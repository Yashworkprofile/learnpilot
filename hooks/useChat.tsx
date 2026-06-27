"use client";

import { useCallback, useState } from "react";
import { askRag, ApiError } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { useCourse } from "./useCourse";

interface UseChatResult {
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (question: string) => void;
  retryMessage: (messageId: string) => void;
  clearChat: () => void;
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function useChat(): UseChatResult {
  const { activeCourse } = useCourse();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackedCourseId, setTrackedCourseId] = useState(activeCourse.id);

  // Switching course clears chat history — render-time reset, same
  // pattern as every other course-scoped hook in this app.
  if (trackedCourseId !== activeCourse.id) {
    setTrackedCourseId(activeCourse.id);
    setMessages([]);
    setLoading(false);
  }

  // Shared by sendMessage (appends a new assistant message) and
  // retryMessage (replaces an existing failed one in place) — existingId
  // is what distinguishes the two.
  const performAsk = useCallback(
    (question: string, existingId?: string) => {
      setLoading(true);
      askRag(question, activeCourse.id)
        .then((res) => {
          const assistantMessage: ChatMessage = {
            id: existingId ?? makeId(),
            role: "assistant",
            content: res.answer,
            sources: res.sources,
            timing: res.timing,
            chunksRetrieved: res.chunks_retrieved,
          };
          setMessages((prev) =>
            existingId
              ? prev.map((m) => (m.id === existingId ? assistantMessage : m))
              : [...prev, assistantMessage]
          );
        })
        .catch((err) => {
          const errorMessage: ChatMessage = {
            id: existingId ?? makeId(),
            role: "assistant",
            content: "",
            error:
              err instanceof ApiError ? err.message : "Something went wrong.",
            retryQuestion: question,
          };
          setMessages((prev) =>
            existingId
              ? prev.map((m) => (m.id === existingId ? errorMessage : m))
              : [...prev, errorMessage]
          );
        })
        .finally(() => setLoading(false));
    },
    [activeCourse.id]
  );

  const sendMessage = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || loading) return;

      const userMessage: ChatMessage = {
        id: makeId(),
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMessage]);
      performAsk(trimmed);
    },
    [loading, performAsk]
  );

  const retryMessage = useCallback(
    (messageId: string) => {
      if (loading) return;
      const target = messages.find((m) => m.id === messageId);
      if (!target?.retryQuestion) return;
      performAsk(target.retryQuestion, messageId);
    },
    [loading, messages, performAsk]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, loading, sendMessage, retryMessage, clearChat };
}
