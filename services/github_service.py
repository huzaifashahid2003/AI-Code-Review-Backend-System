import requests
import os
import time
from dotenv import load_dotenv


load_dotenv()

def _get_token():
    """Read token at call time so updates via /settings are always picked up."""
    return os.getenv("Github_token", "")

def _gh_headers():
    return {"Authorization": f"Bearer {_get_token()}", "Accept": "application/vnd.github+json"}

def get_github_status():
    """Return connection status, authenticated user info, repos, and open PRs."""
    if not _get_token():
        return {"connected": False, "login": None, "repos": [], "prs": []}

    try:
        user_resp = requests.get("https://api.github.com/user", headers=_gh_headers(), timeout=8)
        if user_resp.status_code != 200:
            return {"connected": False, "login": None, "repos": [], "prs": []}

        login = user_resp.json().get("login", "")

        repos_resp = requests.get(
            "https://api.github.com/user/repos?sort=updated&per_page=10",
            headers=_gh_headers(), timeout=8
        )
        raw_repos = repos_resp.json() if repos_resp.status_code == 200 else []

        repos = []
        all_prs = []
        for repo in raw_repos:
            repos.append({
                "name": repo["name"],
                "full_name": repo["full_name"],
                "branch": repo.get("default_branch", "main"),
                "status": "active" if not repo.get("archived") else "archived",
                "lastSync": repo.get("updated_at", "")[:10],
                "private": repo.get("private", False),
            })
            # Fetch open PRs for this repo (limit: first 5 repos to avoid rate limits)
            if len(all_prs) < 20 and len(repos) <= 5:
                pr_resp = requests.get(
                    f"https://api.github.com/repos/{repo['full_name']}/pulls?state=open&per_page=5",
                    headers=_gh_headers(), timeout=8
                )
                if pr_resp.status_code == 200:
                    for pr in pr_resp.json():
                        all_prs.append({
                            "id": pr["number"],
                            "title": pr["title"],
                            "branch": pr["head"]["ref"],
                            "status": "pending",
                            "files": None,
                            "updated": pr.get("updated_at", "")[:10],
                            "issues": None,
                            "repo": repo["full_name"],
                        })

        return {"connected": True, "login": login, "repos": repos, "prs": all_prs}

    except Exception as e:
        return {"connected": False, "login": None, "repos": [], "prs": [], "error": str(e)}

def convert_to_raw_url(url):
    if "github.com" in url and "/blob/" in url:
        return url.replace("github.com","raw.githubusercontent.com").replace("/blob/","/")
    
    return url

def fetch_file_from_github(url):
    url=convert_to_raw_url(url)

    response=requests.get(url)

    if response.status_code!=200:
        raise Exception("Failed to fetch file")
    
    return response.text


def post_commit_comment(repo, commit_sha, comment):
    url = f"https://api.github.com/repos/{repo}/commits/{commit_sha}/comments"
    
    headers = _gh_headers()
    data = {
        "body": comment
        }
    
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code != 201:
        raise Exception(f"Failed to post commit comment: {response.text}")
    
    return response.json()

async def handle_github_event(payload):
    from services.review_service import process_pr_files, format_review_comment

    # ── Pull Request event ──────────────────────────────────────────────────
    if "pull_request" in payload:
        action = payload.get("action", "")
        # Only analyse when a PR is opened or new commits are pushed to it
        if action not in ("opened", "synchronize", "reopened"):
            return {"message": f"PR action '{action}' ignored"}

        pr     = payload["pull_request"]
        repo   = payload["repository"]["full_name"]
        pr_num = pr["number"]
        title  = pr.get("title", f"PR #{pr_num}")

        print(f"[webhook] PR {action}: {repo} #{pr_num} — {title}")

        files = get_pr_file(repo, pr_num)
        if not files:
            return {"message": "No Python files found in PR"}

        results = await process_pr_files(files)
        comment = format_review_comment(results, title=title, pr_number=pr_num)
        post_pr_comment(repo, pr_num, comment)

        return {"event": "PR reviewed", "repo": repo, "pr": pr_num}

    # ── Push event ──────────────────────────────────────────────────────────
    elif "commits" in payload:
        repo    = payload["repository"]["full_name"]
        commits = payload["commits"]

        modified_files = []
        for commit in commits:
            for filename in commit.get("modified", []) + commit.get("added", []):
                if filename.endswith(".py"):
                    modified_files.append({
                        "filename": filename,
                        "raw_url":  f"https://raw.githubusercontent.com/{repo}/{commit['id']}/{filename}"
                    })

        if not modified_files:
            return {"message": "No Python files modified"}

        from services.review_service import process_pr_files, format_review_comment
        results = await process_pr_files(modified_files)
        comment = format_review_comment(results, title="Push Review")
        commit_id = commits[0]["id"]
        post_commit_comment(repo, commit_id, comment)

        return {"event": "Push reviewed", "repo": repo}

    return {"message": "Event ignored"}


def get_pr_file(repo, pr_number):
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files"
    headers = _gh_headers()
    response = safe_request(url, headers)
    if response.status_code != 200:
        raise Exception(f"GitHub API error: {response.status_code}")
    
    files = response.json()

    python_files=[]
    for f in files:
        if f["filename"].endswith(".py"):
            python_files.append({
                "filename":f["filename"],
                "raw_url":f["raw_url"]
            })
    return python_files


def post_pr_comment(repo, pr_number, comment):
    url=f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"

    headers = _gh_headers()
    data={
        "body":comment
    }

    response=requests.post(url, json=data, headers=headers)

    if response.status_code != 201:
        raise Exception(f"Failed to post comment: {response.text}")
    
    return response.json()



def get_pr_diff(repo, pr_number):
    """Return all files in a PR with their unified diff patch."""
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files"
    response = safe_request(url, _gh_headers())
    return [
        {"filename": f["filename"], "patch": f.get("patch", "")}
        for f in response.json()
    ]


def safe_request(url,headers):
    for _ in range(3):
        res= requests.get(url, headers=headers, timeout=10)

        if res.status_code == 200:
            return res
        time.sleep(3)

    raise Exception("API failed after Retries")

