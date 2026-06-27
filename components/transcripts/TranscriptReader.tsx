import { AlertTriangle, Database, RefreshCw, Zap } from "lucide-react";
import type { LectureListItem, TranscriptResponse } from "@/lib/types";

interface TranscriptReaderProps {
  selectedLecture: LectureListItem | null;
  transcript: TranscriptResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  /** "cache" if this view was served from the backend's existing cache,
   *  "fresh" if it was just pulled live (first fetch or a forced refresh).
   *  null while there's nothing to report yet. */
  source: "cache" | "fresh" | null;
}

export function TranscriptReader({
  selectedLecture,
  transcript,
  loading,
  error,
  onRefresh,
  source,
}: TranscriptReaderProps) {
  if (!selectedLecture) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 min-w-0 glass rounded-2xl py-24 px-8">
        <p className="text-sm font-semibold text-white">Select a lecture</p>
        <p className="text-xs text-white/45 max-w-xs">
          Pick any lecture from the list on the left to view its transcript.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/8 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white truncate">
              {selectedLecture.title}
            </h2>
            {source && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${
                  source === "cache"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-indigo-500/15 text-indigo-300"
                }`}
              >
                {source === "cache" ? (
                  <>
                    <Database className="h-3 w-3" /> From cache
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3" /> Freshly fetched
                  </>
                )}
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/40 mt-0.5 truncate">
            {selectedLecture.section_title} · Lecture{" "}
            {selectedLecture.lecture_number}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl glass-soft px-3 py-2 text-xs font-medium text-white/70 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Force Refresh
        </button>
      </div>

      <article className="flex-1 overflow-y-auto px-8 py-6">
        {loading && <TranscriptSkeleton />}

        {!loading && error && (
          <div className="flex flex-col items-center text-center gap-3 py-16">
            <AlertTriangle className="h-7 w-7 text-amber-300" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                Couldn&rsquo;t load this transcript
              </p>
              <p className="text-xs text-white/45 max-w-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && transcript && !transcript.available && (
          <p className="text-sm text-white/45 text-center py-16">
            No transcript is available for this lecture yet.
          </p>
        )}

        {!loading && !error && transcript && transcript.available && (
          <div className="max-w-3xl text-[15px] leading-relaxed text-white/75 whitespace-pre-wrap">
            {transcript.transcript}
          </div>
        )}
      </article>
    </div>
  );
}

function TranscriptSkeleton() {
  return (
    <div className="space-y-3 max-w-2xl animate-pulse" aria-label="Loading transcript">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-4 rounded bg-white/5"
          style={{ width: `${85 - i * 6}%` }}
        />
      ))}
    </div>
  );
}
