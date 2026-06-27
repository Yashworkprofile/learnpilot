"use client";

import { useEffect, useState } from "react";
import { fetchIndexedCourses, ApiError } from "@/lib/api";
import { useAppMode } from "@/context/AppModeContext";

interface UseIndexStatusResult {
  courses: string[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface FetchState {
  key: string;
  courses: string[] | null;
  error: string | null;
}

export function useIndexStatus(): UseIndexStatusResult {
  const { mode } = useAppMode();
  const [generation, setGeneration] = useState(0);
  const requestKey = `${mode}:${generation}`;

  const [state, setState] = useState<FetchState>({
    key: requestKey,
    courses: null,
    error: null,
  });

  if (state.key !== requestKey) {
    setState({ key: requestKey, courses: null, error: null });
  }

  useEffect(() => {
    let cancelled = false;

    fetchIndexedCourses()
      .then((res) => {
        if (cancelled) return;
        setState((prev) =>
          prev.key === requestKey ? { ...prev, courses: res.courses } : prev
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
  }, [requestKey]);

  return {
    courses: state.courses,
    loading: state.key === requestKey && state.courses === null && state.error === null,
    error: state.error,
    refetch: () => setGeneration((g) => g + 1),
  };
}
