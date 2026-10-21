# RepoPilot — Real Captured Data

> **Captured live from the RepoPilot backend against the real GitHub API — not sample data.**
> Capture date: **2026-10-21**. Method: backend reinstalled in `backend/.venv`, `uvicorn app.main:app --port 8000`,
> then `POST /api/repositories/analyze` (plus PR / issues / files / PR-diff endpoints) against real public repositories.
> AI status for every analysis below: `not_configured` (no `OPENROUTER_API_KEY` on the server) — all scores and
> findings are from RepoPilot's deterministic checks only. Nothing in this file was edited, rounded, or invented;
> scores, findings, titles and SHAs are copied verbatim from the API responses.
>
> GitHub rate limit: no rate-limit failure was hit during capture. Core quota read 57/60 remaining before capture
> and 56/60 remaining after the PR-diff analysis (the sandbox egress proxy presents a shared pool, so the counter
> does not decrease 1:1 with the calls made here). Endpoint calls made: 4 analyses × 4 calls, 1 PR list,
> 1 issues list, 1 files list (local DB), 1 PR analyze × 2 calls, 1 triage (re-lists issues).

---

## 1. Primary repository — encode/httpx (healthy, mid-size)

| Field | Value (verbatim) |
|---|---|
| Full name | `encode/httpx` |
| Description | "A next generation HTTP client for Python. 🦋" |
| Default branch | `master` |
| Commit SHA analysed | `b5addb64f0161ff6bfe94c124ef76f6a1fba5254` |
| Languages | Python 570031 bytes, Shell 2821 bytes |
| Files analysed | 113 of 113 in tree |
| Scoring version | 1.0 |
| **Health score** | **95.5 / 100** |
| AI status | `not_configured` |

Category scores (weights in brackets):

| Category | Score |
|---|---|
| Maintainability (25%) | 100.0 |
| Security signals (25%) | 90.0 |
| Testing readiness (20%) | 100.0 |
| Documentation (15%) | 100.0 |
| CI/CD readiness (10%) | 80.0 |
| Structure (5%) | 100.0 |

Weighted check: 100×.25 + 90×.25 + 100×.20 + 100×.15 + 80×.10 + 100×.05 = 95.5 ✓

Summary (verbatim): "Deterministic analysis of 113 files in encode/httpx. Health score 95.5/100 (scoring v1.0). 1 deterministic findings."

Findings (complete list — exactly 1):

| # | Severity | Category | Title | File | Evidence | Suggested fix | Confidence | Source |
|---|---|---|---|---|---|---|---|---|
| 8 | low | security | No SECURITY.md | `SECURITY.md` | No SECURITY.md at root | Add SECURITY.md with a reporting process. | 1.0 | deterministic |

### Files list (GET /api/repositories/2/files — 113 files, first 30 verbatim)
`.github/CONTRIBUTING.md`, `.github/FUNDING.yml`, `.github/ISSUE_TEMPLATE/1-issue.md`, `.github/ISSUE_TEMPLATE/config.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/dependabot.yml`, `.github/workflows/publish.yml`, `.github/workflows/test-suite.yml`, `.gitignore`, `CHANGELOG.md`, `LICENSE.md`, `README.md`, `docs/CNAME`, `docs/advanced/authentication.md`, `docs/advanced/clients.md`, `docs/advanced/event-hooks.md`, `docs/advanced/extensions.md`, `docs/advanced/proxies.md`, `docs/advanced/resource-limits.md`, `docs/advanced/ssl.md`, `docs/advanced/text-encodings.md`, `docs/advanced/timeouts.md`, `docs/advanced/transports.md`, `docs/api.md`, `docs/async.md`, `docs/code_of_conduct.md`, `docs/compatibility.md`, `docs/contributing.md`, `docs/css/custom.css`, `docs/environment_variables.md` … (113 total)

### Open pull requests (GET /api/repositories/2/pull-requests — 30 returned, first 8 verbatim)

| # | Title | Author |
|---|---|---|
| 3796 | Version 1.0 | lovelydinosaur |
| 3785 | Bump cryptography from 45.0.7 to 46.0.6 | dependabot[bot] |
| 3778 | Refactor `map_httpcore_exceptions` to not be a context manager | akx |
| 3777 | Add real async iterator for ByteStreams | akx |
| 3776 | Quiesce warnings from `grep` in sync version.sh | akx |
| 3775 | Do not hang forever if test server fails to start | akx |
| 3774 | docs: fix two broken examples in transports.md | Aiudadadadf |
| 3771 | Fix `unquote` IndexError on empty string input | bysiber |

### PR diff analysis — PR #3771 (POST /api/repositories/2/pull-requests/3771/analyze)

- Summary (verbatim): "PR #3771: Fix `unquote` IndexError on empty string input — 1 files changed, +3/-1. Read-only review; nothing was posted to GitHub."
- Changed files: `httpx/_utils.py` (only file)
- Diff (verbatim):
  ```
  --- httpx/_utils.py
  @@ -89,7 +89,9 @@ def to_bytes_or_str(value: str, match_type_of: typing.AnyStr) -> typing.AnyStr:
  
  def unquote(value: str) -> str:
  -    return value[1:-1] if value[0] == value[-1] == '"' else value
  +    if len(value) >= 2 and value[0] == value[-1] == '"':
  +        return value[1:-1]
  +    return value
  ```
- Findings (exactly 1): medium · testing · "Code changed without test changes" · file `httpx/_utils.py` · evidence "Changed files: httpx/_utils.py" · suggested fix "Add or update tests covering the changed behaviour." · confidence 1.0 · source deterministic.

### Open issues (GET /api/repositories/2/issues — 8 returned, complete list verbatim; none carried GitHub labels at capture time)

| # | Title |
|---|---|
| 3782 | Potential Issue: `AsyncClient.stream` double-cancel may leak active connections |
| 3781 | ADD PROXY _DICT SUPPORT into this latest HTTPX |
| 3734 | The `create_ssl_context()` call can consume a lot of memory |
| 3728 | RuntimeError: Attempted to exit a cancel scope that isn't the current tasks's current cancel scope |
| 3713 | Getting SSL: WRONG_VERSION_NUMBER randomly. A restart resolves for a couple of days. |
| 3712 | MockTransport doesn't set the elapsed property |
| 3708 | test suite hangs after upgrading websockets from 13.1 to 15.0.1 |
| 3704 | Asyncio Task Creation Delay in Python 3.12.8 Compared to Python 3.10 |

### Issue triage (POST /api/repositories/2/issues/triage — deterministic rules, suggestions only, nothing modified on GitHub)

| # | Category | Suggested labels | Complexity |
|---|---|---|---|
| 3782 | testing | testing | high |
| 3781 | bug | bug | high |
| 3734 | bug | bug | high |
| 3728 | bug | bug | high |
| 3713 | bug | bug | high |
| 3712 | bug | bug | medium |
| 3708 | testing | testing | high |
| 3704 | testing | testing | high |

None flagged beginner-friendly.

---

## 2. Contrast — sindresorhus/slugify (mixed / mid health)

| Field | Value (verbatim) |
|---|---|
| Full name | `sindresorhus/slugify` |
| Description | "Slugify a string" |
| Default branch | `main` |
| Commit SHA analysed | `3b17b2e84b97624a683aafaa38184bf2746fab22` |
| Languages | JavaScript 20177 bytes |
| Files analysed | 13 of 13 in tree |
| **Health score** | **81.5 / 100** |

Category scores: Maintainability 100.0 · Security 90.0 · Testing 64.0 · Documentation 55.0 · CI/CD 80.0 · Structure 100.0
Weighted check: 100×.25 + 90×.25 + 64×.20 + 55×.15 + 80×.10 + 100×.05 = 81.5 ✓

Findings (complete list — exactly 2, both low, source deterministic, confidence 1.0):

| Severity | Category | Title | File | Evidence |
|---|---|---|---|---|
| low | documentation | No docs/ directory | `docs` | README present but no docs/ path in tree |
| low | security | No SECURITY.md | `SECURITY.md` | No SECURITY.md at root |

---

## 3. Contrast — octocat/Hello-World (low health)

| Field | Value (verbatim) |
|---|---|
| Full name | `octocat/Hello-World` |
| Description | "My first repository on GitHub!" |
| Default branch | `master` |
| Commit SHA analysed | `7fd1a60b01f91b314f59955a4e4d4e80d8edf11d` |
| Files analysed | 1 of 1 in tree (`README`) |
| **Health score** | **37.8 / 100** |

Category scores: Maintainability 35.0 · Security 75.0 · Testing 0.0 · Documentation 55.0 · CI/CD 0.0 · Structure 40.0
Weighted check: 35×.25 + 75×.25 + 0×.20 + 55×.15 + 0×.10 + 40×.05 = 37.75 → 37.8 ✓

Findings (complete list — exactly 7, all source deterministic, confidence 1.0):

| Severity | Category | Title | File | Evidence |
|---|---|---|---|---|
| low | documentation | No docs/ directory | `docs` | README present but no docs/ path in tree |
| high | testing | No test files detected | — | Searched tree for test/spec paths; none matched |
| medium | cicd | No GitHub Actions workflow detected | `.github/workflows` | No workflow YAML under .github/workflows/ |
| low | security | No SECURITY.md | `SECURITY.md` | No SECURITY.md at root |
| medium | security | No .gitignore | — | No .gitignore in tree |
| medium | structure | No LICENSE file | — | No LICENSE path in tree |
| medium | maintainability | No dependency manifest detected | — | Checked package.json/pyproject.toml/requirements.txt/go.mod/Cargo.toml |

---

## 4. Also captured — pallets/click (healthy, larger)

| Field | Value (verbatim) |
|---|---|
| Full name | `pallets/click` |
| Description | "Python composable command line interface toolkit" |
| Default branch | `main` |
| Commit SHA analysed | `2247b35ea1c47c727d7a06e51fa280e12a863ff6` |
| Languages | Python 971989 bytes, Shell 165 bytes |
| Files analysed | 175 of 175 in tree |
| **Health score** | **94.8 / 100** |

Category scores: Maintainability 100.0 · Security 90.0 · Testing 100.0 · Documentation 95.0 · CI/CD 80.0 · Structure 100.0
Weighted check: 100×.25 + 90×.25 + 100×.20 + 95×.15 + 80×.10 + 100×.05 = 94.75 → 94.8 ✓

Findings (complete list — exactly 1): low · security · "No SECURITY.md" · file `SECURITY.md` · evidence "No SECURITY.md at root" · source deterministic.

---

## How the frontend uses this file

`frontend/lib/snapshot.ts` embeds the encode/httpx primary analysis above (plus the three contrast scores)
**verbatim**. It is shown only when the live backend is unreachable or no live analysis exists yet, and it is
always labelled: **"Recorded live analysis — encode/httpx · captured 2026-10-21 from the RepoPilot backend
(real GitHub API)"**. It is never labelled "live" and never presented as demonstration fiction.
