import { render, screen } from "@testing-library/react";
import TradeoffChart from "@/components/results/TradeoffChart";
import type { TechRecommendation } from "@/types";

// Mock recharts since it doesn't render in jsdom
jest.mock("recharts", () => ({
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Radar: ({ name }: { name: string }) => (
    <div data-testid={`radar-${name}`} />
  ),
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

const techs: TechRecommendation[] = [
  {
    category: "backend",
    technology: "FastAPI",
    confidence: 90,
    justification: "Fast",
    pros: ["Speed"],
    cons: ["New"],
    monthly_cost_estimate: "$50",
    learning_curve: "low",
    community_score: "growing",
  },
  {
    category: "backend",
    technology: "Django",
    confidence: 85,
    justification: "Mature",
    pros: ["Stable"],
    cons: ["Heavy"],
    monthly_cost_estimate: "$60",
    learning_curve: "medium",
    community_score: "massive",
  },
];

describe("TradeoffChart", () => {
  it("renders chart with technologies", () => {
    render(<TradeoffChart technologies={techs} />);
    expect(screen.getByTestId("radar-chart")).toBeInTheDocument();
    expect(screen.getByTestId("radar-FastAPI")).toBeInTheDocument();
    expect(screen.getByTestId("radar-Django")).toBeInTheDocument();
  });

  it("shows empty message when no technologies", () => {
    render(<TradeoffChart technologies={[]} />);
    expect(
      screen.getByText("No technologies to compare.")
    ).toBeInTheDocument();
  });

  it("renders chart title", () => {
    render(<TradeoffChart technologies={techs} />);
    expect(screen.getByText("Trade-off Comparison")).toBeInTheDocument();
  });
});
