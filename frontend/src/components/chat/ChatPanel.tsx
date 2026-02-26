"use client";

import { useRef, useEffect, useState, FormEvent } from "react";
import { Send, Loader2, Wifi, WifiOff } from "lucide-react";
import { useEvaluationStore } from "@/store/evaluationStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageBubble from "./MessageBubble";
import ApprovalGate from "./ApprovalGate";

const SUBAGENT_LABELS: Record<string, string> = {
  "requirements-analyzer": "Requirements Analyzer",
  "frontend-evaluator": "Frontend Evaluator",
  "backend-evaluator": "Backend Evaluator",
  "database-evaluator": "Database Evaluator",
  "infrastructure-evaluator": "Infrastructure Evaluator",
  "scenario-planner": "Scenario Planner",
};

function ProgressIndicator() {
  const progress = useEvaluationStore((s) => s.progress);
  const entries = Object.entries(progress);

  if (entries.length === 0) return null;

  return (
    <div className="mx-4 my-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Evaluation Progress
      </p>
      <div className="space-y-1.5">
        {entries.map(([key, status]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            {status === "running" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
            )}
            {status === "done" && (
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 text-[10px] text-white">
                ✓
              </span>
            )}
            {status === "pending" && (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
            )}
            <span className="text-zinc-700 dark:text-zinc-300">
              {SUBAGENT_LABELS[key] ?? key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectionBadge({ status }: { status: string }) {
  if (status === "connected") {
    return (
      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <Wifi className="h-3 w-3" />
        <span>Connected</span>
      </div>
    );
  }
  if (status === "connecting") {
    return (
      <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
      <WifiOff className="h-3 w-3" />
      <span>Disconnected</span>
    </div>
  );
}

export default function ChatPanel() {
  const sessionId = useEvaluationStore((s) => s.sessionId);
  const messages = useEvaluationStore((s) => s.messages);
  const phase = useEvaluationStore((s) => s.phase);
  const pendingApproval = useEvaluationStore((s) => s.pendingApproval);

  const { send, connectionStatus } = useWebSocket(sessionId);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingApproval]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || connectionStatus !== "connected") return;

    // Add user message to the store
    useEvaluationStore.getState().addMessage({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    });

    // Send via WebSocket
    send({
      type: "user_message",
      payload: { message: trimmed },
    });

    setInput("");
  };

  const isEvaluating = phase === "evaluating";

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Chat
        </h2>
        <ConnectionBadge status={connectionStatus} />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              {sessionId
                ? "Start chatting to evaluate your stack..."
                : "Enter requirements to begin."}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Progress indicators during evaluation */}
        {isEvaluating && <ProgressIndicator />}

        {/* Inline approval gate */}
        {pendingApproval && (
          <div className="my-3">
            <ApprovalGate approval={pendingApproval} send={send} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            connectionStatus === "connected"
              ? "Type a message..."
              : "Waiting for connection..."
          }
          disabled={connectionStatus !== "connected"}
          className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || connectionStatus !== "connected"}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
