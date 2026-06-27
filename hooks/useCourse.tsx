"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Course } from "@/lib/types";
import { useAppMode } from "@/context/AppModeContext";

const SEED_COURSE: Course = {
  id: "6100015",
  title: "AI Engineer Core Track",
  subtitle: "LLM · RAG · QLoRA · Agents",
};

// Shown in demo mode — course_id must match what static_data.json uses.
// Title/subtitle will also be overridden by whatever comes back from
// static_data.json, but this is the fallback before data loads.
const DEMO_COURSE: Course = {
  id: "6s191",
  title: "MIT 6.S191",
  subtitle: "Introduction to Deep Learning",
};

const STORAGE_COURSES_KEY = "udemy_tracker:courses";
const STORAGE_ACTIVE_KEY  = "udemy_tracker:active_course_id";

function loadCourses(): Course[] {
  if (typeof window === "undefined") return [SEED_COURSE];
  try {
    const raw = localStorage.getItem(STORAGE_COURSES_KEY);
    if (!raw) return [SEED_COURSE];
    const parsed: Course[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [SEED_COURSE];
    const hasSeed = parsed.some((c) => c.id === SEED_COURSE.id);
    return hasSeed ? parsed : [SEED_COURSE, ...parsed];
  } catch {
    return [SEED_COURSE];
  }
}

function saveCourses(courses: Course[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_COURSES_KEY, JSON.stringify(courses));
}

function loadActiveId(courses: Course[]): string {
  if (typeof window === "undefined") return courses[0].id;
  try {
    const stored = localStorage.getItem(STORAGE_ACTIVE_KEY);
    if (stored && courses.some((c) => c.id === stored)) return stored;
  } catch {}
  return courses[0].id;
}

function saveActiveId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_ACTIVE_KEY, id);
}

interface CourseContextValue {
  courses: Course[];
  activeCourse: Course;
  setActiveCourseId: (id: string) => void;
  addCourse: (course: Course) => void;
  removeCourse: (id: string) => void;
  hasCourse: (id: string) => boolean;
}

const CourseContext = createContext<CourseContextValue | null>(null);

export function CourseProvider({ children }: { children: ReactNode }) {
  const { mode } = useAppMode();
  const isDemo = mode === "demo";

  // Real courses (used in live mode only)
  const [courses, setCourses] = useState<Course[]>(loadCourses);
  const [activeCourseId, setActiveCourseIdState] = useState<string>(() =>
    loadActiveId(loadCourses())
  );

  // Persist live courses to localStorage (never in demo mode)
  useEffect(() => {
    if (!isDemo) saveCourses(courses);
  }, [courses, isDemo]);

  useEffect(() => {
    if (!isDemo) saveActiveId(activeCourseId);
  }, [activeCourseId, isDemo]);

  const setActiveCourseId = useCallback((id: string) => {
    setActiveCourseIdState(id);
  }, []);

  const addCourse = useCallback((course: Course) => {
    setCourses((prev) => {
      const exists = prev.some((c) => c.id === course.id);
      if (exists) return prev.map((c) => (c.id === course.id ? course : c));
      return [...prev, course];
    });
  }, []);

  const removeCourse = useCallback(
    (id: string) => {
      if (id === SEED_COURSE.id) return;
      setCourses((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((c) => c.id !== id);
        if (id === activeCourseId) setActiveCourseIdState(next[0].id);
        return next;
      });
    },
    [activeCourseId]
  );

  const hasCourse = useCallback(
    (id: string) => courses.some((c) => c.id === id),
    [courses]
  );

  const value = useMemo<CourseContextValue>(() => {
    // In demo mode: expose only the demo course, ignore localStorage entirely
    if (isDemo) {
      return {
        courses: [DEMO_COURSE],
        activeCourse: DEMO_COURSE,
        setActiveCourseId: () => {},  // no-op — only one course in demo
        addCourse: () => {},
        removeCourse: () => {},
        hasCourse: (id) => id === DEMO_COURSE.id,
      };
    }

    const activeCourse =
      courses.find((c) => c.id === activeCourseId) ?? courses[0];
    return {
      courses,
      activeCourse,
      setActiveCourseId,
      addCourse,
      removeCourse,
      hasCourse,
    };
  }, [isDemo, courses, activeCourseId, setActiveCourseId, addCourse, removeCourse, hasCourse]);

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
}

export function useCourse() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error("useCourse must be used within a CourseProvider");
  return ctx;
}
