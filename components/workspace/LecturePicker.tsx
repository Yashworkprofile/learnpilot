"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, Folder } from "lucide-react";
import type { LectureListItem } from "@/lib/types";

interface LecturePickerProps {
  lectures: LectureListItem[];
  selectedLectureId: number | null;
  onSelect: (lectureId: number) => void;
}

export function LecturePicker({
  lectures,
  selectedLectureId,
  onSelect,
}: LecturePickerProps) {
  const sections = groupBySection(lectures);

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
    <div className="lg:w-64 lg:shrink-0 w-full glass rounded-2xl flex flex-col overflow-hidden lg:h-auto">
      <div className="px-4 py-3 lg:py-4 border-b border-white/8 shrink-0">
        <h3 className="text-sm font-semibold text-white">Lectures</h3>
        <p className="text-[10px] text-white/35 mt-0.5">{lectures.length} total</p>
      </div>

      {/* ── Mobile: horizontal chip scroll ── */}
      <div className="lg:hidden overflow-x-auto flex gap-2 p-3 scrollbar-none">
        {lectures.map((lecture) => {
          const selected = lecture.lecture_id === selectedLectureId;
          return (
            <button
              key={lecture.lecture_id}
              onClick={() => onSelect(lecture.lecture_id)}
              className={`shrink-0 flex flex-col items-start rounded-xl px-3 py-2 text-left transition touch-manipulation ${
                selected
                  ? "bg-indigo-500/20 border border-indigo-500/30"
                  : "glass-soft hover:bg-white/[0.06]"
              }`}
            >
              <span className="text-[10px] font-mono text-white/35">
                #{lecture.lecture_number}
              </span>
              <span
                className={`text-xs font-medium mt-0.5 max-w-[110px] truncate ${
                  selected ? "text-indigo-200" : "text-white/65"
                }`}
              >
                {lecture.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Desktop: accordion ── */}
      <div className="hidden lg:block flex-1 overflow-y-auto p-2">
        {sections.map(([sectionTitle, items]) => {
          const isOpen = openSections.has(sectionTitle);
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
                <span className="shrink-0 text-[10px] font-mono text-white/20">
                  {items.length}
                </span>
              </button>

              {isOpen && (
                <div className="mt-0.5">
                  {items.map((lecture) => {
                    const selected = lecture.lecture_id === selectedLectureId;
                    return (
                      <button
                        key={lecture.lecture_id}
                        onClick={() => onSelect(lecture.lecture_id)}
                        className={`w-full flex items-center gap-2 rounded-lg pl-7 pr-2 py-1.5 text-left transition hover:bg-white/[0.04] ${
                          selected ? "bg-white/8 border border-white/10" : ""
                        }`}
                      >
                        <BookOpen
                          className={`h-3.5 w-3.5 shrink-0 transition ${
                            selected ? "text-indigo-300" : "text-white/25"
                          }`}
                        />
                        <div className="min-w-0">
                          <span
                            className={`block text-xs truncate transition ${
                              selected ? "text-white" : "text-white/55"
                            }`}
                          >
                            {lecture.title}
                          </span>
                          <span className="block text-[10px] text-white/25 font-mono">
                            #{lecture.lecture_number}
                          </span>
                        </div>
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
