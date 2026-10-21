# RepoPilot — AI-Powered GitHub Maintainer
Paste a public GitHub URL → deterministic engineering checks + Gemma 4 (via OpenRouter) explanation → evidence-linked health report, read-only PR reviews, issue triage, repository chat, and a Visual Debugger that turns screenshots into structured findings and review-gated GitHub issue drafts.

**Honesty contract:** health scores are computed by deterministic rules only (Maintainability 25 / Security 25 / Testing 20 / Documentation 15 / CI-CD 10 / Structure 5). AI never sets scores. If `OPENROUTER_API_KEY` is not set, AI features return `ai_status: "not_configured"` and no AI output is fabricated. Ungrounded AI file references are stripped by a grounding validator.

## Stack
Next.js + TypeScript + Tailwind (frontend) · FastAPI + Pydantic + SQLAlchemy (backend, SQLite locally / PostgreSQL via Compose) · GitHub REST API · Gemma 4 via OpenRouter (`google/gemma-4-31b-it:free`, fallback `google/gemma-4-26b-a4b-it:free`).

## Run locally (₹0)
Backend:
```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8000
# optional: export OPENROUTER_API_KEY=...  GITHUB_TOKEN=...
```
Frontend (second terminal):
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```
Try it: open the landing page, analyze `https://github.com/octocat/Hello-World`, then open Visual Debugger and upload a screenshot.

Or everything with Docker: `docker compose up --build` (PostgreSQL + backend + frontend).

## Tests
```bash
cd backend && .venv/bin/python -m pytest -q
cd frontend && npm run build
```
See VERIFICATION.md for the recorded verification run.

## Key endpoints
`GET /api/health` · `POST /api/repositories/analyze` · `GET /api/repositories/{id}/report|files` · `GET/POST /api/repositories/{id}/pull-requests[/{n}/analyze]` · `GET /api/repositories/{id}/issues` + `POST .../issues/triage` · `POST /api/repositories/{id}/chat` · `POST /api/repositories/{id}/visual/analyze` · `GET /api/visual-analyses/{id}` · `POST /api/visual-analyses/{id}/issue-draft` · `POST /api/visual-analyses/{id}/issue-draft/publish` (400 without `confirmed:true`, 403 without a server GitHub token) · `POST /api/repositories/{id}/pull-requests/{n}/visual-review` · `DELETE /api/visual-analyses/{id}/image` · `GET /api/jobs/{id}`

MIT licensed.
