"use client";

import { useState } from "react";
import { Check, ChevronDown, ListChecks } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { CourseSection } from "@/lib/types";

interface SectionAccordionProps {
  sections: CourseSection[];
}

export function SectionAccordion({ sections }: SectionAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    sections.length > 0 ? 0 : null
  );
  const totalLessons = sections.reduce((sum, s) => sum + s.total_items, 0);

  return (
    <GlassCard animate className="overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <ListChecks className="h-4 w-4 text-indigo-300" />
          <h3 className="text-sm font-semibold text-white">
            Course Sections
          </h3>
        </div>
        <span className="text-xs text-white/40">
          {sections.length} modules · {totalLessons} lessons
        </span>
      </div>

      <div>
        {sections.map((section, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={section.section_index}
              className="border-b border-white/8 last:border-0"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-white/[0.03] transition"
              >
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                    section.completed_items > 0
                      ? "grad-accent text-white"
                      : "glass-soft text-white/40"
                  }`}
                >
                  {section.section_index}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">
                    {section.title}
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5">
                    {section.completed_items} of {section.total_items} lessons
                    completed
                  </div>
                </div>
                <div className="w-24 hidden sm:block shrink-0">
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        section.completed_items > 0 ? "grad-accent" : ""
                      }`}
                      style={{ width: `${section.completion_percent}%` }}
                    />
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-white/40 shrink-0 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
                style={{
                  maxHeight: isOpen ? "3000px" : "0px",
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div className="px-6 pb-4 pl-[4.5rem] space-y-1">
                  {section.subsections.map((sub, j) => (
                    <div
                      key={sub.lecture_id ?? `${section.section_index}-${j}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.03] transition cursor-pointer"
                    >
                      <span
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                          sub.is_completed ? "bg-emerald-500/20" : "glass-soft"
                        }`}
                      >
                        {sub.is_completed ? (
                          <Check className="h-3 w-3 text-emerald-300" />
                        ) : (
                          <span className="text-[10px] text-white/30">
                            {j + 1}
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-sm truncate ${
                          sub.is_completed ? "text-white/50" : "text-white/80"
                        }`}
                      >
                        {sub.title}
                      </span>
                      <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-white/30 border border-white/10 rounded px-1.5 py-0.5 shrink-0">
                        {sub.type === "lecture" ? "Lecture" : sub.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
