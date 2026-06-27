import { type ReactNode } from "react";

type GlassVariant = "glass" | "glass-strong" | "glass-soft";

interface GlassCardProps {
  children: ReactNode;
  variant?: GlassVariant;
  className?: string;
  /** Adds the fade-in-on-mount animation used across dashboard cards. */
  animate?: boolean;
  /** Stagger delay in seconds, paired with `animate`. */
  animateDelay?: number;
}

/**
 * Base surface for every panel in the app — KPI cards, the sidebar,
 * the header, modals, etc. all compose this rather than redefining
 * the glass treatment inline.
 */
export function GlassCard({
  children,
  variant = "glass",
  className = "",
  animate = false,
  animateDelay,
}: GlassCardProps) {
  return (
    <div
      className={`${variant} rounded-2xl ${animate ? "fade-in" : ""} ${className}`}
      style={animateDelay ? { animationDelay: `${animateDelay}s` } : undefined}
    >
      {children}
    </div>
  );
}
