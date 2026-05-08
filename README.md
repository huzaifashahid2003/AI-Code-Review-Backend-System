# CodeSentinel AI — Intelligent Python PR Review & Auto-Fix Platform

CodeSentinel is an AI-assisted Python code review platform that analyzes local files and GitHub Pull Requests, detects issues per function, generates validated fixes, and provides downloadable corrected code. It automatically reviews Python code using a large language model (LLaMA 3.1 via Groq). It supports both local file uploads and direct GitHub Pull Request analysis, providing per-function issue detection, severity ratings, AI-suggested fixes, and downloadable corrected files.

---

## Why CodeSentinel?

Manual PR reviews are slow, inconsistent, and often miss function-level issues. CodeSentinel accelerates Python review workflows by combining AST-based parsing with LLM-powered analysis and validated auto-fix generation.

## Features

- **File Upload Review** — Upload any `.py` file; every function is extracted and reviewed independently by the AI
- **GitHub PR Review** — Connect your GitHub account to browse open PRs, view the real git diff, and get AI comments per function
- **Per-Function Analysis** — Issues, improvements, severity (`low` / `medium` / `high`), and a corrected `fixed_code` block for each function
- **Copy Correct Code** — One-click clipboard copy of the AI-corrected function from the PR review panel
- **Download Corrected File** — Download the AI-fixed function as a `.py` file directly from the Fix step
- **Settings UI** — Save your Groq API key and GitHub token through the UI; stored in `.env`, never sent to a third party
- **In-Memory Cache** — Identical function code is never sent to the LLM twice in the same session
- **GitHub Webhook** — `/webhook` endpoint ready to receive GitHub push/PR events

---

## Current Limitations

- Python-only analysis
- In-memory cache resets on restart
- AI suggestions may still require human validation
- Large PRs can hit API rate limits

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Lucide React |
| Backend | Python, FastAPI, Uvicorn |
| AI / LLM | Groq API — `llama-3.1-8b-instant` |
| GitHub integration | GitHub REST API v3 |
| Code parsing | Python `ast` module |

---

## Project Structure

```
├── main.py                  # FastAPI app — all HTTP routes
├── analyzer.py              # AST-based function extractor
├── requirements.txt
├── .env                     # API keys (git-ignored)
├── uploads/                 # Temporary storage for uploaded files
│
├── api/
│   └── routes.py            # Additional APIRouter
│
├── core/
│   └── config.py            # Config (reserved)
│
├── services/
│   ├── llm_service.py       # Groq LLM calls, JSON parsing, cache
│   ├── review_service.py    # Orchestrates file/PR review pipeline
│   ├── github_service.py    # GitHub REST API helpers
│   └── cache.py             # Simple in-memory dict cache
│
└── ui/                      # React frontend (Vite)
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx           # Root — routing, global state
        ├── utils/
        │   └── downloadPy.js # Blob download utility
        └── components/
            ├── layout/
            │   ├── Navbar.jsx
            │   └── Sidebar.jsx
            └── screens/
                ├── Dashboard.jsx
                ├── UploadStep.jsx
                ├── AnalyzeStep.jsx
                ├── ReviewStep.jsx
                ├── FixStep.jsx
                ├── RerunStep.jsx
                ├── GithubIntegration.jsx
                ├── PRReview.jsx
                └── Settings.jsx
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com/) (free tier available)
- A [GitHub Personal Access Token](https://github.com/settings/tokens) with `repo` scope

---

### 1. Clone & set up the backend

```bash
git clone <repo-url>
cd AI_code_assistant_review

python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure API keys

Either create a `.env` file manually:

```env
Groq_API=gsk_...
Github_token=ghp_...
```

Or start the app and paste your keys in the **Settings** screen — they are written to `.env` automatically.

### 3. Start the backend

```bash
uvicorn main:app --reload --port 8000
```

### 4. Start the frontend

```bash
cd ui
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/upload` | Upload a `.py` file for AI review |
| `POST` | `/github` | Review a file by raw GitHub URL |
| `GET` | `/github/status` | GitHub connection info, repos, open PRs |
| `GET` | `/pr-review` | AI review of all Python files in a PR |
| `GET` | `/pr-diff` | Raw unified diff for a PR (from GitHub) |
| `POST` | `/webhook` | GitHub webhook receiver |
| `GET` | `/settings` | Read masked API key status |
| `PUT` | `/settings` | Save/update API keys to `.env` |

---

## User Workflow

```
Settings → Save API keys
    ↓
Dashboard → Start New Analysis
    ↓
Upload .py file
    ↓
Analyze — AI reviews each function in parallel
    ↓
Review — Browse per-function issues & severity
    ↓
Fix — See Before/After diff, copy or download corrected .py
    ↓
Re-run Analysis (optional)
```

**GitHub PR workflow:**

```
GitHub Sync → connect GitHub account
    ↓
Browse open PRs → Run AI Review
    ↓
PR Review — real git diff (Before/After) + AI Comments panel
    ↓
Click "Copy Correct Code" on any AI comment card
```

---

## Notes

- `fixed_code` is validated with `ast.parse` before being returned — syntactically invalid suggestions are discarded and the original code is returned instead
- The LLM is instructed never to add try/except, imports, or rename variables not present in the original function
- Rate limit retries are built in (exponential back-off, up to 5 attempts)
- The in-memory cache resets on server restart; identical functions are not re-analyzed within a session
