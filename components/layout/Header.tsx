"use client";

import { useEffect, useState } from "react";
import { Bell, Layers, Menu, Search, FlaskConical } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { useCourse } from "@/hooks/useCourse";
import { useAppMode } from "@/context/AppModeContext";
import { UserMenu } from "./UserMenu";
import { SearchPalette } from "./SearchPalette";

export function Header() {
  const { toggle, setMobileOpen } = useSidebar();
  const { activeCourse } = useCourse();
  const { mode, setMode, backendAvailable, backendChecking } = useAppMode();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isDemo = mode === "demo";

  return (
    <>
      {/* ── Demo banner ── */}
      {isDemo && (
        <div className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300 shrink-0">
          <FlaskConical className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span className="line-clamp-1">
            Demo mode — MIT 6.S191 Introduction to Deep Learning
          </span>
        </div>
      )}

      {/* ── Main header bar ── */}
      <header className="glass-strong rounded-2xl h-14 lg:h-16 shrink-0 flex items-center gap-3 px-4 lg:px-5">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="lg:hidden text-white/50 hover:text-white transition shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle sidebar"
          className="hidden lg:block text-white/50 hover:text-white transition shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search trigger — icon only on mobile, full bar on desktop */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center rounded-xl glass-soft px-3 py-2 text-left hover:bg-white/[0.04] transition group flex-1 lg:max-w-md"
        >
          <Search className="h-4 w-4 text-white/30 shrink-0 lg:mr-2.5 group-hover:text-white/50 transition" />
          <span className="hidden lg:block flex-1 text-sm text-white/30 group-hover:text-white/40 transition select-none">
            Search lectures…
          </span>
          <kbd className="hidden lg:block text-[10px] text-white/25 border border-white/10 rounded px-1.5 py-0.5 font-mono shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* Active course label — desktop only */}
        <div className="hidden lg:flex items-center gap-2 ml-2 min-w-0">
          <Layers className="h-4 w-4 text-indigo-300 shrink-0" />
          <span className="text-xs text-white/45 truncate">
            {activeCourse.title}
            {activeCourse.subtitle && (
              <>
                <span className="mx-1.5 text-white/20">·</span>
                {activeCourse.subtitle}
              </>
            )}
          </span>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Demo / Live toggle — desktop only, backend won't be reachable on mobile anyway */}
          {!backendChecking && backendAvailable && setMode && (
            <div className="hidden lg:flex items-center rounded-xl glass-soft p-1 gap-1">
              <button
                onClick={() => setMode("demo")}
                className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isDemo ? "bg-amber-500/20 text-amber-300" : "text-white/35 hover:text-white/60"
                }`}
              >
                Demo
              </button>
              <button
                onClick={() => setMode("live")}
                className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  !isDemo ? "bg-emerald-500/20 text-emerald-300" : "text-white/35 hover:text-white/60"
                }`}
              >
                Live
              </button>
            </div>
          )}

          <div
            className="h-8 w-8 lg:h-9 lg:w-9 rounded-xl glass-soft flex items-center justify-center text-white/25 cursor-default"
            title="Notifications coming soon"
          >
            <Bell className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
          </div>
          <UserMenu />
        </div>
      </header>

      <SearchPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
