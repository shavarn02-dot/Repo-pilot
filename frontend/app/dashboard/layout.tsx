"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderGit2, GitPullRequest, CircleDot, Bot, ScanEye,
  FileText, Settings, GitBranch, PanelLeftClose, PanelLeftOpen, Menu, X,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";

const NAV: [string, string, any][] = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["Repositories", "/dashboard#repositories", FolderGit2],
  ["Pull Requests", "/dashboard/pull-requests", GitPullRequest],
  ["Issues", "/dashboard/issues", CircleDot],
  ["AI Assistant", "/dashboard/assistant", Bot],
  ["Visual Debugger", "/dashboard/visual", ScanEye],
  ["Reports", "/dashboard/reports", FileText],
  ["Settings", "/dashboard/settings", Settings],
];

const CRUMBS: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/pull-requests": "Pull Requests",
  "/dashboard/issues": "Issues",
  "/dashboard/assistant": "AI Assistant",
  "/dashboard/visual": "Visual Debugger",
  "/dashboard/reports": "Reports",
  "/dashboard/settings": "Settings",
};

function NavList({ path, collapsed, onNavigate }: { path: string; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="space-y-0.5 px-2.5" aria-label="Dashboard">
      {NAV.map(([label, href, Icon]) => {
        const base = href.split("#")[0];
        const active =
          href === "/dashboard"
            ? path === "/dashboard" || path.startsWith("/dashboard/repositories")
            : path === base;
        return (
          <Link
            key={label}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition duration-160 ${
              active ? "bg-hover font-medium text-primary" : "text-secondary hover:bg-hover hover:text-primary"
            } ${collapsed ? "justify-center px-0" : ""}`}
          >
            {active && (
              <span className="absolute left-[-10px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent" aria-hidden />
            )}
            <Icon size={18} className={active ? "text-accent" : "text-muted group-hover:text-secondary"} />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("rp-sidebar") === "collapsed");
    } catch {}
    api("/api/health").then(setHealth).catch(() => setHealth({ status: "offline" }));
  }, []);

  function toggle() {
    setCollapsed((c) => {
      try {
        localStorage.setItem("rp-sidebar", c ? "expanded" : "collapsed");
      } catch {}
      return !c;
    });
  }

  const crumb =
    path.startsWith("/dashboard/repositories/")
      ? "Repository"
      : CRUMBS[path] || "Overview";
  const aiOffline = !health || health.status === "offline";
  const aiConfigured = health?.ai_configured === true;

  const brand = (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-black">
        <GitBranch size={16} strokeWidth={2.4} />
      </span>
      {!collapsed && <span className="text-[15px] font-semibold tracking-[-0.01em]">RepoPilot</span>}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-240 md:flex ${
          collapsed ? "w-[64px]" : "w-[240px]"
        }`}
        aria-label="Workspace"
      >
        <div className={`flex h-14 items-center border-b border-border ${collapsed ? "justify-center px-2" : "px-4"}`}>
          {brand}
        </div>
        {!collapsed && (
          <div className="px-4 pb-1 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Workspace</p>
            <p className="mt-1.5 truncate rounded-lg border border-border bg-canvas px-2.5 py-2 font-mono text-xs text-secondary">
              public repositories
            </p>
          </div>
        )}
        <div className="mt-3 flex-1 overflow-y-auto">
          <NavList path={path} collapsed={collapsed} />
        </div>
        <div className={`border-t border-border p-3 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-muted transition duration-160 hover:bg-hover hover:text-primary"
          >
            {collapsed ? <PanelLeftOpen size={17} /> : (<><PanelLeftClose size={17} /> Collapse</>)}
          </button>
        </div>
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col border-r border-border bg-surface">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              {brand}
              <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="rounded-lg p-1.5 text-secondary hover:bg-hover">
                <X size={18} />
              </button>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto">
              <NavList path={path} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* contextual top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-canvas/95 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-1.5 text-secondary transition duration-160 hover:bg-hover md:hidden"
            >
              <Menu size={19} />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
              <Link href="/dashboard" className="shrink-0 text-secondary transition duration-160 hover:text-primary">
                Dashboard
              </Link>
              <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden />
              <span className="truncate font-medium" aria-current="page">{crumb}</span>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span
              className="hidden items-center gap-2 font-mono text-[11px] text-muted lg:flex"
              title={health ? JSON.stringify(health) : "Checking backend…"}
            >
              <span
                className={`h-2 w-2 rounded-full ${aiOffline ? "bg-danger" : aiConfigured ? "bg-success" : "bg-warning"}`}
                aria-hidden
              />
              {aiOffline
                ? "Backend offline — recorded data shown"
                : aiConfigured
                  ? "Gemma 4 · google/gemma-4-31b-it:free"
                  : "Gemma 4 · not configured"}
            </span>
            <Link href="/" className="text-sm text-secondary transition duration-160 hover:text-primary">
              Landing
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-7 sm:px-6 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
