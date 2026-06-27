import { GlassCard } from "@/components/ui/GlassCard";
import type { CourseSection } from "@/lib/types";

interface ModuleCompletionProps {
  sections: CourseSection[];
}

export function ModuleCompletion({ sections }: ModuleCompletionProps) {
  return (
    <GlassCard animate className="p-6">
      <h3 className="text-sm font-semibold text-white mb-1">
        Module Completion
      </h3>
      <p className="text-xs text-white/40 mb-4">Week-by-week progress.</p>
      <div className="space-y-3.5">
        {sections.map((section) => (
          <div key={section.section_index}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-white/60 truncate pr-2">
                Week {section.section_index} · {stripWeekPrefix(section.title)}
              </span>
              <span
                className={`font-mono shrink-0 ${
                  section.completion_percent > 0
                    ? "text-indigo-200"
                    : "text-white/30"
                }`}
              >
                {Math.round(section.completion_percent)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  section.completion_percent > 0 ? "grad-accent glow" : ""
                }`}
                style={{ width: `${section.completion_percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/** "Week 1 - Build Your First LLM Product" → "Build Your First LLM Product" */
function stripWeekPrefix(title: string): string {
  return title.replace(/^week\s*\d+\s*-\s*/i, "");
}
