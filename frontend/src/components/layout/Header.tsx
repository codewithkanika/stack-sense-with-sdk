import { Layers } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2">
        <Layers className="h-6 w-6 text-blue-600" />
        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          StackAdvisor
        </span>
      </div>
      <span className="text-sm text-zinc-500">AI-Powered Tech Stack Evaluation</span>
    </header>
  );
}
