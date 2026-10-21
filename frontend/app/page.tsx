"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitBranch, ShieldCheck, ScanEye, ArrowRight, ArrowUpRight,
  FileSearch, GitPullRequest, CircleDot, CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { SNAPSHOT, CATEGORIES, SNAPSHOT_LABEL } from "@/lib/snapshot";
import { SevBadge, ScoreBar, scoreTextClass } from "@/components/ui";

function ProductPreview() {
  const s = SNAPSHOT;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-none">
      {/* window chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-elevated" />
            <span className="h-2.5 w-2.5 rounded-full bg-elevated" />
            <span className="h-2.5 w-2.5 rounded-full bg-elevated" />
          </span>
          <span className="truncate font-mono text-[13px]">{s.repo.full_name}</span>
          <span className="hidden font-mono text-[11px] text-muted sm:inline">
            {s.repo.default_branch} · {s.repo.commit_sha.slice(0, 7)}
          </span>
        </div>
        <span className="shrink-0 rounded-[6px] border border-warning/50 px-2 py-0.5 text-[11px] font-medium text-warning">
          Recorded live analysis
        </span>
      </div>

      <div className="grid sm:grid-cols-[148px_1fr]">
        {/* score rail */}
        <div className="border-b border-border px-5 py-5 sm:border-b-0 sm:border-r">
          <p className={`tnum font-mono text-[44px] font-semibold leading-none ${scoreTextClass(s.health_score)}`}>
            {s.health_score.toFixed(1)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Health score / 100
            <br />
            Scoring v{s.scoring_version} · deterministic
          </p>
          <p className="tnum mt-4 font-mono text-[11px] leading-relaxed text-muted">
            {s.repo.files_in_tree} files analysed
            <br />
            1 finding
          </p>
        </div>
        {/* categories + finding */}
        <div className="px-5 py-5">
          <div className="space-y-2.5">
            {CATEGORIES.map(([k, label, wt]) => (
              <div key={k} className="grid grid-cols-[128px_1fr] items-center gap-3">
                <span className="truncate text-[13px] text-secondary">
                  {label} <span className="tnum font-mono text-[11px] text-muted">{wt}%</span>
                </span>
                <ScoreBar value={s.scores[k]} label={label} />
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <SevBadge severity={s.findings[0].severity} />
              <p className="text-sm font-medium">{s.findings[0].title}</p>
              <span className="font-mono text-xs text-muted">{s.findings[0].file_path}</span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">
              Evidence: {s.findings[0].evidence}. Fix: {s.findings[0].suggested_fix}
            </p>
          </div>
        </div>
      </div>
      <p className="border-t border-border px-4 py-2.5 font-mono text-[11px] leading-relaxed text-muted">
        {SNAPSHOT_LABEL}
      </p>
    </div>
  );
}

export default function Landing() {
  const [url, setUrl] = useState("https://github.com/encode/httpx");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [stage, setStage] = useState("");
  const router = useRouter();

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setStage("Fetching repository metadata and file tree from GitHub…");
    try {
      const d = await api("/api/repositories/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      router.push(`/dashboard/repositories/${d.repository.id}`);
    } catch (x: any) {
      setErr(x.message || "Analysis failed.");
      setBusy(false);
      setStage("");
    }
  }

  return (
    <main className="min-h-screen bg-canvas">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-canvas/95">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-black">
              <GitBranch size={16} strokeWidth={2.4} />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.01em]">RepoPilot</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-secondary md:flex" aria-label="Product">
            <a href="#evidence" className="transition duration-160 hover:text-primary">Evidence</a>
            <a href="#workflow" className="transition duration-160 hover:text-primary">Workflow</a>
            <a href="#visual" className="transition duration-160 hover:text-primary">Visual Debugger</a>
            <a href="#opensource" className="transition duration-160 hover:text-primary">Open Source</a>
          </nav>
          <Link
            href="/dashboard"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition duration-160 hover:bg-accentHover"
          >
            Launch App
          </Link>
        </div>
      </header>

      {/* hero — asymmetric editorial */}
      <section className="mx-auto max-w-7xl px-5 pb-20 pt-14 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="rise lg:pt-6">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              Mission control for your codebase
            </p>
            <h1 className="mt-5 text-[44px] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-6xl lg:text-[68px]">
              Your repository deserves a better copilot.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-secondary">
              Understand your codebase. Review pull requests. Catch issues earlier.
              Keep your open-source projects moving — with Gemma 4-powered engineering
              intelligence, grounded in evidence from your real files.
            </p>
            <form onSubmit={go} className="mt-9">
              <label htmlFor="repo-url" className="text-sm font-medium">
                Analyse a public repository
              </label>
              <div className="mt-2.5 flex max-w-xl gap-2">
                <input
                  id="repo-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm transition duration-160 placeholder:text-muted hover:border-muted focus:border-accent"
                  placeholder="https://github.com/owner/repo"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  disabled={busy || !url.trim()}
                  className="flex shrink-0 items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-black transition duration-160 hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Analysing…" : (<>Analyse <ArrowRight size={16} /></>)}
                </button>
              </div>
              {busy && stage && (
                <p className="mt-3 flex items-center gap-2 text-sm text-secondary" role="status">
                  <span className="stage-dot-active h-2 w-2 rounded-full bg-accent" aria-hidden />
                  {stage}
                </p>
              )}
              {err && (
                <p role="alert" className="mt-3 max-w-xl text-sm leading-relaxed text-danger">{err}</p>
              )}
              <p className="mt-3.5 max-w-xl text-[13px] leading-relaxed text-muted">
                Scores come from deterministic checks on the real file tree.
                Gemma 4 explains and prioritises — it never sets the score, and any
                finding it cannot ground in a real file is discarded.
              </p>
            </form>
          </div>
          <div className="rise" style={{ animationDelay: "80ms" }}>
            <ProductPreview />
            <div className="tnum mt-4 flex flex-wrap gap-x-8 gap-y-2 px-1 font-mono text-xs text-muted">
              <span>4 repositories recorded · 2026-10-21</span>
              <span>Scores range 37.8 – 95.5</span>
              <span>0 findings fabricated</span>
            </div>
          </div>
        </div>
      </section>

      {/* evidence — text-led, wide */}
      <section id="evidence" className="border-t border-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[1fr_1.4fr] lg:px-8">
          <div>
            <ShieldCheck className="text-accent" size={22} />
            <h2 className="mt-4 text-[28px] font-semibold leading-snug tracking-[-0.01em]">
              Evidence first.
              <br />
              Every finding, a real file.
            </h2>
          </div>
          <div className="space-y-5 text-[15px] leading-relaxed text-secondary">
            <p>
              Most AI review tools will happily cite a line that does not exist. RepoPilot
              validates every AI-proposed finding against the repository&apos;s actual file
              tree before it is shown. A path that is not in the tree is downgraded to
              <span className="text-primary"> unverified</span> with capped confidence — never
              dressed up as a verified fact.
            </p>
            <p>
              The health score is computed by published, deterministic rules across six
              categories — maintainability, security signals, testing readiness,
              documentation, CI/CD readiness and structure. The same tree always produces
              the same score, and the arithmetic is shown on every report.
            </p>
            <ul className="space-y-2.5 pt-1">
              {[
                "octocat/Hello-World scored 37.8 — no tests, no CI, no LICENSE, from its real 1-file tree",
                "sindresorhus/slugify scored 81.5 — testing 64 and documentation 55 are its real weak points",
                "encode/httpx scored 95.5 — its single finding is a missing SECURITY.md, verified at the root",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <CheckCircle2 size={16} className="mt-1 shrink-0 text-success" aria-hidden />
                  <span className="font-mono text-[13px] leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* workflow — numbered, not cards */}
      <section id="workflow" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <h2 className="text-[28px] font-semibold tracking-[-0.01em]">From URL to report</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
            {[
              ["01", "Submit", "Paste a public GitHub URL. RepoPilot fetches metadata, the full file tree and the analysed commit from the GitHub API."],
              ["02", "Verify", "Deterministic checks score six categories. Gemma 4 then explains the report — its findings pass grounding validation before display."],
              ["03", "Review", "Inspect findings with their evidence, review PR diffs read-only, triage issues, and debug screenshots in the Visual Debugger."],
            ].map(([n, t, b]) => (
              <div key={n} className="border-t-2 border-border pt-5">
                <p className="tnum font-mono text-sm text-accent">{n}</p>
                <h3 className="mt-2.5 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-secondary">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* split feature rows — varied composition */}
      <section id="visual" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Visual PR review · recorded</p>
              <p className="mt-3 font-mono text-[13px]">
                PR #3771 — Fix `unquote` IndexError on empty string input
              </p>
              <pre className="scroll-slim mt-3 overflow-auto rounded-lg bg-canvas p-4 font-mono text-xs leading-relaxed">
                {SNAPSHOT.prReview.diff.split("\n").map((ln, i) => (
                  <div key={i} className={ln.startsWith("+") ? "text-success" : ln.startsWith("-") ? "text-danger" : "text-secondary"}>
                    {ln || " "}
                  </div>
                ))}
              </pre>
              <p className="mt-3 text-[13px] leading-relaxed text-secondary">
                Real diff, captured 2026-10-21. One deterministic finding: code changed
                without test changes, in <span className="font-mono text-xs">httpx/_utils.py</span>.
              </p>
            </div>
            <div className="lg:pt-2">
              <ScanEye className="text-accent" size={22} />
              <h2 className="mt-4 text-[28px] font-semibold leading-snug tracking-[-0.01em]">
                See the bug, not just the log.
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-secondary">
                The Visual Debugger takes a screenshot and a description, retrieves the
                repository files that could explain what you see, and returns structured
                findings — observed in the image, inferred as a cause, or verified in code,
                each labelled as what it is.
              </p>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-secondary">
                Turning a finding into a GitHub issue is a separate, explicit step: a
                full preview you can edit, and a publish button that stays disabled
                until you confirm.
              </p>
              <Link
                href="/dashboard/visual"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition duration-160 hover:text-accentHover"
              >
                Open the Visual Debugger <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

          <div className="mt-16 grid gap-x-10 gap-y-8 border-t border-border pt-12 sm:grid-cols-3">
            {[
              [GitPullRequest, "Pull-request review", "Real diffs, severity-classified findings, read-only by design. Nothing is posted to GitHub from the review workspace."],
              [CircleDot, "Issue triage", "Open issues classified by type with suggested labels and complexity. Suggestions only — your tracker stays untouched."],
              [FileSearch, "Repository assistant", "Questions answered from retrieved files, with citations. When the evidence is insufficient, it says so."],
            ].map(([Icon, t, b]: any) => (
              <div key={t}>
                <Icon className="text-accent" size={20} />
                <h3 className="mt-3 font-semibold">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-secondary">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section id="opensource" className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-8 px-5 py-20 lg:px-8">
          <div className="max-w-xl">
            <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.01em]">
              Open source. ₹0 to run.
              <br />
              <span className="text-secondary">Built to be read, not just used.</span>
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-secondary">
              Next.js and FastAPI, a deterministic scoring service, and Gemma 4 through
              OpenRouter&apos;s free models. MIT licensed — the scoring rules, prompts and
              validation logic are all in the repository.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 font-semibold text-black transition duration-160 hover:bg-accentHover"
          >
            Launch App <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-[13px] text-muted lg:px-8">
          <span className="flex items-center gap-2">
            <GitBranch size={15} /> RepoPilot — open source, MIT
          </span>
          <span className="font-mono text-xs">Gemma 4 via OpenRouter · google/gemma-4-31b-it:free</span>
        </div>
      </footer>
    </main>
  );
}
