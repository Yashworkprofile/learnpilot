"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TIMEOUT_MS = 2000;

export interface BackendStatus {
  available: boolean;
  checking: boolean;
}

export function useBackendStatus(): BackendStatus {
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    fetch(`${API_URL}/health`, { signal: controller.signal })
      .then((res) => {
        if (!cancelled) setAvailable(res.ok);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      })
      .finally(() => {
        clearTimeout(timer);
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, []); // once on mount

  return { available, checking };
}
