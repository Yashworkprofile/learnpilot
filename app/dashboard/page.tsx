"use client";

import { AlertTriangle, Database, FlaskConical, RefreshCw } from "lucide-react";
import { useCourse } from "@/hooks/useCourse";
import { useProgress } from "@/hooks/useProgress";
import { useAppMode } from "@/context/AppModeContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { UpNextCard } from "@/components/dashboard/UpNextCard";
import { CompletionOverview } from "@/components/dashboard/CompletionOverview";
import { ModuleCompletion } from "@/components/dashboard/ModuleCompletion";
import { SectionAccordion } from "@/components/dashboard/SectionAccordion";

export default function DashboardPage() {
  const { activeCourse } = useCourse();
  const { mode } = useAppMode();
  const { data, loading, error, refetch } = useProgress();
  const isDemo = mode === "demo";

  return (
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-5 gap-3 px-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Learning Analytics
            </h1>
            {isDemo && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-amber-500/15 border border-amber-500/20 text-amber-300">
                <FlaskConical className="h-3 w-3" />
                Demo
              </span>
            )}
          </div>
          <p className="text-sm text-white/45 mt-1">
            Tracking{" "}
            <span className="text-indigo-300 font-medium">
              {activeCourse.title}
            </span>
            .
          </p>
        </div>
        {data && !isDemo && (
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full glass-soft px-3 py-1.5 text-white/60">
              <Database className="h-3.5 w-3.5 text-indigo-300" />
              {data.progress.total_sections} sections
            </span>
            <button
              onClick={refetch}
              className="inline-flex items-center gap-1.5 rounded-full glass-soft px-3 py-1.5 text-white/60 hover:text-white transition"
            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-300" /> Refresh
            </button>
          </div>
        )}
        {data && isDemo && (
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full glass-soft px-3 py-1.5 text-white/60">
              <Database className="h-3.5 w-3.5 text-indigo-300" />
              {data.progress.total_sections} sections
            </span>
          </div>
        )}
      </div>

      {loading && <DashboardSkeleton />}

      {!loading && error && (
        <GlassCard
          animate
          className="flex flex-col items-center text-center gap-3 py-16 px-8"
        >
          <AlertTriangle className="h-8 w-8 text-amber-300" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white">
              Couldn&rsquo;t load progress
            </h2>
            <p className="text-xs text-white/45 max-w-sm">{error}</p>
          </div>
          {!isDemo && (
            <button
              onClick={refetch}
              className="mt-1 inline-flex items-center gap-2 rounded-xl grad-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition glow"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          )}
        </GlassCard>
      )}

      {!loading && !error && data && (
        <>
          <KpiCards progress={data.progress} />
          <UpNextCard
            currentPosition={data.progress.current_position}
            sections={data.sections}
            lectureId={(() => {
              const cp = data.progress.current_position;
              if (!cp) return null;
              for (const sec of data.sections) {
                const sub = sec.subsections.find(
                  (s) => s.title === cp.subsection_title
                );
                if (sub) return sub.lecture_id;
              }
              return null;
            })()}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            <CompletionOverview progress={data.progress} />
            <ModuleCompletion sections={data.sections} />
          </div>
          <SectionAccordion sections={data.sections} />
        </>
      )}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-label="Loading progress">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass rounded-2xl h-36" />
        ))}
      </div>
      <div className="glass-strong rounded-2xl h-20" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="glass rounded-2xl h-56" />
        <div className="glass rounded-2xl h-56" />
      </div>
      <div className="glass rounded-2xl h-40" />
    </div>
  );
}
