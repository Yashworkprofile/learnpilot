"use client";

import { useEffect, useState } from "react";
import { fetchSummaryStatus, ApiError } from "@/lib/api";
import type { SummaryStatusResponse } from "@/lib/types";
import { useCourse } from "./useCourse";
import { useAppMode } from "@/context/AppModeContext";

interface FetchState {
  key: string;
  data: SummaryStatusResponse | null;
  error: string | null;
}

interface UseSummaryStatusResult {
  data: SummaryStatusResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  markSummaryCached: (lectureId: number) => void;
}

export function useSummaryStatus(): UseSummaryStatusResult {
  const { activeCourse } = useCourse();
  const { mode } = useAppMode();
  const [generation, setGeneration] = useState(0);
  const requestKey = `${mode}:${activeCourse.id}:${generation}`;

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

    fetchSummaryStatus(activeCourse.id)
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

  function markSummaryCached(lectureId: number) {
    setState((prev) => {
      if (!prev.data) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          lectures: prev.data.lectures.map((l) =>
            l.lecture_id === lectureId ? { ...l, summary_cached: true } : l
          ),
        },
      };
    });
  }

  return {
    data: state.data,
    loading: state.key === requestKey && state.data === null && state.error === null,
    error: state.error,
    refetch: () => setGeneration((g) => g + 1),
    markSummaryCached,
  };
}
