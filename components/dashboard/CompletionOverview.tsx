import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { formatPercent } from "@/lib/format";
import type { ProgressSummary } from "@/lib/types";

interface CompletionOverviewProps {
  progress: ProgressSummary;
}

export function CompletionOverview({ progress }: CompletionOverviewProps) {
  const { overall_completion_percent, items_completed, total_items, current_position } =
    progress;

  // The API doesn't separately report "in progress" — treat the current
  // resume point as the one in-progress item when there's still work left.
  const inProgress = current_position && items_completed < total_items ? 1 : 0;
  const notStarted = Math.max(total_items - items_completed - inProgress, 0);

  return (
    <GlassCard animate className="p-6">
      <h3 className="text-sm font-semibold text-white mb-1">
        Completion Overview
      </h3>
      <p className="text-xs text-white/40 mb-4">
        Lessons by status across the full track.
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
        <ProgressRing
          percent={overall_completion_percent}
          radius={14}
          strokeWidth={4}
          glow
          gradientId="completion-overview-ring"
          className="h-36 w-36 lg:h-40 lg:w-40 shrink-0"
        >
          <span className="text-2xl font-bold text-white">
            {formatPercent(overall_completion_percent)}%
          </span>
          <span className="text-[10px] text-white/40">complete</span>
        </ProgressRing>
        <div className="space-y-3 text-sm">
          <LegendRow swatchClass="grad-accent" label="Completed" value={items_completed} />
          <LegendRow
            swatchClass="bg-indigo-400/40"
            label="In progress"
            value={inProgress}
          />
          <LegendRow
            swatchClass="bg-white/15"
            label="Not started"
            value={notStarted}
          />
        </div>
      </div>
    </GlassCard>
  );
}

function LegendRow({
  swatchClass,
  label,
  value,
}: {
  swatchClass: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${swatchClass}`} />
      <span className="text-white/55">{label}</span>
      <span className="ml-auto font-semibold text-white">{value}</span>
    </div>
  );
}