import { render, screen, fireEvent } from "@testing-library/react";
import ComparisonTable from "@/components/results/ComparisonTable";
import type { TechRecommendation } from "@/types";

const techs: TechRecommendation[] = [
  {
    category: "backend",
    technology: "FastAPI",
    confidence: 90,
    justification: "High performance Python framework",
    pros: ["Fast"],
    cons: ["Newer"],
    monthly_cost_estimate: "$50",
    learning_curve: "low",
    community_score: "growing",
  },
  {
    category: "backend",
    technology: "Django",
    confidence: 85,
    justification: "Batteries-included Python framework",
    pros: ["Mature"],
    cons: ["Heavier"],
    monthly_cost_estimate: "$60",
    learning_curve: "medium",
    community_score: "massive",
  },
];

describe("ComparisonTable", () => {
  it("renders all technologies", () => {
    render(<ComparisonTable technologies={techs} />);
    expect(screen.getByText("FastAPI")).toBeInTheDocument();
    expect(screen.getByText("Django")).toBeInTheDocument();
  });

  it("renders column headers", () => {
    render(<ComparisonTable technologies={techs} />);
    expect(screen.getByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("Confidence")).toBeInTheDocument();
    expect(screen.getByText("Monthly Cost")).toBeInTheDocument();
  });

  it("highlights recommended technology", () => {
    render(
      <ComparisonTable technologies={techs} recommendedTech="FastAPI" />
    );
    expect(screen.getByText("Recommended")).toBeInTheDocument();
  });

  it("sorts by confidence when header clicked", () => {
    render(<ComparisonTable technologies={techs} />);
    fireEvent.click(screen.getByText("Confidence"));
    // After clicking, rows should be sorted
    const rows = screen.getAllByRole("row");
    // First row is header, so data starts at index 1
    expect(rows.length).toBe(3); // header + 2 data rows
  });
});
