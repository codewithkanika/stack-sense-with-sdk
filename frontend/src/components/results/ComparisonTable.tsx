"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { TechRecommendation } from "@/types";

interface ComparisonTableProps {
  technologies: TechRecommendation[];
  recommendedTech?: string;
}

type SortField =
  | "technology"
  | "confidence"
  | "monthly_cost_estimate"
  | "learning_curve"
  | "community_score"
  | "justification";

type SortDirection = "asc" | "desc";

const LEARNING_CURVE_ORDER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const COMMUNITY_ORDER: Record<string, number> = {
  small: 1,
  growing: 2,
  large: 3,
  massive: 4,
};

function parseCost(cost: string | null): number {
  if (!cost) return 0;
  const match = cost.replace(/[^0-9.]/g, "");
  return parseFloat(match) || 0;
}

function SortIndicator({
  field,
  activeField,
  direction,
}: {
  field: SortField;
  activeField: SortField | null;
  direction: SortDirection;
}) {
  if (field !== activeField) {
    return (
      <span className="ml-1 inline-flex flex-col text-zinc-300 dark:text-zinc-600">
        <ChevronUp className="h-3 w-3 -mb-1" />
        <ChevronDown className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span className="ml-1 inline-flex items-center">
      {direction === "asc" ? (
        <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
      ) : (
        <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
      )}
    </span>
  );
}

export default function ComparisonTable({
  technologies,
  recommendedTech,
}: ComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sorted = useMemo(() => {
    if (!sortField) return technologies;

    return [...technologies].sort((a, b) => {
      let cmp = 0;

      switch (sortField) {
        case "technology":
          cmp = a.technology.localeCompare(b.technology);
          break;
        case "confidence":
          cmp = a.confidence - b.confidence;
          break;
        case "monthly_cost_estimate":
          cmp = parseCost(a.monthly_cost_estimate) - parseCost(b.monthly_cost_estimate);
          break;
        case "learning_curve":
          cmp =
            (LEARNING_CURVE_ORDER[a.learning_curve] ?? 0) -
            (LEARNING_CURVE_ORDER[b.learning_curve] ?? 0);
          break;
        case "community_score":
          cmp =
            (COMMUNITY_ORDER[a.community_score] ?? 0) -
            (COMMUNITY_ORDER[b.community_score] ?? 0);
          break;
        case "justification":
          cmp = a.justification.localeCompare(b.justification);
          break;
      }

      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [technologies, sortField, sortDirection]);

  const columns: { key: SortField; label: string }[] = [
    { key: "technology", label: "Technology" },
    { key: "confidence", label: "Confidence" },
    { key: "monthly_cost_estimate", label: "Monthly Cost" },
    { key: "learning_curve", label: "Learning Curve" },
    { key: "community_score", label: "Community" },
    { key: "justification", label: "Justification" },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            {columns.map(({ key, label }) => (
              <th
                key={key}
                scope="col"
                className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                onClick={() => handleSort(key)}
              >
                <span className="inline-flex items-center">
                  {label}
                  <SortIndicator
                    field={key}
                    activeField={sortField}
                    direction={sortDirection}
                  />
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
          {sorted.map((tech) => {
            const isRecommended = recommendedTech === tech.technology;
            return (
              <tr
                key={tech.technology}
                className={
                  isRecommended
                    ? "bg-blue-50 dark:bg-blue-950/30"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {tech.technology}
                  {isRecommended && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Recommended
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                  {tech.confidence}%
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                  {tech.monthly_cost_estimate ?? "N/A"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-zinc-700 dark:text-zinc-300">
                  {tech.learning_curve}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-zinc-700 dark:text-zinc-300">
                  {tech.community_score}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {tech.justification}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
