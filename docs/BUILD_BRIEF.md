# RepoPilot — Build Brief (synthesised 2026-10-21)
Source docs: PRD.pdf, Design_requirement_document.pdf, prompt.pdf (all in ~/workspace/user/files/)

## What it is
AI-Powered GitHub Maintainer. Tagline concept: "Mission Control for Your Codebase."
Hero headline (DRD-locked): "Your repository deserves a better copilot."
User pastes a public GitHub URL → RepoPilot fetches metadata + file tree, runs deterministic checks + Gemma 4 analysis, returns an evidence-linked engineering health report, PR reviews, and issue triage. Budget target: ₹0. Open-source, Hacktoberfest/portfolio-ready.

## Stack (agreed across PRD + Prompt)
- Frontend: Next.js + TypeScript, Tailwind, shadcn/ui, Recharts, Monaco (diff/code)
- Backend: FastAPI + Pydantic, GitHub REST API, background jobs
- AI: Gemma 4 via OpenRouter ONLY, server-side. Preferred: google/gemma-4-31b-it:free, fallback: google/gemma-4-26b-a4b-it:free. Endpoint: https://openrouter.ai/api/v1
- DB: PostgreSQL (Supabase / local for dev). Do NOT permanently store large source snapshots by default.
- Keys: env vars server-side only, never in frontend, never committed.

## MVP — definition of done (PRD §6, §20)
A user can: submit a real public repo → track analysis job → view a real health report → open referenced files → analyse a PR (read-only) → export report.
Must include: URL validation, metadata, file discovery/filtering, Gemma 4 integration, health report, evidence-linked findings, dashboard, export, basic tests + docs.
Non-goals: auto-merge, auto-deploy, unsupervised repo edits, guaranteed vuln detection, executing untrusted repo code.

## Health scoring (critical rule)
Overall 0–100 = weighted sum, DETERMINISTIC rules, versioned scoring. AI must NOT set the numbers — AI only explains/prioritises.
Maintainability 25% | Security signals 25% | Testing readiness 20% | Documentation 15% | CI/CD readiness 10% | Structure 5%
Unknown category = "Not assessed", never auto full marks. Every finding: id, category, severity, title, explanation, evidence, file path, valid line refs, suggested fix, confidence, source (deterministic / AI inference / advisory). Validate file paths + line ranges before showing as verified.

## Core features / priority
P0: FR-01 Repo submission, FR-02 File analysis, FR-03 Gemma 4 engine, FR-04 Health report, FR-05 PR review (read-only in MVP)
P1: FR-06 Issue triage, FR-07 Repo chat (grounded, cite files, admit insufficient evidence), FR-08 Code fix suggestions (show patch, never auto-apply), FR-09 GitHub OAuth (least-privilege)
P2: FR-10 Analysis history / score comparison

## API surface (PRD §10)
POST /api/repositories/analyze | GET /api/repositories/{id} | GET /api/repositories/{id}/report | GET /api/repositories/{id}/files
GET /api/repositories/{id}/pull-requests | POST /api/repositories/{id}/pull-requests/{number}/analyze | GET /api/pull-request-reviews/{review_id}
GET /api/repositories/{id}/issues | POST /api/repositories/{id}/issues/triage
POST /api/repositories/{id}/chat | GET /api/jobs/{id}
DB tables: Users, Repositories, AnalysisJobs, Reports, Findings, PullRequestReviews (+ sessions/OAuth/chat as needed)

## Design system (DRD — this overrides generic SaaS look)
Dark-first, editorial minimalism, precision engineering. "Clarity over decoration."
Canvas #0B0D10 | Surface #111418 | Elevated #171B20 | Hover #1E232A | Text #E9EDF2 / #959DA8 / #6E7885 | Border #282E36
Accent #A78BFA (hover #B8A3FC) | Success #48B89A | Warning #E2B16D | Danger #E17878 | Info #79AEE8
Type: Geist Sans / Inter (UI), Geist Mono / JetBrains Mono (code). Hero 56–72px, page title 30–36px.
Layout: 240px left sidebar (collapsible), contextual top bar, optional right inspector. Radius: buttons/inputs 8px, panels 10–12px, modals 14px. Borders over shadows.
Screens: Landing (asymmetric editorial, live product preview, NOT centred headline + 3 cards), Repo Overview, PR Review (3-panel: files | diff | AI panel, finding click → highlight + scroll to line), AI Assistant (repo-context, NOT a ChatGPT clone), Issue Triage, Reports.
Motion: 120–350ms, functional only. Icons: Lucide, 16–20px, no emoji in core UI. WCAG 2.2 AA, keyboard, focus visible, reduced-motion, severity never by colour alone.
Strictly banned: purple-blue gradients everywhere, glowing orbs, glassmorphism, generic chatbot as main product, repeated 3-card layouts, fake metrics / fake activity graphs, placeholder AI shown as real findings, "Unleash / Revolutionize / Supercharge / Magical" copy.

## Conflicts / decisions spotted
1. ACCENT: Prompt says "violet and cyan accents" — DRD palette has NO cyan, only violet #A78BFA + info blue #79AEE8. Recommendation: follow DRD (it's the more specific, later design doc).
2. PR PUBLISHING: PRD MVP = read-only PR reviews, preview only. Prompt §3 says allow publishing selected comments after explicit confirmation. Recommendation: MVP read-only + preview + copy; publishing gated to P1 after OAuth.
3. CHAT + TRIAGE + FIXES are P1 in PRD but listed as core in Prompt — phase them after the vertical slice, per Prompt's own Phase 1–6 order.

## Build order (Prompt Phase 1–6 + PRD Milestones 1–6, merged)
1. Foundation: monorepo, DB schema, design tokens/system, landing + dashboard shell, .env.example, Docker
2. GitHub intelligence: URL validation, API client, metadata, file tree, file filtering (exclude binaries/deps/generated/oversized)
3. Gemma 4: OpenRouter client, structured JSON schemas, retry/timeout/rate-limit, usage logging, prompt-injection defence (repo text = untrusted)
4. MVP analysis: deterministic checks, scoring service, health report, evidence validation, read-only PR review
5. Extended: issue triage, repo chat, fix suggestions, OAuth/private repos, history
6. Release: tests (unit/integration/e2e, mocked AI + 1 live smoke repo), security review, README/LICENSE/CONTRIBUTING/SECURITY/CI, demo

## First vertical slice to prove it works
URL input → GitHub metadata + file tree → 5–6 deterministic checks (README, LICENSE, tests present, CI config, .gitignore, file structure) → 1 Gemma 4 call (structured) → health report page with real evidence links. Nothing else until this is tested end-to-end on a real public repo.

## Multimodal extension (added 2026-10-21, PRD v1.1 — full spec: MULTIMODAL_EXTENSION.md)
New Visual Debugger workspace in the dashboard. Features in priority order: (1) Screenshot-to-Bug Detective [MVP], (2) Screenshot-to-GitHub Issue [MVP, publish only after explicit user approval + preview], (3) Visual PR Reviewer [next — before/after screenshots vs PR diff], (4) Multimodal AI Assistant [image+text in repo chat]. Same Gemma 4 / OpenRouter integration, structured findings (severity, evidence, confidence, suggested fix), repo-grounded retrieval, never fabricate paths/root causes. New APIs, DB tables (VisualAnalyses, VisualFindings, IssueDrafts), and tests defined in the extension doc.

## Open inputs needed from user before coding
- OpenRouter API key (via secure vault, not chat) — or confirm using the free Gemma 4 models only
- GitHub OAuth app? Not needed for MVP public-repo flow; needed for P1 private repos
- Where to host (₹0): e.g. Vercel (Next.js) + Render/Railway free tier (FastAPI) + Supabase (Postgres) — needs confirmation
- Confirm accent decision (DRD-only violet) and MVP read-only PR scope
