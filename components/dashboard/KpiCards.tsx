import { Target, CheckCheck, Layers3 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { formatPercent } from "@/lib/format";
import type { CurrentPosition, ProgressSummary } from "@/lib/types";

interface KpiCardsProps {
  progress: ProgressSummary;
}

export function KpiCards({ progress }: KpiCardsProps) {
  const {
    overall_completion_percent,
    items_completed,
    total_items,
    sections_completed,
    total_sections,
    current_position,
  } = progress;

  const remaining = Math.max(total_items - items_completed, 0);
  const sectionsPercent =
    total_sections > 0 ? (sections_completed / total_sections) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
      <GlassCard animate className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-white/45 uppercase tracking-wide">
            Overall Completion
          </span>
          <Target className="h-4 w-4 text-white/30" />
        </div>
        <div className="flex items-center gap-5">
          <ProgressRing
            percent={overall_completion_percent}
            glow
            gradientId="kpi-overall-ring"
          >
            <span className="text-lg font-bold text-white">
              {formatPercent(overall_completion_percent)}%
            </span>
          </ProgressRing>
          <div>
            <div className="text-3xl font-bold grad-text leading-none">
              {formatPercent(overall_completion_percent)}
              <span className="text-lg">%</span>
            </div>
            <p className="text-xs text-white/40 mt-1.5">
              {items_completed} of {total_items} lessons done
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard animate animateDelay={0.05} className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-white/45 uppercase tracking-wide">
            Lectures Completed
          </span>
          <CheckCheck className="h-4 w-4 text-white/30" />
        </div>
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-4xl font-bold text-white">{items_completed}</span>
          <span className="text-lg text-white/35 font-medium">
            / {total_items}
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full grad-accent rounded-full glow"
            style={{ width: `${overall_completion_percent}%` }}
          />
        </div>
        <p className="text-[11px] text-white/35 mt-2">
          {remaining} lectures remaining
        </p>
      </GlassCard>

      <GlassCard animate animateDelay={0.1} className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-white/45 uppercase tracking-wide">
            Sections Completed
          </span>
          <Layers3 className="h-4 w-4 text-white/30" />
        </div>
        <div className="flex items-center gap-5">
          <ProgressRing percent={sectionsPercent} variant="flat">
            <span className="text-lg font-bold text-white/40">
              {Math.round(sectionsPercent)}%
            </span>
          </ProgressRing>
          <div>
            <div className="text-3xl font-bold text-white leading-none">
              {sections_completed}
              <span className="text-lg text-white/35"> / {total_sections}</span>
            </div>
            <p className="text-xs text-white/40 mt-1.5">
              {currentPositionLabel(current_position)}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function currentPositionLabel(pos: CurrentPosition | null): string {
  if (!pos) return "Not started yet";
  // "Week 1 - Build Your First LLM Product" → "Week 1 in progress"
  const shortLabel = pos.section_title.split(" - ")[0].trim();
  return `${shortLabel} in progress`;
}
