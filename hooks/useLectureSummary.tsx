"use client";

import { useCallback, useState } from "react";
import { fetchLectureSummary, ApiError } from "@/lib/api";
import type { LectureSummary } from "@/lib/types";
import { useCourse } from "./useCourse";
import { useAppMode } from "@/context/AppModeContext";

interface UseLectureSummaryResult {
  data: LectureSummary | null;
  loading: boolean;
  error: string | null;
  generate: (refresh?: boolean) => void;
}

export function useLectureSummary(
  lectureId: number | null
): UseLectureSummaryResult {
  const { activeCourse } = useCourse();
  const { mode } = useAppMode();
  const [data, setData] = useState<LectureSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedKey, setTrackedKey] = useState(`${mode}:${lectureId}`);

  // Reset on lecture change OR mode switch
  const currentKey = `${mode}:${lectureId}`;
  if (trackedKey !== currentKey) {
    setTrackedKey(currentKey);
    setData(null);
    setError(null);
    setLoading(false);
  }

  const generate = useCallback(
    (refresh = false) => {
      if (lectureId === null) return;
      setLoading(true);
      setError(null);
      fetchLectureSummary(activeCourse.id, lectureId, refresh)
        .then((res) => setData(res))
        .catch((err) =>
          setError(err instanceof ApiError ? err.message : "Something went wrong.")
        )
        .finally(() => setLoading(false));
    },
    [lectureId, activeCourse.id, mode] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return { data, loading, error, generate };
}
