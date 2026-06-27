// Shared types for the course-selection layer (sidebar, header).
//
// API response types that mirror app.py's endpoints (ProgressResponse,
// LectureSummary, RagAskResponse, etc.) are added alongside each tab as
// it's wired up, rather than guessed here ahead of time.

export interface Course {
  id: string;
  title: string;
  subtitle: string;
}

// ---------------------------------------------------------------------
// GET /progress — mirrors app.py's response shape exactly (see
// NEXT_SESSION_CONTEXT.md). Used by the Dashboard tab.
// ---------------------------------------------------------------------

export interface CurrentPosition {
  section_title: string;
  subsection_title: string;
}

export interface ProgressSummary {
  overall_completion_percent: number;
  items_completed: number;
  total_items: number;
  sections_completed: number;
  total_sections: number;
  current_position: CurrentPosition | null;
}

export interface Subsection {
  title: string;
  type: string;
  lecture_id: number;
  lecture_number: number;
  object_index: number;
  section_index: number;
  is_completed: boolean;
}

export interface CourseSection {
  title: string;
  section_index: number;
  completion_percent: number;
  completed_items: number;
  total_items: number;
  subsections: Subsection[];
}

export interface ProgressResponse {
  course_id: string;
  course_title: string;
  progress: ProgressSummary;
  sections: CourseSection[];
}

// ---------------------------------------------------------------------
// GET /lectures, GET /transcript/{id} — used by the Transcripts tab.
//
// NOTE: unlike ProgressResponse above, NEXT_SESSION_CONTEXT.md didn't
// include a confirmed JSON example for GET /lectures (only the endpoint
// path). This shape is inferred from udemy_client.py's documented
// function names (list_lectures, get_all_transcripts_status) and the
// demo-mode mapping already sketched in the context doc. If the real
// response differs, this is the only place that needs to change.
//
// TranscriptResponse, by contrast, IS confirmed — the context doc states
// ocw_client.py must produce output "identical to udemy_client.get_transcript()",
// and gives the exact shape used here.
// ---------------------------------------------------------------------

export interface LectureListItem {
  lecture_id: number;
  lecture_number: number;
  title: string;
  section_title: string;
  section_index: number;
  object_index: number;
  /** Transcript already fetched and cached on disk. */
  cached: boolean;
  /** Udemy reports captions/transcript exist for this lecture. */
  available: boolean;
  /** Present if the last fetch attempt for this lecture failed. */
  error?: string | null;
}

export interface LecturesResponse {
  course_id: string;
  course_title: string;
  lectures: LectureListItem[];
}

export interface TranscriptResponse {
  lecture_id: number;
  lecture_number: number;
  title: string;
  section_title: string;
  section_index: number;
  object_index: number;
  available: boolean;
  transcript: string;
  error: string | null;
}

// ---------------------------------------------------------------------
// GET /summary/status, GET /summary/{id}, GET /summary/course — used by
// the Summaries tab.
//
// LectureSummary and CourseSummary ARE confirmed — NEXT_SESSION_CONTEXT.md
// gives the exact groq_summarizer.py JSON shapes for both.
//
// SummaryStatusResponse is INFERRED (same caveat as LecturesResponse above
// — no JSON example was ever pasted for this endpoint). Shaped to mirror
// LecturesResponse/LectureListItem since both come from the same
// "list lectures, flag which ones have a cached artifact" pattern. If the
// real response differs, this is the only place that needs to change —
// the only place reading `.summary_cached` is
// `components/summaries/LectureSummaryPicker.tsx` and `app/summaries/page.tsx`.
// ---------------------------------------------------------------------

export interface SummaryStatusItem {
  lecture_id: number;
  lecture_number: number;
  title: string;
  section_title: string;
  section_index: number;
  /** Lecture summary already generated and cached on disk. */
  summary_cached: boolean;
}

export interface SummaryStatusResponse {
  course_id: string;
  lectures: SummaryStatusItem[];
}

export interface ImportantTerm {
  term: string;
  definition: string;
  example: string;
}

export interface SpecificDetails {
  commands: string[];
  numbers_and_specs: string[];
  urls_and_resources: string[];
  comparisons: string[];
}

export type SummaryDifficulty = "beginner" | "intermediate" | "advanced";

export interface LectureSummary {
  lecture_id: number;
  lecture_number: number;
  title: string;
  section_title: string;
  available: boolean;
  summary: string;
  key_concepts: string[];
  what_you_learned: string[];
  important_terms: ImportantTerm[];
  specific_details: SpecificDetails;
  instructor_emphasis: string[];
  difficulty: SummaryDifficulty;
  estimated_review_time_minutes: number;
}

// CONFIRMED BUG (found 2026-06-21): tools_and_technologies is NOT a plain
// string[] in the real backend response, despite NEXT_SESSION_CONTEXT.md
// originally documenting it that way — it's an array of {name, description}
// objects. Caused a runtime crash ("Objects are not valid as a React
// child") in CourseSummaryCard's PillRow, which TypeScript couldn't catch
// because the type itself was wrong, not the rendering code. Fixed here;
// PillRow/SummaryList in CourseSummaryCard.tsx were also made defensive
// (accept string OR CourseTool) in case key_concepts_covered or others
// turn out to have drifted the same way — not confirmed either way yet.
export interface CourseTool {
  name: string;
  description: string;
}

export interface CourseSummary {
  course_id: string;
  course_title: string;
  overall_summary: string;
  what_you_covered: string[];
  tools_and_technologies: CourseTool[];
  skills_acquired: string[];
  knowledge_progression: string;
  key_concepts_covered: string[];
  quick_review_topics: string[];
}

// ---------------------------------------------------------------------
// POST /rag/ask, GET /rag/courses — used by the RAG Chat tab.
//
// Shaped directly from rag_chat.py's ask() return dict, as documented in
// NEXT_SESSION_CONTEXT.md — NOT yet confirmed against a live response,
// since /rag/ask didn't exist in app.py as of this writing. Same caveat
// class as LecturesResponse/SummaryStatusResponse above: trustworthy
// (read from the actual function source, not guessed from an endpoint
// name), but unverified. If the real response differs, this is the only
// place that needs to change — the only readers are
// `hooks/useChat.tsx` and `components/chat/ChatMessageBubble.tsx`.
//
// One thing worth a second look once this is live: lecture_id here is
// typed `string` per the documented shape, while LectureListItem /
// SummaryStatusItem elsewhere use `number` for the same concept. That
// asymmetry is preserved as-documented rather than "corrected" — it may
// well be intentional (Chroma metadata is often stored as strings) or it
// may be a documentation slip. Either way, sources are display-only here
// (no numeric comparisons done on lecture_id), so it doesn't matter
// functionally yet — but flagging it in case it trips up a future filter
// or "jump to this lecture" feature.
// ---------------------------------------------------------------------

export interface RagSource {
  lecture_id: string;
  title: string;
  section_title: string;
}

export interface RagTiming {
  retrieval_ms: number;
  ttft_ms: number;
  generation_ms: number;
  total_ms: number;
}

export interface RagAskResponse {
  question: string;
  answer: string;
  sources: RagSource[];
  chunks_retrieved: number;
  timing: RagTiming;
}

export interface RagCoursesResponse {
  courses: string[];
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  sources?: RagSource[];
  timing?: RagTiming;
  chunksRetrieved?: number;
  /** Set when this message is an assistant reply that failed to generate
   *  — renders an error state with retry instead of empty content. */
  error?: string;
  /** The original question that produced this message — only set on
   *  failed assistant messages, so retryMessage() knows what to re-ask
   *  without needing to look back at the preceding user message. */
  retryQuestion?: string;
}
