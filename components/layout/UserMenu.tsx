"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, LogIn, LogOut, Pencil, User, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu() {
  const { user, logout, updateName, updatePassword } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "name" | "password">("menu");

  const [nameInput, setNameInput] = useState(user?.name ?? "");
  const [nameError, setNameError] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setView("menu");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (user) setNameInput(user.name);
  }, [user]);

  function openView(v: "name" | "password") {
    setView(v);
    setNameError("");
    setPassError("");
    setPassSaved(false);
    setCurrentPass("");
    setNewPass("");
  }

  function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) { setNameError("Name can't be empty."); return; }
    updateName(trimmed);
    setView("menu");
  }

  function savePassword() {
    if (!currentPass) { setPassError("Enter your current password."); return; }
    if (newPass.length < 4) { setPassError("New password must be at least 4 characters."); return; }
    const ok = updatePassword(currentPass, newPass);
    if (!ok) { setPassError("Current password is wrong."); return; }
    setPassSaved(true);
    setTimeout(() => { setView("menu"); setOpen(false); }, 800);
  }

  // ── Guest button (not signed in) ──────────────────────────────────
  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="h-8 w-8 lg:h-9 lg:w-9 rounded-full glass-soft flex items-center justify-center text-white/40 hover:text-white/80 transition"
        title="Sign in"
      >
        <User className="h-4 w-4" />
      </button>
    );
  }

  const initials = getInitials(user.name);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => { setOpen((o) => !o); setView("menu"); }}
        className="h-8 w-8 lg:h-9 lg:w-9 rounded-full grad-accent flex items-center justify-center text-white text-xs font-semibold glow hover:opacity-90 transition"
        title={user.name}
      >
        {initials}
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-64 rounded-2xl shadow-2xl z-50 overflow-hidden fade-in"
          style={{ background: "rgba(12,12,28,0.94)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {view === "menu" && (
            <>
              <div className="px-4 pt-4 pb-3 border-b border-white/8 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full grad-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-white/35">Local account</p>
                </div>
              </div>
              <div className="py-1.5">
                <button onClick={() => openView("name")} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/65 hover:text-white hover:bg-white/5 transition">
                  <Pencil className="h-4 w-4 shrink-0" /> Edit display name
                </button>
                <button onClick={() => openView("password")} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/65 hover:text-white hover:bg-white/5 transition">
                  <KeyRound className="h-4 w-4 shrink-0" /> Change password
                </button>
              </div>
              <div className="border-t border-white/8 py-1.5">
                <button onClick={() => { logout(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition">
                  <LogOut className="h-4 w-4 shrink-0" /> Sign out
                </button>
              </div>
            </>
          )}

          {view === "name" && (
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white">Edit display name</p>
                <button onClick={() => setView("menu")} className="text-white/30 hover:text-white transition"><X className="h-4 w-4" /></button>
              </div>
              <input type="text" value={nameInput} onChange={(e) => { setNameInput(e.target.value); setNameError(""); }} onKeyDown={(e) => e.key === "Enter" && saveName()} autoFocus className="w-full rounded-xl glass-soft px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 transition" />
              {nameError && <p className="text-[11px] text-rose-300">{nameError}</p>}
              <button onClick={saveName} className="w-full rounded-xl grad-accent py-2 text-xs font-semibold text-white flex items-center justify-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Save
              </button>
            </div>
          )}

          {view === "password" && (
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white">Change password</p>
                <button onClick={() => setView("menu")} className="text-white/30 hover:text-white transition"><X className="h-4 w-4" /></button>
              </div>
              <input type="password" value={currentPass} onChange={(e) => { setCurrentPass(e.target.value); setPassError(""); }} placeholder="Current password" autoFocus className="w-full rounded-xl glass-soft px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 transition" />
              <input type="password" value={newPass} onChange={(e) => { setNewPass(e.target.value); setPassError(""); }} onKeyDown={(e) => e.key === "Enter" && savePassword()} placeholder="New password" className="w-full rounded-xl glass-soft px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 transition" />
              {passError && <p className="text-[11px] text-rose-300">{passError}</p>}
              <button onClick={savePassword} className="w-full rounded-xl grad-accent py-2 text-xs font-semibold text-white flex items-center justify-center gap-1.5">
                {passSaved ? <><Check className="h-3.5 w-3.5" /> Saved!</> : "Update password"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
