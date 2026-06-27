import { getDemoCompletedIds } from "@/context/DemoProgressContext";
import type {
  CourseSummary,
  LecturesResponse,
  LectureSummary,
  ProgressResponse,
  RagAskResponse,
  RagCoursesResponse,
  SummaryStatusResponse,
  TranscriptResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Mode injection ────────────────────────────────────────────────────────
// AppModeProvider calls setApiMode() whenever mode changes (via useEffect),
// so every fetch function below reads the current runtime mode without
// needing to thread context through every hook.

type AppMode = "demo" | "live";
let _mode: AppMode = "demo";

export function setApiMode(mode: AppMode): void {
  _mode = mode;
}

function isDemo(): boolean {
  return _mode === "demo";
}

// ─── Error class (unchanged) ───────────────────────────────────────────────

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ─── Live fetch helpers (unchanged) ───────────────────────────────────────

async function getJSON<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`);
  } catch {
    throw new ApiError(
      `Couldn't reach the API at ${API_URL}. Is the backend running?`
    );
  }
  if (!res.ok) {
    throw new ApiError(`Request failed (${res.status})`, res.status);
  }
  return res.json() as Promise<T>;
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      `Couldn't reach the API at ${API_URL}. Is the backend running?`
    );
  }
  if (!res.ok) {
    throw new ApiError(`Request failed (${res.status})`, res.status);
  }
  return res.json() as Promise<T>;
}

// ─── Demo static data cache ────────────────────────────────────────────────

interface StaticData {
  progress: ProgressResponse;
  lectures: LecturesResponse;
  summary_status: SummaryStatusResponse;
  course_summary: CourseSummary;
  lecture_summaries: Record<string, LectureSummary>;
}

interface QAPair {
  question: string;
  answer: string;
  sources?: Array<{ lecture_id: string; title: string; section_title: string }>;
}

let _staticData: StaticData | null = null;
let _staticDataPromise: Promise<StaticData> | null = null;
let _qaPairs: QAPair[] | null = null;

async function getStaticData(): Promise<StaticData> {
  if (_staticData) return _staticData;
  if (_staticDataPromise) return _staticDataPromise;

  _staticDataPromise = fetch("/demo/static_data.json")
    .then((r) => {
      if (!r.ok) throw new ApiError(`Demo data unavailable (${r.status})`);
      return r.json() as Promise<StaticData>;
    })
    .then((d) => {
      _staticData = d;
      return d;
    });

  return _staticDataPromise;
}

async function getQAPairs(): Promise<QAPair[]> {
  if (_qaPairs) return _qaPairs;
  const r = await fetch("/demo/qa_pairs.json");
  if (!r.ok) throw new ApiError(`Demo Q&A unavailable (${r.status})`);
  _qaPairs = await r.json();
  return _qaPairs!;
}

// ─── Demo RAG (fuzzy word-overlap) ────────────────────────────────────────

function wordOverlapScore(a: string, b: string): number {
  const tok = (s: string) =>
    new Set(s.toLowerCase().match(/\b[a-z]{3,}\b/g) ?? []);
  const aW = tok(a);
  const bW = tok(b);
  let hits = 0;
  for (const w of aW) if (bW.has(w)) hits++;
  return hits / Math.max(aW.size, bW.size, 1);
}

async function demoAskRag(question: string): Promise<RagAskResponse> {
  const pairs = await getQAPairs();
  await new Promise((r) => setTimeout(r, 700)); // fake latency

  const scored = pairs
    .map((p) => ({ p, score: wordOverlapScore(question, p.question) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const THRESHOLD = 0.15;

  const answer =
    best && best.score >= THRESHOLD
      ? best.p.answer
      : "I don't have a pre-generated answer for that in demo mode. " +
        "Try asking about lecture topics, key concepts, or tools covered in the course.";

  return {
    question,
    answer,
    sources: (best?.score >= THRESHOLD ? best.p.sources : undefined) ?? [],
    chunks_retrieved: best?.score >= THRESHOLD ? 3 : 0,
    timing: {
      retrieval_ms: 120,
      ttft_ms: 500,
      generation_ms: 80,
      total_ms: 700,
    },
  };
}

// ─── Public API functions ──────────────────────────────────────────────────
// Signatures are identical to before — all hooks call these unchanged.

export async function fetchProgress(
  courseId: string,
  refreshCurriculum = false
): Promise<ProgressResponse> {
  if (isDemo()) {
    const d = await getStaticData();
    const completed = getDemoCompletedIds();

    // Recompute all progress fields from the in-memory completed set
    const sections = d.progress.sections.map((section) => {
      const subsections = section.subsections.map((sub) => ({
        ...sub,
        is_completed: completed.has(sub.lecture_id),
      }));
      const completedItems = subsections.filter((s) => s.is_completed).length;
      const completionPercent =
        subsections.length > 0
          ? (completedItems / subsections.length) * 100
          : 0;
      return {
        ...section,
        subsections,
        completed_items: completedItems,
        completion_percent: completionPercent,
        is_completed: completedItems === subsections.length,
      };
    });

    const totalItems = sections.reduce((s, sec) => s + sec.total_items, 0);
    const itemsCompleted = sections.reduce((s, sec) => s + sec.completed_items, 0);
    const sectionsCompleted = sections.filter((s) => s.is_completed).length;
    const overallPercent = totalItems > 0 ? (itemsCompleted / totalItems) * 100 : 0;

    // current_position: first incomplete lecture
    let currentPosition = d.progress.progress.current_position;
    for (const sec of sections) {
      const incomplete = sec.subsections.find((s) => !s.is_completed);
      if (incomplete) {
        currentPosition = {
          section_title: sec.title,
          subsection_title: incomplete.title,
        };
        break;
      }
    }

    return {
      ...d.progress,
      sections,
      progress: {
        ...d.progress.progress,
        items_completed: itemsCompleted,
        sections_completed: sectionsCompleted,
        overall_completion_percent: overallPercent,
        current_position: itemsCompleted === totalItems ? null : currentPosition,
      },
    };
  }
  const params = new URLSearchParams({
    course_id: courseId,
    refresh_curriculum: String(refreshCurriculum),
  });
  return getJSON<ProgressResponse>(`/progress?${params}`);
}

export async function fetchLectures(courseId: string): Promise<LecturesResponse> {
  if (isDemo()) {
    const d = await getStaticData();
    return d.lectures;
  }
  const params = new URLSearchParams({ course_id: courseId });
  return getJSON<LecturesResponse>(`/lectures?${params}`);
}

export async function fetchTranscript(
  courseId: string,
  lectureId: number,
  refresh = false
): Promise<TranscriptResponse> {
  if (isDemo()) {
    // Transcripts tab is disabled in demo — this is a safety fallback only
    throw new ApiError("Transcripts are not available in demo mode.");
  }
  const params = new URLSearchParams({
    course_id: courseId,
    refresh: String(refresh),
  });
  return getJSON<TranscriptResponse>(`/transcript/${lectureId}?${params}`);
}

export async function fetchSummaryStatus(
  courseId: string
): Promise<SummaryStatusResponse> {
  if (isDemo()) {
    const d = await getStaticData();
    return d.summary_status;
  }
  const params = new URLSearchParams({ course_id: courseId });
  return getJSON<SummaryStatusResponse>(`/summary/status?${params}`);
}

export async function fetchLectureSummary(
  courseId: string,
  lectureId: number,
  refresh = false
): Promise<LectureSummary> {
  if (isDemo()) {
    const d = await getStaticData();
    const key = String(lectureId);
    const summary = d.lecture_summaries[key];
    if (!summary) throw new ApiError(`No demo summary for lecture ${lectureId}`);
    return summary;
  }
  const params = new URLSearchParams({
    course_id: courseId,
    refresh: String(refresh),
  });
  return getJSON<LectureSummary>(`/summary/${lectureId}?${params}`);
}

export async function fetchCourseSummary(
  courseId: string,
  refresh = false
): Promise<CourseSummary> {
  if (isDemo()) {
    const d = await getStaticData();
    return d.course_summary;
  }
  const params = new URLSearchParams({
    course_id: courseId,
    refresh: String(refresh),
  });
  return getJSON<CourseSummary>(`/summary/course?${params}`);
}

export async function askRag(
  question: string,
  courseId: string
): Promise<RagAskResponse> {
  if (isDemo()) return demoAskRag(question);
  return postJSON<RagAskResponse>("/rag/ask", { question, course_id: courseId });
}

export async function fetchIndexedCourses(): Promise<RagCoursesResponse> {
  if (isDemo()) {
    // Report the demo course as indexed so the coverage banner shows
    const d = await getStaticData();
    return { courses: [d.progress.course_id] };
  }
  return getJSON<RagCoursesResponse>("/rag/courses");
}