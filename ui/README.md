# AI Code Review Assistant — React UI

A production-ready SaaS web application for AI-powered code reviews.

## Quick Start

### Prerequisites
Install [Node.js](https://nodejs.org/) (v18 or later).

### Setup

```bash
cd ui
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## Screens & Navigation

| Screen | How to reach |
|--------|-------------|
| Dashboard | Click "Dashboard" in sidebar, or launch the app |
| Upload → Analyze → Review → Fix → Re-run | Click "Start New Analysis" on Dashboard |
| GitHub Integration | Click "GitHub Sync" in sidebar |
| PR Review | Click "Run AI Review" on any PR in GitHub Integration |
| Settings | Click "Settings" at bottom of sidebar |

---

## Tech Stack

- **React 18** + Vite
- **Tailwind CSS v3**
- **Lucide React** (icons)

## Project Structure

```
ui/
├── src/
│   ├── App.jsx                    # Root component + routing
│   ├── main.jsx                   # Entry point
│   ├── index.css                  # Tailwind + global styles
│   └── components/
│       ├── layout/
│       │   ├── Sidebar.jsx        # Left navigation
│       │   └── Navbar.jsx         # Top bar + step progress indicator
│       └── screens/
│           ├── Dashboard.jsx      # Main dashboard with metrics
│           ├── UploadStep.jsx     # File upload (step 1)
│           ├── AnalyzeStep.jsx    # Animated analysis (step 2)
│           ├── ReviewStep.jsx     # Issue review split-panel (step 3)
│           ├── FixStep.jsx        # Diff view + apply fix (step 4)
│           ├── RerunStep.jsx      # Re-run and compare (step 5)
│           ├── GithubIntegration.jsx  # GitHub repos + PRs
│           ├── PRReview.jsx       # 3-panel PR review
│           └── Settings.jsx       # Configuration
```
