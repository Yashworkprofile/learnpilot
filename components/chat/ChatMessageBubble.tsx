"use client";

import {
  AlertTriangle,
  BookOpen,
  Bot,
  Clock,
  Layers,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { FormattedAnswer } from "./FormattedAnswer";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onRetry: (messageId: string) => void;
}

export function ChatMessageBubble({
  message,
  onRetry,
}: ChatMessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-2xl rounded-br-sm grad-accent px-4 py-2.5 text-sm text-white leading-relaxed whitespace-pre-line">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex items-start gap-3">
        <Avatar />
        <div className="max-w-[75%] rounded-2xl rounded-bl-md glass-soft border border-rose-400/20 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">
              Couldn&rsquo;t get an answer
            </span>
          </div>
          <p className="text-xs text-white/45">{message.error}</p>
          <button
            onClick={() => onRetry(message.id)}
            className="inline-flex items-center gap-1.5 rounded-lg glass-soft px-2.5 py-1.5 text-[11px] font-medium text-white/60 hover:text-white transition"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <Avatar />
      <div className="max-w-[90%] min-w-0 rounded-2xl rounded-bl-md glass-soft px-4 py-3 space-y-3">
        <FormattedAnswer text={message.content} />

        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-white/8">
            {message.sources.map((s, i) => (
              <span
                key={i}
                title={s.section_title}
                className="inline-flex items-center gap-1.5 rounded-full glass-soft px-2.5 py-1 text-[10px] font-medium text-white/55 max-w-[220px]"
              >
                <BookOpen className="h-3 w-3 shrink-0 text-indigo-300" />
                <span className="truncate">{s.title}</span>
              </span>
            ))}
          </div>
        )}

        {message.timing && (
          <div className="flex items-center gap-3 text-[10px] font-mono text-white/25">
            <span className="inline-flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" />
              {message.timing.retrieval_ms}ms retrieval
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {message.timing.total_ms}ms total
            </span>
            {typeof message.chunksRetrieved === "number" && (
              <span className="inline-flex items-center gap-1">
                <Layers className="h-2.5 w-2.5" />
                {message.chunksRetrieved} chunks
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <Avatar />
      <div className="rounded-2xl rounded-bl-md glass-soft px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="shrink-0 h-7 w-7 rounded-full glass-soft flex items-center justify-center mt-0.5">
      <Bot className="h-3.5 w-3.5 text-indigo-300" />
    </div>
  );
}