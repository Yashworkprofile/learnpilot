"use client";

import { useCallback, useState } from "react";
import { fetchCourseSummary, ApiError } from "@/lib/api";
import type { CourseSummary } from "@/lib/types";
import { useCourse } from "./useCourse";
import { useAppMode } from "@/context/AppModeContext";

interface UseCourseSummaryResult {
  data: CourseSummary | null;
  loading: boolean;
  error: string | null;
  generate: (refresh?: boolean) => void;
}

export function useCourseSummary(): UseCourseSummaryResult {
  const { activeCourse } = useCourse();
  const { mode } = useAppMode();
  const [data, setData] = useState<CourseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedKey, setTrackedKey] = useState(`${mode}:${activeCourse.id}`);

  // Reset on course switch OR mode switch
  const currentKey = `${mode}:${activeCourse.id}`;
  if (trackedKey !== currentKey) {
    setTrackedKey(currentKey);
    setData(null);
    setError(null);
    setLoading(false);
  }

  const generate = useCallback(
    (refresh = false) => {
      setLoading(true);
      setError(null);
      fetchCourseSummary(activeCourse.id, refresh)
        .then((res) => setData(res))
        .catch((err) =>
          setError(err instanceof ApiError ? err.message : "Something went wrong.")
        )
        .finally(() => setLoading(false));
    },
    [activeCourse.id, mode] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return { data, loading, error, generate };
}
