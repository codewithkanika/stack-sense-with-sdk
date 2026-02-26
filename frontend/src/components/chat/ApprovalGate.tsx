"use client";

import { useState } from "react";
import { Check, X, MessageSquare } from "lucide-react";
import { ApprovalRequest } from "@/types";

type Decision = "approve" | "modify" | "reject";

interface ApprovalGateProps {
  approval: ApprovalRequest;
  send: (data: Record<string, unknown>) => void;
}

const BORDER_COLORS: Record<string, string> = {
  pending: "border-yellow-400",
  approve: "border-green-500",
  modify: "border-yellow-500",
  reject: "border-red-500",
};

const BG_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 dark:bg-yellow-950/30",
  approve: "bg-green-50 dark:bg-green-950/30",
  modify: "bg-yellow-50 dark:bg-yellow-950/30",
  reject: "bg-red-50 dark:bg-red-950/30",
};

const DECISION_LABELS: Record<Decision, string> = {
  approve: "Approved",
  modify: "Modification Requested",
  reject: "Rejected",
};

export default function ApprovalGate({ approval, send }: ApprovalGateProps) {
  const [decided, setDecided] = useState<Decision | null>(null);
  const [showModifyInput, setShowModifyInput] = useState(false);
  const [feedback, setFeedback] = useState("");

  const status = decided ?? "pending";
  const borderColor = BORDER_COLORS[status];
  const bgColor = BG_COLORS[status];

  const handleDecision = (decision: Decision) => {
    if (decided) return; // already acted

    if (decision === "modify" && !showModifyInput) {
      setShowModifyInput(true);
      return;
    }

    setDecided(decision);
    setShowModifyInput(false);

    send({
      type: "approval_response",
      payload: {
        request_id: approval.id,
        decision,
        feedback: decision === "modify" ? feedback : null,
      },
    });
  };

  return (
    <div
      className={`rounded-xl border-2 ${borderColor} ${bgColor} p-4 shadow-sm transition-colors`}
    >
      {/* Header */}
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {approval.title}
      </h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {approval.description}
      </p>

      {/* Stack summary chips */}
      {approval.proposed_stack?.primary &&
        approval.proposed_stack.primary.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {approval.proposed_stack.primary.map((tech) => (
              <span
                key={tech.category}
                className="inline-flex items-center rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
              >
                {tech.category}: {tech.technology}
              </span>
            ))}
          </div>
        )}

      {/* Decision state or action buttons */}
      {decided ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Decision:{" "}
            <span
              className={
                decided === "approve"
                  ? "text-green-600 dark:text-green-400"
                  : decided === "reject"
                    ? "text-red-600 dark:text-red-400"
                    : "text-yellow-600 dark:text-yellow-400"
              }
            >
              {DECISION_LABELS[decided]}
            </span>
          </p>
          {decided === "modify" && feedback && (
            <p className="mt-1 text-sm italic text-zinc-500 dark:text-zinc-400">
              Feedback: &ldquo;{feedback}&rdquo;
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {/* Modify text input */}
          {showModifyInput && (
            <div className="flex gap-2">
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe what you'd like changed..."
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && feedback.trim()) {
                    handleDecision("modify");
                  }
                }}
              />
              <button
                onClick={() => handleDecision("modify")}
                disabled={!feedback.trim()}
                className="rounded-lg bg-yellow-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-yellow-600 disabled:opacity-40"
              >
                Send
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleDecision("approve")}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => handleDecision("modify")}
              className="flex items-center gap-1.5 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600"
            >
              <MessageSquare className="h-4 w-4" />
              Modify
            </button>
            <button
              onClick={() => handleDecision("reject")}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
