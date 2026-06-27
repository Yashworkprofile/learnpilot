"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  FileType2,
  RefreshCw,
  ScrollText,
} from "lucide-react";
import type { LectureListItem, TranscriptResponse } from "@/lib/types";

// ---- PDF path convention -----------------------------------------------
// Drop PDFs at:  public/pdfs/{lecture_id}.pdf
// They're served as static assets by Next.js / Vercel — no backend needed.
// The frontend checks at mount time whether the file actually exists (HEAD
// request); if yes it shows the PDF viewer, otherwise falls back to the
// transcript.

function pdfUrl(lectureId: number) {
  return `/pdfs/${lectureId}.pdf`;
}

// ---- localStorage helpers ----------------------------------------------

function notesKey(lectureId: number) {
  return `workspace:notes:${lectureId}`;
}

function loadNotes(lectureId: number): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(notesKey(lectureId)) ?? "";
  } catch {
    return "";
  }
}

function saveNotes(lectureId: number, text: string) {
  try {
    localStorage.setItem(notesKey(lectureId), text);
  } catch {
    // localStorage may be unavailable in some contexts — fail silently.
  }
}

// ---- Types -------------------------------------------------------------

type SaveStatus = "idle" | "saved";
type SourceMode = "checking" | "pdf" | "transcript";

// ---- EmptyState --------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 glass rounded-2xl py-24 px-8">
      <FileText className="h-8 w-8 text-white/15" />
      <p className="text-sm font-semibold text-white">Pick a lecture</p>
      <p className="text-xs text-white/40 max-w-xs">
        Select any lecture from the list to view its content and write your
        notes alongside.
      </p>
    </div>
  );
}

// ---- TranscriptSkeleton ------------------------------------------------

function TranscriptSkeleton() {
  return (
    <div className="space-y-3 max-w-2xl animate-pulse" aria-label="Loading transcript">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-3.5 rounded bg-white/5"
          style={{ width: `${90 - i * 5}%` }}
        />
      ))}
    </div>
  );
}

// ---- WorkspacePanel (public shell) -------------------------------------

interface WorkspacePanelProps {
  selectedLecture: LectureListItem | null;
  transcript: TranscriptResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  /** Called when the user clicks Next — moves to the following lecture. */
  onNext?: () => void;
  /** True when there is no next lecture (last in list). */
  isLastLecture?: boolean;
}

export function WorkspacePanel({
  selectedLecture,
  transcript,
  loading,
  error,
  onRefresh,
  onNext,
  isLastLecture,
}: WorkspacePanelProps) {
  if (!selectedLecture) return <EmptyState />;

  return (
    <WorkspacePanelInner
      key={selectedLecture.lecture_id}
      selectedLecture={selectedLecture}
      transcript={transcript}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      onNext={onNext}
      isLastLecture={isLastLecture}
    />
  );
}

// ---- WorkspacePanelInner (keyed — fully remounts on lecture change) ----

function WorkspacePanelInner({
  selectedLecture,
  transcript,
  loading,
  error,
  onRefresh,
  onNext,
  isLastLecture,
}: WorkspacePanelProps & { selectedLecture: LectureListItem }) {
  const [notes, setNotes] = useState(() => loadNotes(selectedLecture.lecture_id));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check once at mount whether a PDF exists for this lecture.
  // HEAD request is cheap — no body downloaded. Falls back to transcript
  // if the file isn't there or the fetch itself fails.
  const [sourceMode, setSourceMode] = useState<SourceMode>("checking");

  useEffect(() => {
    let cancelled = false;
    fetch(pdfUrl(selectedLecture.lecture_id), { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        setSourceMode(res.ok ? "pdf" : "transcript");
      })
      .catch(() => {
        if (!cancelled) setSourceMode("transcript");
      });
    return () => { cancelled = true; };
  }, [selectedLecture.lecture_id]);

  // Debounced autosave — 800 ms after the user stops typing.
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveNotes(selectedLecture.lecture_id, notes);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [notes, selectedLecture.lecture_id]);

  const url = pdfUrl(selectedLecture.lecture_id);
  const showPdf = sourceMode === "pdf";
  const showTranscript = sourceMode === "transcript";
  const checkingSource = sourceMode === "checking";

  return (
    <div className="flex-1 flex flex-col min-w-0 gap-3 min-h-0">
      {/* ---- Content pane (PDF or Transcript) -------------------------- */}
      <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden min-h-0">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/8 shrink-0">
          <div className="min-w-0 flex items-center gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white truncate">
                  {selectedLecture.title}
                </h2>
                {/* Source badge — shown once we know which mode we're in */}
                {showPdf && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 bg-sky-500/15 text-sky-300">
                    <FileType2 className="h-3 w-3" /> PDF
                  </span>
                )}
                {showTranscript && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 bg-white/8 text-white/40">
                    <ScrollText className="h-3 w-3" /> Transcript
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/40 mt-0.5 truncate">
                {selectedLecture.section_title} · Lecture{" "}
                {selectedLecture.lecture_number}
              </p>
            </div>
          </div>

          {/* Refresh only makes sense for the transcript */}
          {showTranscript && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl glass-soft px-3 py-2 text-xs font-medium text-white/70 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          )}

          {/* PDF: open-in-tab link */}
          {showPdf && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl glass-soft px-3 py-2 text-xs font-medium text-white/70 hover:text-white transition"
            >
              <FileType2 className="h-3.5 w-3.5" /> Open PDF
            </a>
          )}

          {/* Next lecture button */}
          {onNext && (
            <button
              onClick={onNext}
              disabled={isLastLecture}
              title={isLastLecture ? "No more lectures" : "Next lecture"}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl grad-accent px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition glow disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-hidden">

          {/* While we're checking for the PDF, show the transcript skeleton
              so the pane doesn't flash blank */}
          {checkingSource && (
            <div className="px-8 py-6">
              <TranscriptSkeleton />
            </div>
          )}

          {/* PDF viewer — native browser embed */}
          {showPdf && (
            <iframe
              src={url}
              title={selectedLecture.title}
              className="w-full border-0 rounded-xl bg-white/[0.02] pdf-iframe"
            />
          )}

          {/* Transcript viewer */}
          {showTranscript && (
            <article className="h-full overflow-y-auto px-8 py-6">
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
          )}
        </div>
      </div>

      {/* ---- Notes pane ------------------------------------------------ */}
      <div className="glass rounded-2xl flex flex-col shrink-0" style={{ height: "220px" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 shrink-0">
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            My Notes
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-medium transition-opacity duration-300 ${
              saveStatus === "saved"
                ? "text-emerald-300 opacity-100"
                : "opacity-0"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" /> Saved
          </span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down anything — key points, questions, things to revisit…"
          className="flex-1 w-full resize-none bg-transparent px-5 py-3 text-sm text-white/75 placeholder:text-white/20 focus:outline-none font-mono leading-relaxed"
        />
      </div>
    </div>
  );
}