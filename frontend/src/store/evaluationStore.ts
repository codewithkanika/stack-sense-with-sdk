import { create } from "zustand";
import {
  StackRecommendation,
  ApprovalRequest,
  ScenarioResult,
} from "@/types";

export type { ScenarioResult };

export type Phase =
  | "input"
  | "chatting"
  | "evaluating"
  | "awaiting_approval"
  | "completed";

export type ConnectionStatus = "disconnected" | "connecting" | "connected";
export type SubagentStatus = "pending" | "running" | "done";

export interface ChatMessage {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
  type?: string; // for special messages like approval_request, progress_update
}

interface EvaluationStore {
  sessionId: string | null;
  setSessionId: (id: string) => void;

  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;

  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;

  phase: Phase;
  setPhase: (phase: Phase) => void;

  progress: Record<string, SubagentStatus>;
  setProgress: (key: string, status: SubagentStatus) => void;

  recommendation: StackRecommendation | null;
  setRecommendation: (rec: StackRecommendation) => void;

  pendingApproval: ApprovalRequest | null;
  setPendingApproval: (req: ApprovalRequest | null) => void;

  scenarios: ScenarioResult[];
  addScenario: (s: ScenarioResult) => void;

  reset: () => void;
}

const initialState = {
  sessionId: null,
  connectionStatus: "disconnected" as ConnectionStatus,
  messages: [] as ChatMessage[],
  phase: "input" as Phase,
  progress: {} as Record<string, SubagentStatus>,
  recommendation: null,
  pendingApproval: null,
  scenarios: [] as ScenarioResult[],
};

export const useEvaluationStore = create<EvaluationStore>((set) => ({
  ...initialState,

  setSessionId: (id) => set({ sessionId: id }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setPhase: (phase) => set({ phase }),

  setProgress: (key, status) =>
    set((state) => ({
      progress: { ...state.progress, [key]: status },
    })),

  setRecommendation: (rec) => set({ recommendation: rec }),

  setPendingApproval: (req) => set({ pendingApproval: req }),

  addScenario: (s) =>
    set((state) => ({ scenarios: [...state.scenarios, s] })),

  reset: () => set(initialState),
}));
