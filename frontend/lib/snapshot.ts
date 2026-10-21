// Recorded live analysis — captured 2026-10-21 from the RepoPilot backend
// against the real GitHub API. Every value below is verbatim from the API
// responses documented in ~/workspace/repopilot/REAL_DATA.md.
// This is a RECORDING of a real analysis, not live data and not sample data.
// It is only shown when the live backend is unreachable or has no data yet,
// and the UI must always label it as recorded (see RecordedNote component).

export const SNAPSHOT_LABEL =
  "Recorded live analysis — encode/httpx · captured 2026-10-21 from the RepoPilot backend (real GitHub API)";

export interface SnapFinding {
  severity: string;
  category: string;
  title: string;
  file_path: string | null;
  evidence: string;
  suggested_fix: string;
  confidence: number;
  source: string;
  description?: string;
}

export const SNAPSHOT = {
  capturedAt: "2026-10-21",
  repo: {
    full_name: "encode/httpx",
    description: "A next generation HTTP client for Python. 🦋",
    default_branch: "master",
    html_url: "https://github.com/encode/httpx",
    commit_sha: "b5addb64f0161ff6bfe94c124ef76f6a1fba5254",
    languages: { Python: 570031, Shell: 2821 },
    files_in_tree: 113,
  },
  health_score: 95.5,
  scores: {
    maintainability: 100.0,
    security: 90.0,
    testing: 100.0,
    documentation: 100.0,
    cicd: 80.0,
    structure: 100.0,
  } as Record<string, number>,
  summary:
    "Deterministic analysis of 113 files in encode/httpx. Health score 95.5/100 (scoring v1.0). 1 deterministic findings.",
  ai_status: "not_configured",
  scoring_version: "1.0",
  findings: [
    {
      severity: "low",
      category: "security",
      title: "No SECURITY.md",
      file_path: "SECURITY.md",
      evidence: "No SECURITY.md at root",
      suggested_fix: "Add SECURITY.md with a reporting process.",
      confidence: 1.0,
      source: "deterministic",
      description: "No vulnerability reporting policy found.",
    },
  ] as SnapFinding[],
  pullRequests: [
    { number: 3796, title: "Version 1.0", user: "lovelydinosaur" },
    { number: 3785, title: "Bump cryptography from 45.0.7 to 46.0.6", user: "dependabot[bot]" },
    { number: 3778, title: "Refactor `map_httpcore_exceptions` to not be a context manager", user: "akx" },
    { number: 3777, title: "Add real async iterator for ByteStreams", user: "akx" },
    { number: 3776, title: "Quiesce warnings from `grep` in sync version.sh", user: "akx" },
    { number: 3775, title: "Do not hang forever if test server fails to start", user: "akx" },
    { number: 3774, title: "docs: fix two broken examples in transports.md", user: "Aiudadadadf" },
    { number: 3771, title: "Fix `unquote` IndexError on empty string input", user: "bysiber" },
  ],
  prReview: {
    pr_number: 3771,
    title: "Fix `unquote` IndexError on empty string input",
    summary:
      "PR #3771: Fix `unquote` IndexError on empty string input — 1 files changed, +3/-1. Read-only review; nothing was posted to GitHub.",
    changed_files: ["httpx/_utils.py"],
    diff: [
      "--- httpx/_utils.py",
      "@@ -89,7 +89,9 @@ def to_bytes_or_str(value: str, match_type_of: typing.AnyStr) -> typing.AnyStr:",
      " ",
      " def unquote(value: str) -> str:",
      "-    return value[1:-1] if value[0] == value[-1] == '\"' else value",
      "+    if len(value) >= 2 and value[0] == value[-1] == '\"':",
      "+        return value[1:-1]",
      "+    return value",
      " ",
      " def peek_filelike_length(stream: typing.Any) -> int | None:",
    ].join("\n"),
    findings: [
      {
        severity: "medium",
        category: "testing",
        title: "Code changed without test changes",
        file_path: "httpx/_utils.py",
        evidence: "Changed files: httpx/_utils.py",
        suggested_fix: "Add or update tests covering the changed behaviour.",
        confidence: 1.0,
        source: "deterministic",
        description: "This PR changes code files but no test files.",
      },
    ] as SnapFinding[],
  },
  issues: [
    { number: 3782, title: "Potential Issue: `AsyncClient.stream` double-cancel may leak active connections", labels: [] as string[] },
    { number: 3781, title: "ADD PROXY _DICT SUPPORT into this latest HTTPX", labels: [] as string[] },
    { number: 3734, title: "The `create_ssl_context()` call can consume a lot of memory", labels: [] as string[] },
    { number: 3728, title: "RuntimeError: Attempted to exit a cancel scope that isn't the current tasks's current cancel scope", labels: [] as string[] },
    { number: 3713, title: "Getting SSL: WRONG_VERSION_NUMBER randomly. A restart resolves for a couple of days.", labels: [] as string[] },
    { number: 3712, title: "MockTransport doesn't set the elapsed property", labels: [] as string[] },
    { number: 3708, title: "test suite hangs after upgrading websockets from 13.1 to 15.0.1", labels: [] as string[] },
    { number: 3704, title: "Asyncio Task Creation Delay in Python 3.12.8 Compared to Python 3.10", labels: [] as string[] },
  ],
  triage: [
    { number: 3782, category: "testing", suggested_labels: ["testing"], complexity: "high", beginner_friendly: false },
    { number: 3781, category: "bug", suggested_labels: ["bug"], complexity: "high", beginner_friendly: false },
    { number: 3734, category: "bug", suggested_labels: ["bug"], complexity: "high", beginner_friendly: false },
    { number: 3728, category: "bug", suggested_labels: ["bug"], complexity: "high", beginner_friendly: false },
    { number: 3713, category: "bug", suggested_labels: ["bug"], complexity: "high", beginner_friendly: false },
    { number: 3712, category: "bug", suggested_labels: ["bug"], complexity: "medium", beginner_friendly: false },
    { number: 3708, category: "testing", suggested_labels: ["testing"], complexity: "high", beginner_friendly: false },
    { number: 3704, category: "testing", suggested_labels: ["testing"], complexity: "high", beginner_friendly: false },
  ],
  files: [
    ".github/CONTRIBUTING.md", ".github/FUNDING.yml", ".github/ISSUE_TEMPLATE/1-issue.md",
    ".github/ISSUE_TEMPLATE/config.yml", ".github/PULL_REQUEST_TEMPLATE.md", ".github/dependabot.yml",
    ".github/workflows/publish.yml", ".github/workflows/test-suite.yml", ".gitignore", "CHANGELOG.md",
    "LICENSE.md", "README.md", "docs/CNAME", "docs/advanced/authentication.md", "docs/advanced/clients.md",
    "docs/advanced/event-hooks.md", "docs/advanced/extensions.md", "docs/advanced/proxies.md",
    "docs/advanced/resource-limits.md", "docs/advanced/ssl.md", "docs/advanced/text-encodings.md",
    "docs/advanced/timeouts.md", "docs/advanced/transports.md", "docs/api.md", "docs/async.md",
    "docs/code_of_conduct.md", "docs/compatibility.md", "docs/contributing.md", "docs/css/custom.css",
    "docs/environment_variables.md",
  ],
};

// Contrast analyses captured the same day (see REAL_DATA.md for full findings).
export const SNAPSHOT_CONTRAST = [
  {
    full_name: "encode/httpx",
    description: "A next generation HTTP client for Python. 🦋",
    health_score: 95.5,
    files: 113,
    findings: 1,
    commit_sha: "b5addb64f0161ff6bfe94c124ef76f6a1fba5254",
    branch: "master",
  },
  {
    full_name: "pallets/click",
    description: "Python composable command line interface toolkit",
    health_score: 94.8,
    files: 175,
    findings: 1,
    commit_sha: "2247b35ea1c47c727d7a06e51fa280e12a863ff6",
    branch: "main",
  },
  {
    full_name: "sindresorhus/slugify",
    description: "Slugify a string",
    health_score: 81.5,
    files: 13,
    findings: 2,
    commit_sha: "3b17b2e84b97624a683aafaa38184bf2746fab22",
    branch: "main",
  },
  {
    full_name: "octocat/Hello-World",
    description: "My first repository on GitHub!",
    health_score: 37.8,
    files: 1,
    findings: 7,
    commit_sha: "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
    branch: "master",
  },
];

export const HELLO_WORLD = {
  scores: {
    maintainability: 35.0, security: 75.0, testing: 0.0,
    documentation: 55.0, cicd: 0.0, structure: 40.0,
  } as Record<string, number>,
  findings: [
    { severity: "low", category: "documentation", title: "No docs/ directory", file_path: "docs", evidence: "README present but no docs/ path in tree", suggested_fix: "Add docs/ for architecture and usage guides when the project grows.", confidence: 1.0, source: "deterministic", description: "Extended documentation was not found." },
    { severity: "high", category: "testing", title: "No test files detected", file_path: null, evidence: "Searched tree for test/spec paths; none matched", suggested_fix: "Add unit tests and a test command.", confidence: 1.0, source: "deterministic", description: "No files or directories indicating tests were found." },
    { severity: "medium", category: "cicd", title: "No GitHub Actions workflow detected", file_path: ".github/workflows", evidence: "No workflow YAML under .github/workflows/", suggested_fix: "Add a CI workflow that runs tests on pull requests.", confidence: 1.0, source: "deterministic", description: "CI configuration was not found." },
    { severity: "low", category: "security", title: "No SECURITY.md", file_path: "SECURITY.md", evidence: "No SECURITY.md at root", suggested_fix: "Add SECURITY.md with a reporting process.", confidence: 1.0, source: "deterministic", description: "No vulnerability reporting policy found." },
    { severity: "medium", category: "security", title: "No .gitignore", file_path: null, evidence: "No .gitignore in tree", suggested_fix: "Add a .gitignore covering .env, dependencies and build output.", confidence: 1.0, source: "deterministic", description: "Without .gitignore, secrets and build output are easier to commit accidentally." },
    { severity: "medium", category: "structure", title: "No LICENSE file", file_path: null, evidence: "No LICENSE path in tree", suggested_fix: "Add a LICENSE file (for example MIT).", confidence: 1.0, source: "deterministic", description: "Open-source reuse terms are unclear." },
    { severity: "medium", category: "maintainability", title: "No dependency manifest detected", file_path: null, evidence: "Checked package.json/pyproject.toml/requirements.txt/go.mod/Cargo.toml", suggested_fix: "Add a manifest that declares runtime and dev dependencies.", confidence: 1.0, source: "deterministic", description: "No standard manifest was found, so setup may be unclear." },
  ] as SnapFinding[],
};

export const CATEGORIES: [string, string, number][] = [
  ["maintainability", "Maintainability", 25],
  ["security", "Security signals", 25],
  ["testing", "Testing readiness", 20],
  ["documentation", "Documentation", 15],
  ["cicd", "CI/CD readiness", 10],
  ["structure", "Structure", 5],
];

export function healthTone(score: number): "success" | "warning" | "danger" {
  return score >= 80 ? "success" : score >= 50 ? "warning" : "danger";
}
