"use client";

import { useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  FileCheck2,
  FileText,
  Folder,
  RefreshCw,
} from "lucide-react";
import type { LectureListItem } from "@/lib/types";

interface LectureFileTreeProps {
  lectures: LectureListItem[];
  selectedLectureId: number | null;
  onSelect: (lectureId: number) => void;
  onRefresh: () => void;
}

export function LectureFileTree({
  lectures,
  selectedLectureId,
  onSelect,
  onRefresh,
}: LectureFileTreeProps) {
  const sections = groupBySection(lectures);

  // First section open by default, matching the accordion pattern used on
  // the Dashboard tab. Sections toggle independently (unlike the Dashboard
  // accordion, more than one can be open at once — this is a file tree,
  // not an FAQ list).
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(sections.length > 0 ? [sections[0][0]] : [])
  );

  function toggleSection(title: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  return (
    <div className="w-72 shrink-0 glass rounded-2xl flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/8 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Cached Lectures</h3>
          <span className="text-[10px] text-white/30 font-mono">
            {lectures.length} files
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl glass-soft px-3 py-2 text-xs font-semibold text-indigo-200 hover:border-indigo-400/30 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {sections.map(([sectionTitle, items]) => {
          const isOpen = openSections.has(sectionTitle);
          const cachedCount = items.filter((l) => l.cached).length;

          return (
            <div key={sectionTitle} className="mb-1">
              <button
                onClick={() => toggleSection(sectionTitle)}
                className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.03] transition"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-white/30 transition-transform ${
                    isOpen ? "" : "-rotate-90"
                  }`}
                />
                <Folder className="h-3.5 w-3.5 shrink-0 text-white/30" />
                <span className="flex-1 min-w-0 truncate text-[11px] font-semibold uppercase tracking-wider text-white/30">
                  {sectionTitle}
                </span>
                <span className="shrink-0 text-[10px] font-mono text-white/25">
                  {cachedCount}/{items.length}
                </span>
              </button>

              {isOpen && (
                <div className="mt-0.5">
                  {items.map((lecture) => {
                    const selected = lecture.lecture_id === selectedLectureId;
                    const Icon = lecture.error
                      ? AlertCircle
                      : lecture.cached
                      ? FileCheck2
                      : FileText;
                    const iconClass = lecture.error
                      ? "text-amber-300"
                      : lecture.cached
                      ? "text-emerald-300"
                      : "text-white/30";

                    return (
                      <button
                        key={lecture.lecture_id}
                        onClick={() => onSelect(lecture.lecture_id)}
                        className={`w-full flex items-center gap-2 rounded-lg pl-7 pr-2 py-1.5 text-left transition hover:bg-white/[0.04] ${
                          selected ? "bg-white/8" : ""
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} />
                        <span className="text-xs text-white/60 truncate">
                          {lecture.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function groupBySection(
  lectures: LectureListItem[]
): [string, LectureListItem[]][] {
  const map = new Map<string, LectureListItem[]>();
  for (const lecture of lectures) {
    if (!map.has(lecture.section_title)) map.set(lecture.section_title, []);
    map.get(lecture.section_title)!.push(lecture);
  }
  return Array.from(map.entries()).sort(
    (a, b) => (a[1][0]?.section_index ?? 0) - (b[1][0]?.section_index ?? 0)
  );
}
