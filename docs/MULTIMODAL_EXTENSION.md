# RepoPilot — Multimodal Extension (PRD v1.1, 2026-10-21)
Extends PRD v1.0 / DRD v1.0 without breaking existing features. Model for ALL multimodal calls: `google/gemma-4-31b-it:free` via existing OpenRouter server-side integration. Fallback: `google/gemma-4-26b-a4b-it:free`.

## Priority order
- MVP: (1) Screenshot-to-Bug Detective, (2) Screenshot-to-GitHub Issue
- Next: (3) Visual PR Reviewer
- Integrated throughout: (4) Multimodal AI Assistant (image+text in repo chat)

## New functional requirements

### FR-11: Screenshot-to-Bug Detective (P0, multimodal MVP)
User uploads a UI screenshot (PNG/JPG/WebP, max 10 MB) + text description, in a selected repo context.
System: validates file type/size, strips EXIF, stores image encrypted at rest with signed access, runs Gemma 4 vision analysis, retrieves relevant repo files (grounded retrieval over file tree / component names / visible UI text OCR'd by model), returns structured findings.
Each finding: id, severity (critical/high/medium/low/info), title, visual evidence (what is seen in the image, quoted region description), suspected root cause labelled as AI INFERENCE, candidate files (only files that exist in the repo — validated against file tree, with line ranges validated before display), confidence 0–1, suggested fix.
Rule: if no repo file can be grounded, say so explicitly — never fabricate a path, root cause, or line reference. Distinguish "observed in screenshot" vs "inferred cause" vs "verified in code".

### FR-12: Screenshot-to-GitHub Issue (P0, multimodal MVP)
From a FR-11 analysis (or directly from screenshot+description), generate a structured issue draft: title, summary, steps to reproduce (only steps supported by user description/screenshot — mark inferred steps), expected vs actual, severity, suggested labels (from repo's existing label set where available), environment placeholder, attached screenshot reference.
Publishing is a GitHub WRITE action: show full preview + destination repo, allow editing, require explicit user confirmation checkbox/click. Never auto-publish. Requires GitHub OAuth with issues:write scope; without it, offer Copy Markdown / Download .md.

### FR-13: Visual PR Reviewer (P1)
User attaches before + after screenshots to a PR review. System aligns them with the PR diff, asks Gemma 4 to compare visuals + changed files, returns UI regression findings: region changed, expected-from-diff? (yes/no/unclear), severity, evidence, candidate changed file, suggested fix. Includes a before/after comparison view (slider). A visual change that matches the diff intent is reported as "consistent with diff", not a regression.

### FR-14: Multimodal AI Assistant (P1)
Repo chat accepts image + text together. Image is scoped to the active repo/branch context, shown as a context chip, removable. Answers must cite repo files as in FR-07, reference image regions in words, and admit insufficient evidence. Same prompt-injection defences: image text / repo text is untrusted content.

## API additions (all server-side, OpenRouter key never client-side)
- POST /api/repositories/{id}/visual/analyze — multipart: image, description, mode=bug-detective → 202 {job_id}
- GET  /api/jobs/{id} — existing jobs endpoint, reused (job type: visual_analysis)
- GET  /api/visual-analyses/{analysis_id} — structured findings
- POST /api/visual-analyses/{analysis_id}/issue-draft — generate/editable draft
- POST /api/visual-analyses/{analysis_id}/issue-draft/publish — body: {confirmed: true, title, body, labels[]} → creates GitHub issue, returns issue URL. 403 without OAuth scope, 400 without confirmed=true.
- POST /api/repositories/{id}/pull-requests/{number}/visual-review — multipart: before_image, after_image → findings linked to PR review
- POST /api/repositories/{id}/chat — extend existing: optional image attachment id alongside message
- DELETE /api/visual-analyses/{analysis_id}/image — user deletes stored image

## Database additions
- VisualAnalyses: id, repository_id, user_id, job_id, mode (bug_detective | pr_visual | assistant), image_storage_key, image_mime, image_bytes, image_sha256, description, status, model_id, latency_ms, token_usage, created_at
- VisualFindings: id, visual_analysis_id, severity, title, visual_evidence, root_cause_inference, file_path (validated, nullable), line_start, line_end, confidence, suggested_fix, source (ai_inference)
- IssueDrafts: id, visual_analysis_id, repository_id, title, body_md, severity, labels (jsonb), status (draft | published), github_issue_number, github_issue_url, published_at, published_by
- PullRequestReviews: add before_image_key, after_image_key, visual_findings_count (or link VisualAnalyses via pr_review_id)
Storage rule: images are user data — private bucket, signed URLs, auto-delete option, never used for training, listed in privacy docs. Do not store images in Postgres (storage key only).

## Processing pipeline
Upload → validate (mime sniff, size, dimensions) → strip metadata → private storage → job queued → retrieval (file tree + candidate files by visible text/component names) → Gemma 4 multimodal call (structured JSON schema) → schema validation → grounding validation (paths/lines exist?) → ungrounded findings downgraded / marked "unverified" → persist → UI.

## Security / trust
- Images treated as untrusted input; text inside images must not trigger tools/actions (prompt-injection via screenshot).
- No image leaves the backend except to OpenRouter for the user's own analysis request.
- Rate-limit visual endpoints separately (vision calls are expensive); file-size + daily free-tier caps.
- Issue publishing: explicit confirmation, preview, destination shown (same pattern as PR comment publishing in DRD §8).

## Tests (additions to PRD §16 plan)
Unit: image validation (mime/size/dimension), schema validation of vision responses, grounding validator (fake path rejected), issue-draft renderer.
Integration: mocked OpenRouter vision response → findings persisted; publish endpoint refuses without confirmed=true and without OAuth scope; image delete removes storage object.
E2E: upload screenshot → progress stages → findings with evidence → draft issue → edit → confirm → (mocked GitHub) issue created; Visual PR: before/after upload → comparison → regression finding linked to a changed file.
Golden rule test: a model response citing a non-existent file must NEVER render as verified evidence.

## UI — Visual Debugger workspace (DRD §5 shell)
New sidebar item: Visual Debugger (between AI Assistant and Reports), Lucide `ScanEye` / `ImageSearch` style icon, 16–20px, labelled.
Layout: left = upload + description + repo context + analysis stages; centre = screenshot viewer with region markers; right inspector = structured findings, then issue-draft panel when requested. Mobile: stacked, inspector becomes drawer.
Loading shows REAL stages: Uploading → Reading screenshot → Retrieving repository files → Analysing with Gemma 4 → Validating evidence. No fake percentages.
Demo data, if shown, is labelled "Demonstration" per DRD §6.
