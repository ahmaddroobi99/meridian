import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, Moon, RefreshCw, Search, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV } from "./nav";
import { Input } from "@/components/ui/input";
import { formatRelative } from "@/lib/utils";
import { usePersonal } from "@/lib/store/personal";
import { cn } from "@/lib/utils";

export function ThemeSync() {
  const theme = usePersonal((s) => s.theme);
  useEffect(() => {
    void usePersonal.persist.rehydrate();
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }, [theme]);
  return null;
}

export function AppShell({
  children,
  lastUpdated,
  onRefresh,
  refreshing,
}: {
  children: React.ReactNode;
  lastUpdated?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const theme = usePersonal((s) => s.theme);
  const setTheme = usePersonal((s) => s.setTheme);
  const waste = usePersonal((s) => s.wasteMyTime);
  const setWaste = usePersonal((s) => s.setWaste);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <ThemeSync />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 bg-accent px-3 py-2 text-accent-fg">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-bg/90 px-3 backdrop-blur-sm md:px-5">
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-md hover:bg-surface-2 md:hidden"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <Link to="/" className="flex items-baseline gap-2 shrink-0">
          <span className="font-mono text-sm tracking-[0.18em] text-accent">MERIDIAN</span>
          <span className="hidden text-xs text-muted sm:inline">research terminal</span>
        </Link>
        <form
          className="mx-auto hidden max-w-xl flex-1 md:block"
          action="/search"
          onSubmit={(e) => {
            e.preventDefault();
            void navigate({ to: "/search", search: { q } });
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search papers, models, CUDA, agents…"
              className="h-9 pl-9"
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setWaste(!waste)}
            className={cn(
              "hidden h-8 items-center rounded-md px-2 font-mono text-xs sm:inline-flex",
              waste ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface-2",
            )}
          >
            {waste ? "signal only" : "all noise"}
          </button>
          {lastUpdated && (
            <span className="hidden font-mono text-xs tabular-nums text-subtle lg:inline">
              {formatRelative(lastUpdated)}
            </span>
          )}
          {onRefresh && (
            <button
              type="button"
              aria-label="Refresh feeds"
              onClick={onRefresh}
              className="inline-flex size-10 items-center justify-center rounded-md hover:bg-surface-2"
            >
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            </button>
          )}
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex size-10 items-center justify-center rounded-md hover:bg-surface-2"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-52 shrink-0 overflow-y-auto border-r border-border p-3 md:block">
          <NavList path={path} />
          <div className="mt-6 px-2">
            <p className="font-mono text-xs uppercase tracking-widest text-subtle">Sources</p>
            <Link to="/sources" className="mt-2 block text-sm text-muted hover:text-fg">
              Labs & feeds
            </Link>
            <Link to="/orgs" className="mt-1 block text-sm text-muted hover:text-fg">
              Organizations
            </Link>
            <Link to="/models" className="mt-1 block text-sm text-muted hover:text-fg">
              Models
            </Link>
            <Link to="/compare" className="mt-1 block text-sm text-muted hover:text-fg">
              Compare
            </Link>
            <Link to="/admin" className="mt-1 block text-sm text-muted hover:text-fg">
              Ingest
            </Link>
          </div>
        </aside>

        {open && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button type="button" className="absolute inset-0 bg-bg/70" aria-label="Close menu" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-sm tracking-[0.18em] text-accent">MERIDIAN</span>
                <button type="button" className="size-10" aria-label="Close" onClick={() => setOpen(false)}>
                  <X className="mx-auto size-5" />
                </button>
              </div>
              <form action="/search" className="mb-3" onSubmit={(e) => e.preventDefault()}>
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      window.location.href = `/search?q=${encodeURIComponent(q)}`;
                    }
                  }}
                />
              </form>
              <div className="flex-1 overflow-y-auto" onClick={() => setOpen(false)}>
                <NavList path={path} />
              </div>
            </div>
          </div>
        )}

        <main id="main" className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavList({ path }: { path: string }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = item.to === "/" ? path === "/" : path === item.to || path.startsWith(item.to + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex h-10 items-center gap-2 rounded-md px-2 text-sm",
              active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
