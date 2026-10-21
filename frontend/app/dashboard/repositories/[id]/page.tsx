"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ExternalLink, ArrowUpDown } from "lucide-react";
import { api, Finding, fmtDate, Report, Repo } from "@/lib/api";
import { CATEGORIES } from "@/lib/snapshot";
import {
  AiStatusBadge, Badge, Empty, ErrorBox, Panel, PanelHead, ScoreBar,
  SevBadge, Skeleton, scoreTextClass,
} from "@/components/ui";

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export default function RepoOverview() {
  const { id } = useParams();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [err, setErr] = useState("");
  const [sel, setSel] = useState<Finding | null>(null);
  const [sev, setSev] = useState("all");
  const [sortDesc, setSortDesc] = useState(true);

  async function load() {
    if (!id) return;
    setErr("");
    try {
      const [a, b] = await Promise.all([
        api(`/api/repositories/${id}`),
        api(`/api/repositories/${id}/report`),
      ]);
      setRepo(a);
      setReport(b);
      if (b.findings?.length) setSel(b.findings[0]);
    } catch (e: any) {
      setErr(e.message);
    }
  }
  useEffect(() => { load(); }, [id]);

  const findings = useMemo(() => {
    const all = (report?.findings || []).filter((f) => sev === "all" || f.severity === sev);
    return [...all].sort((a, b) =>
      sortDesc
        ? (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9)
        : (SEV_ORDER[b.severity] ?? 9) - (SEV_ORDER[a.severity] ?? 9)
    );
  }, [report, sev, sortDesc]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of report?.findings || []) c[f.severity] = (c[f.severity] || 0) + 1;
    return c;
  }, [report]);

  if (err)
    return (
      <div className="space-y-4">
        <ErrorBox msg={`${err} If you have not analysed a repository yet, do that from the Overview — recorded analyses are shown there while the backend is offline.`} retry={load} />
      </div>
    );
  if (!repo || !report) return <Skeleton rows={4} />;

  return (
    <div>
      {/* repo context strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[13px] text-secondary">
        <span className="text-primary">{repo.full_name}</span>
        <span aria-hidden className="text-muted">·</span>
        <span>branch {repo.default_branch}</span>
        <span aria-hidden className="text-muted">·</span>
        <a
          className="inline-flex items-center gap-1 text-info transition duration-160 hover:underline"
          href={repo.html_url}
          target="_blank"
          rel="noreferrer"
        >
          GitHub <ExternalLink size={12} />
        </a>
        <span aria-hidden className="text-muted">·</span>
        <span className="text-muted">analysed {fmtDate(repo.last_analyzed_at)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.01em]">Repository overview</h1>
        <AiStatusBadge status={report.ai_status} />
      </div>
      {repo.description && <p className="mt-1.5 max-w-2xl text-[15px] text-secondary">{repo.description}</p>}

      {/* health */}
      <div className="mt-7 grid gap-5 lg:grid-cols-[248px_1fr]">
        <Panel className="p-5">
          <p className={`tnum font-mono text-[56px] font-semibold leading-none ${scoreTextClass(report.health_score)}`}>
            {report.health_score.toFixed(1)}
          </p>
          <p className="mt-2 text-sm text-secondary">Health score / 100</p>
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-[13px]">
            <p className="flex justify-between">
              <span className="text-muted">Scoring</span>
              <span className="font-mono text-xs">deterministic v{report.scoring_version}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted">Files in tree</span>
              <span className="tnum font-mono text-xs">{report.coverage?.files_in_tree ?? "—"}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted">Files analysed</span>
              <span className="tnum font-mono text-xs">{report.coverage?.files_listed ?? "—"}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted">Findings</span>
              <span className="tnum font-mono text-xs">{report.findings.length}</span>
            </p>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            The score is the weighted sum shown on the right. AI never sets this number.
          </p>
        </Panel>

        <Panel>
          <PanelHead
            title="Category breakdown"
            sub="Each category is scored by deterministic checks. Points show its exact contribution to the overall score."
          />
          <div className="space-y-3.5 px-5 py-5">
            {CATEGORIES.map(([k, label, wt]) => (
              <div key={k} className="grid grid-cols-[168px_1fr] items-center gap-3 sm:grid-cols-[190px_1fr]">
                <span className="text-sm">
                  {label}{" "}
                  <span className="tnum font-mono text-[11px] text-muted">weight {wt}%</span>
                </span>
                <ScoreBar value={report.scores[k] ?? 0} weight={wt} label={label} showContribution />
              </div>
            ))}
          </div>
          <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-secondary">{report.summary}</p>
        </Panel>
      </div>

      {/* findings */}
      <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          Findings{" "}
          <span className="tnum font-mono text-sm font-normal text-muted">
            {findings.length} of {report.findings.length}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 sm:flex" role="group" aria-label="Filter by severity">
            {["all", "high", "medium", "low"].map((s) => (
              <button
                key={s}
                onClick={() => setSev(s)}
                aria-pressed={sev === s}
                className={`rounded-lg border px-2.5 py-1.5 text-[13px] capitalize transition duration-160 ${
                  sev === s
                    ? "border-accent bg-hover font-medium text-primary"
                    : "border-border text-secondary hover:bg-hover hover:text-primary"
                }`}
              >
                {s}
                {s !== "all" && counts[s] ? <span className="tnum ml-1.5 font-mono text-[11px] text-muted">{counts[s]}</span> : null}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortDesc((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] text-secondary transition duration-160 hover:bg-hover hover:text-primary"
            aria-label="Toggle severity sort order"
          >
            <ArrowUpDown size={13} /> Severity
          </button>
        </div>
      </div>

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Finding</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">File</th>
              </tr>
            </thead>
            <tbody>
              {findings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4">
                    <Empty
                      title="No findings in this filter"
                      body="No findings were detected within the analysed scope. That does not guarantee the repository is bug-free."
                    />
                  </td>
                </tr>
              ) : (
                findings.map((f) => {
                  const active = sel?.id === f.id;
                  return (
                    <tr
                      key={f.id}
                      onClick={() => setSel(f)}
                      aria-selected={active}
                      className={`cursor-pointer border-b border-border transition duration-120 last:border-0 ${
                        active ? "bg-hover" : "hover:bg-hover"
                      }`}
                    >
                      <td className="px-4 py-3"><SevBadge severity={f.severity} /></td>
                      <td className={`px-4 py-3 ${active ? "font-medium" : ""}`}>{f.title}</td>
                      <td className="px-4 py-3 capitalize text-secondary">{f.category}</td>
                      <td className="px-4 py-3 font-mono text-xs text-secondary">{f.file_path || "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* inspector */}
        <aside
          className="rounded-xl border border-border bg-elevated lg:sticky lg:top-[72px]"
          aria-label="Finding inspector"
        >
          {sel ? (
            <div className="rise" key={sel.id}>
              <div className="border-b border-border px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <SevBadge severity={sel.severity} />
                  <Badge>{sel.category}</Badge>
                  <Badge tone="border-border text-muted">{sel.source}</Badge>
                </div>
                <h3 className="mt-3 text-[15px] font-semibold leading-snug">{sel.title}</h3>
                {sel.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-secondary">{sel.description}</p>
                )}
              </div>
              <dl className="space-y-4 px-5 py-4">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Evidence</dt>
                  <dd className="mt-1.5 break-words font-mono text-xs leading-relaxed text-primary">
                    {sel.evidence || "—"}
                  </dd>
                  {sel.file_path && (
                    <dd className="mt-1 font-mono text-xs text-secondary">
                      {sel.file_path}
                      {sel.line_start ? `:${sel.line_start}${sel.line_end ? `–${sel.line_end}` : ""}` : ""}
                    </dd>
                  )}
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Suggested fix</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed">{sel.suggested_fix || "—"}</dd>
                </div>
                <div className="flex gap-6 border-t border-border pt-3.5">
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Confidence</dt>
                    <dd className="tnum mt-1 font-mono text-[13px]">
                      {sel.confidence !== undefined ? sel.confidence.toFixed(2) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Source</dt>
                    <dd className="mt-1 font-mono text-[13px]">{sel.source || "—"}</dd>
                  </div>
                </div>
              </dl>
            </div>
          ) : (
            <p className="px-5 py-4 text-sm leading-relaxed text-secondary">
              Select a finding to inspect its evidence and suggested fix.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
