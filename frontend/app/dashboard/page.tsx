"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { api, fmtDate, Repo } from "@/lib/api";
import { SNAPSHOT_CONTRAST } from "@/lib/snapshot";
import { Empty, ErrorBox, PageHead, RecordedNote, ScoreBar, TableSkeleton, scoreTextClass } from "@/components/ui";

export default function Overview() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [err, setErr] = useState("");
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const rs: Repo[] = await api("/api/repositories");
      setRepos(rs);
      setOffline(false);
      const out: Record<number, number> = {};
      for (const r of rs) {
        try {
          const rep = await api(`/api/repositories/${r.id}/report`);
          out[r.id] = rep.health_score;
        } catch {}
      }
      setScores(out);
    } catch (e: any) {
      setOffline(true);
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const d = await api("/api/repositories/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      window.location.href = `/dashboard/repositories/${d.repository.id}`;
    } catch (x: any) {
      setErr(x.message);
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHead
        eyebrow="Workspace"
        title="Overview"
        body="Analyse a public repository, or reopen one you already checked. Scores are deterministic — the same file tree always produces the same report."
      />

      <form
        onSubmit={analyze}
        className="mt-7 flex flex-col gap-2 rounded-[24px] border border-border bg-surface p-3.5 sm:flex-row"
      >
        <label className="sr-only" htmlFor="ov-url">GitHub repository URL</label>
        <input
          id="ov-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="min-w-0 flex-1 rounded-2xl border border-border bg-canvas px-3.5 py-2.5 font-mono text-sm transition duration-160 placeholder:text-muted hover:border-muted focus:border-accent"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          disabled={busy || !url.trim()}
          className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-onAccent transition duration-160 hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Analysing…" : (<>Analyse <ArrowRight size={15} /></>)}
        </button>
      </form>
      {busy && (
        <p className="mt-3 flex items-center gap-2 text-sm text-secondary" role="status">
          <span className="stage-dot-active h-2 w-2 rounded-full bg-accent" aria-hidden />
          Fetching repository metadata and file tree from GitHub…
        </p>
      )}
      {err && !offline && <div className="mt-4"><ErrorBox msg={err} /></div>}

      <div className="mt-10 flex items-end justify-between gap-4">
        <h2 id="repositories" className="text-xl font-semibold">Repositories</h2>
        <p className="tnum font-mono text-xs text-muted">
          {offline ? `${SNAPSHOT_CONTRAST.length} recorded` : loading ? "…" : `${repos.length} analysed`}
        </p>
      </div>

      <div className="mt-4">
        {loading ? (
          <TableSkeleton cols={4} rows={4} />
        ) : offline ? (
          <div className="space-y-4">
            <RecordedNote label="Backend is offline, so this table shows 4 real analyses captured 2026-10-21 from the RepoPilot backend against the real GitHub API" />
            <div className="overflow-x-auto rounded-[24px] border border-border bg-surface">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 font-medium">Repository</th>
                    <th className="px-4 py-3 font-medium">Health</th>
                    <th className="px-4 py-3 text-right font-medium">Score</th>
                    <th className="px-4 py-3 text-right font-medium">Files</th>
                    <th className="px-4 py-3 text-right font-medium">Findings</th>
                    <th className="px-4 py-3 font-medium">Commit</th>
                  </tr>
                </thead>
                <tbody>
                  {SNAPSHOT_CONTRAST.map((r) => (
                    <tr key={r.full_name} className="border-b border-border transition duration-120 last:border-0 hover:bg-hover">
                      <td className="px-4 py-3.5">
                        <p className="font-mono text-[13px]">{r.full_name}</p>
                        <p className="mt-0.5 text-[13px] text-secondary">{r.description}</p>
                      </td>
                      <td className="w-[180px] px-4 py-3.5"><ScoreBar value={r.health_score} label={`${r.full_name} health`} /></td>
                      <td className={`tnum px-4 py-3.5 text-right font-mono text-[15px] font-semibold ${scoreTextClass(r.health_score)}`}>
                        {r.health_score.toFixed(1)}
                      </td>
                      <td className="tnum px-4 py-3.5 text-right font-mono text-[13px] text-secondary">{r.files}</td>
                      <td className="tnum px-4 py-3.5 text-right font-mono text-[13px] text-secondary">{r.findings}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted">{r.commit_sha.slice(0, 7)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[13px] text-muted">
              Full findings for each of these are recorded in the project&apos;s REAL_DATA.md, captured
              2026-10-21 through the live backend.
            </p>
          </div>
        ) : repos.length === 0 ? (
          <Empty
            title="No repositories analysed yet"
            body="Paste a public GitHub URL above. Your first health report — score, category breakdown and evidence-linked findings — will appear here."
          />
        ) : (
          <div className="overflow-x-auto rounded-[24px] border border-border bg-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">Repository</th>
                  <th className="px-4 py-3 font-medium">Branch</th>
                  <th className="px-4 py-3 text-right font-medium">Health score</th>
                  <th className="px-4 py-3 font-medium">Last analysed</th>
                  <th className="px-4 py-3" aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {repos.map((r) => (
                  <tr key={r.id} className="border-b border-border transition duration-120 last:border-0 hover:bg-hover">
                    <td className="px-4 py-3.5">
                      <Link href={`/dashboard/repositories/${r.id}`} className="font-mono text-[13px] hover:text-accent">
                        {r.full_name}
                      </Link>
                      <p className="mt-0.5 max-w-md truncate text-[13px] text-secondary">{r.description || "No description on GitHub"}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-secondary">{r.default_branch}</td>
                    <td className="tnum px-4 py-3.5 text-right font-mono text-[15px] font-semibold">
                      {scores[r.id] !== undefined ? (
                        <span className={scoreTextClass(scores[r.id])}>{scores[r.id].toFixed(1)}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-secondary">{fmtDate(r.last_analyzed_at)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/dashboard/repositories/${r.id}`}
                        aria-label={`Open ${r.full_name}`}
                        className="inline-flex rounded-2xl border border-border p-1.5 text-secondary transition duration-160 hover:bg-hover hover:text-primary"
                      >
                        <ArrowUpRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
