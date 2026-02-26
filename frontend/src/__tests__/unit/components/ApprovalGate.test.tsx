import { render, screen, fireEvent } from "@testing-library/react";
import ApprovalGate from "@/components/chat/ApprovalGate";
import type { ApprovalRequest } from "@/types";

const mockApproval: ApprovalRequest = {
  id: "req-1",
  title: "Stack Recommendation",
  description: "Please review the proposed stack",
  proposed_stack: {
    primary: [
      {
        category: "backend",
        technology: "FastAPI",
        confidence: 90,
        justification: "Good fit",
        pros: ["Fast"],
        cons: ["New"],
        monthly_cost_estimate: null,
        learning_curve: "low",
        community_score: "growing",
      },
    ],
    alternatives: {},
    overall_justification: "Solid choice",
    estimated_monthly_cost: "$100",
    scalability_assessment: "Good",
    risk_factors: [],
  },
  options: ["approve", "modify", "reject"],
};

describe("ApprovalGate", () => {
  it("renders title and description", () => {
    const send = jest.fn();
    render(<ApprovalGate approval={mockApproval} send={send} />);
    expect(screen.getByText("Stack Recommendation")).toBeInTheDocument();
    expect(
      screen.getByText("Please review the proposed stack")
    ).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    const send = jest.fn();
    render(<ApprovalGate approval={mockApproval} send={send} />);
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Modify")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
  });

  it("sends approve response on click", () => {
    const send = jest.fn();
    render(<ApprovalGate approval={mockApproval} send={send} />);
    fireEvent.click(screen.getByText("Approve"));
    expect(send).toHaveBeenCalledWith({
      type: "approval_response",
      payload: {
        request_id: "req-1",
        decision: "approve",
        feedback: null,
      },
    });
  });

  it("shows approved state after clicking approve", () => {
    const send = jest.fn();
    render(<ApprovalGate approval={mockApproval} send={send} />);
    fireEvent.click(screen.getByText("Approve"));
    expect(screen.getByText("Approved")).toBeInTheDocument();
    // Buttons should be gone
    expect(screen.queryByText("Reject")).not.toBeInTheDocument();
  });

  it("sends reject response on click", () => {
    const send = jest.fn();
    render(<ApprovalGate approval={mockApproval} send={send} />);
    fireEvent.click(screen.getByText("Reject"));
    expect(send).toHaveBeenCalledWith({
      type: "approval_response",
      payload: {
        request_id: "req-1",
        decision: "reject",
        feedback: null,
      },
    });
  });

  it("shows tech stack chips", () => {
    const send = jest.fn();
    render(<ApprovalGate approval={mockApproval} send={send} />);
    expect(screen.getByText("backend: FastAPI")).toBeInTheDocument();
  });
});
