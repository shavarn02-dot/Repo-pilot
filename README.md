# RepoPilot

**Understand what a GitHub repository needs before the next review.**

RepoPilot is a self-hosted repository health and review workspace. Enter a GitHub repository URL to see a repeatable, evidence-led health report, browse open pull requests and issues, ask questions about repository files, and experiment with screenshot-based debugging.

> **Important:** RepoPilot is a developer tool, not a security scanner or an automated code reviewer. Its health score is calculated from repository file-tree signals. It does not clone or execute repository code, and its findings need human review.

## Contents

- [What RepoPilot does](#what-repopilot-does)
- [How analysis works](#how-analysis-works)
- [Requirements](#requirements)
- [Run locally](#run-locally)
- [Run with Docker Compose](#run-with-docker-compose)
- [Configuration](#configuration)
- [Use the application](#use-the-application)
- [HTTP API](#http-api)
- [Data, privacy, and security](#data-privacy-and-security)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Tests and contribution](#tests-and-contribution)
- [Project layout](#project-layout)
- [License](#license)

## What RepoPilot does

- **Repository health reports:** analyze a GitHub repository and see a weighted score, category scores, evidence, and suggested improvements.
- **Pull-request review:** inspect open pull requests and run deterministic checks on a pull request diff. Optional AI-generated explanations supplement the checks; reviews are read-only and are not posted to GitHub.
- **Issue triage:** view open GitHub issues and get rule-based category, label, complexity, and beginner-friendly suggestions. Triage does not edit issues or labels.
- **Repository chat:** ask a question about a repository. RepoPilot retrieves a small number of matching files and returns a grounded answer when AI is configured, or matching source lines otherwise.
- **Visual Debugger:** upload a screenshot with a description, or provide before-and-after screenshots for a pull request. Images are validated and stored by the backend. The current AI visual-analysis path is experimental; see [Known limitations](#known-limitations).
- **Review-gated issue drafts:** create and edit a GitHub issue draft from a visual analysis. Publishing is a separate, write-enabled action that requires both an explicit confirmation and a server-side GitHub token.
- **Analysis history:** repository metadata, reports, pull-request reviews, visual analyses, and issue drafts are stored in the configured database.

The dashboard provides Overview, Reports, Pull request review, Issue triage, AI Assistant, Visual Debugger, and Settings pages.

## How analysis works

### Repository health score

The score is calculated by deterministic checks against the repository's GitHub file tree. AI does **not** set or change the numeric score.

| Category | Weight | Examples of signals checked |
|---|---:|---|
| Maintainability | 25% | Source directories, dependency manifests, and repository size |
| Security | 25% | A committed `.env` or key file, `.gitignore`, and `SECURITY.md` |
| Testing | 20% | Paths that look like test or spec files |
| Documentation | 15% | A root README, `docs/`, contribution guidance, and changelog |
| CI/CD | 10% | GitHub Actions workflow files and Docker configuration |
| Structure | 5% | License, `.gitignore`, README, and root-file count |

Each category is scored from 0 to 100. The overall score is the weighted sum of those category scores. A finding includes its category, severity, description, evidence, suggested fix, and source. The scoring rules are versioned (`1.0` at present); they are indicators, not a measure of code correctness or a guarantee that a repository is secure.

### AI assistance

When an OpenRouter key is configured, RepoPilot can request generated summaries or explanations using Gemma 4. AI output is supplemental and distinct from deterministic findings. File references are checked against the repository's known file paths; this grounding check does not prove that an AI explanation is correct.

Without an OpenRouter key, features that have a non-AI fallback continue to work. For example, repository chat can return matching file lines. AI-only output is not fabricated: responses report an unavailable or failed AI status instead.

### GitHub access

RepoPilot uses the GitHub REST API. Public repository reads can work without a token, subject to GitHub's unauthenticated rate limits. A server-side `GITHUB_TOKEN` can provide authenticated reads and is required for issue publishing. RepoPilot does not request OAuth in the browser.

## Requirements

For a local run:

- Python **3.10 or newer**
- Node.js **18.17 or newer** and npm
- Internet access to GitHub; OpenRouter access is needed only for AI features

Alternatively, install Docker and the Docker Compose plugin to run the app and PostgreSQL together.

## Run locally

Open two terminals from the repository root.

### 1. Start the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

To enable AI or authenticated GitHub access, set the relevant variables in the same terminal **before** starting Uvicorn:

```bash
export OPENROUTER_API_KEY="your-openrouter-api-key"
export GITHUB_TOKEN="your-github-token"
```

Both variables are optional for basic local use. The GitHub token is sensitive; never commit it or put it in frontend code. The API is available at `http://localhost:8000`; interactive FastAPI documentation is at `http://localhost:8000/docs`.

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend uses `http://localhost:8000` as its backend by default. To point it elsewhere, set `NEXT_PUBLIC_API_URL` when starting the frontend:

```bash
NEXT_PUBLIC_API_URL="http://localhost:8000" npm run dev
```

### 3. Try a repository

1. Open the landing page.
2. Analyze `https://github.com/octocat/Hello-World`.
3. Open the repository report to see the score, category breakdown, and findings.
4. Visit Pull request review, Issue triage, or AI Assistant to explore the other workflows.
5. Open Visual Debugger to upload a PNG, JPEG, or WebP image (maximum 10 MB).

The sample repository is public. Analysis requires a reachable GitHub API; AI output requires a valid OpenRouter key.

## Run with Docker Compose

From the repository root:

```bash
docker compose up --build
```

Then open:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

Compose starts the frontend, backend, and PostgreSQL. Database data is kept in the `pgdata` volume, and uploaded visual-analysis images are kept in the `visualdata` volume.

Compose passes `OPENROUTER_API_KEY` and `GITHUB_TOKEN` from the host environment (or a root `.env` file). The current Compose configuration does **not** pass `OPENROUTER_API_KEYS`; multi-key fallback is available when running the backend directly, but not wired into Compose. The PostgreSQL credentials in the Compose file are development defaults. Do not expose this configuration to an untrusted network without changing credentials and adding appropriate access controls.

To stop the services, press `Ctrl+C`, or run `docker compose down` from the project root.

## Configuration

The backend reads configuration from process environment variables. The frontend reads `NEXT_PUBLIC_API_URL`.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./repopilot.db` | SQLAlchemy database URL. Local development uses SQLite; Compose configures PostgreSQL. |
| `GITHUB_TOKEN` | unset | Optional server-side GitHub token for authenticated API reads; required to publish issue drafts. Keep it private. |
| `OPENROUTER_API_KEY` | unset | Optional single OpenRouter key for AI-assisted summaries and explanations. |
| `OPENROUTER_API_KEYS` | unset | Optional comma- or newline-separated key list with fallback between keys. When both key variables are set, the single key is tried first, followed by the list, with duplicates removed. This variable is not currently forwarded by Docker Compose. |
| `VISUAL_STORAGE_DIR` | `./data/visual` | Backend directory for uploaded and re-encoded images. |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL used by the frontend. This is a public frontend setting, not a place for secrets. |

The backend does not automatically load a `.env` file when run with Uvicorn; export variables in the shell or use your preferred environment manager. Docker Compose automatically reads a root `.env` file for variable substitution.

OpenRouter keys are tried in configured order. The configured model preference is `google/gemma-4-31b-it:free`, with `google/gemma-4-26b-a4b-it:free` as a model fallback. Provider errors can result in `provider_error`; check the backend logs and key/provider availability.

## Use the application

### Analyze and revisit a repository

Submit a GitHub repository URL such as `https://github.com/owner/repo`. RepoPilot reads repository metadata, the recursive file tree, the latest commit reference, and language statistics. It stores the filtered file list and report in its database. Re-analyzing a repository creates a new report for the latest repository state returned by GitHub.

### Review a pull request

Choose an open pull request and run an analysis. Deterministic checks look for patterns such as code changes without test-file changes, large pull requests, and secret-like keywords in added diff lines. If AI is configured, it may add a grounded summary or findings. The operation reads GitHub data only; it does not approve, comment on, or otherwise modify the pull request.

### Triage issues

RepoPilot lists open issues and applies simple text rules to suggest a category, labels, and rough complexity. These are suggestions only. No labels or issue content are written back to GitHub.

### Ask about repository files

The chat endpoint selects up to five paths by matching words from the question, fetches those files from the default branch, and uses the matching lines as evidence. With AI configured, the answer is generated from that evidence; without AI, RepoPilot returns extractive matching lines. This is lightweight file retrieval, not a full-repository semantic search.

### Use Visual Debugger and issue drafts

The Visual Debugger accepts PNG, JPEG, or WebP images up to 10 MB. The backend checks the image type, re-encodes it to remove image metadata, and stores it under `VISUAL_STORAGE_DIR`. You can create an editable issue draft from an analysis. Publishing requires a deliberate confirmation (`confirmed: true`) and a server-side token with permission to create issues in the target repository. Review the full draft and destination before publishing.

Use the Visual Debugger's delete-image action when you want to remove stored image files for an analysis. See [Data, privacy, and security](#data-privacy-and-security) before uploading sensitive images.

## HTTP API

All routes are served from the backend base URL (default `http://localhost:8000`). The interactive schema at `/docs` is the most convenient way to inspect request and response models.

### Health and repository analysis

| Method and path | Purpose |
|---|---|
| `GET /api/health` | Reports API status and whether AI keys are configured. |
| `POST /api/repositories/analyze` | Analyze a repository. JSON body: `{"url":"https://github.com/owner/repo"}`. Returns repository details, `job_id`, commit SHA when available, and the report. |
| `GET /api/repositories` | List repositories stored in the database. |
| `GET /api/repositories/{rid}` | Get a stored repository. |
| `GET /api/repositories/{rid}/report` | Get its most recent report and findings. |
| `GET /api/repositories/{rid}/files` | Get its filtered file-path list. |
| `GET /api/jobs/{jid}` | Get analysis job status and progress. |

### Pull requests, issues, and chat

| Method and path | Purpose |
|---|---|
| `GET /api/repositories/{rid}/pull-requests` | List up to 30 open pull requests. |
| `POST /api/repositories/{rid}/pull-requests/{number}/analyze` | Analyze a pull-request diff and store a read-only review. |
| `GET /api/pull-request-reviews/{review_id}` | Retrieve a stored review. |
| `GET /api/repositories/{rid}/issues` | List up to 50 open issues (excluding pull requests). |
| `POST /api/repositories/{rid}/issues/triage` | Return deterministic triage suggestions; does not edit GitHub. |
| `POST /api/repositories/{rid}/chat` | Ask about a repository. JSON body: `{"message":"Where is the API configured?"}`. |

### Visual analysis and issue drafts

| Method and path | Purpose |
|---|---|
| `POST /api/repositories/{rid}/visual/analyze` | Multipart upload with `image`; optional form fields `description` and `mode`. |
| `POST /api/repositories/{rid}/pull-requests/{number}/visual-review` | Multipart upload with `before_image` and `after_image`. |
| `GET /api/visual-analyses/{aid}` | Retrieve a visual analysis. |
| `POST /api/visual-analyses/{aid}/issue-draft` | Create an issue draft or save supplied draft fields (`title`, `body_md`, `severity`, `labels`). |
| `POST /api/visual-analyses/{aid}/issue-draft/publish` | Publish the saved draft. JSON may include `confirmed`, `title`, `body`, and `labels`; requires `confirmed: true` and a server token. |
| `DELETE /api/visual-analyses/{aid}/image` | Delete the stored image or before/after images for an analysis. |

`rid`, `jid`, `aid`, and `review_id` are numeric IDs returned by RepoPilot. Publishing an issue is the only API operation above that creates a GitHub issue; analysis, PR review, and triage are read-only with respect to GitHub.

## Data, privacy, and security

- RepoPilot stores repository metadata, file paths, reports, findings, and review/draft records in the configured database.
- It queries GitHub's API and does not clone or run repository code. Chat may fetch selected file contents from GitHub. When AI is configured, relevant prompts and evidence are sent from the backend to OpenRouter.
- Uploaded images are re-encoded to strip metadata and stored as files in `VISUAL_STORAGE_DIR`; they are not stored in the SQL database. The Docker setup uses a persistent volume for this directory. Images remain until deleted or the storage volume is removed.
- A configured GitHub token is kept on the backend and used for GitHub API calls. Issue publication is a write action and requires explicit confirmation.
- The API has no user authentication or per-user authorization. CORS is restricted to the local frontend origins by default, but CORS is not authentication. Do not expose this development setup as a public service or use it to process untrusted users' data without adding authentication, authorization, rate limiting, and production-grade secret/storage controls.
- Do not submit private repository content, credentials, or sensitive screenshots to an AI provider unless your organization's policies permit that data transfer.

## Known limitations

- **Heuristic scoring:** the score evaluates the presence of repository-tree signals. It does not inspect every source file or prove that the code is maintainable, secure, tested, or correct.
- **AI is optional and fallible:** AI provider output can be unavailable or inaccurate. Grounding checks validate cited paths against the file tree, not the truth of a finding.
- **Visual analysis is experimental:** the current backend validates and stores uploaded images, but the OpenRouter request path does not yet provide a complete multimodal image payload for actual vision reasoning. Do not rely on its AI output as a verified screenshot inspection.
- **Visual PR comparison is incomplete:** the current before/after endpoint stores the images and associates the request with a PR; it does not yet perform a complete visual diff review.
- **Image persistence is manual:** image files are retained until explicitly deleted or the storage volume is removed; automatic expiry is not implemented.
- **GitHub limits apply:** public unauthenticated requests are subject to GitHub rate limits. Private-repository access requires a token with access to that repository.
- **Not production hardened:** the project currently has no authentication or rate limiting. The local Compose database credentials are development defaults.

## Troubleshooting

| Problem | What to check |
|---|---|
| Frontend says it cannot reach the backend | Start Uvicorn on port 8000 and confirm `NEXT_PUBLIC_API_URL` points to the backend URL. |
| GitHub returns `403` | You may have reached the GitHub API rate limit or the token may lack access. Set a valid server-side `GITHUB_TOKEN` and retry later if rate-limited. |
| GitHub returns `404` | Confirm the repository URL is `https://github.com/owner/repo` and that the repository is accessible to the configured token. |
| AI status is `not_configured` | Set `OPENROUTER_API_KEY` (or `OPENROUTER_API_KEYS` for a direct backend run) in the backend process environment, then restart it. |
| AI status is `provider_error` | Check key validity, provider/model availability, network access, and backend logs. |
| Issue publishing returns `400` | Review the draft, then send `confirmed: true` in the publish request. |
| Issue publishing returns `403` | Configure `GITHUB_TOKEN` on the backend and ensure it can create issues in the selected repository. |
| Compose backend cannot connect to PostgreSQL at startup | Check `docker compose logs db`; PostgreSQL may still be starting. Once it is ready, restart the backend container. |

## Tests and contribution

Run the backend tests:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m pytest -q
```

Build the frontend:

```bash
cd frontend
npm install
npm run build
```

See [VERIFICATION.md](./VERIFICATION.md) for recorded verification details and [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines. Keep behavior and documentation aligned; do not present AI output, sample content, or heuristic findings as verified facts.

## Project layout

```text
Repo-pilot/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI routes and application workflows
│   │   ├── models.py         # SQLAlchemy records
│   │   ├── scoring.py        # Deterministic repository health rubric
│   │   ├── github_client.py  # GitHub REST API access and URL validation
│   │   ├── openrouter.py     # Optional AI provider integration
│   │   ├── grounding.py      # Validates AI file-path references
│   │   └── image_utils.py    # Image validation and metadata stripping
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── app/                  # Landing page and dashboard routes
│   ├── components/           # Shared UI components
│   └── lib/                  # API client and UI helpers
├── docs/                     # Product and verification reference material
├── docker-compose.yml
├── DESIGN.md
├── CONTRIBUTING.md
└── README.md
```

## License

RepoPilot is distributed under the [MIT License](./LICENSE).
