import { render, screen, fireEvent } from "@testing-library/react";
import RecommendationCard from "@/components/results/RecommendationCard";
import type { TechRecommendation } from "@/types";

const mockRec: TechRecommendation = {
  category: "frontend",
  technology: "React",
  confidence: 85,
  justification: "Mature ecosystem with large community",
  pros: ["Large community", "Rich ecosystem"],
  cons: ["Bundle size can grow"],
  monthly_cost_estimate: "$0",
  learning_curve: "medium",
  community_score: "massive",
};

describe("RecommendationCard", () => {
  it("renders technology name and category", () => {
    render(<RecommendationCard recommendation={mockRec} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Frontend")).toBeInTheDocument();
  });

  it("shows confidence percentage", () => {
    render(<RecommendationCard recommendation={mockRec} />);
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("displays justification", () => {
    render(<RecommendationCard recommendation={mockRec} />);
    expect(
      screen.getByText("Mature ecosystem with large community")
    ).toBeInTheDocument();
  });

  it("shows learning curve and community badges", () => {
    render(<RecommendationCard recommendation={mockRec} />);
    expect(screen.getByText("Learning: medium")).toBeInTheDocument();
    expect(screen.getByText("Community: massive")).toBeInTheDocument();
  });

  it("expands to show pros and cons on click", () => {
    render(<RecommendationCard recommendation={mockRec} />);
    // Pros/cons should be hidden initially
    expect(screen.queryByText("Large community")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText("Pros & Cons"));
    expect(screen.getByText("Large community")).toBeInTheDocument();
    expect(screen.getByText("Bundle size can grow")).toBeInTheDocument();
  });
});
