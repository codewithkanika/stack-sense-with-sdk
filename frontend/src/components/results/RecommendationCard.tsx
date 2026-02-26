"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";
import type { TechRecommendation } from "@/types";

interface RecommendationCardProps {
  recommendation: TechRecommendation;
}

const CATEGORY_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  infrastructure: "Infrastructure",
  cache: "Cache",
  search: "Search",
};

function confidenceColor(confidence: number): string {
  if (confidence >= 80) return "bg-green-500";
  if (confidence >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function confidenceTrackColor(confidence: number): string {
  if (confidence >= 80) return "bg-green-100 dark:bg-green-950";
  if (confidence >= 60) return "bg-yellow-100 dark:bg-yellow-950";
  return "bg-red-100 dark:bg-red-950";
}

function learningCurveBadge(curve: TechRecommendation["learning_curve"]) {
  const colors: Record<string, string> = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return colors[curve] ?? colors.medium;
}

function communityBadge(score: TechRecommendation["community_score"]) {
  const colors: Record<string, string> = {
    massive:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    large:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    growing:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    small:
      "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  };
  return colors[score] ?? colors.growing;
}

export default function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const {
    category,
    technology,
    confidence,
    justification,
    pros,
    cons,
    monthly_cost_estimate,
    learning_curve,
    community_score,
  } = recommendation;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {/* Category label */}
      <div className="px-5 pt-4 pb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {CATEGORY_LABELS[category] ?? category}
        </span>
      </div>

      {/* Technology name */}
      <div className="px-5 pb-3">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {technology}
        </h3>
      </div>

      {/* Confidence bar */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Confidence
          </span>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">
            {confidence}%
          </span>
        </div>
        <div
          className={`h-2 w-full rounded-full ${confidenceTrackColor(confidence)}`}
        >
          <div
            className={`h-2 rounded-full transition-all ${confidenceColor(confidence)}`}
            style={{ width: `${Math.min(confidence, 100)}%` }}
          />
        </div>
      </div>

      {/* Justification */}
      <div className="px-5 pb-3">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {justification}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 px-5 pb-4">
        {monthly_cost_estimate && (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            {monthly_cost_estimate}/mo
          </span>
        )}
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${learningCurveBadge(learning_curve)}`}
        >
          Learning: {learning_curve}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${communityBadge(community_score)}`}
        >
          Community: {community_score}
        </span>
      </div>

      {/* Expandable pros/cons */}
      <div className="border-t border-zinc-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
        >
          <span>Pros &amp; Cons</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expanded && (
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
            {/* Pros */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                Pros
              </h4>
              <ul className="space-y-1.5">
                {pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                Cons
              </h4>
              <ul className="space-y-1.5">
                {cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
