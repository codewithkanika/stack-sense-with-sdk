"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEvaluationStore } from "@/store/evaluationStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import ConnectionBanner from "@/components/layout/ConnectionBanner";
import ChatPanel from "@/components/chat/ChatPanel";
import RecommendationCard from "@/components/results/RecommendationCard";
import AlternativeStacks from "@/components/results/AlternativeStacks";
import TradeoffChart from "@/components/results/TradeoffChart";
import ScenarioPanel from "@/components/results/ScenarioPanel";

// ---------------------------------------------------------------------------
// Welcome / loading state shown before any results arrive
// ---------------------------------------------------------------------------
function WelcomeState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40">
        <svg
          className="h-8 w-8 text-blue-600 dark:text-blue-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Ready to Evaluate
      </h2>
      <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        Describe your project requirements in the chat and the AI agents will
        analyze the best tech stack for your needs. Results will appear here as
        the evaluation progresses.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard content (reads search params, so must be inside Suspense)
// ---------------------------------------------------------------------------
function EvaluateContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const {
    setSessionId,
    recommendation,
    phase,
    connectionStatus,
    scenarios,
  } = useEvaluationStore();

  const { send } = useWebSocket(sessionId);

  // Sync sessionId from URL into the store on mount / change
  useEffect(() => {
    if (sessionId) {
      setSessionId(sessionId);
    }
  }, [sessionId, setSessionId]);

  const hasRecommendation = recommendation !== null;
  const hasAlternatives =
    hasRecommendation &&
    Object.keys(recommendation.alternatives).length > 0;
  const hasPrimaryTechs =
    hasRecommendation && recommendation.primary.length > 0;

  // Show results panel once evaluation starts, completes, or has data
  const showResults =
    hasRecommendation || phase === "evaluating" || phase === "completed";

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col lg:flex-row">
      {/* ---- Left panel: Chat (40%) ---- */}
      <div className="flex h-1/2 flex-col border-b border-zinc-200 dark:border-zinc-800 lg:h-full lg:w-2/5 lg:border-b-0 lg:border-r">
        <ChatPanel />
      </div>

      {/* ---- Right panel: Results (60%) ---- */}
      <div className="flex h-1/2 flex-col lg:h-full lg:w-3/5">
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Connection status banner (hidden when connected) */}
          <div className="mb-4">
            <ConnectionBanner status={connectionStatus} />
          </div>

          {!showResults ? (
            <WelcomeState />
          ) : (
            <div className="space-y-6">
              {/* Evaluating indicator */}
              {phase === "evaluating" && !hasRecommendation && (
                <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/40">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Evaluation in progress...
                  </span>
                </div>
              )}

              {/* Recommendation cards in a 2-column grid */}
              {hasPrimaryTechs && (
                <section>
                  <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Recommendations
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {recommendation.primary.map((tech) => (
                      <RecommendationCard
                        key={`${tech.category}-${tech.technology}`}
                        recommendation={tech}
                      />
                    ))}
                  </div>
                  {recommendation.overall_justification && (
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {recommendation.overall_justification}
                    </p>
                  )}
                </section>
              )}

              {/* Alternative stacks */}
              {hasAlternatives && (
                <section>
                  <AlternativeStacks
                    alternatives={recommendation.alternatives}
                  />
                </section>
              )}

              {/* Tradeoff radar chart */}
              {hasPrimaryTechs && (
                <section>
                  <TradeoffChart technologies={recommendation.primary} />
                </section>
              )}

              {/* Scenario planning -- always visible when results are shown
                  so users can ask "What if..." questions */}
              <section>
                <ScenarioPanel scenarios={scenarios} send={send} />
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export -- Suspense boundary required by Next.js 15 for useSearchParams
// ---------------------------------------------------------------------------
export default function EvaluatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-65px)] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm text-zinc-500">Loading...</span>
          </div>
        </div>
      }
    >
      <EvaluateContent />
    </Suspense>
  );
}
