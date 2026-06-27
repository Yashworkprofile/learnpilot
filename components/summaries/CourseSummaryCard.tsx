"use client";

import {
  AlertTriangle,
  GraduationCap,
  Layers,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { CourseSummary, CourseTool } from "@/lib/types";

interface CourseSummaryCardProps {
  data: CourseSummary | null;
  loading: boolean;
  error: string | null;
  onGenerate: (refresh?: boolean) => void;
}

export function CourseSummaryCard({
  data,
  loading,
  error,
  onGenerate,
}: CourseSummaryCardProps) {
  return (
    <GlassCard animate variant="glass-strong" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="h-4 w-4 text-indigo-300" />
          <h2 className="text-sm font-semibold text-white">Course Overview</h2>
        </div>
        {data && !loading && (
          <button
            onClick={() => onGenerate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg glass-soft px-2.5 py-1.5 text-[11px] font-medium text-white/55 hover:text-white transition"
          >
            <RefreshCw className="h-3 w-3" /> Regenerate
          </button>
        )}
      </div>

      <div className="px-6 py-6">
        {!data && !loading && !error && (
          <EmptyState onGenerate={() => onGenerate(false)} />
        )}

        {loading && <GeneratingState />}

        {!loading && error && (
          <ErrorState error={error} onRetry={() => onGenerate(false)} />
        )}

        {!loading && !error && data && <LoadedState data={data} />}
      </div>
    </GlassCard>
  );
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-6">
      <div className="h-10 w-10 rounded-xl glass-soft flex items-center justify-center">
        <Sparkles className="h-5 w-5 text-indigo-300" />
      </div>
      <div className="space-y-1 max-w-sm">
        <p className="text-sm font-semibold text-white">
          No course overview yet
        </p>
        <p className="text-xs text-white/45">
          Groq reads every lecture summary you&rsquo;ve generated so far and
          writes a course-level overview — what you&rsquo;ve covered, the
          tools used, and skills picked up.
        </p>
      </div>
      <button
        onClick={onGenerate}
        className="mt-1 inline-flex items-center gap-2 rounded-xl grad-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition glow"
      >
        <Wand2 className="h-4 w-4" /> Generate Course Overview
      </button>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-8">
      <div className="h-10 w-10 rounded-xl glass-soft flex items-center justify-center">
        <Sparkles className="h-5 w-5 text-indigo-300 animate-pulse" />
      </div>
      <p className="text-sm font-medium text-white/70">
        Generating overview&hellip;
      </p>
      <p className="text-xs text-white/35">
        Reading lecture summaries and writing it up with Groq.
      </p>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-6">
      <AlertTriangle className="h-7 w-7 text-amber-300" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">
          Couldn&rsquo;t generate the overview
        </p>
        <p className="text-xs text-white/45 max-w-sm">{error}</p>
      </div>
      <button
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-2 rounded-xl glass-soft px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition"
      >
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}

function LoadedState({ data }: { data: CourseSummary }) {
  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-relaxed text-white/80">
        {data.overall_summary}
      </p>

      {data.knowledge_progression && (
        <div className="flex gap-3 rounded-xl glass-soft px-4 py-3">
          <Layers className="h-4 w-4 text-sky-300 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-white/55">
            {data.knowledge_progression}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SummaryList title="What You Covered" items={data.what_you_covered} />
        <SummaryList
          title="Skills Acquired"
          items={data.skills_acquired}
          icon={Lightbulb}
        />
      </div>

      {data.tools_and_technologies.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-white/45 uppercase tracking-wider mb-2">
            Tools &amp; Technologies
          </h4>
          <PillRow items={data.tools_and_technologies} tone="indigo" />
        </div>
      )}

      {data.key_concepts_covered.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-white/45 uppercase tracking-wider mb-2">
            Key Concepts
          </h4>
          <PillRow items={data.key_concepts_covered} tone="sky" />
        </div>
      )}

      {data.quick_review_topics.length > 0 && (
        <SummaryList
          title="Quick Review Topics"
          items={data.quick_review_topics}
        />
      )}
    </div>
  );
}

function SummaryList({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: (string | CourseTool)[];
  icon?: typeof Lightbulb;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold text-white/45 uppercase tracking-wider mb-2">
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-white/70 leading-snug"
          >
            {Icon ? (
              <Icon className="h-3.5 w-3.5 text-white/30 shrink-0 mt-0.5" />
            ) : (
              <span className="h-1 w-1 rounded-full bg-white/30 shrink-0 mt-2" />
            )}
            <span>
              {pillLabel(item)}
              {pillDescription(item) && (
                <span className="text-white/40"> — {pillDescription(item)}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PillRow({
  items,
  tone,
}: {
  items: (string | CourseTool)[];
  tone: "indigo" | "sky";
}) {
  const toneClass =
    tone === "indigo"
      ? "bg-indigo-500/12 text-indigo-200 border-indigo-400/20"
      : "bg-sky-500/12 text-sky-200 border-sky-400/20";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={i}
          title={pillDescription(item)}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClass}`}
        >
          {pillLabel(item)}
        </span>
      ))}
    </div>
  );
}

/** Handles both the documented string[] shape and the real {name,
 *  description} object shape tools_and_technologies turned out to use —
 *  see the comment on CourseSummary in lib/types.ts. */
function pillLabel(item: string | CourseTool): string {
  return typeof item === "string" ? item : item.name;
}

function pillDescription(item: string | CourseTool): string | undefined {
  return typeof item === "string" ? undefined : item.description || undefined;
}