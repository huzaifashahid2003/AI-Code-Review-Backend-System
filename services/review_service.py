import os
from analyzer import extract_function_code
from services.llm_service import review_code
import asyncio
from services.github_service import fetch_file_from_github


UPLOAD_DIR = "uploads"


os.makedirs(UPLOAD_DIR, exist_ok=True)


semaphore = asyncio.Semaphore(1)

async def process_file(file):
    file_path=os.path.join(UPLOAD_DIR,file.filename)

    content=await file.read()

    with open(file_path,"wb") as f:
        f.write(content)

    functions=extract_function_code(file_path)

    results = await process_functions(functions)

    return{
        "filename":file.filename,
        "analysis":results
    }


async def review_single_function(func):
    async with semaphore:
        loop = asyncio.get_running_loop()
        ai_result = await loop.run_in_executor(
            None,
            review_code,
            func["code"]
        )

    return {
        "function": func["name"],
        "code": func["code"],
        "fixed_code": ai_result.get("fixed_code", func["code"]),
        "line": func.get("line"),
        "review": {
            "issues": ai_result.get("issues", []),
            "improvements": ai_result.get("improvements", []),
            "severity": ai_result.get("severity", "low")
        }
    }

async def process_functions(functions):
    all_results=[]
    for batch in chunk_list(functions,10):
        tasks=[]
        for func in batch:
          tasks.append(review_single_function(func))

        results= await asyncio.gather(*tasks)
        all_results.extend(results)

    return all_results

async def process_file_from_github(raw_url):
    file_path="temp.py"

    code = fetch_file_from_github(raw_url)

    with open("temp.py", "w", encoding="utf-8") as f:
       f.write(code)
    
    functions=extract_function_code(file_path)
    functions= functions[:10]
    
    results= await process_functions(functions)

    return{
        "source":"github",
        "analysis":results
    }


def chunk_list(data,size):
    for i in range(0,len(data),size):
        yield data[i:i+size]

async def process_pr_files(files):
    results=[]
    for f in files:
        if not f["filename"].endswith(".py"):
            continue

        code = fetch_file_from_github(f["raw_url"])
        file_path = f"temp_{f['filename'].replace('/', '_')}"

        with open(file_path, "w", encoding="utf-8") as file:
            file.write(code)

        functions = extract_function_code(file_path)

        analysis = await process_functions(functions)
        os.remove(file_path)

        results.append({
            "file": f["filename"],
            "analysis": analysis
        })

    return results
   

def format_review_comment(results, title="AI Code Review", pr_number=None):
    SEVERITY_EMOJI = {"high": "ðŸ”´", "medium": "ðŸŸ¡", "low": "ðŸŸ¢"}

    total_issues = 0
    total_high   = 0

    body_lines = []

    for file_result in results:
        filename = file_result.get("file", "unknown")
        analysis = file_result.get("analysis", [])
        if not analysis:
            continue

        body_lines.append(f"\n### ðŸ“„ `{filename}`\n")
        body_lines.append("| Function | Severity | Issues | Suggestions |")
        body_lines.append("|----------|----------|--------|-------------|")

        for func in analysis:
            fn_name  = func.get("function", "?")
            review   = func.get("review", {})
            severity = (review.get("severity") or "low").lower()
            issues   = review.get("issues", [])
            improvements = review.get("improvements", [])

            # Normalize issue items (may be string or {line, message})
            def _text(item):
                if isinstance(item, str):   return item
                if isinstance(item, dict):  return item.get("message", str(item))
                return str(item)

            issue_texts  = [_text(i) for i in issues      if i]
            suggest_texts = [_text(i) for i in improvements if i]

            total_issues += len(issue_texts)
            if severity == "high":
                total_high += len(issue_texts)

            emoji = SEVERITY_EMOJI.get(severity, "ðŸŸ¢")
            issues_str  = "<br>".join(f"- {i}" for i in issue_texts)   or "â€”"
            suggest_str = "<br>".join(f"- {s}" for s in suggest_texts) or "â€”"

            body_lines.append(f"| `{fn_name}` | {emoji} {severity.capitalize()} | {issues_str} | {suggest_str} |")

    # Build header summary
    pr_ref = f" for PR #{pr_number}" if pr_number else ""
    header = [
        f"## ðŸ¤– AlphaCore AI Code Review{pr_ref}",
        "",
        f"> **{total_issues} issue(s) found** â€” {total_high} high severity",
        "",
        "<details><summary>ðŸ“Š Click to expand full report</summary>",
        "",
    ]

    footer = [
        "",
        "</details>",
        "",
        "---",
        "*Powered by [AlphaCore AI](https://github.com) Â· Review generated automatically*",
    ]

    return "\n".join(header + body_lines + footer)


