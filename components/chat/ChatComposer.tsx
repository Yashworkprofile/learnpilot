"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { Loader2, SendHorizontal } from "lucide-react";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  loading,
  disabled,
  placeholder,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow up to a cap, then scroll internally — same idea as a
  // standard chat composer, no library needed for this.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !loading && !disabled) onSend();
    }
  }

  const canSend = value.trim().length > 0 && !loading && !disabled;

  return (
    <div className="glass-strong rounded-2xl flex items-end gap-2 p-3">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder ?? "Ask something about this course…"}
        className="flex-1 resize-none bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={onSend}
        disabled={!canSend}
        className="shrink-0 h-9 w-9 rounded-xl grad-accent flex items-center justify-center text-white transition disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 glow"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SendHorizontal className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}