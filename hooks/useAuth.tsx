"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "udemy_tracker:auth";

interface StoredAuth {
  name: string;
  passwordHash: string;
}

// Very lightweight hash — not cryptographic, just enough to avoid storing
// the password in plain text in localStorage. For a personal local tool
// this is fine; swap for bcrypt if this ever hits a real server.
function simpleHash(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16);
}

function loadStored(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

function saveStored(data: StoredAuth) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearStored() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

interface AuthContextValue {
  /** null = not logged in */
  user: { name: string } | null;
  /** First-time setup — registers name + password */
  register: (name: string, password: string) => void;
  /** Returns true if credentials match */
  login: (password: string) => boolean;
  logout: () => void;
  updateName: (name: string) => void;
  updatePassword: (current: string, next: string) => boolean;
  /** True if credentials have ever been registered */
  isRegistered: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [stored, setStoredState] = useState<StoredAuth | null>(loadStored);
  const [loggedIn, setLoggedIn] = useState(false);

  const isRegistered = stored !== null;
  const user = loggedIn && stored ? { name: stored.name } : null;

  const persist = useCallback((data: StoredAuth) => {
    saveStored(data);
    setStoredState(data);
  }, []);

  const register = useCallback(
    (name: string, password: string) => {
      const data: StoredAuth = { name: name.trim(), passwordHash: simpleHash(password) };
      persist(data);
      setLoggedIn(true);
    },
    [persist]
  );

  const login = useCallback(
    (password: string): boolean => {
      if (!stored) return false;
      const ok = simpleHash(password) === stored.passwordHash;
      if (ok) setLoggedIn(true);
      return ok;
    },
    [stored]
  );

  const logout = useCallback(() => {
    setLoggedIn(false);
  }, []);

  const updateName = useCallback(
    (name: string) => {
      if (!stored) return;
      persist({ ...stored, name: name.trim() });
    },
    [stored, persist]
  );

  const updatePassword = useCallback(
    (current: string, next: string): boolean => {
      if (!stored) return false;
      if (simpleHash(current) !== stored.passwordHash) return false;
      persist({ ...stored, passwordHash: simpleHash(next) });
      return true;
    },
    [stored, persist]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, isRegistered, register, login, logout, updateName, updatePassword }),
    [user, isRegistered, register, login, logout, updateName, updatePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}