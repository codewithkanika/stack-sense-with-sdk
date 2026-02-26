"use client";

import { useState, useMemo } from "react";
import type { TechRecommendation } from "@/types";
import ComparisonTable from "./ComparisonTable";

interface AlternativeStacksProps {
  alternatives: Record<string, TechRecommendation[]>;
  recommendedTechs?: Record<string, string>;
}

const TAB_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  infrastructure: "Infrastructure",
  cache: "Cache",
  search: "Search",
};

export default function AlternativeStacks({
  alternatives,
  recommendedTechs,
}: AlternativeStacksProps) {
  const categories = useMemo(
    () => Object.keys(alternatives).filter((k) => alternatives[k].length > 0),
    [alternatives]
  );

  const [activeTab, setActiveTab] = useState<string>(categories[0] ?? "");

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        No alternative stacks available.
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === cat
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {TAB_LABELS[cat] ?? cat}
            <span className="ml-1.5 text-xs text-zinc-400 dark:text-zinc-500">
              ({alternatives[cat].length})
            </span>
          </button>
        ))}
      </div>

      {/* Table for active tab */}
      {activeTab && alternatives[activeTab] && (
        <ComparisonTable
          technologies={alternatives[activeTab]}
          recommendedTech={recommendedTechs?.[activeTab]}
        />
      )}
    </div>
  );
}
