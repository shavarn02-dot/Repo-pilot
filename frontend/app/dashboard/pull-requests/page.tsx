"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SNAPSHOT, SNAPSHOT_LABEL } from "@/lib/snapshot";
import { AiStatusBadge, Empty, ErrorBox, PageHead, Panel, PanelHead, RecordedNote, SevBadge, Skeleton } from "@/components/ui";

function DiffView({ diff }: { diff: string }) {
  if (!diff) return <p className="text-sm text-secondary">No textual diff returned.</p>;
  return (
    <pre className="scroll-slim max-h-[440px] overflow-auto rounded-lg border border-border bg-canvas p-4 font-mono text-xs leading-[1.7]">
      {diff.split("\n").map((ln, i) => (
        <div
          key={i}
          className={
            ln.startsWith("+") && !ln.startsWith("+++")
              ? "bg-success/10 text-success"
              : ln.startsWith("-") && !ln.startsWith("---")
                ? "bg-danger/10 text-danger"
                : ln.startsWith("@@")
                  ? "text-info"
                  : ln.startsWith("---")
                    ? "font-semibold text-primary"
                    : "text-secondary"
          }
        >
          {ln || " "}
        </div>
      ))}
    </pre>
  );
}

export default function PRs() {
  const [repos, setRepos] = useState<any[]>([]);
  const [rid, setRid] = useState("");
  const [prs, setPrs] = useState<any[]>([]);
  const [review, setReview] = useState<any>(null);
  const [err, setErr] = useState("");
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    api("/api/repositories")
      .then((r: any[]) => { setRepos(r); if (r[0]) setRid(String(r[0].id)); })
      .catch((e) => { setOffline(true); setErr(e.message); setReview(SNAPSHOT.prReview); setActive(3771); });
  }, []);
  useEffect(() => {
    if (rid) api(`/api/repositories/${rid}/pull-requests`).then(setPrs).catch((e) => setErr(e.message));
  }, [rid]);

  async function analyze(n: number) {
    setBusy(n); setActive(n); setErr("");
    try {
      setReview(await api(`/api/repositories/${rid}/pull-requests/${n}/analyze`, { method: "POST" }));
    } catch (e: any) { setErr(e.message); }
    setBusy(null);
  }

  const list = offline ? SNAPSHOT.pullRequests : prs;

  return (
    <div>
      <PageHead
        eyebrow="Review"
        title="Pull request review"
        body="Read-only review of real GitHub diffs. RepoPilot never posts comments to GitHub from this workspace."
        actions={!offline ? (
          <select
            value={rid}
            onChange={(e) => setRid(e.target.value)}
            aria-label="Repository"
            className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[13px] transition duration-160 hover:border-muted focus:border-accent"
          >
            {repos.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
          </select>
        ) : undefined}
      />
      {err && !offline && <div className="mt-4"><ErrorBox msg={err} /></div>}
      {offline && <div className="mt-5"><RecordedNote label={SNAPSHOT_LABEL} /></div>}

      <div className="mt-7 grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel>
          <PanelHead title="Open pull requests" sub={offline ? "First 8 of 30 returned · recorded" : `${list.length} returned by GitHub`} />
          <div className="max-h-[560px] divide-y divide-border overflow-y-auto">
            {list.length === 0 ? (
              <div className="p-4"><Empty title="No open pull requests" body="GitHub returned no open PRs for this repository, or none has been analysed yet." /></div>
            ) : (
              list.map((p: any) => (
                <button
                  key={p.number}
                  onClick={() => (offline ? (setReview(SNAPSHOT.prReview), setActive(p.number)) : analyze(p.number))}
                  aria-current={active === p.number ? "true" : undefined}
                  className={`relative block w-full px-4 py-3.5 text-left transition duration-160 ${
                    active === p.number ? "bg-hover" : "hover:bg-hover"
                  }`}
                >
                  {active === p.number && <span className="absolute left-0 top-0 h-full w-[3px] bg-accent" aria-hidden />}
                  <span className="tnum flex items-baseline justify-between gap-2">
                    <span className="font-mono text-xs text-muted">#{p.number}</span>
                    {busy === p.number && <span className="text-[11px] text-accent">Fetching diff…</span>}
                  </span>
                  <span className="mt-1 block text-sm font-medium leading-snug">{p.title}</span>
                  <span className="mt-1 block font-mono text-[11px] text-muted">by {p.user}</span>
                </button>
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHead
            title={review ? `Review — PR #${review.pr_number}` : "Review"}
            sub={review ? review.changed_files?.join(", ") : "Select a pull request"}
            right={review ? <AiStatusBadge status={review.ai_status || "not_configured"} /> : undefined}
          />
          <div className="px-5 py-5">
            {busy !== null ? (
              <Skeleton rows={2} />
            ) : review ? (
              <div className="rise" key={review.pr_number}>
                <p className="text-sm leading-relaxed text-secondary">{review.summary}</p>
                <h3 className="mt-6 text-[15px] font-semibold">
                  Findings <span className="tnum font-mono text-[13px] font-normal text-muted">{review.findings.length}</span>
                </h3>
                {review.findings.length === 0 ? (
                  <p className="mt-2 text-sm text-secondary">No deterministic findings in this diff.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {review.findings.map((f: any, i: number) => (
                      <article key={i} className="rounded-lg border border-border bg-canvas p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <SevBadge severity={f.severity} />
                          <span className="text-xs capitalize text-muted">{f.category}</span>
                          <span className="tnum ml-auto font-mono text-[11px] text-muted">confidence {Number(f.confidence).toFixed(2)} · {f.source}</span>
                        </div>
                        <p className="mt-2.5 text-sm font-semibold">{f.title}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-secondary">{f.description}</p>
                        <dl className="mt-3 space-y-2 border-t border-border pt-3 text-[13px]">
                          <div className="flex gap-2">
                            <dt className="w-[72px] shrink-0 text-muted">Evidence</dt>
                            <dd className="font-mono text-xs leading-relaxed">{f.evidence}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-[72px] shrink-0 text-muted">Fix</dt>
                            <dd className="leading-relaxed">{f.suggested_fix}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                )}
                <h3 className="mt-6 text-[15px] font-semibold">Diff</h3>
                <div className="mt-3"><DiffView diff={review.diff} /></div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-secondary">
                Select a pull request on the left to fetch its real diff from GitHub and review it.
                Changed files, additions and deletions come straight from the GitHub API.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
