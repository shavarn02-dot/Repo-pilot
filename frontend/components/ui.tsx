"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, Info, Moon, Sun } from "lucide-react";
import { CATEGORIES, healthTone } from "@/lib/snapshot";

/* ---------- theme ---------- */

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  function flip() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("rp-theme", next ? "dark" : "light");
    } catch {}
  }
  return (
    <button
      onClick={flip}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-surface text-secondary transition duration-300 ease-spring hover:bg-elevated hover:text-primary ${className}`}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

/* ---------- primitives ---------- */

export function Badge({
  children,
  tone,
  className = "",
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium leading-4 ${tone || "bg-elevated text-secondary"} ${className}`}
    >
      {children}
    </span>
  );
}

const SEV_PILL: Record<string, string> = {
  critical: "bg-danger/10 text-danger",
  high: "bg-danger/10 text-danger",
  medium: "bg-warning/10 text-warning",
  low: "bg-info/10 text-info",
  info: "bg-elevated text-secondary",
};
const SEV_DOT: Record<string, string> = {
  critical: "bg-danger",
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-info",
  info: "bg-muted",
};

export function SevBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold capitalize leading-4 ${SEV_PILL[severity] || SEV_PILL.info}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${SEV_DOT[severity] || SEV_DOT.info}`} aria-hidden />
      {severity}
    </span>
  );
}

/* ---------- score presentation ---------- */

export function scoreTextClass(score: number) {
  const t = healthTone(score);
  return t === "success" ? "text-success" : t === "warning" ? "text-warning" : "text-danger";
}

const TONE_VAR: Record<string, string> = {
  success: "var(--c-success)",
  warning: "var(--c-warning)",
  danger: "var(--c-danger)",
};

/**
 * Signature score visual: a thick indigo arc sweeping to the score on
 * mount, wrapped by a segmented outer ring — one segment per scoring
 * category, its length showing that category's earned share of its weight.
 */
export function ScoreRing({
  score,
  scores,
  size = 184,
  caption = "Health score",
}: {
  score: number;
  scores?: Record<string, number>;
  size?: number;
  caption?: string;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(false);
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
    return () => cancelAnimationFrame(t);
  }, [score]);

  const segR = size / 2 - 4;
  const segC = 2 * Math.PI * segR;
  const arcR = segR - 16;
  const arcC = 2 * Math.PI * arcR;
  const GAP = 4;

  let acc = 0;
  const segments = CATEGORIES.map(([key, label, weight]) => {
    const span = (weight / 100) * segC;
    const earned = scores ? span * Math.max(0, Math.min(100, scores[key] ?? 0)) / 100 : 0;
    const seg = { key, label, span, earned, start: acc, tone: healthTone(scores?.[key] ?? 0) };
    acc += span;
    return seg;
  });

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${caption}: ${score.toFixed(1)} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* category segment ring (outer) */}
        {segments.map((s) => (
          <g key={s.key}>
            <circle
              cx={size / 2} cy={size / 2} r={segR} fill="none"
              stroke="rgb(var(--c-elevated))" strokeWidth={5}
              strokeDasharray={`${Math.max(0, s.span - GAP)} ${segC}`}
              strokeDashoffset={-s.start}
              strokeLinecap="round"
            />
            {scores && s.earned > 0.5 && (
              <circle
                cx={size / 2} cy={size / 2} r={segR} fill="none"
                stroke={`rgb(${TONE_VAR[s.tone]})`} strokeWidth={5}
                strokeDasharray={`${Math.max(0, Math.min(s.span - GAP, s.earned))} ${segC}`}
                strokeDashoffset={-s.start}
                strokeLinecap="round"
                className="score-seg"
                style={{ opacity: on ? 1 : 0 }}
              />
            )}
          </g>
        ))}
        {/* score arc (inner, indigo) */}
        <circle
          cx={size / 2} cy={size / 2} r={arcR} fill="none"
          stroke="rgb(var(--c-elevated))" strokeWidth={13}
        />
        <circle
          cx={size / 2} cy={size / 2} r={arcR} fill="none"
          stroke="rgb(var(--c-accent))" strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={arcC}
          strokeDashoffset={on ? arcC * (1 - Math.max(0, Math.min(100, score)) / 100) : arcC}
          className="score-arc"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum font-semibold leading-none tracking-[-0.03em]" style={{ fontSize: size * 0.29 }}>
          {score.toFixed(1)}
        </span>
        <span className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          {caption} · /100
        </span>
      </div>
    </div>
  );
}

export function ScoreBar({
  value,
  weight,
  label,
  showContribution = false,
}: {
  value: number;
  weight?: number;
  label?: string;
  showContribution?: boolean;
}) {
  const t = healthTone(value);
  const bar = t === "success" ? "bg-success" : t === "warning" ? "bg-warning" : "bg-danger";
  const [w, setW] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setW(Math.max(0, Math.min(100, value))));
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2.5 flex-1 overflow-hidden rounded-full bg-elevated"
        role="img"
        aria-label={`${label || "Score"}: ${value} out of 100`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-spring ${bar}`}
          style={{ width: `${w}%` }}
        />
      </div>
      <span className="tnum w-10 text-right font-mono text-[13px] text-primary">{value.toFixed(0)}</span>
      {showContribution && weight !== undefined && (
        <span className="tnum w-14 text-right font-mono text-[11px] text-muted">
          +{((value * weight) / 100).toFixed(1)} pts
        </span>
      )}
    </div>
  );
}

/* ---------- page scaffolding ---------- */

export function PageHead({
  eyebrow,
  title,
  body,
  actions,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
        )}
        <h1 className="mt-2 text-[34px] font-semibold leading-[1.08] tracking-[-0.02em]">{title}</h1>
        {body && <p className="mt-2.5 text-[15px] leading-relaxed text-secondary">{body}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1">{actions}</div>}
    </div>
  );
}

export function Panel({
  children,
  className = "",
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section aria-label={label} className={`rounded-panel bg-surface ${className}`}>
      {children}
    </section>
  );
}

export function PanelHead({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-1 pt-5">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
        {sub && <p className="mt-0.5 text-xs leading-relaxed text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------- honest-data notes ---------- */

export function RecordedNote({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[20px] bg-warning/10 px-4 py-3 text-[13px] leading-relaxed text-secondary">
      <Info size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
      <p>
        <span className="font-semibold text-warning">Recorded, not live.</span> {label}. Start the
        backend and analyse a repository to replace this with a live report.
      </p>
    </div>
  );
}

export function AiStatusBadge({ status }: { status: string }) {
  if (status === "completed")
    return <Badge tone="bg-success/10 font-semibold text-success">Gemma 4 · completed</Badge>;
  if (status === "configured")
    return <Badge tone="bg-success/10 font-semibold text-success">Gemma 4 · configured</Badge>;
  return (
    <Badge tone="bg-warning/10 font-semibold text-warning">
      Gemma 4 · not configured — deterministic results only
    </Badge>
  );
}

/* ---------- states ---------- */

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-panel bg-surface px-6 py-12 text-center">
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-secondary">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBox({ msg, retry }: { msg: string; retry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-[20px] bg-danger/10 px-4 py-3.5 text-sm text-danger"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="leading-relaxed">{msg}</p>
        {retry && (
          <button
            onClick={retry}
            className="mt-2 rounded-full bg-danger/10 px-4 py-1.5 text-[13px] font-semibold text-danger transition duration-200 ease-spring hover:bg-danger/20"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      <div className="skeleton-pulse h-5 w-1/3 rounded-full bg-elevated" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-pulse h-28 rounded-panel bg-surface" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function TableSkeleton({ cols = 4, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <div className="overflow-hidden rounded-panel bg-surface" role="status" aria-label="Loading table">
      <div className="skeleton-pulse h-11 bg-elevated" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="skeleton-pulse h-4 rounded-full bg-elevated"
              style={{ width: `${18 + ((i * 7 + j * 13) % 22)}%`, animationDelay: `${(i + j) * 90}ms` }}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
