"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SNAPSHOT, SNAPSHOT_LABEL } from "@/lib/snapshot";
import { Badge, Empty, ErrorBox, PageHead, RecordedNote, TableSkeleton } from "@/components/ui";

export default function Issues() {
  const [repos, setRepos] = useState<any[]>([]);
  const [rid, setRid] = useState("");
  const [issues, setIssues] = useState<any[]>([]);
  const [triage, setTriage] = useState<any>(null);
  const [err, setErr] = useState("");
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/repositories")
      .then((r: any[]) => { setRepos(r); if (r[0]) setRid(String(r[0].id)); })
      .catch((e) => {
        setOffline(true); setErr(e.message); setLoading(false);
        setIssues(SNAPSHOT.issues); setTriage({ triage: SNAPSHOT.triage });
      });
  }, []);
  useEffect(() => {
    if (rid) {
      setLoading(true);
      api(`/api/repositories/${rid}/issues`).then(setIssues).catch((e) => setErr(e.message)).finally(() => setLoading(false));
    }
  }, [rid]);

  async function run() {
    setBusy(true);
    try { setTriage(await api(`/api/repositories/${rid}/issues/triage`, { method: "POST" })); }
    catch (e: any) { setErr(e.message); }
    setBusy(false);
  }

  const byNum: any = {};
  (triage?.triage || []).forEach((t: any) => (byNum[t.number] = t));
  const repo = repos.find((r) => String(r.id) === rid);

  return (
    <div>
      <PageHead
        eyebrow="Triage"
        title="Issue triage"
        body="Real open issues from GitHub, pull requests excluded. Triage suggests labels and complexity only — nothing is modified on GitHub."
        actions={
          offline ? undefined : (
            <div className="flex items-center gap-2">
              <select
                value={rid}
                onChange={(e) => setRid(e.target.value)}
                aria-label="Repository"
                className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[13px] transition duration-160 hover:border-muted focus:border-accent"
              >
                {repos.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
              </select>
              <button
                onClick={run}
                disabled={busy || !rid}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition duration-160 hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Triaging…" : "Run triage"}
              </button>
            </div>
          )
        }
      />
      {err && !offline && <div className="mt-4"><ErrorBox msg={err} /></div>}
      {offline && <div className="mt-5"><RecordedNote label={SNAPSHOT_LABEL} /></div>}
      {offline && (
        <p className="mt-3 text-[13px] text-muted">
          The recorded encode/httpx triage below was produced by the same deterministic rules the backend runs.
          Category and complexity are suggestions from those rules, not GitHub labels — GitHub showed no labels on these issues at capture time.
        </p>
      )}

      <div className="mt-7">
        {loading ? (
          <TableSkeleton cols={3} rows={5} />
        ) : issues.length === 0 ? (
          <Empty title="No open issues" body="GitHub returned no open issues for this repository." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Issue{offline ? " · encode/httpx" : repo ? ` · ${repo.full_name}` : ""}</th>
                  <th className="px-4 py-3 font-medium">GitHub labels</th>
                  <th className="px-4 py-3 font-medium">Triage category</th>
                  <th className="px-4 py-3 font-medium">Complexity</th>
                  <th className="px-4 py-3 font-medium">Suggested labels</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => {
                  const t = byNum[i.number];
                  return (
                    <tr key={i.number} className="border-b border-border align-top transition duration-120 last:border-0 hover:bg-hover">
                      <td className="tnum px-4 py-3.5 font-mono text-xs text-muted">{i.number}</td>
                      <td className="max-w-[380px] px-4 py-3.5 font-medium leading-snug">{i.title}</td>
                      <td className="px-4 py-3.5">
                        {i.labels?.length ? (
                          <span className="flex flex-wrap gap-1.5">{i.labels.map((l: string) => <Badge key={l}>{l}</Badge>)}</span>
                        ) : (
                          <span className="text-[13px] text-muted">none</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {t ? <Badge tone="border-accent/60 text-accent">{t.category}</Badge> : <span className="text-[13px] text-muted">not triaged</span>}
                      </td>
                      <td className="tnum px-4 py-3.5 font-mono text-xs text-secondary">{t ? t.complexity : "—"}</td>
                      <td className="px-4 py-3.5">
                        {t ? (
                          <span className="flex flex-wrap items-center gap-1.5">
                            {(t.suggested_labels || []).map((l: string) => <Badge key={l}>{l}</Badge>)}
                            {t.beginner_friendly && <Badge tone="border-success/50 text-success">beginner-friendly</Badge>}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
