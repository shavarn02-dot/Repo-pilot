import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { healthTone } from "@/lib/snapshot";

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
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] border px-2 py-0.5 text-[11px] font-medium leading-5 ${tone || "border-border text-secondary"} ${className}`}
    >
      {children}
    </span>
  );
}

const SEV_TONE: Record<string, string> = {
  critical: "border-danger/60 text-danger",
  high: "border-danger/60 text-danger",
  medium: "border-warning/60 text-warning",
  low: "border-info/60 text-info",
  info: "border-border text-secondary",
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
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] border px-2 py-0.5 text-[11px] font-medium capitalize leading-5 ${SEV_TONE[severity] || SEV_TONE.info}`}
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
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-[6px] flex-1 overflow-hidden rounded-full bg-elevated"
        role="img"
        aria-label={`${label || "Score"}: ${value} out of 100`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${bar}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
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
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{eyebrow}</p>
        )}
        <h1 className="mt-1.5 text-[30px] font-semibold leading-tight tracking-[-0.01em]">{title}</h1>
        {body && <p className="mt-2 text-[15px] leading-relaxed text-secondary">{body}</p>}
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
    <section aria-label={label} className={`rounded-xl border border-border bg-surface ${className}`}>
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
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------- honest-data notes ---------- */

export function RecordedNote({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-warning/40 bg-elevated px-3.5 py-2.5 text-[13px] leading-relaxed text-secondary">
      <Info size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
      <p>
        <span className="font-medium text-warning">Recorded, not live.</span> {label}. Start the
        backend and analyse a repository to replace this with a live report.
      </p>
    </div>
  );
}

export function AiStatusBadge({ status }: { status: string }) {
  if (status === "completed")
    return <Badge tone="border-success/50 text-success">Gemma 4 · completed</Badge>;
  if (status === "configured")
    return <Badge tone="border-success/50 text-success">Gemma 4 · configured</Badge>;
  return (
    <Badge tone="border-warning/50 text-warning">
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
    <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
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
      className="flex items-start gap-3 rounded-lg border border-danger/40 bg-surface px-4 py-3.5 text-sm text-danger"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="leading-relaxed">{msg}</p>
        {retry && (
          <button
            onClick={retry}
            className="mt-2 rounded-lg border border-danger/50 px-3 py-1.5 text-[13px] font-medium text-danger transition duration-160 hover:bg-hover"
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
      <div className="skeleton-pulse h-5 w-1/3 rounded bg-elevated" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-pulse h-24 rounded-xl bg-elevated" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function TableSkeleton({ cols = 4, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border" role="status" aria-label="Loading table">
      <div className="skeleton-pulse h-10 bg-elevated" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-t border-border px-4 py-3.5">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="skeleton-pulse h-4 rounded bg-elevated"
              style={{ width: `${18 + ((i * 7 + j * 13) % 22)}%`, animationDelay: `${(i + j) * 90}ms` }}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
