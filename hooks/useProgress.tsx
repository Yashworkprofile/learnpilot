"use client";

import { useEffect, useState } from "react";
import { fetchProgress, ApiError } from "@/lib/api";
import type { ProgressResponse } from "@/lib/types";
import { useCourse } from "./useCourse";
import { useAppMode } from "@/context/AppModeContext";
import { useDemoProgress } from "@/context/DemoProgressContext";

interface FetchState {
  key: string;
  data: ProgressResponse | null;
  error: string | null;
}

interface UseProgressResult {
  data: ProgressResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProgress(): UseProgressResult {
  const { activeCourse } = useCourse();
  const { mode } = useAppMode();
  const { completedIds } = useDemoProgress();
  const [generation, setGeneration] = useState(0);

  // In demo mode, re-fetch whenever completedIds changes (lecture marked done).
  // We use the size as a stable primitive for the key — each new completion
  // bumps the size, triggering a fresh fetchProgress call.
  const demoKey = mode === "demo" ? completedIds.size : 0;
  const requestKey = `${mode}:${activeCourse.id}:${generation}:${demoKey}`;

  const [state, setState] = useState<FetchState>({
    key: requestKey,
    data: null,
    error: null,
  });

  if (state.key !== requestKey) {
    setState({ key: requestKey, data: null, error: null });
  }

  useEffect(() => {
    let cancelled = false;

    fetchProgress(activeCourse.id)
      .then((res) => {
        if (cancelled) return;
        setState((prev) =>
          prev.key === requestKey ? { ...prev, data: res } : prev
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setState((prev) =>
          prev.key === requestKey
            ? {
                ...prev,
                error:
                  err instanceof ApiError ? err.message : "Something went wrong.",
              }
            : prev
        );
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey, activeCourse.id]);

  return {
    data: state.data,
    loading: state.key === requestKey && state.data === null && state.error === null,
    error: state.error,
    refetch: () => setGeneration((g) => g + 1),
  };
}