from groq import Groq
import json
import os
import time
from dotenv import load_dotenv
from services.cache import cache
import hashlib
import ast

load_dotenv()

def _get_client():
    """Create a Groq client using the current env value (supports runtime key updates)."""
    load_dotenv(override=True)
    return Groq(api_key=os.getenv("Groq_API"))

def review_code(function_code):
    key = get_hash(function_code)

    if key in cache:
        print("cache HIT")
        return cache[key]

    print("LLM call")

    prompt = f"""You are a senior Python code reviewer. Analyze the Python function below and respond with ONLY a valid JSON object. Do not include any explanation, markdown, code fences, or extra text — just the raw JSON.

The JSON must have exactly these four keys:
- "issues": a list of strings describing problems found in the code
- "improvements": a list of strings with suggested improvements
- "severity": one of "low", "medium", or "high"
- "fixed_code": the complete corrected version of the function

STRICT rules for "fixed_code" — violating ANY rule makes the output wrong:
1. Copy the original function EXACTLY, line by line
2. ONLY modify the specific line(s) that contain a real bug
3. NEVER add try/except, error handling, or exception handling that is not already in the original
4. NEVER add new imports, decorators, type hints, comments, or blank lines not in the original
5. NEVER rename variables, parameters, or the function itself
6. The line count of fixed_code must be within +/-2 lines of the original
7. If there is no real code bug, return the original function completely unchanged

WRONG example (never do this):
Original: def root():\n    return {{"message": "ok"}}
WRONG fixed_code adds try/except: def root():\n    try:\n        return {{"message": "ok"}}\n    except Exception as e:\n        return {{"error": str(e)}}
This is WRONG because try/except was not in the original.

CORRECT example:
Original: def divide(a, b):\n    return a / b
CORRECT fixed_code: def divide(a, b):\n    if b == 0: return None\n    return a / b
This is correct because only the specific bug fix line was added.

Function to analyze:
{function_code}"""

    client = _get_client()

    max_retries = 5
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
            )
            break
        except Exception as e:
            err = str(e)
            if "rate_limit_exceeded" in err or "429" in err:
                wait = 2 ** attempt + 5
                print(f"Rate limit hit, retrying in {wait}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait)
                if attempt == max_retries - 1:
                    return {"issues": ["Rate limit exceeded. Please wait and try again."], "improvements": [], "severity": "low", "fixed_code": function_code}
            else:
                raise

    raw_output = response.choices[0].message.content.strip()
    print(f"LLM raw output: {raw_output[:300]}")

    try:
        import re as _re
        cleaned = raw_output
        # Strip markdown code fences
        fence_match = _re.search(r'```(?:json)?\s*([\s\S]*?)```', cleaned)
        if fence_match:
            cleaned = fence_match.group(1).strip()
        # Extract outermost JSON object
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start != -1 and end > start:
            cleaned = cleaned[start:end]
        parsed = json.loads(cleaned)
        parsed.setdefault("issues", [])
        parsed.setdefault("improvements", [])
        parsed.setdefault("severity", "low")
        parsed.setdefault("fixed_code", function_code)
        # Validate fixed_code is syntactically valid Python
        try:
            ast.parse(parsed["fixed_code"])
        except Exception:
            parsed["fixed_code"] = function_code
    except Exception as parse_err:
        print(f"JSON parse error: {parse_err}\nRaw: {raw_output}")
        parsed = {
            "issues": ["Could not parse AI response. Raw output logged to console."],
            "improvements": [],
            "severity": "low",
            "fixed_code": function_code
        }

    cache[key] = parsed

    return parsed

    

def get_hash(code):
    return hashlib.md5(code.encode()).hexdigest()
    