"use client";

import { ConnectionStatus } from "@/store/evaluationStore";

interface ConnectionBannerProps {
  status: ConnectionStatus;
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { dotColor: string; bgColor: string; label: string; animate: boolean }
> = {
  connected: {
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    label: "Connected",
    animate: false,
  },
  connecting: {
    dotColor: "bg-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    label: "Connecting...",
    animate: true,
  },
  disconnected: {
    dotColor: "bg-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    label: "Disconnected",
    animate: false,
  },
};

export default function ConnectionBanner({ status }: ConnectionBannerProps) {
  // Hide the banner when connected to reduce visual noise
  if (status === "connected") {
    return null;
  }

  const config = STATUS_CONFIG[status];

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${config.bgColor}`}
    >
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${config.dotColor} ${
          config.animate ? "animate-pulse" : ""
        }`}
      />
      <span className="font-medium text-zinc-700 dark:text-zinc-300">
        {config.label}
      </span>
    </div>
  );
}
