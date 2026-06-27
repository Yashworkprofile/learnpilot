"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CircleCheck,
  CircleDashed,
  Library,
  MessageSquareText,
  Trash2,
} from "lucide-react";
import { useCourse } from "@/hooks/useCourse";
import { useChat } from "@/hooks/useChat";
import { useIndexStatus } from "@/hooks/useIndexStatus";
import { useSummaryStatus } from "@/hooks/useSummaryStatus";
import { ChatComposer } from "@/components/chat/ChatComposer";
import {
  ChatMessageBubble,
  TypingIndicator,
} from "@/components/chat/ChatMessageBubble";
import type { SummaryStatusItem } from "@/lib/types";

const SUGGESTIONS = [
  "Summarize the first lecture",
  "What tools does this course use?",
  "Quiz me on what I've learned so far",
];

// ── Coverage computation ────────────────────────────────────────────────────
//
// "Indexed" means summary_cached === true, since the RAG index is built
// from summaries via chunking.py. We walk the ordered lecture list and find
// the last contiguous run of cached lectures — that's our coverage boundary.
//
// Returns null if nothing is indexed yet.

interface CoverageInfo {
  /** The last lecture that is part of the contiguous indexed run. */
  lastLecture: SummaryStatusItem;
  /** How many sections are *fully* covered (every lecture cached). */
  fullySectionsCovered: number;
  /** How many sections come after the boundary (not yet indexed). */
  sectionsRemaining: number;
  /** Total indexed lecture count. */
  indexedCount: number;
  /** Total lecture count. */
  totalCount: number;
}

function computeCoverage(
  lectures: SummaryStatusItem[]
): CoverageInfo | null {
  if (!lectures.length) return null;

  // Sort by object_index (course order) to be safe.
  const ordered = [...lectures].sort(
    (a, b) => (a.lecture_number ?? 0) - (b.lecture_number ?? 0)
  );

  const indexedCount = ordered.filter((l) => l.summary_cached).length;
  if (indexedCount === 0) return null;

  // Find the last contiguous cached lecture from the start.
  let lastContiguousIdx = -1;
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i].summary_cached) lastContiguousIdx = i;
    else break;
  }

  const lastLecture = ordered[lastContiguousIdx];

  // Group by section to count fully covered / remaining.
  const sectionMap = new Map<string, { total: number; cached: number }>();
  for (const l of ordered) {
    const key = l.section_title;
    if (!sectionMap.has(key)) sectionMap.set(key, { total: 0, cached: 0 });
    const s = sectionMap.get(key)!;
    s.total++;
    if (l.summary_cached) s.cached++;
  }

  // A section is "fully covered" if all its lectures are cached AND it
  // comes entirely before (or at) the boundary section.
  const sections = Array.from(sectionMap.entries());
  const boundarySection = lastLecture.section_title;
  let passedBoundary = false;
  let fullySectionsCovered = 0;
  let sectionsRemaining = 0;

  for (const [title, counts] of sections) {
    if (title === boundarySection) {
      passedBoundary = true;
      // The boundary section itself: only count as fully covered if
      // every lecture in it is cached.
      if (counts.cached === counts.total) fullySectionsCovered++;
      continue;
    }
    if (!passedBoundary) {
      if (counts.cached === counts.total) fullySectionsCovered++;
    } else {
      sectionsRemaining++;
    }
  }

  return {
    lastLecture,
    fullySectionsCovered,
    sectionsRemaining,
    indexedCount,
    totalCount: ordered.length,
  };
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { activeCourse } = useCourse();
  const { messages, loading, sendMessage, retryMessage, clearChat } = useChat();
  const indexStatus = useIndexStatus();
  const summaryStatus = useSummaryStatus();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  function handleSend() {
    const question = draft;
    setDraft("");
    sendMessage(question);
  }

  const indexed = indexStatus.courses?.includes(activeCourse.id) ?? null;
  const coverage = summaryStatus.data
    ? computeCoverage(summaryStatus.data.lectures)
    : null;

  return (
    <section className="h-full flex flex-col min-h-0">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1 mb-4 shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">RAG Chat</h1>
          <p className="text-xs lg:text-sm text-white/45 mt-0.5 truncate">
            Ask questions grounded in {activeCourse.title}&rsquo;s indexed transcripts.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <IndexBadge indexed={indexed} />
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="inline-flex items-center gap-1.5 rounded-xl glass-soft px-3 py-2 text-xs font-medium text-white/55 hover:text-white transition"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Coverage banner ── */}
      {indexed && <CoverageBanner coverage={coverage} loading={summaryStatus.loading} />}

      {/* ── Scrollable message area ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-4 py-4 space-y-5">
          {messages.length === 0 ? (
            <EmptyState courseTitle={activeCourse.title} onSuggestion={setDraft} />
          ) : (
            messages.map((m) => (
              <ChatMessageBubble key={m.id} message={m} onRetry={retryMessage} />
            ))
          )}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Pinned composer ── */}
      <div className="shrink-0 pt-3 pb-1">
        <div className="px-4">
          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            loading={loading}
          />
        </div>
      </div>

    </section>
  );
}

// ── Coverage banner ──────────────────────────────────────────────────────────

function CoverageBanner({
  coverage,
  loading,
}: {
  coverage: CoverageInfo | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="mb-4 shrink-0 rounded-2xl glass-soft px-4 py-3 animate-pulse">
        <div className="h-3 w-48 rounded bg-white/8" />
      </div>
    );
  }

  if (!coverage) return null;

  const { lastLecture, fullySectionsCovered, sectionsRemaining, indexedCount, totalCount } =
    coverage;

  return (
    <div className="mb-4 shrink-0 rounded-2xl glass-soft px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">

      {/* Coverage boundary */}
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <BookOpen className="h-3.5 w-3.5 text-indigo-300 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35 block">
            Coverage up to
          </span>
          <span className="text-xs font-semibold text-white truncate block">
            {lastLecture.title}
          </span>
        </div>
      </div>

      {/* Counts — inline on mobile */}
      <div className="flex items-center gap-3 shrink-0 text-center">
        <div>
          <span className="block text-sm font-bold text-emerald-300 leading-none">{indexedCount}<span className="text-white/25 font-normal text-xs">/{totalCount}</span></span>
          <span className="block text-[9px] uppercase tracking-wider text-white/30 mt-0.5">lectures</span>
        </div>
        <span className="text-white/15 text-xs">·</span>
        <div>
          <span className="block text-sm font-bold text-white/40 leading-none">{sectionsRemaining}</span>
          <span className="block text-[9px] uppercase tracking-wider text-white/30 mt-0.5">remaining</span>
        </div>
      </div>

    </div>
  );
}

// ── Index badge ──────────────────────────────────────────────────────────────

function IndexBadge({ indexed }: { indexed: boolean | null }) {
  if (indexed === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full glass-soft px-3 py-1.5 text-[11px] font-medium text-white/35">
        Checking index&hellip;
      </span>
    );
  }
  if (indexed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
        <CircleCheck className="h-3 w-3" /> Indexed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-300">
      <CircleDashed className="h-3 w-3" /> Not indexed yet
    </span>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  courseTitle,
  onSuggestion,
}: {
  courseTitle: string;
  onSuggestion: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-8 lg:py-20">
      <div className="h-12 w-12 rounded-2xl glass-soft flex items-center justify-center">
        <MessageSquareText className="h-6 w-6 text-indigo-300" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">No messages yet</p>
        <p className="text-xs text-white/40 max-w-xs">
          Ask something below to get started exploring {courseTitle}.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-md">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="rounded-xl glass-soft px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.06] transition"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}