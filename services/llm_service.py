from groq import Groq
import json
import os
import time
from dotenv import load_dotenv
from services.cache import cache
import hashlib

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

The JSON must have exactly these three keys:
- "issues": a list of strings describing problems found in the code
- "improvements": a list of strings with suggested improvements
- "fixed_code": a string containing the corrected version of the function

Example output:
{{"issues": ["Missing input validation"], "improvements": ["Add a guard clause for empty input"], "fixed_code": "def foo(x):\\n    if x is None:\\n        return None\\n    return x + 1"}}

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
                wait = 2 ** attempt + 5  # 6s, 7s, 9s, 13s, 21s
                print(f"Rate limit hit, retrying in {wait}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait)
                if attempt == max_retries - 1:
                    return {"issues": ["Rate limit exceeded. Please wait and try again."], "improvements": [], "fixed_code": function_code}
            else:
                raise

    raw_output = response.choices[0].message.content.strip()
    print(f"LLM raw output: {raw_output[:300]}")

    try:
        # Strip markdown code fences if the model still adds them
        cleaned = raw_output
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        cleaned = cleaned[start:end]
        parsed = json.loads(cleaned)
        # Ensure all expected keys exist
        parsed.setdefault("issues", [])
        parsed.setdefault("improvements", [])
        parsed.setdefault("fixed_code", function_code)
    except Exception as parse_err:
        print(f"JSON parse error: {parse_err}\nRaw: {raw_output}")
        parsed = {
            "issues": ["Could not parse AI response. Raw output logged to console."],
            "improvements": [],
            "fixed_code": function_code
        }

    cache[key] = parsed
    return parsed

def get_hash(code):
    return hashlib.md5(code.encode()).hexdigest()
    