"use client";
import React, { useEffect, useState } from "react";
import { api, API } from "@/lib/api";
import { PageHead, Panel, PanelHead, Badge } from "@/components/ui";

const ROWS: [string, string, string][] = [
  ["OPENROUTER_API_KEY", "Backend env", "Enables Gemma 4 (google/gemma-4-31b-it:free). Without it, AI features report not_configured honestly — deterministic features are unaffected."],
  ["GITHUB_TOKEN", "Backend env", "Optional. Raises GitHub API limits, and is required before issue publishing can succeed (the publish gate returns 403 without it)."],
  ["DATABASE_URL", "Backend env", "SQLite for local development, PostgreSQL in Docker Compose."],
  ["NEXT_PUBLIC_API_URL", "Frontend env", "API base used by this interface."],
];

export default function Settings() {
  const [health, setHealth] = useState<any>(null);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    api("/api/health").then(setHealth).catch(() => setOffline(true));
  }, []);

  return (
    <div>
      <PageHead
        eyebrow="Configuration"
        title="Settings"
        body="Configuration is server-side by design. API keys are never entered in the browser and never exposed to the frontend — this page only reports the live status the backend itself publishes."
      />

      <div className="mt-7 grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <Panel>
          <PanelHead title="Environment" sub="Where each value lives, and what changes when it is set" />
          <dl className="divide-y divide-border">
            {ROWS.map(([k, where, body]) => (
              <div key={k} className="grid gap-1.5 px-5 py-4 sm:grid-cols-[210px_1fr]">
                <dt>
                  <span className="font-mono text-[13px]">{k}</span>
                  <span className="mt-1 block text-xs text-muted">{where}</span>
                </dt>
                <dd className="text-sm leading-relaxed text-secondary">{body}</dd>
              </div>
            ))}
            <div className="grid gap-1.5 px-5 py-4 sm:grid-cols-[210px_1fr]">
              <dt>
                <span className="font-mono text-[13px]">API base in use</span>
                <span className="mt-1 block text-xs text-muted">This browser session</span>
              </dt>
              <dd className="break-all font-mono text-[13px]">{API}</dd>
            </div>
          </dl>
        </Panel>

        <Panel>
          <PanelHead title="Live status" sub="GET /api/health" />
          <div className="px-5 py-4">
            {offline ? (
              <div className="space-y-3 text-sm leading-relaxed">
                <Badge tone="border-danger/50 text-danger">Backend offline</Badge>
                <p className="text-secondary">
                  The backend at <span className="break-all font-mono text-xs">{API}</span> did not respond.
                  Pages in this workspace fall back to recorded live analyses from 2026-10-21.
                </p>
              </div>
            ) : health ? (
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Service</dt>
                  <dd><Badge tone="border-success/50 text-success">{health.service} · {health.status}</Badge></dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">AI status</dt>
                  <dd className="font-mono text-xs">{health.ai_status}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-muted">Model</dt>
                  <dd className="break-all text-right font-mono text-xs">{health.model}</dd>
                </div>
              </dl>
            ) : (
              <div className="skeleton-pulse h-20 rounded-lg bg-elevated" role="status" aria-label="Checking backend status" />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
