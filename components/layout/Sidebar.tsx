"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  SquarePen,
  Sparkles,
  MessageSquareText,
  BookMarked,
  ChevronsUpDown,
  Check,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { useCourse } from "@/hooks/useCourse";
import { useAppMode } from "@/context/AppModeContext";
import { AddCourseModal } from "./AddCourseModal";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transcripts", label: "Transcripts", icon: FileText, demoDisabled: true },
  { href: "/workspace", label: "Lecture Workspace", icon: SquarePen },
  { href: "/summaries", label: "Summaries", icon: Sparkles },
  { href: "/chat", label: "RAG Chat", icon: MessageSquareText },
] as const;

const SEED_COURSE_ID = "6100015";

export function Sidebar() {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const { courses, activeCourse, setActiveCourseId, removeCourse } = useCourse();
  const { mode } = useAppMode();
  const isDemo = mode === "demo";

  const [courseMenuOpen, setCourseMenuOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar on nav
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setCourseMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openAddModal() {
    setCourseMenuOpen(false);
    setAddModalOpen(true);
  }

  const sidebarContent = (
    <aside
      className={`h-full glass rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        // On desktop: respect collapsed state. On mobile: always full width inside the drawer.
        collapsed ? "lg:w-20 w-72" : "w-72 lg:w-64"
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/8 shrink-0">
        <div className="h-9 w-9 rounded-xl grad-accent flex items-center justify-center shrink-0 glow">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        {/* On desktop respect collapsed; on mobile always show label */}
        <div className={`leading-tight min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
          <div className="text-sm font-semibold text-white truncate">LearnPilot AI</div>
          <div className="text-[11px] text-white/40 truncate">Learning workspace</div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden ml-auto text-white/40 hover:text-white transition"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {(!collapsed || mobileOpen) && (
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
            Workspace
          </p>
        )}
        {NAV_ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
          const disabled = isDemo && "demoDisabled" in rest && rest.demoDisabled;
          const active = !disabled && pathname?.startsWith(href);

          if (disabled) {
            return (
              <div
                key={href}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/20 cursor-not-allowed select-none"
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate flex items-center gap-2">
                  {label}
                  <span className="text-[10px] font-normal text-white/25 bg-white/5 rounded px-1.5 py-0.5">
                    demo
                  </span>
                </span>
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "nav-active text-white" : "text-white/55 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {/* On desktop respect collapsed; on mobile always show */}
              <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Active course + API status */}
      <div className="p-3 border-t border-white/8 space-y-3 shrink-0">
        <div ref={menuRef} className="relative">
          {(!collapsed || mobileOpen) && (
            <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-1.5 px-1">
              Active Course
            </label>
          )}
          <button
            onClick={() => setCourseMenuOpen((o) => !o)}
            className="relative w-full flex items-center gap-2.5 rounded-xl glass-soft px-3 py-2.5 text-left hover:border-white/20 transition group"
          >
            <div className="h-7 w-7 rounded-lg grad-accent flex items-center justify-center shrink-0">
              <BookMarked className="h-4 w-4 text-white" />
            </div>
            <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
              <div className="text-xs font-semibold text-white truncate">{activeCourse.title}</div>
              <div className="text-[10px] text-white/40 truncate">{activeCourse.subtitle}</div>
            </div>
            <ChevronsUpDown className={`h-4 w-4 text-white/40 group-hover:text-white/70 shrink-0 ${collapsed ? "lg:hidden" : ""}`} />
          </button>

          {courseMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1.5 rounded-xl glass-strong overflow-hidden shadow-2xl z-20">
              {courses.map((course) => {
                const selected = course.id === activeCourse.id;
                const isDeletable = course.id !== SEED_COURSE_ID;
                return (
                  <div
                    key={course.id}
                    className={`flex items-center gap-2 px-3 py-2.5 text-xs transition group/row ${
                      selected ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                    }`}
                  >
                    <button
                      onClick={() => { setActiveCourseId(course.id); setCourseMenuOpen(false); }}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <span className="w-3.5 shrink-0">
                        {selected && <Check className="h-3.5 w-3.5 text-indigo-300" />}
                      </span>
                      <span className="truncate">{course.title}</span>
                    </button>
                    {isDeletable && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeCourse(course.id); }}
                        className="shrink-0 opacity-0 group-hover/row:opacity-100 h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-rose-400 transition"
                        title="Remove course"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              <div className="border-t border-white/8">
                <button
                  onClick={openAddModal}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-indigo-300 hover:bg-white/5 transition"
                >
                  <span className="w-3.5 shrink-0 flex items-center justify-center">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                  <span>New Course</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* API status */}
        <div className="flex items-center gap-2.5 rounded-xl glass-soft px-3 py-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="ping-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className={`text-[11px] font-medium text-emerald-300 ${collapsed ? "lg:hidden" : ""}`}>
            API Live
          </span>
          <span className={`ml-auto text-[10px] text-emerald-400/50 font-mono ${collapsed ? "lg:hidden" : ""}`}>
            42ms
          </span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Desktop sidebar (in layout flow) ── */}
      <div className="hidden lg:flex shrink-0">
        {sidebarContent}
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-10 h-full">
            {sidebarContent}
          </div>
        </div>
      )}

      {addModalOpen && <AddCourseModal onClose={() => setAddModalOpen(false)} />}
    </>
  );
}