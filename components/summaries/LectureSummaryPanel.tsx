"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BookMarked,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Gauge,
  Hash,
  Lightbulb,
  ListChecks,
  Quote,
  RefreshCw,
  Scale,
  Sparkles,
  Terminal,
  Wand2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type {
  LectureSummary,
  SummaryDifficulty,
  SummaryStatusItem,
} from "@/lib/types";

interface LectureSummaryPanelProps {
  selectedLecture: SummaryStatusItem | null;
  summary: LectureSummary | null;
  loading: boolean;
  error: string | null;
  onGenerate: (refresh?: boolean) => void;
}

export function LectureSummaryPanel({
  selectedLecture,
  summary,
  loading,
  error,
  onGenerate,
}: LectureSummaryPanelProps) {
  if (!selectedLecture) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 glass rounded-2xl py-24 px-8">
        <Sparkles className="h-8 w-8 text-white/15" />
        <p className="text-sm font-semibold text-white">Pick a lecture</p>
        <p className="text-xs text-white/40 max-w-xs">
          Select any lecture from the list to view or generate its AI
          summary.
        </p>
      </div>
    );
  }

  const showCards = !loading && !error && summary && summary.available;

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      {/* Page-style header — not a card, matches the reference design */}
      <div className="flex items-start justify-between gap-3 px-1 pb-4 shrink-0">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white truncate">
            {selectedLecture.title}
          </h2>
          <p className="text-xs text-white/40 mt-0.5 truncate">
            {selectedLecture.section_title} · Lecture{" "}
            {selectedLecture.lecture_number}
          </p>
        </div>

        {showCards && (
          <div className="shrink-0 flex items-center gap-2">
            <DifficultyBadge difficulty={summary.difficulty} />
            <button
              onClick={() => onGenerate(true)}
              className="inline-flex items-center gap-1.5 rounded-xl glass-soft px-3 py-2 text-xs font-medium text-white/70 hover:text-white transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </button>
          </div>
        )}
      </div>

      {/* Scroll region */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!summary && !loading && !error && (
          <GlassCard className="px-8 py-16">
            <PromptState
              cached={selectedLecture.summary_cached}
              onGenerate={() => onGenerate(false)}
            />
          </GlassCard>
        )}

        {loading && (
          <GlassCard className="px-8 py-16">
            <GeneratingState />
          </GlassCard>
        )}

        {!loading && error && (
          <GlassCard className="px-8 py-16">
            <ErrorState error={error} onRetry={() => onGenerate(false)} />
          </GlassCard>
        )}

        {!loading && !error && summary && !summary.available && (
          <GlassCard className="px-8 py-16">
            <p className="text-sm text-white/45 text-center">
              No transcript is available for this lecture, so a summary
              couldn&rsquo;t be generated.
            </p>
          </GlassCard>
        )}

        {showCards && (
          <SummaryDetail key={selectedLecture.lecture_id} summary={summary} />
        )}
      </div>
    </div>
  );
}

function PromptState({
  cached,
  onGenerate,
}: {
  cached: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 max-w-sm mx-auto">
      <div className="h-10 w-10 rounded-xl glass-soft flex items-center justify-center">
        <Sparkles className="h-5 w-5 text-indigo-300" />
      </div>
      <p className="text-sm font-semibold text-white">
        {cached ? "Summary ready" : "No summary yet"}
      </p>
      <p className="text-xs text-white/45">
        {cached
          ? "This lecture already has a cached summary — load it below."
          : "Groq will read the transcript and pull out key concepts, commands, and action items."}
      </p>
      <button
        onClick={onGenerate}
        className="mt-1 inline-flex items-center gap-2 rounded-xl grad-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition glow"
      >
        <Wand2 className="h-4 w-4" />
        {cached ? "View Summary" : "Generate Summary"}
      </button>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <Sparkles className="h-7 w-7 text-indigo-300 animate-pulse" />
      <p className="text-sm font-medium text-white/70">
        Reading the transcript&hellip;
      </p>
      <p className="text-xs text-white/35">This can take a few seconds.</p>
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
    <div className="flex flex-col items-center text-center gap-3">
      <AlertTriangle className="h-7 w-7 text-amber-300" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">
          Couldn&rsquo;t generate this summary
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

/** The loaded view — a stack of distinct cards rather than one tall pane,
 *  so this tab doesn't read as a reskin of Transcripts/Workspace's single
 *  content pane. Keyed by lecture_id at the call site so switching
 *  lectures (or regenerating, see ActionItemsCard's own key below) starts
 *  clean rather than carrying over stale interactive state. */
function SummaryDetail({ summary }: { summary: LectureSummary }) {
  const hasMoreDetails =
    summary.important_terms.length > 0 ||
    summary.specific_details.numbers_and_specs.length > 0 ||
    summary.specific_details.urls_and_resources.length > 0 ||
    summary.specific_details.comparisons.length > 0 ||
    summary.instructor_emphasis.length > 0;

  return (
    <div className="max-w-3xl space-y-4 pb-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full glass-soft px-2.5 py-1 text-[11px] font-medium text-white/55">
          <Clock className="h-3 w-3" />
          ~{summary.estimated_review_time_minutes} min review
        </span>
      </div>

      <p className="text-[15px] leading-relaxed text-white/75">
        {summary.summary}
      </p>

      {summary.key_concepts.length > 0 && (
        <GlassCard className="px-5 py-5">
          <SectionLabel icon={Lightbulb}>Key Concepts</SectionLabel>
          <ul className="space-y-2">
            {summary.key_concepts.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-white/75 leading-snug"
              >
                <span className="h-1 w-1 rounded-full bg-indigo-300/70 shrink-0 mt-2" />
                {c}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {summary.specific_details.commands.length > 0 && (
        <GlassCard className="px-5 py-5">
          <SectionLabel icon={Terminal}>Commands</SectionLabel>
          <div className="rounded-xl bg-black/40 border border-white/8 overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/8">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="ml-2 text-[10px] font-mono text-white/25 uppercase tracking-wider">
                terminal
              </span>
            </div>
            <div className="px-4 py-3 space-y-2">
              {summary.specific_details.commands.map((cmd, i) => (
                <div key={i} className="text-xs font-mono text-emerald-300/90">
                  <span className="text-white/20 mr-2 select-none">$</span>
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {summary.what_you_learned.length > 0 && (
        <ActionItemsCard
          key={`${summary.lecture_id}-${summary.what_you_learned.length}`}
          lectureId={summary.lecture_id}
          items={summary.what_you_learned}
        />
      )}

      {hasMoreDetails && <MoreDetailsSection summary={summary} />}
    </div>
  );
}

function ActionItemsCard({
  lectureId,
  items,
}: {
  lectureId: number;
  items: string[];
}) {
  const [completed, setCompleted] = useState<boolean[]>(() =>
    loadCompleted(lectureId, items.length)
  );

  function toggle(i: number) {
    setCompleted((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      saveCompleted(lectureId, next);
      return next;
    });
  }

  const doneCount = completed.filter(Boolean).length;

  return (
    <GlassCard className="px-5 py-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-white/45 uppercase tracking-wider">
          <ListChecks className="h-3.5 w-3.5" />
          Action Items
        </h4>
        <span className="text-[10px] font-mono text-white/30">
          {doneCount}/{items.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const done = completed[i] ?? false;
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="w-full flex items-start gap-2.5 rounded-xl glass-soft px-3.5 py-2.5 text-left transition hover:bg-white/[0.06]"
            >
              <span
                className={`mt-0.5 h-4 w-4 rounded-md border shrink-0 flex items-center justify-center transition ${
                  done
                    ? "bg-indigo-500 border-indigo-400"
                    : "border-white/20"
                }`}
              >
                {done && <Check className="h-3 w-3 text-white" />}
              </span>
              <span
                className={`text-sm leading-snug transition ${
                  done ? "text-white/35 line-through" : "text-white/75"
                }`}
              >
                {item}
              </span>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

function MoreDetailsSection({ summary }: { summary: LectureSummary }) {
  const [open, setOpen] = useState(false);

  return (
    <GlassCard className="overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <span className="text-xs font-semibold text-white/55 uppercase tracking-wider">
          More from this lecture
        </span>
        <ChevronDown
          className={`h-4 w-4 text-white/30 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: open ? "3000px" : "0px" }}
      >
        <div className="px-5 pb-5 space-y-5 border-t border-white/8 pt-5">
          {summary.important_terms.length > 0 && (
            <div>
              <SectionLabel icon={BookMarked}>Important Terms</SectionLabel>
              <div className="space-y-2.5">
                {summary.important_terms.map((t, i) => (
                  <div key={i} className="rounded-xl glass-soft px-4 py-3">
                    <p className="text-sm font-semibold text-white">
                      {t.term}
                    </p>
                    <p className="text-xs text-white/55 mt-1 leading-relaxed">
                      {t.definition}
                    </p>
                    {t.example && (
                      <p className="text-[11px] text-white/35 mt-1.5 italic">
                        e.g. {t.example}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.specific_details.numbers_and_specs.length > 0 && (
            <div>
              <SectionLabel icon={Hash}>Numbers &amp; Specs</SectionLabel>
              <ul className="space-y-1">
                {summary.specific_details.numbers_and_specs.map((n, i) => (
                  <li key={i} className="text-sm text-white/65 font-mono">
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.specific_details.urls_and_resources.length > 0 && (
            <div>
              <SectionLabel icon={ExternalLink}>Resources</SectionLabel>
              <ul className="space-y-1">
                {summary.specific_details.urls_and_resources.map((u, i) => (
                  <li key={i} className="text-sm text-sky-300/80 truncate">
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.specific_details.comparisons.length > 0 && (
            <div>
              <SectionLabel icon={Scale}>Comparisons</SectionLabel>
              <ul className="space-y-1.5">
                {summary.specific_details.comparisons.map((c, i) => (
                  <li key={i} className="text-sm text-white/65 leading-snug">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.instructor_emphasis.length > 0 && (
            <div>
              <SectionLabel icon={Quote}>Instructor Emphasis</SectionLabel>
              <div className="space-y-2">
                {summary.instructor_emphasis.map((e, i) => (
                  <p
                    key={i}
                    className="text-sm text-white/60 italic leading-relaxed border-l-2 border-indigo-400/30 pl-3"
                  >
                    {e}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: typeof Lightbulb;
  children: string;
}) {
  return (
    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-white/45 uppercase tracking-wider mb-3">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </h4>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: SummaryDifficulty }) {
  const config: Record<SummaryDifficulty, { label: string; cls: string }> = {
    beginner: {
      label: "Difficulty: Easy",
      cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
    },
    intermediate: {
      label: "Difficulty: Medium",
      cls: "bg-amber-500/15 text-amber-300 border-amber-400/20",
    },
    advanced: {
      label: "Difficulty: Hard",
      cls: "bg-rose-500/15 text-rose-300 border-rose-400/20",
    },
  };
  const { label, cls } = config[difficulty] ?? config.beginner;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${cls}`}
    >
      <Gauge className="h-3 w-3" />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------
// Action-item checkbox state — persisted to localStorage, same pattern as
// the Workspace tab's notes (workspace:notes:{lecture_id}). Keyed by
// lecture_id; the ActionItemsCard above is additionally keyed by item
// count so a regenerate that changes the list resets cleanly instead of
// reusing stale indices.
// ---------------------------------------------------------------------

function actionItemsKey(lectureId: number): string {
  return `summaries:action-items:${lectureId}`;
}

function loadCompleted(lectureId: number, count: number): boolean[] {
  if (typeof window === "undefined") return new Array(count).fill(false);
  try {
    const raw = window.localStorage.getItem(actionItemsKey(lectureId));
    if (!raw) return new Array(count).fill(false);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== count) {
      return new Array(count).fill(false);
    }
    return parsed;
  } catch {
    return new Array(count).fill(false);
  }
}

function saveCompleted(lectureId: number, completed: boolean[]) {
  try {
    window.localStorage.setItem(
      actionItemsKey(lectureId),
      JSON.stringify(completed)
    );
  } catch {
    // localStorage unavailable (private browsing, quota) — fail silently,
    // same as the notes pane in WorkspacePanel.
  }
}
