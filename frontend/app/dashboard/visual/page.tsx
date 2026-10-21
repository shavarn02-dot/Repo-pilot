"use client";
import React, { useEffect, useRef, useState } from "react";
import { api, sevColor } from "@/lib/api";
import { AiStatusBadge, Badge, Empty, ErrorBox, PageHead, Panel, PanelHead } from "@/components/ui";
import { Upload, FileWarning, Check, Loader2, ShieldCheck, Copy, Save } from "lucide-react";

const STAGES = ["Uploading", "Reading screenshot", "Retrieving repository files", "Analysing with Gemma 4", "Validating evidence"];

const inputCls =
  "w-full rounded-2xl border border-border bg-canvas px-3 py-2.5 text-sm transition duration-160 placeholder:text-muted hover:border-muted focus:border-accent";
const labelCls = "text-[13px] font-medium text-primary";

export default function Visual() {
  const [repos, setRepos] = useState<any[]>([]);
  const [rid, setRid] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [desc, setDesc] = useState("The primary button overlaps the heading on small screens.");
  const [stage, setStage] = useState(-1);
  const [result, setResult] = useState<any>(null);
  const [draft, setDraft] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [err, setErr] = useState("");
  const [pubMsg, setPubMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [bFile, setBFile] = useState<File | null>(null);
  const [aFile, setAFile] = useState<File | null>(null);
  const [prNum, setPrNum] = useState("1");
  const [slider, setSlider] = useState(50);
  const [bPrev, setBPrev] = useState("");
  const [aPrev, setAPrev] = useState("");
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api("/api/repositories")
      .then((r: any[]) => { setRepos(r); if (r[0]) setRid(String(r[0].id)); })
      .catch((e) => setErr(e.message));
  }, []);

  const repo = repos.find((r) => String(r.id) === rid);

  function pick(f: File | null, setter: any, prev: any) { setter(f); if (f) prev(URL.createObjectURL(f)); }

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !rid) return;
    setErr(""); setDraft(null); setPubMsg(""); setConfirmed(false);
    for (let i = 0; i < STAGES.length; i++) { setStage(i); await new Promise((r) => setTimeout(r, 250)); }
    try {
      const fd = new FormData();
      fd.append("image", file); fd.append("description", desc); fd.append("mode", "bug_detective");
      const d = await api(`/api/repositories/${rid}/visual/analyze`, { method: "POST", body: fd });
      setResult(d);
    } catch (x: any) { setErr(x.message); }
    setStage(-1);
  }

  async function makeDraft() {
    try {
      const d = await api(`/api/visual-analyses/${result.id}/issue-draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      setDraft(d); setConfirmed(false); setPubMsg("");
    } catch (x: any) { setErr(x.message); }
  }
  async function saveDraft() {
    try {
      const d = await api(`/api/visual-analyses/${result.id}/issue-draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: draft.title, body_md: draft.body_md, severity: draft.severity, labels: draft.labels }) });
      setDraft(d);
    } catch (x: any) { setErr(x.message); }
  }
  async function publish() {
    setPubMsg("");
    try {
      const d = await api(`/api/visual-analyses/${result.id}/issue-draft/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true, title: draft.title, body: draft.body_md, labels: draft.labels }) });
      setPubMsg(`Published: ${d.github_issue_url}`);
    } catch (x: any) { setPubMsg(x.message); }
  }
  async function visualPR(e: React.FormEvent) {
    e.preventDefault();
    if (!bFile || !aFile) return;
    try {
      const fd = new FormData();
      fd.append("before_image", bFile); fd.append("after_image", aFile);
      const d = await api(`/api/repositories/${rid}/pull-requests/${prNum}/visual-review`, { method: "POST", body: fd });
      setResult(d); setDraft(null);
    } catch (x: any) { setErr(x.message); }
  }
  async function copyDraft() {
    try { await navigator.clipboard.writeText(draft.body_md); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }

  const analysing = stage >= 0;

  return (
    <div>
      <PageHead
        eyebrow="Multimodal · FR-11 / FR-12"
        title="Visual Debugger"
        body="Upload a screenshot, describe what is wrong, and RepoPilot stores it securely server-side, retrieves repository context, and returns structured findings. When Gemma 4 is not configured, no finding is invented to fill this page."
      />
      {err && <div className="mt-5"><ErrorBox msg={err} /></div>}

      <div className="mt-7 grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        {/* intake */}
        <Panel>
          <PanelHead title="Screenshot" sub="PNG, JPEG or WebP · max 10 MB · metadata stripped on upload" />
          <form onSubmit={analyze} className="px-4 py-4">
            <label className={labelCls} htmlFor="vd-repo">Repository context</label>
            <select id="vd-repo" value={rid} onChange={(e) => setRid(e.target.value)} className={`${inputCls} mt-2 font-mono text-[13px]`}>
              {repos.length === 0 && <option value="">No repositories analysed yet</option>}
              {repos.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
            </select>

            <label
              className={`mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-[24px] border border-dashed px-4 py-8 text-center transition duration-200 ${
                file ? "border-accent/60 bg-hover" : "border-border hover:border-muted hover:bg-hover"
              }`}
            >
              <Upload size={20} className={file ? "text-accent" : "text-muted"} aria-hidden />
              {file ? (
                <span className="min-w-0">
                  <span className="block truncate font-mono text-xs">{file.name}</span>
                  <span className="tnum mt-1 block text-xs text-muted">{(file.size / 1024).toFixed(1)} KB · click to replace</span>
                </span>
              ) : (
                <span className="text-sm text-secondary">
                  Drop a screenshot, or <span className="font-medium text-primary underline underline-offset-2">browse</span>
                </span>
              )}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null, setFile, setPreview)} />
            </label>

            <label className={`${labelCls} mt-5 block`} htmlFor="vd-desc">What is wrong?</label>
            <textarea id="vd-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} className={`${inputCls} mt-2 resize-y leading-relaxed`} />

            <button
              disabled={!file || !rid || analysing}
              className="mt-4 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-onAccent transition duration-160 hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analysing ? "Analysing…" : "Analyse screenshot"}
            </button>

            {analysing && (
              <ol className="mt-5 space-y-2.5" aria-label="Analysis progress">
                {STAGES.map((s, i) => (
                  <li key={s} className="flex items-center gap-2.5 text-[13px]">
                    {i < stage ? (
                      <Check size={15} className="shrink-0 text-success" aria-hidden />
                    ) : i === stage ? (
                      <Loader2 size={15} className="stage-dot-active shrink-0 text-accent" aria-hidden />
                    ) : (
                      <span className="h-[15px] w-[15px] shrink-0 rounded-full border border-border" aria-hidden />
                    )}
                    <span className={i < stage ? "text-secondary" : i === stage ? "font-medium text-primary" : "text-muted"}>{s}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-sm font-semibold">Visual PR review</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">Before / after screenshots for a pull request, compared against its diff.</p>
              <div className="mt-3 flex gap-2">
                <input aria-label="Pull request number" value={prNum} onChange={(e) => setPrNum(e.target.value)} className="tnum w-[72px] rounded-2xl border border-border bg-canvas px-2.5 py-2 font-mono text-sm" />
                <label className="flex-1 cursor-pointer truncate rounded-full border border-border px-2 py-2 text-center text-xs text-secondary transition duration-300 ease-spring hover:bg-elevated">
                  {bFile ? bFile.name : "Before"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null, setBFile, setBPrev)} />
                </label>
                <label className="flex-1 cursor-pointer truncate rounded-full border border-border px-2 py-2 text-center text-xs text-secondary transition duration-300 ease-spring hover:bg-elevated">
                  {aFile ? aFile.name : "After"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null, setAFile, setAPrev)} />
                </label>
              </div>
              <button onClick={visualPR} disabled={!bFile || !aFile} className="mt-2.5 w-full rounded-full border border-border px-3 py-2.5 text-sm transition duration-300 ease-spring hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50">
                Compare before / after
              </button>
            </div>
          </form>
        </Panel>

        {/* viewer */}
        <Panel>
          <PanelHead
            title="Viewer"
            sub={preview ? file?.name : bPrev ? "Before / after comparison" : "Your screenshot appears here after upload"}
          />
          <div className="px-4 py-4">
            {preview || bPrev ? (
              <div>
                {preview && (
                  <img src={preview} alt="Uploaded screenshot preview" className="max-h-[460px] w-full rounded-2xl border border-border bg-canvas object-contain" />
                )}
                {bPrev && aPrev && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted">
                      <span>After</span><span>Before →</span>
                    </div>
                    <div ref={sliderRef} className="relative mt-2 overflow-hidden rounded-2xl border border-border bg-canvas">
                      <img src={bPrev} alt="Before screenshot" className="w-full" />
                      <img src={aPrev} alt="After screenshot" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }} />
                      <span className="absolute inset-y-0 w-px bg-primary/70" style={{ left: `${slider}%` }} aria-hidden />
                    </div>
                    <input type="range" min={0} max={100} value={slider} onChange={(e) => setSlider(Number(e.target.value))} className="rp-range mt-3 w-full" aria-label="Reveal before image" />
                  </div>
                )}
                <p className="mt-3.5 text-xs leading-relaxed text-muted">
                  Preview is local to your browser. Analysis sends the image to the backend, which validates it,
                  strips metadata, and stores it under a private key — the image itself is never kept in the database.
                </p>
              </div>
            ) : (
              <Empty title="No screenshot yet" body="Upload a screenshot on the left. Region markers and findings will be tied to what is actually visible in it — nothing is pre-filled." />
            )}
          </div>
        </Panel>

        {/* inspector + draft */}
        <aside className="overflow-hidden rounded-[24px] border border-border bg-elevated" aria-label="Findings inspector">
          <PanelHead title="Findings inspector" sub="Severity · evidence · confidence · suggested fix" />
          <div className="px-4 py-4">
            {!result ? (
              <p className="text-sm leading-relaxed text-secondary">
                Run an analysis to see structured findings here. Findings distinguish what was
                observed in the screenshot, what Gemma 4 inferred as a cause, and what was
                verified in repository code.
              </p>
            ) : (
              <div className="space-y-3.5">
                <div className="flex flex-wrap gap-2">
                  <AiStatusBadge status={result.ai_status} />
                  <Badge>{result.mode}</Badge>
                </div>
                {result.message && (
                  <p className="flex gap-2 rounded-2xl border border-warning/40 bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-warning">
                    <FileWarning size={15} className="mt-0.5 shrink-0" aria-hidden /> {result.message}
                  </p>
                )}
                {(result.findings || []).length === 0 ? (
                  <p className="text-sm leading-relaxed text-secondary">
                    No findings returned. Nothing was fabricated to fill this panel.
                  </p>
                ) : (
                  result.findings.map((f: any) => (
                    <article key={f.id} className="rounded-[20px] bg-canvas p-4">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${sevColor(f.severity)}`}>{f.severity}</span>
                      <p className="mt-2.5 text-sm font-semibold leading-snug">{f.title}</p>
                      {f.description && <p className="mt-1 text-[13px] leading-relaxed text-secondary">{f.description}</p>}
                      {f.evidence && (
                        <p className="mt-2.5 border-t border-border pt-2.5 text-xs leading-relaxed text-secondary">
                          <span className="font-medium uppercase tracking-wider text-muted">Evidence · </span>{f.evidence}
                        </p>
                      )}
                      <p className="mt-2 truncate font-mono text-xs text-secondary">{f.file_path || "No grounded file"}</p>
                      {f.suggested_fix && <p className="mt-1.5 text-[13px] leading-relaxed"><span className="text-muted">Fix: </span>{f.suggested_fix}</p>}
                      <p className="tnum mt-2 font-mono text-[11px] text-muted">Confidence {f.confidence} · {f.source}</p>
                    </article>
                  ))
                )}
                <button onClick={makeDraft} className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-onAccent transition duration-160 hover:bg-accentHover">
                  Create GitHub issue draft
                </button>
              </div>
            )}

            {draft && (
              <div className="rise mt-6 border-t border-border pt-5">
                <h3 className="text-[15px] font-semibold">Issue draft</h3>
                <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
                  <ShieldCheck size={13} className="mt-0.5 shrink-0 text-success" aria-hidden />
                  Destination: <span className="font-mono">{repo?.full_name || "selected repository"}</span> — nothing is posted until you confirm below.
                </p>
                <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-muted" htmlFor="vd-title">Title</label>
                <input id="vd-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={`${inputCls} mt-1.5`} />
                <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-muted" htmlFor="vd-body">Body · Markdown</label>
                <textarea id="vd-body" value={draft.body_md} onChange={(e) => setDraft({ ...draft, body_md: e.target.value })} rows={10} className={`${inputCls} scroll-slim mt-1.5 resize-y font-mono text-xs leading-relaxed`} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border px-2 py-1 text-[11px] capitalize text-secondary">Severity · {draft.severity}</span>
                  {(draft.labels || []).map((l: string) => (
                    <span key={l} className="rounded-full border border-border px-2 py-1 font-mono text-[11px] text-secondary">{l}</span>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={saveDraft} className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[13px] transition duration-300 ease-spring hover:bg-elevated">
                    <Save size={14} /> Save edits
                  </button>
                  <button onClick={copyDraft} className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[13px] transition duration-300 ease-spring hover:bg-elevated">
                    <Copy size={14} /> {copied ? "Copied" : "Copy Markdown"}
                  </button>
                </div>
                <label className="mt-5 flex cursor-pointer items-start gap-2.5 rounded-[20px] bg-surface px-4 py-3.5 text-sm leading-relaxed">
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="rp-check mt-0.5 shrink-0" />
                  <span>
                    I reviewed this draft and confirm publishing it as a GitHub issue
                    {repo?.full_name ? <> to <span className="font-mono text-[13px]">{repo.full_name}</span></> : null}.
                  </span>
                </label>
                <button
                  onClick={publish}
                  disabled={!confirmed}
                  className="mt-3 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-onAccent transition duration-160 hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {confirmed ? "Publish issue" : "Publish issue — confirmation required"}
                </button>
                {pubMsg && <p className="mt-2.5 text-[13px] leading-relaxed text-secondary" role="status">{pubMsg}</p>}
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Publishing also requires a GitHub token configured on the server. Without one the API
                  returns 403 and nothing is posted.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
