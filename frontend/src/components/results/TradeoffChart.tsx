"use client";

import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TechRecommendation } from "@/types";

interface TradeoffChartProps {
  technologies: TechRecommendation[];
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];

const COMMUNITY_SCORES: Record<string, number> = {
  massive: 10,
  large: 8,
  growing: 6,
  small: 4,
};

const LEARNING_CURVE_DX: Record<string, number> = {
  low: 9,
  medium: 6,
  high: 3,
};

function inferCostEfficiency(costStr: string | null): number {
  if (!costStr) return 5;
  const num = parseFloat(costStr.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return 5;
  // Lower cost = higher efficiency. Scale: $0=10, $500+=2
  if (num <= 50) return 9;
  if (num <= 100) return 8;
  if (num <= 200) return 7;
  if (num <= 500) return 5;
  return 3;
}

function deriveAxes(tech: TechRecommendation) {
  const community = COMMUNITY_SCORES[tech.community_score] ?? 6;
  const dx = LEARNING_CURVE_DX[tech.learning_curve] ?? 6;
  const costEff = inferCostEfficiency(tech.monthly_cost_estimate);
  const base = tech.confidence / 10; // 0-10 scale

  return {
    Scalability: Math.min(10, Math.round(base * 1.05)),
    "Cost Efficiency": costEff,
    "Developer Experience": dx,
    Performance: Math.min(10, Math.round(base * 0.95 + 0.5)),
    Security: Math.min(10, Math.round(base * 0.9 + 1)),
    Community: community,
  };
}

type AxisKey = ReturnType<typeof deriveAxes>;

export default function TradeoffChart({ technologies }: TradeoffChartProps) {
  const chartData = useMemo(() => {
    const axes = [
      "Scalability",
      "Cost Efficiency",
      "Developer Experience",
      "Performance",
      "Security",
      "Community",
    ] as const;

    // Build per-tech axis values
    const techAxes = technologies.map((t) => ({
      name: t.technology,
      values: deriveAxes(t),
    }));

    // Shape data for Recharts: one entry per axis, with a key per technology
    return axes.map((axis) => {
      const entry: Record<string, string | number> = { axis };
      for (const t of techAxes) {
        entry[t.name] = t.values[axis as keyof AxisKey];
      }
      return entry;
    });
  }, [technologies]);

  if (technologies.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        No technologies to compare.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Trade-off Comparison
      </h3>
      <ResponsiveContainer width="100%" height={380}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
          <PolarGrid stroke="#d4d4d8" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#71717a", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
          />
          {technologies.map((tech, idx) => (
            <Radar
              key={tech.technology}
              name={tech.technology}
              dataKey={tech.technology}
              stroke={COLORS[idx % COLORS.length]}
              fill={COLORS[idx % COLORS.length]}
              fillOpacity={0.15}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
