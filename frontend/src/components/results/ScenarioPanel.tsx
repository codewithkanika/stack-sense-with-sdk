"use client";

import { useState } from "react";
import { Send, MessageCircleQuestion } from "lucide-react";
import type { ScenarioResult } from "@/types";

interface ScenarioPanelProps {
  send: (data: Record<string, unknown>) => void;
  scenarios: ScenarioResult[];
}

export default function ScenarioPanel({ send, scenarios }: ScenarioPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    send({ type: "scenario_query", payload: { query: trimmed } });
    setQuery("");
    // Loading clears when a new scenario arrives
    setTimeout(() => setLoading(false), 10000);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <MessageCircleQuestion className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Scenario Planning
        </h3>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 px-5 py-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What if we switched to MongoDB?"
          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span>{loading ? "Sending..." : "Ask"}</span>
        </button>
      </form>

      {/* Scenario results */}
      {scenarios.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="px-5 py-4">
                {/* Query */}
                <div className="mb-3 flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Q
                  </span>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {scenario.query}
                  </p>
                </div>

                {/* Analysis */}
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
                    A
                  </span>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                    {scenario.analysis}
                  </p>
                </div>

                {/* Timestamp */}
                <p className="mt-2 text-right text-xs text-zinc-400 dark:text-zinc-500">
                  {new Date(scenario.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {scenarios.length === 0 && (
        <div className="px-5 pb-5 text-center text-sm text-zinc-400 dark:text-zinc-500">
          Ask &quot;What if...&quot; questions to explore alternative scenarios.
        </div>
      )}
    </div>
  );
}
