import type { LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface ComingSoonPanelProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoonPanel({
  icon: Icon,
  title,
  description,
}: ComingSoonPanelProps) {
  return (
    <GlassCard
      variant="glass"
      animate
      className="flex flex-col items-center justify-center text-center gap-4 py-24 px-8"
    >
      <div className="h-12 w-12 rounded-xl grad-accent flex items-center justify-center glow">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="text-xs text-white/45 leading-relaxed">{description}</p>
      </div>
    </GlassCard>
  );
}
