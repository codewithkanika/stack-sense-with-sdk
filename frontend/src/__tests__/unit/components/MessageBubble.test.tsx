import { render, screen } from "@testing-library/react";
import MessageBubble from "@/components/chat/MessageBubble";
import { ChatMessage } from "@/store/evaluationStore";

describe("MessageBubble", () => {
  it("renders user message right-aligned", () => {
    const msg: ChatMessage = {
      id: "1",
      role: "user",
      content: "Hello agent",
      timestamp: new Date(),
    };
    render(<MessageBubble message={msg} />);
    expect(screen.getByText("Hello agent")).toBeInTheDocument();
  });

  it("renders agent message left-aligned", () => {
    const msg: ChatMessage = {
      id: "2",
      role: "agent",
      content: "I recommend React",
      timestamp: new Date(),
    };
    render(<MessageBubble message={msg} />);
    expect(screen.getByText("I recommend React")).toBeInTheDocument();
  });

  it("renders system message centered", () => {
    const msg: ChatMessage = {
      id: "3",
      role: "system",
      content: "Evaluation complete!",
      timestamp: new Date(),
    };
    render(<MessageBubble message={msg} />);
    expect(screen.getByText("Evaluation complete!")).toBeInTheDocument();
  });

  it("displays timestamp", () => {
    const date = new Date(2024, 5, 15, 14, 30);
    const msg: ChatMessage = {
      id: "4",
      role: "user",
      content: "Test",
      timestamp: date,
    };
    render(<MessageBubble message={msg} />);
    // Timestamp should be rendered as a time element
    const timeEl = document.querySelector("time");
    expect(timeEl).toBeInTheDocument();
  });
});
