"use client";

import { useEffect, useRef, useState } from "react";
import { fetchTranscript, ApiError } from "@/lib/api";
import type { TranscriptResponse } from "@/lib/types";
import { useCourse } from "./useCourse";
import { useAppMode } from "@/context/AppModeContext";

interface FetchState {
  key: string;
  data: TranscriptResponse | null;
  error: string | null;
}

interface UseTranscriptResult {
  data: TranscriptResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTranscript(
  lectureId: number | null,
  onLoaded?: (lectureId: number) => void
): UseTranscriptResult {
  const { activeCourse } = useCourse();
  const { mode } = useAppMode();
  const [generation, setGeneration] = useState(0);
  const [forceNext, setForceNext] = useState(false);
  const requestKey =
    lectureId === null
      ? "idle"
      : `${mode}:${activeCourse.id}:${lectureId}:${generation}`;

  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });

  const [state, setState] = useState<FetchState>({
    key: requestKey,
    data: null,
    error: null,
  });

  if (state.key !== requestKey) {
    setState({ key: requestKey, data: null, error: null });
  }

  useEffect(() => {
    if (lectureId === null) return;
    let cancelled = false;
    const force = forceNext;

    fetchTranscript(activeCourse.id, lectureId, force)
      .then((res) => {
        if (cancelled) return;
        setState((prev) =>
          prev.key === requestKey ? { ...prev, data: res } : prev
        );
        if (res.available) onLoadedRef.current?.(lectureId);
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
      })
      .finally(() => {
        if (!cancelled) setForceNext(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey, activeCourse.id, lectureId, forceNext]);

  return {
    data: state.data,
    loading:
      lectureId !== null &&
      state.key === requestKey &&
      state.data === null &&
      state.error === null,
    error: state.error,
    refresh: () => {
      setForceNext(true);
      setGeneration((g) => g + 1);
    },
  };
}
