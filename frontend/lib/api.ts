export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function api(path: string, init?: RequestInit) {
  let r: Response;
  try {
    r = await fetch(`${API}${path}`, init);
  } catch {
    throw new Error(
      `Cannot reach the RepoPilot backend at ${API}. Start it (uvicorn app.main:app --port 8000) or check NEXT_PUBLIC_API_URL.`
    );
  }
  if (!r.ok) {
    let m = r.statusText;
    try {
      const j = await r.json();
      m = j.detail || m;
    } catch {}
    throw new Error(m);
  }
  return r.json();
}

export type Finding = {
  id?: number;
  category?: string;
  severity: string;
  title: string;
  description?: string;
  file_path?: string | null;
  line_start?: number | null;
  line_end?: number | null;
  evidence?: string;
  suggested_fix?: string;
  confidence?: number;
  source?: string;
};

export type Repo = {
  id: number;
  owner: string;
  name: string;
  full_name: string;
  description?: string | null;
  default_branch: string;
  visibility: string;
  html_url: string;
  languages?: Record<string, number>;
  last_analyzed_at?: string | null;
};

export type Report = {
  id: number;
  repository_id: number;
  scoring_version: string;
  health_score: number;
  scores: Record<string, number>;
  summary: string;
  ai_status: string;
  coverage?: { files_in_tree?: number; files_listed?: number };
  created_at: string;
  findings: Finding[];
};

export function sevColor(s: string) {
  return s === "critical" || s === "high"
    ? "text-danger border-danger"
    : s === "medium"
      ? "text-warning border-warning"
      : s === "low"
        ? "text-info border-info"
        : "text-secondary border-border";
}

/** Short commit SHA for display. */
export function shortSha(sha?: string | null) {
  return sha ? sha.slice(0, 7) : "—";
}

/** Format an ISO-ish backend timestamp for display, falling back to raw. */
export function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v.replace(" ", "T"));
  return isNaN(d.getTime()) ? v : d.toLocaleString();
}
