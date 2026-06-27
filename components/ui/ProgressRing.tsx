import type { ReactNode } from "react";

interface ProgressRingProps {
  /** 0-100. Values outside that range are clamped. */
  percent: number;
  /** Ring radius in the (fixed) 0 0 36 36 viewBox. */
  radius?: number;
  strokeWidth?: number;
  /** "gradient" = indigo→violet stroke. "flat" = dim white stroke. */
  variant?: "gradient" | "flat";
  /** Required (and must be unique on the page) when variant is "gradient",
   *  since SVG gradient ids are global to the document. */
  gradientId?: string;
  /** Adds the drop-shadow glow used on the two hero rings. */
  glow?: boolean;
  /** Tailwind sizing classes for the rendered ring, e.g. "h-20 w-20". */
  className?: string;
  /** Centered content overlaid on the ring (percentage label, etc.). */
  children?: ReactNode;
}

export function ProgressRing({
  percent,
  radius = 15.5,
  strokeWidth = 3.5,
  variant = "gradient",
  gradientId = "progress-ring-gradient",
  glow = false,
  className = "h-20 w-20",
  children,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * clamped) / 100;

  return (
    <div className={`relative shrink-0 ${className}`}>
      <svg
        className={`h-full w-full -rotate-90 ${glow ? "ring-glow" : ""}`}
        viewBox="0 0 36 36"
      >
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={variant === "gradient" ? `url(#${gradientId})` : "rgba(255,255,255,.2)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        {variant === "gradient" && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#818cf8" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        )}
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
