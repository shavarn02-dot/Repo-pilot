"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Download, ArrowUpRight } from "lucide-react";
import { api, fmtDate } from "@/lib/api";
import { SNAPSHOT_CONTRAST } from "@/lib/snapshot";
import { Empty, ErrorBox, PageHead, RecordedNote, ScoreBar, scoreTextClass } from "@/components/ui";

export default function Reports() {
  const [repos, setRepos] = useState<any[]>([]);
  const [reports, setReports] = useState<any>({});
  const [err, setErr] = useState("");
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rs = await api("/api/repositories");
        setRepos(rs);
        const out: any = {};
        for (const r of rs) {
          try { out[r.id] = await api(`/api/repositories/${r.id}/report`); } catch {}
        }
        setReports(out);
      } catch (e: any) {
        setOffline(true);
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function download(r: any, rep: any) {
    const blob = new Blob([JSON.stringify(rep, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `repopilot-${r.full_name.replace("/", "-")}-report.json`;
    a.click();
  }
  function downloadRecorded(c: any) {
    const payload = {
      repository: c.full_name, health_score: c.health_score, files_analysed: c.files,
      findings_count: c.findings, commit_sha: c.commit_sha, default_branch: c.branch,
      captured_at: "2026-10-21",
      source: "Recorded live analysis — captured from the RepoPilot backend against the real GitHub API. Full findings in REAL_DATA.md.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `repopilot-${c.full_name.replace("/", "-")}-recorded.json`;
    a.click();
  }

  return (
    <div>
      <PageHead
        eyebrow="History · FR-10"
        title="Reports"
        body="Analysis history. Each report is tied to the repository state — and the commit — at the moment it was analysed, so scores are comparable only across the same scoring version."
      />
      {err && !offline && <div className="mt-4"><ErrorBox msg={err} /></div>}
      {offline && (
        <div className="mt-5">
          <RecordedNote label="These are the 4 analyses captured 2026-10-21 from the RepoPilot backend against the real GitHub API" />
        </div>
      )}

      <div className="mt-7">
        {loading ? (
          <div className="space-y-3" role="status" aria-label="Loading reports">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton-pulse h-[76px] rounded-[24px] bg-elevated" style={{ animationDelay: `${i * 120}ms` }} />)}
          </div>
        ) : offline ? (
          <div className="overflow-x-auto rounded-[24px] border border-border bg-surface">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">Repository</th>
                  <th className="px-4 py-3 font-medium">Health</th>
                  <th className="px-4 py-3 text-right font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Commit</th>
                  <th className="px-4 py-3 font-medium">Captured</th>
                  <th className="px-4 py-3" aria-label="Export" />
                </tr>
              </thead>
              <tbody>
                {SNAPSHOT_CONTRAST.map((c) => (
                  <tr key={c.full_name} className="border-b border-border transition duration-120 last:border-0 hover:bg-hover">
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-[13px]">{c.full_name}</p>
                      <p className="tnum mt-0.5 text-xs text-muted">{c.files} files · {c.findings} findings · scoring v1.0</p>
                    </td>
                    <td className="w-[170px] px-4 py-3.5"><ScoreBar value={c.health_score} label={`${c.full_name} health`} /></td>
                    <td className={`tnum px-4 py-3.5 text-right font-mono text-[15px] font-semibold ${scoreTextClass(c.health_score)}`}>{c.health_score.toFixed(1)}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted">{c.commit_sha.slice(0, 7)}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-secondary">2026-10-21</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => downloadRecorded(c)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-[13px] transition duration-300 ease-spring hover:bg-elevated"
                      >
                        <Download size={13} /> JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : repos.length === 0 ? (
          <Empty title="No reports yet" body="Analyse a repository first — its report will be listed here with the commit it was measured at." />
        ) : (
          <div className="space-y-3">
            {repos.map((r) => {
              const rep = reports[r.id];
              return (
                <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-[24px] border border-border bg-surface px-5 py-4 transition duration-160 hover:bg-hover">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[13px]">{r.full_name}</p>
                    <p className="mt-1 text-[13px] text-secondary">
                      {rep
                        ? <>Analysed {fmtDate(rep.created_at)} · AI {rep.ai_status} · scoring v{rep.scoring_version}</>
                        : "No report yet"}
                    </p>
                  </div>
                  {rep && (
                    <>
                      <span className={`tnum font-mono text-2xl font-semibold ${scoreTextClass(rep.health_score)}`}>
                        {rep.health_score.toFixed(1)}
                        <span className="ml-1 text-xs font-normal text-muted">/ 100</span>
                      </span>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/repositories/${r.id}`} className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[13px] transition duration-300 ease-spring hover:bg-elevated">
                          Open <ArrowUpRight size={13} />
                        </Link>
                        <button onClick={() => download(r, rep)} className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[13px] transition duration-300 ease-spring hover:bg-elevated">
                          <Download size={13} /> Export JSON
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
