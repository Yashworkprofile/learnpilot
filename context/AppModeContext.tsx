"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useBackendStatus } from "@/hooks/useBackendStatus";

export type AppMode = "demo" | "live";

const SESSION_KEY = "udemy_tracker:app_mode";

interface AppModeContextValue {
  mode: AppMode;
  /** null when backend is not reachable — hides the toggle entirely */
  setMode: ((mode: AppMode) => void) | null;
  backendAvailable: boolean;
  backendChecking: boolean;
}

const AppModeContext = createContext<AppModeContextValue>({
  mode: "demo",
  setMode: null,
  backendAvailable: false,
  backendChecking: true,
});

export function AppModeProvider({ children }: { children: ReactNode }) {
  const { available, checking } = useBackendStatus();
  const [mode, setModeState] = useState<AppMode>("demo");
  const [mounted, setMounted] = useState(false);

  // Read sessionStorage only on client — avoids SSR/hydration mismatch
  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === "live" || stored === "demo") {
      setModeState(stored);
    }
  }, []);

  // If backend check finishes and it's gone, force back to demo
  useEffect(() => {
    if (!checking && !available && mode === "live") {
      setModeState("demo");
      sessionStorage.setItem(SESSION_KEY, "demo");
    }
  }, [checking, available, mode]);

  const setMode = useCallback(
    (next: AppMode) => {
      if (!available) return;
      setModeState(next);
      sessionStorage.setItem(SESSION_KEY, next);
    },
    [available]
  );

  return (
    <AppModeContext.Provider
      value={{
        mode: mounted ? mode : "demo", // SSR always demo
        setMode: available ? setMode : null,
        backendAvailable: available,
        backendChecking: checking,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode(): AppModeContextValue {
  return useContext(AppModeContext);
}
