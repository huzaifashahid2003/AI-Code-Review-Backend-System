from fastapi import FastAPI, UploadFile, File, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from analyzer import analyze_code
import os
import re
import traceback
from dotenv import load_dotenv
from services.github_service import handle_github_event, get_github_status, get_pr_file, get_pr_diff
from services.review_service import process_file, process_file_from_github, process_pr_files


UPLOAD_DIR="uploads"
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def home():
    return{"message":"AI code running"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        result = await process_file(file)
        return result

    except Exception as e:
        print(" ERROR:", str(e))
        traceback.print_exc()
        return {"error": str(e)}


@app.get("/github/status")
async def github_status():
    return get_github_status()

@app.post("/github")
async def review_github(data: dict= Body(...)):
     return await process_file_from_github(data["url"])

@app.post("/webhook")
async def github_webhook(request: Request):
    try:
        payload = await request.json()
        event_type = request.headers.get("X-GitHub-Event", "")
        print(f"Event received: {event_type}")
        result = await handle_github_event(payload)
        return result
    except Exception as e:
        print(f"WEBHOOK ERROR: {str(e)}")
        traceback.print_exc()
        return {"error": str(e)}, 500


ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")

def _read_env():
    keys = {"Groq_API": "", "Github_token": ""}
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, "r") as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, _, v = line.partition("=")
                    if k.strip() in keys:
                        keys[k.strip()] = v.strip()
    return keys

def _mask(val):
    if not val:
        return ""
    if len(val) <= 8:
        return "*" * len(val)
    return val[:4] + "*" * (len(val) - 8) + val[-4:]

@app.get("/settings")
async def get_settings():
    keys = _read_env()
    return {
        "groq_api_set":    bool(keys["Groq_API"]),
        "github_token_set": bool(keys["Github_token"]),
        "groq_api_masked":    _mask(keys["Groq_API"]),
        "github_token_masked": _mask(keys["Github_token"]),
    }

@app.put("/settings")
async def save_settings(data: dict = Body(...)):
    keys = _read_env()
    if "groq_api" in data and data["groq_api"]:
        keys["Groq_API"] = data["groq_api"]
    if "github_token" in data and data["github_token"]:
        keys["Github_token"] = data["github_token"]

    lines = []
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, "r") as f:
            lines = f.readlines()

    def _set_line(lines, key, value):
        pattern = re.compile(rf"^{re.escape(key)}\s*=")
        for i, line in enumerate(lines):
            if pattern.match(line):
                lines[i] = f"{key}={value}\n"
                return lines
        lines.append(f"{key}={value}\n")
        return lines

    for k, v in keys.items():
        if v:
            lines = _set_line(lines, k, v)

    with open(ENV_PATH, "w", encoding="utf-8") as f:
        f.writelines(lines)

    # Reload env vars into the running process so services pick up new keys
    load_dotenv(ENV_PATH, override=True)

    return {"status": "saved"}


@app.get("/pr-review")
async def review_pr(repo: str, pr_number: int):
    try:
        files = get_pr_file(repo, pr_number)
        if not files:
            return {"error": "No python files found"}
        results = await process_pr_files(files)
        return {"repo": repo, "pr": pr_number, "reviews": results}
    except Exception as e:
        return {"error": str(e)}


@app.get("/pr-diff")
async def pr_diff(repo: str, pr_number: int):
    try:
        diff = get_pr_diff(repo, pr_number)
        return {"repo": repo, "pr": pr_number, "diff": diff}
    except Exception as e:
        return {"error": str(e)}
          