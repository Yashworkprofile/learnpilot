"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useCourse } from "@/hooks/useCourse";
import { useLectures } from "@/hooks/useLectures";
import { useTranscript } from "@/hooks/useTranscript";
import { GlassCard } from "@/components/ui/GlassCard";
import { LectureFileTree } from "@/components/transcripts/LectureFileTree";
import { TranscriptReader } from "@/components/transcripts/TranscriptReader";

interface ViewMeta {
  lectureId: number;
  /** Whether the lectures list already showed this as cached at the
   *  moment it was selected — captured before the fetch can patch that
   *  flag locally, so the badge reflects what actually just happened. */
  cachedAtSelection: boolean;
  forced: boolean;
}

export default function TranscriptsPage() {
  const { activeCourse } = useCourse();
  const { data, loading, error, refetch, markLectureCached } = useLectures();

  const [selectedLectureId, setSelectedLectureId] = useState<number | null>(null);
  const [viewMeta, setViewMeta] = useState<ViewMeta | null>(null);
  const [trackedCourseId, setTrackedCourseId] = useState(activeCourse.id);

  // Clear selection when the active course changes, instead of resetting
  // it inside an effect — same render-time pattern used by the
  // data-fetching hooks (see hooks/useProgress.tsx).
  if (trackedCourseId !== activeCourse.id) {
    setTrackedCourseId(activeCourse.id);
    setSelectedLectureId(null);
    setViewMeta(null);
  }

  const transcriptState = useTranscript(selectedLectureId, markLectureCached);
  const selectedLecture =
    data?.lectures.find((l) => l.lecture_id === selectedLectureId) ?? null;

  function handleSelect(lectureId: number) {
    const lecture = data?.lectures.find((l) => l.lecture_id === lectureId);
    setSelectedLectureId(lectureId);
    setViewMeta({
      lectureId,
      cachedAtSelection: lecture?.cached ?? false,
      forced: false,
    });
  }

  function handleForceRefresh() {
    if (selectedLectureId !== null) {
      setViewMeta((prev) =>
        prev && prev.lectureId === selectedLectureId
          ? { ...prev, forced: true }
          : prev
      );
    }
    transcriptState.refresh();
  }

  const source: "cache" | "fresh" | null =
    !viewMeta ||
    viewMeta.lectureId !== selectedLectureId ||
    transcriptState.loading ||
    !transcriptState.data
      ? null
      : viewMeta.forced || !viewMeta.cachedAtSelection
      ? "fresh"
      : "cache";

  return (
    <section className="h-full flex flex-col">
      <div className="px-1 mb-5 shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Transcripts
        </h1>
        <p className="text-sm text-white/45 mt-1">
          Browse cached lecture transcripts for{" "}
          <span className="text-indigo-300 font-medium">
            {activeCourse.title}
          </span>
          .
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
        <div className="flex-1 flex gap-3 min-h-0">
          <LectureFileTree
            lectures={data.lectures}
            selectedLectureId={selectedLectureId}
            onSelect={handleSelect}
            onRefresh={refetch}
          />
          <TranscriptReader
            selectedLecture={selectedLecture}
            transcript={transcriptState.data}
            loading={transcriptState.loading}
            error={transcriptState.error}
            onRefresh={handleForceRefresh}
            source={source}
          />
        </div>
      )}
    </section>
  );
}
