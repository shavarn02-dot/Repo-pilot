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
import { ThemeToggle } from "@/components/ui";

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
    <nav className="space-y-1 px-3" aria-label="Dashboard">
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
            className={`flex items-center gap-3 rounded-full py-2.5 text-sm transition-all duration-300 ease-spring ${
              active
                ? "bg-accentContainer font-semibold text-accent"
                : "font-normal text-secondary hover:bg-elevated hover:text-primary"
            } ${collapsed ? "justify-center px-0" : "px-4"}`}
          >
            <Icon size={18} className={active ? "text-accent" : "text-muted"} />
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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-onAccent">
        <GitBranch size={17} strokeWidth={2.4} />
      </span>
      {!collapsed && <span className="text-[16px] font-semibold tracking-[-0.01em]">RepoPilot</span>}
    </div>
  );

  return (
    <div className="flex min-h-screen gap-0 bg-canvas md:gap-4 md:p-4">
      {/* desktop sidebar — floating tonal panel */}
      <aside
        className={`sticky top-4 hidden h-[calc(100vh-2rem)] shrink-0 flex-col rounded-panel bg-surface shadow-soft transition-[width] duration-300 ease-spring md:flex ${
          collapsed ? "w-[76px]" : "w-[248px]"
        }`}
        aria-label="Workspace"
      >
        <div className={`flex items-center px-5 pb-2 pt-5 ${collapsed ? "justify-center px-2" : ""}`}>
          {brand}
        </div>
        {!collapsed && (
          <div className="px-5 pb-1 pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Workspace</p>
            <p className="mt-2 truncate rounded-full bg-elevated px-3.5 py-2 font-mono text-xs text-secondary">
              public repositories
            </p>
          </div>
        )}
        <div className="mt-3 flex-1 overflow-y-auto">
          <NavList path={path} collapsed={collapsed} />
        </div>
        <div className={`p-3 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-[13px] text-muted transition duration-300 ease-spring hover:bg-elevated hover:text-primary"
          >
            {collapsed ? <PanelLeftOpen size={17} /> : (<><PanelLeftClose size={17} /> Collapse</>)}
          </button>
        </div>
      </aside>

      {/* mobile drawer — floating rounded sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-3 left-3 flex w-[272px] flex-col rounded-panel bg-surface shadow-pop">
            <div className="flex items-center justify-between px-5 pb-1 pt-5">
              {brand}
              <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="rounded-full bg-elevated p-2 text-secondary transition duration-200 hover:text-primary">
                <X size={17} />
              </button>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto pb-4">
              <NavList path={path} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* contextual top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 bg-canvas px-4 sm:px-6 md:top-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="rounded-full bg-surface p-2.5 text-secondary shadow-soft transition duration-300 ease-spring hover:bg-elevated hover:text-primary md:hidden"
            >
              <Menu size={18} />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
              <Link href="/dashboard" className="shrink-0 text-secondary transition duration-200 hover:text-primary">
                Dashboard
              </Link>
              <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden />
              <span className="truncate font-semibold" aria-current="page">{crumb}</span>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span
              className="hidden items-center gap-2 rounded-full bg-surface px-3.5 py-2 font-mono text-[11px] text-secondary shadow-soft lg:flex"
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
            <ThemeToggle />
            <Link href="/" className="hidden rounded-full bg-surface px-4 py-2 text-sm font-medium text-secondary shadow-soft transition duration-300 ease-spring hover:bg-elevated hover:text-primary sm:block">
              Landing
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-10 pt-5 sm:px-6 lg:pt-7">{children}</main>
      </div>
    </div>
  );
}
