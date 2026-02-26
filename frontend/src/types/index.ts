// ---- WebSocket Message Types ----

// Client -> Server message types
type ClientMessageType =
  | "user_message"
  | "start_evaluation"
  | "approval_response"
  | "scenario_query";

// Server -> Client message types
type ServerMessageType =
  | "agent_message"
  | "agent_thinking"
  | "approval_request"
  | "recommendation"
  | "progress_update"
  | "evaluation_complete"
  | "error";

export type WSMessageType = ClientMessageType | ServerMessageType;

// ---- Core Interfaces ----

export interface ProjectRequirements {
  project_description: string;
  project_type:
    | "web_app"
    | "mobile_app"
    | "api_service"
    | "data_pipeline"
    | "e_commerce"
    | "saas"
    | "ml_platform"
    | "iot"
    | "cli_tool"
    | "library";
  expected_users: "< 1K" | "1K-100K" | "100K-1M" | "1M-10M" | "10M+";
  budget: "bootstrap" | "startup" | "mid_range" | "enterprise";
  team_size: number;
  team_experience: "junior" | "mid" | "senior" | "mixed";
  language_preferences: string[];
  compliance_needs: string[];
  timeline: "1_month" | "3_months" | "6_months" | "12_months";
  existing_stack: string | null;
  priorities: Record<string, number>;
}

export interface TechRecommendation {
  category:
    | "frontend"
    | "backend"
    | "database"
    | "infrastructure"
    | "cache"
    | "search";
  technology: string;
  confidence: number;
  justification: string;
  pros: string[];
  cons: string[];
  monthly_cost_estimate: string | null;
  learning_curve: "low" | "medium" | "high";
  community_score: "small" | "growing" | "large" | "massive";
}

export interface StackRecommendation {
  primary: TechRecommendation[];
  alternatives: Record<string, TechRecommendation[]>;
  overall_justification: string;
  estimated_monthly_cost: string;
  scalability_assessment: string;
  risk_factors: string[];
}

export interface WSMessage {
  type: WSMessageType;
  payload: Record<string, unknown>;
  session_id: string;
  timestamp: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  proposed_stack: StackRecommendation;
  options: string[];
}

export interface ApprovalResponse {
  request_id: string;
  decision: "approve" | "modify" | "reject";
  feedback: string | null;
}

export interface ScenarioResult {
  id: string;
  query: string;
  analysis: string;
  timestamp: string;
}
