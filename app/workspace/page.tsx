"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useCourse } from "@/hooks/useCourse";
import { useLectures } from "@/hooks/useLectures";
import { useTranscript } from "@/hooks/useTranscript";
import { useAppMode } from "@/context/AppModeContext";
import { useDemoProgress } from "@/context/DemoProgressContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { LecturePicker } from "@/components/workspace/LecturePicker";
import { WorkspacePanel } from "@/components/workspace/WorkspacePanel";

// useSearchParams() requires a Suspense boundary in Next.js App Router.
// Split into an inner component so the boundary can wrap just that part.
function WorkspaceInner() {
  const { activeCourse } = useCourse();
  const { mode } = useAppMode();
  const { markComplete } = useDemoProgress();
  const { data, loading, error, refetch } = useLectures();
  const searchParams = useSearchParams();

  const [selectedLectureId, setSelectedLectureId] = useState<number | null>(null);
  const [trackedCourseId, setTrackedCourseId] = useState(activeCourse.id);
  const [appliedParam, setAppliedParam] = useState(false);

  // Once lectures have loaded, apply the ?lecture_id= param exactly once.
  // Doing it here (after data loads) rather than in useState init guarantees
  // the param is actually read — searchParams can be null on first render.
  useEffect(() => {
    if (appliedParam || !data) return;
    const param = searchParams.get("lecture_id");
    if (param) {
      const id = parseInt(param, 10);
      // Only select if the lecture actually exists in this course
      const exists = data.lectures.some((l) => l.lecture_id === id);
      if (exists) setSelectedLectureId(id);
    }
    setAppliedParam(true);
  }, [data, appliedParam, searchParams]);

  // Clear selection when course switches (render-time pattern)
  if (trackedCourseId !== activeCourse.id) {
    setTrackedCourseId(activeCourse.id);
    setSelectedLectureId(null);
    setAppliedParam(false);
  }

  const transcriptState = useTranscript(selectedLectureId);
  const selectedLecture =
    data?.lectures.find((l) => l.lecture_id === selectedLectureId) ?? null;

  // Next-lecture navigation
  const currentIndex = data
    ? data.lectures.findIndex((l) => l.lecture_id === selectedLectureId)
    : -1;
  const isLastLecture = currentIndex >= 0 && data
    ? currentIndex === data.lectures.length - 1
    : false;

  function handleNext() {
    if (!data || currentIndex < 0 || currentIndex >= data.lectures.length - 1) return;
    // In demo mode, mark the current lecture as completed before advancing
    if (mode === "demo" && selectedLectureId !== null) {
      markComplete(selectedLectureId);
    }
    setSelectedLectureId(data.lectures[currentIndex + 1].lecture_id);
  }

  return (
    <section className="lg:h-full lg:flex lg:flex-col">
      <div className="px-1 mb-5 shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Lecture Workspace
        </h1>
        <p className="text-sm text-white/45 mt-1">
          Read transcripts and write notes for{" "}
          <span className="text-indigo-300 font-medium">
            {activeCourse.title}
          </span>
          . Notes are saved automatically.
        </p>
      </div>

      {loading && (
        <div className="flex-1 grid place-items-center">
          <p className="text-sm text-white/40">Loading lectures…</p>
        </div>
      )}

      {!loading && error && (
        <GlassCard
          animate
          className="flex flex-col items-center text-center gap-3 py-16 px-8"
        >
          <AlertTriangle className="h-8 w-8 text-amber-300" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white">
              Couldn&rsquo;t load lectures
            </h2>
            <p className="text-xs text-white/45 max-w-sm">{error}</p>
          </div>
          <button
            onClick={refetch}
            className="mt-1 inline-flex items-center gap-2 rounded-xl grad-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition glow"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </GlassCard>
      )}

      {!loading && !error && data && (
        <div className="flex flex-col lg:flex-row gap-3 lg:flex-1 lg:min-h-0">
          <LecturePicker
            lectures={data.lectures}
            selectedLectureId={selectedLectureId}
            onSelect={setSelectedLectureId}
          />
          <WorkspacePanel
            selectedLecture={selectedLecture}
            transcript={transcriptState.data}
            loading={transcriptState.loading}
            error={transcriptState.error}
            onRefresh={transcriptState.refresh}
            onNext={selectedLectureId !== null ? handleNext : undefined}
            isLastLecture={isLastLecture}
          />
        </div>
      )}
    </section>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense>
      <WorkspaceInner />
    </Suspense>
  );
}