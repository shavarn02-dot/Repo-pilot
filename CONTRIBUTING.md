# Contributing to RepoPilot
Thanks for contributing. Keep changes evidence-based: never add fake metrics, mock AI output presented as real, or findings without a file reference.
## Setup
Backend: `cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt pytest && .venv/bin/python -m pytest`
Frontend: `cd frontend && npm install && npm run build`
## Rules
- Scores are deterministic only. AI output goes through schema + grounding validation.
- Secrets only via environment variables. Never commit keys.
- Run backend tests and the frontend build before opening a PR.
