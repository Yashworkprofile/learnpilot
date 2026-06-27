"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Folder, Search, X } from "lucide-react";
import { useLectures } from "@/hooks/useLectures";
import type { LectureListItem } from "@/lib/types";

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

type ResultItem =
  | { kind: "section"; title: string; sectionIndex: number }
  | { kind: "lecture"; lecture: LectureListItem };

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const router = useRouter();
  const { data } = useLectures();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  // ── Results (must come before the keydown effect that reads them) ──────
  const results = useMemo<ResultItem[]>(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();

    const sectionMap = new Map<string, { index: number; lectures: LectureListItem[] }>();
    for (const l of data.lectures) {
      if (!sectionMap.has(l.section_title)) {
        sectionMap.set(l.section_title, { index: l.section_index, lectures: [] });
      }
      sectionMap.get(l.section_title)!.lectures.push(l);
    }
    const sections = Array.from(sectionMap.entries()).sort(
      (a, b) => a[1].index - b[1].index
    );

    const items: ResultItem[] = [];
    for (const [title, { index, lectures }] of sections) {
      const matchingLectures = lectures.filter(
        (l) =>
          !q ||
          l.title.toLowerCase().includes(q) ||
          title.toLowerCase().includes(q)
      );
      if (matchingLectures.length > 0) {
        items.push({ kind: "section", title, sectionIndex: index });
        for (const l of matchingLectures) {
          items.push({ kind: "lecture", lecture: l });
        }
      }
    }
    return items;
  }, [data, query]);

  const selectableIndices = useMemo(
    () => results.reduce<number[]>((acc, item, i) => {
      if (item.kind === "lecture") acc.push(i);
      return acc;
    }, []),
    [results]
  );

  // ── Helpers ────────────────────────────────────────────────────────────
  function navigate(lecture: LectureListItem) {
    router.push(`/workspace?lecture_id=${lecture.lecture_id}`);
    onClose();
  }

  function scrollResultIntoView(index: number) {
    const el = listRef.current?.querySelector(`[data-index="${index}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }

  // ── Focus / reset on open ──────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // ── Reset active index when results change ─────────────────────────────
  useEffect(() => {
    setActiveIndex(selectableIndices[0] ?? 0);
  }, [selectableIndices]);

  // ── Global keydown — works regardless of which element has focus ───────
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      const pos = selectableIndices.indexOf(activeIndex);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = selectableIndices[Math.min(pos + 1, selectableIndices.length - 1)];
        if (next !== undefined) {
          setActiveIndex(next);
          scrollResultIntoView(next);
        }
        inputRef.current?.focus();
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = selectableIndices[Math.max(pos - 1, 0)];
        if (prev !== undefined) {
          setActiveIndex(prev);
          scrollResultIntoView(prev);
        }
        inputRef.current?.focus();
      }

      if (e.key === "Enter") {
        const item = results[activeIndex];
        if (item?.kind === "lecture") navigate(item.lecture);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, activeIndex, selectableIndices, results, onClose]);

  if (!open) return null;

  const lectureCount = results.filter((r) => r.kind === "lecture").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onMouseDown={(e) => {
        if (!paletteRef.current?.contains(e.target as Node)) onClose();
      }}
    >
      {/* Dim overlay — pointer-events-none so clicks pass through to backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />

      {/* Palette card */}
      <div
        ref={paletteRef}
        className="relative w-full max-w-xl mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "rgba(12,12,28,0.96)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
          <Search className="h-4 w-4 text-white/35 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lectures and sections…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          {query && (
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery("");
                inputRef.current?.focus();
              }}
              className="text-white/30 hover:text-white transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onMouseDown={(e) => { e.preventDefault(); onClose(); }}
            className="text-[10px] text-white/25 border border-white/10 rounded px-1.5 py-0.5 font-mono hover:text-white/50 hover:border-white/25 transition cursor-pointer"
          >
            esc
          </button>
        </div>

        {/* Results list */}
        <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: "380px" }}>
          {!data && (
            <p className="text-xs text-white/35 text-center py-10">Loading lectures…</p>
          )}
          {data && results.length === 0 && (
            <p className="text-xs text-white/35 text-center py-10">
              No lectures match &ldquo;{query}&rdquo;
            </p>
          )}

          {results.map((item, i) => {
            if (item.kind === "section") {
              return (
                <div
                  key={`section-${item.sectionIndex}`}
                  className="flex items-center gap-2 px-4 pt-4 pb-1.5"
                >
                  <Folder className="h-3 w-3 text-white/25 shrink-0" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30 truncate">
                    {item.title}
                  </span>
                </div>
              );
            }

            const isActive = i === activeIndex;
            return (
              <button
                key={item.lecture.lecture_id}
                data-index={i}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => navigate(item.lecture)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                  isActive ? "bg-indigo-500/15" : "hover:bg-white/[0.03]"
                }`}
              >
                <BookOpen
                  className={`h-3.5 w-3.5 shrink-0 transition ${
                    isActive ? "text-indigo-300" : "text-white/25"
                  }`}
                />
                <span
                  className={`flex-1 min-w-0 text-sm truncate transition ${
                    isActive ? "text-white" : "text-white/60"
                  }`}
                >
                  {item.lecture.title}
                </span>
                <span className="text-[10px] font-mono text-white/20 shrink-0">
                  #{item.lecture.lecture_number}
                </span>
              </button>
            );
          })}

          {results.length > 0 && <div className="h-2" />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/8">
          <span className="text-[10px] text-white/25">
            {data
              ? lectureCount > 0
                ? `${lectureCount} lecture${lectureCount !== 1 ? "s" : ""}`
                : "No results"
              : "Loading…"}
          </span>
          <div className="flex items-center gap-3 text-[10px] text-white/25">
            <span><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> open in Workspace</span>
            <span><kbd className="font-mono">esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  );
}