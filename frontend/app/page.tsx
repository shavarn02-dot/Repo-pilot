"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check, FileCode2, GitBranch, GitPullRequest, ScanSearch, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { CATEGORIES, SNAPSHOT } from "@/lib/snapshot";
import { ScoreBar, SevBadge, scoreTextClass } from "@/components/ui";

function Mark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary bg-primary text-surface">
      <GitBranch size={17} strokeWidth={2.2} />
    </span>
  );
}

function AnalysisPreview() {
  const s = SNAPSHOT;
  return (
    <div className="border border-border bg-surface shadow-[6px_6px_0_#d5d0c5]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Analysis #0241</p>
          <p className="mt-1 font-mono text-sm font-medium">{s.repo.full_name}</p>
        </div>
        <span className="font-mono text-[11px] text-secondary">{s.repo.default_branch}@{s.repo.commit_sha.slice(0, 7)}</span>
      </div>

      <div className="grid md:grid-cols-[170px_1fr]">
        <div className="border-b border-border p-5 md:border-b-0 md:border-r">
          <p className={`tnum font-mono text-5xl font-semibold leading-none ${scoreTextClass(s.health_score)}`}>{s.health_score.toFixed(1)}</p>
          <p className="mt-2 text-xs leading-relaxed text-secondary">Repository health<br />out of 100</p>
          <div className="mt-5 border-t border-border pt-4 font-mono text-[11px] leading-5 text-muted">
            <p>{s.repo.files_in_tree} files checked</p>
            <p>scoring v{s.scoring_version}</p>
          </div>
        </div>
        <div className="min-w-0 p-5">
          <div className="space-y-2.5">
            {CATEGORIES.map(([key, label]) => (
              <div key={key} className="grid grid-cols-[106px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[132px_minmax(0,1fr)]">
                <span className="truncate text-xs text-secondary">{label}</span>
                <ScoreBar value={s.scores[key]} label={label} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-canvas/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <SevBadge severity={s.findings[0].severity} />
          <span className="text-sm font-medium">{s.findings[0].title}</span>
          <span className="font-mono text-[11px] text-muted">{s.findings[0].file_path}</span>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [url, setUrl] = useState("https://github.com/encode/httpx");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const data = await api("/api/repositories/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      router.push(`/dashboard/repositories/${data.repository.id}`);
    } catch (error: any) {
      setErr(error.message || "Could not analyse this repository.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-canvas">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="RepoPilot home"><Mark /><span className="text-[15px] font-semibold tracking-[-0.02em]">RepoPilot</span></Link>
          <nav className="hidden items-center gap-6 text-[13px] text-secondary md:flex" aria-label="Main navigation">
            <a href="#method" className="hover:text-primary">How it works</a>
            <a href="#tools" className="hover:text-primary">Tools</a>
            <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">MIT · local-first</span>
          </nav>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-border decoration-2 underline-offset-4 hover:decoration-accent">Open workspace <ArrowUpRight size={15} /></Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-12 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-secondary"><span className="h-px w-7 bg-accent" /> Open-source repository diagnostics</div>
            <h1 className="mt-6 max-w-[680px] text-[42px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-[66px]">Know what a repository needs before the next review.</h1>
            <p className="mt-6 max-w-xl text-[17px] leading-7 text-secondary">RepoPilot checks the actual file tree, explains weak spots with Gemma 4, and keeps every claim tied to evidence you can inspect.</p>

            <form onSubmit={analyze} className="mt-8 max-w-xl border border-border bg-surface p-3 shadow-[4px_4px_0_#d5d0c5]">
              <label htmlFor="repo-url" className="mb-2 block px-1 text-xs font-semibold uppercase tracking-[0.1em] text-secondary">Public GitHub repository</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input id="repo-url" value={url} onChange={(e) => setUrl(e.target.value)} className="min-w-0 flex-1 rounded-md border border-border bg-canvas px-3.5 py-3 font-mono text-[13px] placeholder:text-muted hover:border-muted focus:border-accent" placeholder="github.com/owner/repository" autoComplete="off" spellCheck={false} />
                <button disabled={busy || !url.trim()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-surface hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Checking…" : "Run analysis"} <ArrowRight size={16} /></button>
              </div>
              {err && <p role="alert" className="px-1 pt-2.5 text-sm text-danger">{err}</p>}
            </form>

            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-secondary">
              {["Deterministic score", "Source-linked findings", "Read-only by default"].map((item) => <li key={item} className="flex items-center gap-1.5"><Check size={13} className="text-success" />{item}</li>)}
            </ul>
          </div>

          <div className="lg:pt-2">
            <AnalysisPreview />
            <p className="mt-4 max-w-2xl font-mono text-[11px] leading-5 text-muted">Recorded sample · encode/httpx · score produced from deterministic checks; AI does not set or modify it.</p>
          </div>
        </div>
      </section>

      <section id="method" className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[0.7fr_1.3fr]">
          <div className="border-b border-border px-5 py-14 lg:border-b-0 lg:border-r lg:px-8 lg:py-20">
            <p className="font-mono text-xs text-accent">01 / METHOD</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em]">AI explains.<br />Rules decide.</h2>
          </div>
          <div className="grid sm:grid-cols-3">
            {[["Fetch", "Read repository metadata and its complete file tree at one commit."], ["Score", "Run published checks across security, testing, docs, CI and structure."], ["Explain", "Ask Gemma 4 to prioritise findings, then reject references that are not in the tree."]].map(([title, body], index) => (
              <div key={title} className="border-b border-border p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:p-8">
                <span className="font-mono text-xs text-muted">0{index + 1}</span>
                <h3 className="mt-8 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-primary pb-5">
          <div><p className="font-mono text-xs text-accent">02 / WORKSPACE</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Built for the review loop</h2></div>
          <p className="max-w-md text-sm leading-6 text-secondary">One workspace for repository health, pull requests, issues, code-grounded questions and screenshot debugging.</p>
        </div>

        <div className="divide-y divide-border">
          {[[GitPullRequest, "Pull-request review", "Inspect real diffs and see severity-ranked findings without posting anything back to GitHub."], [ShieldCheck, "Repository health", "Compare six weighted categories and trace every deduction to a deterministic rule."], [ScanSearch, "Visual debugger", "Turn a screenshot into observed, inferred and code-verified findings—with those distinctions kept visible."], [FileCode2, "Repository assistant", "Ask questions against retrieved project files and get citations instead of confident guesses."]].map(([Icon, title, body]: any, index) => (
            <div key={title} className="grid gap-4 py-6 sm:grid-cols-[52px_220px_1fr_auto] sm:items-center">
              <span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, "0")}</span>
              <div className="flex items-center gap-3"><Icon size={18} className="text-accent" /><h3 className="font-semibold">{title}</h3></div>
              <p className="max-w-2xl text-sm leading-6 text-secondary">{body}</p>
              <ArrowRight size={16} className="hidden text-muted sm:block" />
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-6 bg-primary px-6 py-7 text-surface sm:flex-row sm:items-center lg:px-8">
          <div><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-surface/60">Runs locally · MIT licensed</p><p className="mt-2 text-xl font-semibold">Bring a repository. Keep the evidence.</p></div>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-md bg-surface px-5 py-3 text-sm font-semibold text-primary hover:bg-accent hover:text-primary">Open RepoPilot <ArrowRight size={16} /></Link>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted lg:px-8">
          <span className="flex items-center gap-2"><GitBranch size={14} /> RepoPilot · open source under MIT</span>
          <span className="font-mono">Next.js + FastAPI · Gemma 4 via OpenRouter</span>
        </div>
      </footer>
    </main>
  );
}
