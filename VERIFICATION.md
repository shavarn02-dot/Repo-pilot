# RepoPilot — Verification Record (2026-10-21)

## Backend tests
Command: `cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt pytest && .venv/bin/python -m pytest tests/ -v`
Result: **9 passed, 0 failed** (1 Starlette deprecation warning, harmless).
Tests: URL parsing (valid + SSRF/non-GitHub rejection), file filtering (node_modules/binary/oversized excluded), scoring weights sum to 100 and weighted-math matches, grounding validator (fake path `src/fake.py` rejected → unverified, confidence capped 0.3), image validation (real PNG ok, garbage rejected, oversize rejected), health + `not_configured` honesty, full visual flow (upload → not_configured with zero findings → issue draft → publish gate), bad image rejected (400).

## Live smoke test (real GitHub API, no mocks)
Server: `.venv/bin/uvicorn app.main:app --port 8000`
- `GET /api/health` → `{"status":"ok","ai_configured":false,"ai_status":"not_configured","model":"google/gemma-4-31b-it:free"}`
- `POST /api/repositories/analyze {"url":"https://github.com/octocat/Hello-World"}` → **HTTP 200**, real data:
  - Repository: octocat/Hello-World, "My first repository on GitHub!", branch `master`, commit `7fd1a60b01f91b314f59955a4e4d4e80d8edf11d`
  - **Health score 37.8/100** — Maintainability 35, Security 75, Testing 0, Documentation 55, CI/CD 0, Structure 40 (weighted: 35*.25+75*.25+0*.20+55*.15+0*.10+40*.05 = 37.75 → 37.8 ✓)
  - 7 deterministic findings (no tests [high], no CI, no LICENSE, no .gitignore, no SECURITY.md, no docs/, no manifest), `ai_status: not_configured`
- `GET /api/repositories/1/report`, `/files` (["README"]), `/api/jobs/1` (completed, 100%) → all correct.
- `GET /api/repositories/1/pull-requests` → real open PRs (e.g. #11593, #11592).
- `POST /api/repositories/1/pull-requests/11592/analyze` → real diff fetched ("Create my_file.txt", +1/-0), read-only, ai_status not_configured.
- `GET /api/repositories/1/issues` → real open issues, PRs excluded. `POST .../issues/triage` → rule-based categories/labels, "nothing was modified on GitHub".
- `POST /api/repositories/1/chat {"message":"What does the README say?"}` → extractive grounded answer: `README: Hello World!`, citations ["README"], mode "extractive", ai_status "not_configured".
- Visual: `POST /api/repositories/1/visual/analyze` with a real PNG → stored (sha256 returned), status/ai_status `not_configured`, **findings: []** with explicit message that nothing was fabricated. Issue draft generated from the description. Publish gate verified live: `confirmed:false` → **400**, `confirmed:true` without server GitHub token → **403**.

## Frontend
Commands: `cd frontend && npm install && npm run build`
Result: **Build succeeded** — Next.js 14.2.35, 11 routes (/, /dashboard, /dashboard/repositories/[id], pull-requests, issues, assistant, visual, reports, settings), TypeScript type-check passed.
Fixes during build: lucide-react upgraded to ^1.61.0 (ScanEye missing in old version); removed `Github` brand icon (removed upstream in lucide v1) in favour of GitBranch.

## Bugs found and fixed during verification
1. httpx crashed on this sandbox's bracketed-IPv6 `NO_PROXY` (Invalid port ':1]') and direct egress is unavailable here, so `trust_env=False` alone broke GitHub calls (SSL wrong version). Fixed with `backend/app/http_client.py`: clients are built with the `HTTPS_PROXY` env value passed explicitly (no value is stored in code), falling back to a direct client when no proxy env exists (normal dev machines).

## What is gated on the user (explicit)
- **OpenRouter API key (`OPENROUTER_API_KEY`)**: NOT set during verification. All deterministic features work fully without it. With it unset, Gemma narrative summaries, PR AI review, vision findings, and AI chat return `ai_status: "not_configured"` (chat falls back to grounded extractive answers). The OpenRouter client (model `google/gemma-4-31b-it:free`, fallback `google/gemma-4-26b-a4b-it:free`, retry/timeout, JSON schema expectation, grounding validation, prompt-injection system prompt) is implemented and unit-covered for its deterministic parts, but the live Gemma path could not be exercised without a key.
- **GitHub token / OAuth (`GITHUB_TOKEN`)**: NOT set. Public-repo reads work unauthenticated (rate-limited by GitHub). Issue publishing returns 403 by design until a token with issues:write is configured server-side; the publish code path itself is implemented.
- **Hosting**: not deployed. Local run + Docker Compose (PostgreSQL) are provided; docker compose was not run in this sandbox.
- Note: unauthenticated GitHub API has a low hourly rate limit; heavy local testing may hit 403s until a token is set.

---

## Update — 2026-10-21 (real-data capture + frontend UI/UX overhaul)

Driven by user feedback: "the UI is all mock data and the UI/UX is not good at all."

### Job 1 — Real analyses captured (backend, live GitHub API)
Backend deps reinstalled in `backend/.venv`, uvicorn run, analyses executed through
`POST /api/repositories/analyze` (plus PR list, issues list, files list, PR #3771 diff analysis,
issue triage for the primary repo). Full verbatim results: `~/workspace/repopilot/REAL_DATA.md`.
- octocat/Hello-World — **37.8/100** (Maint 35, Security 75, Testing 0, Docs 55, CI/CD 0, Structure 40), commit `7fd1a60b01f91b314f59955a4e4d4e80d8edf11d`, 1 file, 7 findings.
- sindresorhus/slugify — **81.5/100** (100/90/64/55/80/100), commit `3b17b2e84b97624a683aafaa38184bf2746fab22`, 13 files, 2 findings — the mixed-health contrast.
- encode/httpx — **95.5/100** (100/90/100/100/80/100), commit `b5addb64f0161ff6bfe94c124ef76f6a1fba5254`, 113 files, 1 finding ("No SECURITY.md"). Primary repo: 30 PRs returned (first 8 recorded), 8 open issues recorded with rule-based triage, PR #3771 diff analysed (+3/-1 in `httpx/_utils.py`, 1 medium testing finding).
- pallets/click — **94.8/100** (100/90/100/95/80/100), commit `2247b35ea1c47c727d7a06e51fa280e12a863ff6`, 175 files, 1 finding.
All weighted sums re-checked arithmetically (e.g. httpx 100×.25+90×.25+100×.20+100×.15+80×.10+100×.05 = 95.5 ✓).
Every analysis returned `ai_status: not_configured` (no OpenRouter key) — scores/findings are deterministic only.
GitHub rate limit: **no failure hit**. Core quota 57/60 remaining before capture, 56/60 after the PR-diff
analysis (sandbox egress proxy presents a shared pool; counter does not decrease 1:1). No data was invented.

### Job 2 — Frontend overhaul (`frontend/`, API wiring unchanged)
- **Design system**: Inter + JetBrains Mono via next/font (CSS variables wired into Tailwind), tabular numerals, DRD tokens only, radius 8/10–12/14, borders over shadows, no gradients/orbs/glassmorphism/emoji, focus-visible accent outline, reduced-motion support, custom scrollbars/range/checkbox styling, 120–300 ms transitions. Shared component library rebuilt (`Badge`, `SevBadge` with severity dots so severity is never colour-only, `ScoreBar` with per-status colour + exact points contribution, `PageHead`, `Panel/PanelHead`, `RecordedNote`, `AiStatusBadge`, skeleton + table-skeleton states).
- **Landing**: asymmetric editorial hero (5/7 grid, 68 px display type) with a product preview built from the **real recorded httpx analysis** (95.5, all six category scores, the single real SECURITY.md finding, commit `b5addb6`) labelled "Recorded live analysis"; evidence section quoting the three other real recorded scores; numbered workflow (not 3 cards); real PR #3771 diff with added-line highlighting; varied split sections; final CTA. The old fake "100 / Demonstration preview" panel was deleted.
- **Dashboard shell**: 240 px sidebar (collapsible to 64 px, persisted, restrained accent active indicator), workspace block, contextual top bar with breadcrumb + live backend/Gemma status dot (green = configured, amber = not configured, red = offline), mobile drawer with backdrop.
- **Overview**: analysis form with real stage status; live repo table now includes health scores; when the backend is offline it shows the 4 recorded analyses as a proper data table (score bars, tabular scores, files, findings, commit SHAs) under a "Recorded, not live" notice.
- **Repository report**: score rail (score, scoring version, coverage, finding count), category bars with weights and exact point contributions, severity filter chips with counts + severity sort, dense findings table, sticky inspector with evidence hierarchy (severity/category/source, evidence, file:line, fix, confidence).
- **Visual Debugger**: 3-panel layout (intake / viewer / findings inspector), polished upload zone with file size, staged progress with check/spinner states, before/after slider with handle line, findings with evidence/fix/confidence, issue draft with destination repo named, severity/labels, copy feedback, and the publish button disabled until the confirmation checkbox is ticked (label states why).
- **Pull Requests / Issues / Assistant / Reports / Settings**: PR page gains colour-coded diff view, finding cards with evidence+fix, and recorded httpx PRs + #3771 review when offline; Issues becomes a real table (GitHub labels vs triage category/complexity/suggested labels) with recorded httpx issues + triage when offline; Assistant gains repo context strip, suggested questions, grounded/insufficient-evidence badges; Reports becomes a recorded-reports table with score bars + JSON export of the recorded summary when offline; Settings shows live `/api/health` status next to the env documentation.
- **Honesty rule**: offline/recorded data comes only from `frontend/lib/snapshot.ts`, a verbatim transcription of REAL_DATA.md, always labelled "Recorded live analysis … captured 2026-10-21" — the word "Demonstration" no longer appears anywhere in the frontend, and recorded data is never called live.

### Build result
`cd frontend && npm install && npm run build` — **PASSED** (Next.js 14.2.35, TypeScript clean, 11 routes:
`/`, `/dashboard`, `/dashboard/assistant`, `/dashboard/issues`, `/dashboard/pull-requests`,
`/dashboard/reports`, `/dashboard/repositories/[id]`, `/dashboard/settings`, `/dashboard/visual`, `/_not-found`).
Production smoke check (`next start`): landing HTML contains "95.5", "encode/httpx",
"Recorded live analysis" and the hero headline; `/dashboard` returns HTTP 200.
