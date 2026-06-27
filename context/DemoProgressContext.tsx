"use client";

/**
 * DemoProgressContext
 *
 * Tracks which lectures the demo user has "completed" (via the Next button
 * in Workspace) entirely in memory — no backend, no localStorage.
 *
 * The context also exposes a module-level getter so api.ts can read the
 * completed set synchronously when computing the demo ProgressResponse,
 * without needing to thread React context through the fetch layer.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// ─── Module-level store (read by api.ts synchronously) ────────────────────

let _completedIds: Set<number> = new Set();

/** Called by api.ts to read completed lecture IDs without React context. */
export function getDemoCompletedIds(): Set<number> {
  return _completedIds;
}

// ─── Context ──────────────────────────────────────────────────────────────

interface DemoProgressContextValue {
  completedIds: Set<number>;
  markComplete: (lectureId: number) => void;
}

const DemoProgressContext = createContext<DemoProgressContextValue>({
  completedIds: new Set(),
  markComplete: () => {},
});

export function DemoProgressProvider({ children }: { children: ReactNode }) {
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());

  const markComplete = useCallback((lectureId: number) => {
    setCompletedIds((prev) => {
      if (prev.has(lectureId)) return prev;
      const next = new Set(prev);
      next.add(lectureId);
      // Keep module-level store in sync so api.ts can read it
      _completedIds = next;
      return next;
    });
  }, []);

  return (
    <DemoProgressContext.Provider value={{ completedIds, markComplete }}>
      {children}
    </DemoProgressContext.Provider>
  );
}

export function useDemoProgress(): DemoProgressContextValue {
  return useContext(DemoProgressContext);
}