"use client";

interface CriteriaSlidersProps {
  priorities: Record<string, number>;
  onChange: (priorities: Record<string, number>) => void;
}

const CRITERIA = [
  { key: "scalability", label: "Scalability" },
  { key: "cost", label: "Cost" },
  { key: "developer_experience", label: "Developer Experience" },
  { key: "performance", label: "Performance" },
  { key: "security", label: "Security" },
] as const;

export default function CriteriaSliders({
  priorities,
  onChange,
}: CriteriaSlidersProps) {
  const handleChange = (key: string, value: number) => {
    onChange({ ...priorities, [key]: value });
  };

  return (
    <div className="space-y-5">
      {CRITERIA.map(({ key, label }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={`slider-${key}`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {label}
            </label>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums w-6 text-right">
              {priorities[key] ?? 5}
            </span>
          </div>
          <input
            id={`slider-${key}`}
            type="range"
            min={1}
            max={10}
            step={1}
            value={priorities[key] ?? 5}
            onChange={(e) => handleChange(key, Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700 accent-blue-600"
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-xs text-zinc-400">Low</span>
            <span className="text-xs text-zinc-400">High</span>
          </div>
        </div>
      ))}
    </div>
  );
}
