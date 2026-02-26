import { useEvaluationStore, ChatMessage } from "@/store/evaluationStore";

describe("evaluationStore", () => {
  beforeEach(() => {
    useEvaluationStore.getState().reset();
  });

  it("has correct initial state", () => {
    const state = useEvaluationStore.getState();
    expect(state.sessionId).toBeNull();
    expect(state.connectionStatus).toBe("disconnected");
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.phase).toBe("input");
    expect(state.recommendation).toBeNull();
    expect(state.pendingApproval).toBeNull();
    expect(state.scenarios).toEqual([]);
  });

  it("setSessionId updates sessionId", () => {
    useEvaluationStore.getState().setSessionId("test-123");
    expect(useEvaluationStore.getState().sessionId).toBe("test-123");
  });

  it("setConnectionStatus updates status", () => {
    useEvaluationStore.getState().setConnectionStatus("connected");
    expect(useEvaluationStore.getState().connectionStatus).toBe("connected");
  });

  it("setIsLoading updates loading state", () => {
    useEvaluationStore.getState().setIsLoading(true);
    expect(useEvaluationStore.getState().isLoading).toBe(true);
  });

  it("setError updates error", () => {
    useEvaluationStore.getState().setError("Something went wrong");
    expect(useEvaluationStore.getState().error).toBe("Something went wrong");
  });

  it("addMessage appends a message", () => {
    const msg: ChatMessage = {
      id: "1",
      role: "user",
      content: "Hello",
      timestamp: new Date(),
    };
    useEvaluationStore.getState().addMessage(msg);
    expect(useEvaluationStore.getState().messages).toHaveLength(1);
    expect(useEvaluationStore.getState().messages[0].content).toBe("Hello");
  });

  it("addMessage preserves existing messages", () => {
    const msg1: ChatMessage = {
      id: "1",
      role: "user",
      content: "First",
      timestamp: new Date(),
    };
    const msg2: ChatMessage = {
      id: "2",
      role: "agent",
      content: "Second",
      timestamp: new Date(),
    };
    useEvaluationStore.getState().addMessage(msg1);
    useEvaluationStore.getState().addMessage(msg2);
    expect(useEvaluationStore.getState().messages).toHaveLength(2);
  });

  it("setPhase updates phase", () => {
    useEvaluationStore.getState().setPhase("evaluating");
    expect(useEvaluationStore.getState().phase).toBe("evaluating");
  });

  it("setProgress updates progress map", () => {
    useEvaluationStore.getState().setProgress("frontend-evaluator", "running");
    expect(useEvaluationStore.getState().progress["frontend-evaluator"]).toBe(
      "running"
    );
  });

  it("setRecommendation stores recommendation", () => {
    const rec = {
      primary: [],
      alternatives: {},
      overall_justification: "Test",
      estimated_monthly_cost: "$100",
      scalability_assessment: "Good",
      risk_factors: [],
    };
    useEvaluationStore.getState().setRecommendation(rec);
    expect(useEvaluationStore.getState().recommendation).toEqual(rec);
  });

  it("setPendingApproval stores and clears approval", () => {
    const approval = {
      id: "a1",
      title: "Review",
      description: "Please review",
      proposed_stack: {
        primary: [],
        alternatives: {},
        overall_justification: "",
        estimated_monthly_cost: "",
        scalability_assessment: "",
        risk_factors: [],
      },
      options: ["approve", "reject"],
    };
    useEvaluationStore.getState().setPendingApproval(approval);
    expect(useEvaluationStore.getState().pendingApproval).toEqual(approval);

    useEvaluationStore.getState().setPendingApproval(null);
    expect(useEvaluationStore.getState().pendingApproval).toBeNull();
  });

  it("addScenario appends scenarios", () => {
    useEvaluationStore.getState().addScenario({
      id: "s1",
      query: "What if we use Go?",
      analysis: "Go would improve performance",
      timestamp: new Date().toISOString(),
    });
    expect(useEvaluationStore.getState().scenarios).toHaveLength(1);
  });

  it("reset restores initial state", () => {
    useEvaluationStore.getState().setSessionId("test");
    useEvaluationStore.getState().setPhase("completed");
    useEvaluationStore.getState().setIsLoading(true);
    useEvaluationStore.getState().reset();

    const state = useEvaluationStore.getState();
    expect(state.sessionId).toBeNull();
    expect(state.phase).toBe("input");
    expect(state.isLoading).toBe(false);
  });
});
