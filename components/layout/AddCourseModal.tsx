"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, BookPlus, Loader2, X } from "lucide-react";
// AlertTriangle kept for the slow-warning block below
import { fetchProgress } from "@/lib/api";
import { useCourse } from "@/hooks/useCourse";
import { useRouter } from "next/navigation";

interface AddCourseModalProps {
  onClose: () => void;
}

type Phase =
  | { type: "idle" }
  | { type: "loading"; slowWarning: boolean }
  | { type: "error"; message: string };

export function AddCourseModal({ onClose }: AddCourseModalProps) {
  const { addCourse, hasCourse, setActiveCourseId } = useCourse();
  const router = useRouter();

  const [courseId, setCourseId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [phase, setPhase] = useState<Phase>({ type: "idle" });

  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Cleanup timers/abort on unmount
  useEffect(() => {
    return () => {
      slowTimerRef.current && clearTimeout(slowTimerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  async function handleSubmit() {
    const id = courseId.trim();
    if (!id) return;

    // Already added — just switch to it
    if (hasCourse(id)) {
      setActiveCourseId(id);
      router.push("/dashboard");
      onClose();
      return;
    }

    setPhase({ type: "loading", slowWarning: false });

    // After 10 s, show the "this is taking a while" warning
    slowTimerRef.current = setTimeout(() => {
      setPhase((p) =>
        p.type === "loading" ? { type: "loading", slowWarning: true } : p
      );
    }, 10_000);

    abortRef.current = new AbortController();

    try {
      const progress = await fetchProgress(id);
      clearTimeout(slowTimerRef.current!);

      const title = customTitle.trim() || progress.course_title;
      // Derive a subtitle from the title — take everything after the first colon
      // if present, otherwise leave blank.
      const colonIdx = title.indexOf(":");
      const subtitle =
        colonIdx > -1
          ? title.slice(colonIdx + 1).trim()
          : progress.course_title !== title
          ? progress.course_title
          : "";

      addCourse({ id, title, subtitle });
      setActiveCourseId(id);
      router.push("/dashboard");
      onClose();
    } catch (err) {
      clearTimeout(slowTimerRef.current!);
      const message =
        err instanceof Error ? err.message : "Couldn't reach the API.";
      setPhase({ type: "error", message });
    }
  }

  const loading = phase.type === "loading";
  const canSubmit = courseId.trim().length > 0 && !loading;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(7,7,16,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-strong rounded-2xl w-full max-w-md shadow-2xl fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl grad-accent flex items-center justify-center shrink-0">
              <BookPlus className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Add New Course</p>
              <p className="text-[11px] text-white/40">
                Enter your Udemy course ID to get started
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg glass-soft flex items-center justify-center text-white/40 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Course ID */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
              Course ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                if (phase.type === "error") setPhase({ type: "idle" });
              }}
              onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
              disabled={loading}
              placeholder="e.g. 6100015"
              className="w-full rounded-xl glass-soft px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 disabled:opacity-50 transition"
            />
            <p className="text-[11px] text-white/30">
              Find it in the Udemy course URL: udemy.com/course/…/?courseId=<span className="text-white/50">XXXXXX</span>
            </p>
          </div>

          {/* Custom display name (optional) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
              Display Name <span className="text-white/25">(optional)</span>
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
              disabled={loading}
              placeholder="Leave blank to use the course title from Udemy"
              className="w-full rounded-xl glass-soft px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 disabled:opacity-50 transition"
            />
          </div>

          {/* Slow-load warning */}
          {phase.type === "loading" && phase.slowWarning && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-200">
                  This is taking a while…
                </p>
                <p className="text-[11px] text-amber-200/60">
                  Udemy might be slow right now or the course ID may not exist.
                  You can wait or close and try again.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {phase.type === "error" && (
            <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-4 flex flex-col items-center text-center gap-2">
              <span className="text-3xl select-none">😬</span>
              <p className="text-sm font-semibold text-rose-200">
                Uh-oh — no course found!
              </p>
              <p className="text-[11px] text-rose-200/55 max-w-xs leading-relaxed">
                We couldn&rsquo;t find a course with that ID. Double-check the
                number from the Udemy URL and make sure your backend is running.
              </p>
              <p className="text-[10px] text-rose-300/35 font-mono mt-0.5">
                {phase.message}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl glass-soft px-4 py-2 text-sm text-white/55 hover:text-white transition disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-xl grad-accent glow px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </>
            ) : (
              "Add Course"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}