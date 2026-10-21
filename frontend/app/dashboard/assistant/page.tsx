"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AiStatusBadge, Badge, Empty, ErrorBox, PageHead } from "@/components/ui";
import { ImagePlus, Send, X } from "lucide-react";

const SUGGESTED = [
  "What does the README say?",
  "Where are the tests for this repository?",
  "Which file documents authentication?",
];

export default function Assistant() {
  const [repos, setRepos] = useState<any[]>([]);
  const [rid, setRid] = useState("");
  const [msg, setMsg] = useState("");
  const [log, setLog] = useState<any[]>([]);
  const [err, setErr] = useState("");
  const [img, setImg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/repositories")
      .then((r: any[]) => { setRepos(r); if (r[0]) setRid(String(r[0].id)); })
      .catch((e) => setErr(e.message));
  }, []);

  const repo = repos.find((r) => String(r.id) === rid);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim() || !rid) return;
    setBusy(true);
    setErr("");
    const q = msg;
    try {
      const d = await api(`/api/repositories/${rid}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      setLog((l) => [...l, { q, a: d.answer, c: d.citations, ai: d.ai_status, img, grounded: d.grounded, mode: d.mode }]);
      setImg("");
      setMsg("");
    } catch (x: any) { setErr(x.message); }
    setBusy(false);
  }

  return (
    <div>
      <PageHead
        eyebrow="Assistant · FR-07 / FR-14"
        title="AI Assistant"
        body="Repository-grounded chat — not a generic chatbot. Answers cite real retrieved files and say so when evidence is insufficient. Attach a screenshot as context for multimodal debugging."
      />
      {err && <div className="mt-4"><ErrorBox msg={err} /></div>}

      {/* context strip */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5 rounded-[24px] border border-border bg-surface px-4 py-3 text-[13px]">
        <span className="font-medium uppercase tracking-wider text-muted text-[11px]">Context</span>
        <select
          value={rid}
          onChange={(e) => setRid(e.target.value)}
          aria-label="Active repository"
          className="rounded-2xl border border-border bg-canvas px-2.5 py-1.5 font-mono text-xs transition duration-160 hover:border-muted focus:border-accent"
        >
          {repos.length === 0 && <option value="">No repository analysed yet</option>}
          {repos.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
        </select>
        {repo && (
          <>
            <Badge>branch · <span className="font-mono">{repo.default_branch}</span></Badge>
            <Badge>public</Badge>
          </>
        )}
        <span className="ml-auto hidden text-xs text-muted sm:block">
          Answers are grounded in retrieved files from the selected repository only.
        </span>
      </div>

      {/* conversation */}
      <div className="mt-5 space-y-4">
        {log.length === 0 && (
          <Empty
            title="Ask about this repository"
            body="Try a question that names a file, a module or a behaviour. If the retrieved evidence cannot answer it, the assistant will tell you instead of guessing."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => setMsg(s)}
                    className="rounded-full border border-border px-4 py-1.5 text-[13px] text-secondary transition duration-300 ease-spring hover:bg-elevated hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            }
          />
        )}
        {log.map((m, i) => (
          <article key={i} className="rise overflow-hidden rounded-[24px] border border-border bg-surface">
            <div className="border-b border-border bg-elevated px-5 py-3.5">
              <p className="text-sm font-medium leading-relaxed">{m.q}</p>
              {m.img && <p className="mt-1 font-mono text-xs text-muted">Image context: {m.img}</p>}
            </div>
            <div className="px-5 py-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-secondary">{m.a}</pre>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3.5">
                <AiStatusBadge status={m.ai} />
                {m.mode && <Badge>mode · {m.mode}</Badge>}
                <Badge tone={m.grounded ? "border-success/50 text-success" : "border-warning/50 text-warning"}>
                  {m.grounded ? "grounded in files" : "insufficient evidence"}
                </Badge>
                {(m.c || []).map((c: string) => (
                  <Badge key={c}><span className="font-mono text-[11px]">{c}</span></Badge>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* composer */}
      <form onSubmit={send} className="mt-5 rounded-[24px] border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          {img ? (
            <span className="flex items-center gap-2 rounded-full bg-accentContainer px-3.5 py-2 font-mono text-xs text-accent">
              <ImagePlus size={14} className="text-accent" /> {img}
              <button type="button" onClick={() => setImg("")} aria-label="Remove image" className="text-secondary transition duration-160 hover:text-primary">
                <X size={14} />
              </button>
            </span>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-[13px] text-secondary transition duration-300 ease-spring hover:bg-elevated hover:text-primary">
              <ImagePlus size={15} /> Attach image
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => setImg(e.target.files?.[0]?.name || "")} />
            </label>
          )}
          <span className="text-xs text-muted">
            For full screenshot analysis use Visual Debugger — it stores and validates the image server-side.
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <label className="sr-only" htmlFor="asq">Ask about this repository</label>
          <input
            id="asq"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Ask about this repository — name a file or module for the best grounding…"
            className="min-w-0 flex-1 rounded-2xl border border-border bg-canvas px-3.5 py-2.5 text-sm transition duration-160 placeholder:text-muted hover:border-muted focus:border-accent"
          />
          <button
            disabled={busy || !msg.trim() || !rid}
            className="flex shrink-0 items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-onAccent transition duration-160 hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Asking…" : (<>Ask <Send size={14} /></>)}
          </button>
        </div>
      </form>
    </div>
  );
}
