"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { isRegistered, login, register } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  const registered = mounted && isRegistered;

  async function handleSubmit() {
    const trimmedName = name.trim();
    const trimmedPass = password.trim();

    if (!registered && !trimmedName) { setError("Please enter your name."); return; }
    if (!trimmedPass) { setError("Please enter a password."); return; }

    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 400));

    if (registered) {
      const ok = login(trimmedPass);
      if (!ok) { setError("Wrong password. Try again."); setLoading(false); return; }
    } else {
      register(trimmedName, trimmedPass);
    }

    setLoading(false);
    router.push("/dashboard");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  // Shared input class — font-size 16px prevents iOS auto-zoom
  const inputClass =
    "w-full rounded-xl glass-soft px-4 py-3 text-base text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 transition appearance-none";

  return (
    // Allow scroll so keyboard doesn't obscure inputs on mobile
    <div className="min-h-screen flex items-center justify-center p-5 overflow-auto">
      <div className="w-full max-w-sm fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-14 w-14 rounded-2xl grad-accent flex items-center justify-center glow">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">LearnPilot AI</h1>
            <p className="text-sm text-white/40 mt-0.5">Your personal learning workspace</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl px-6 py-7 space-y-5">
          <div className="text-center space-y-0.5">
            <p className="text-sm font-semibold text-white">
              {registered ? "Welcome back 👋" : "Set up your account"}
            </p>
            <p className="text-[11px] text-white/35">
              {registered
                ? "Enter your password to continue"
                : "Choose a name and password — stored locally, just for you"}
            </p>
          </div>

          <div className="space-y-3">
            {!registered && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  onKeyDown={handleKey}
                  placeholder="e.g. Nikhil Kumar"
                  autoComplete="name"
                  className={inputClass}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={handleKey}
                  placeholder="••••••••"
                  autoComplete={registered ? "current-password" : "new-password"}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-[12px] text-rose-300 text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl grad-accent glow py-3 text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : registered ? (
              "Sign In"
            ) : (
              "Get Started"
            )}
          </button>

          {/* Skip option */}
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full text-center text-xs text-white/30 hover:text-white/55 transition py-1 touch-manipulation"
          >
            Continue without signing in →
          </button>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-4">
          Credentials are stored locally in your browser only.
        </p>
      </div>
    </div>
  );
}