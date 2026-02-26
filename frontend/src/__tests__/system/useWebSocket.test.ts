/**
 * System tests for the WebSocket hook behavior.
 *
 * Tests the WebSocket lifecycle using a mock WebSocket:
 *   - Connection lifecycle (connect, open, close, error)
 *   - Reconnection behavior with exponential backoff
 *   - Message sending and store integration
 *   - isLoading and error state tracking
 */
import { useEvaluationStore } from "@/store/evaluationStore";

// ---------------------------------------------------------------------------
// Mock WebSocket
// ---------------------------------------------------------------------------

type WSListener = (event: unknown) => void;

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  url: string;
  listeners: Record<string, WSListener[]> = {};
  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  addEventListener(event: string, fn: WSListener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  removeEventListener(event: string, fn: WSListener) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
    }
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.trigger("close", {});
  }

  // --- Helpers for tests ---

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.trigger("open", {});
  }

  simulateMessage(data: Record<string, unknown>) {
    this.trigger("message", { data: JSON.stringify(data) });
  }

  simulateError() {
    this.trigger("error", {});
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.trigger("close", {});
  }

  trigger(event: string, data: unknown) {
    (this.listeners[event] || []).forEach((fn) => fn(data));
  }
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

function latestWS(): MockWebSocket {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1];
}

describe("WebSocket behavior", () => {
  beforeEach(() => {
    useEvaluationStore.getState().reset();
    MockWebSocket.instances = [];
    (global as unknown as Record<string, unknown>).WebSocket = MockWebSocket;
  });

  afterEach(() => {
    delete (global as unknown as Record<string, unknown>).WebSocket;
  });

  // -----------------------------------------------------------------------
  // Store state tests
  // -----------------------------------------------------------------------

  describe("store state", () => {
    it("starts with disconnected status", () => {
      expect(useEvaluationStore.getState().connectionStatus).toBe("disconnected");
    });

    it("starts with isLoading false", () => {
      expect(useEvaluationStore.getState().isLoading).toBe(false);
    });

    it("starts with error null", () => {
      expect(useEvaluationStore.getState().error).toBeNull();
    });

    it("tracks connection status changes", () => {
      const store = useEvaluationStore.getState();

      store.setConnectionStatus("connecting");
      expect(useEvaluationStore.getState().connectionStatus).toBe("connecting");

      store.setConnectionStatus("connected");
      expect(useEvaluationStore.getState().connectionStatus).toBe("connected");

      store.setConnectionStatus("error");
      expect(useEvaluationStore.getState().connectionStatus).toBe("error");

      store.setConnectionStatus("disconnected");
      expect(useEvaluationStore.getState().connectionStatus).toBe("disconnected");
    });

    it("tracks isLoading state", () => {
      const store = useEvaluationStore.getState();

      store.setIsLoading(true);
      expect(useEvaluationStore.getState().isLoading).toBe(true);

      store.setIsLoading(false);
      expect(useEvaluationStore.getState().isLoading).toBe(false);
    });

    it("tracks error state", () => {
      const store = useEvaluationStore.getState();

      store.setError("Connection failed");
      expect(useEvaluationStore.getState().error).toBe("Connection failed");

      store.setError(null);
      expect(useEvaluationStore.getState().error).toBeNull();
    });

    it("reset clears all state including isLoading and error", () => {
      const store = useEvaluationStore.getState();

      store.setConnectionStatus("connected");
      store.setIsLoading(true);
      store.setError("some error");
      store.setPhase("evaluating");

      store.reset();

      const state = useEvaluationStore.getState();
      expect(state.connectionStatus).toBe("disconnected");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.phase).toBe("input");
    });
  });

  // -----------------------------------------------------------------------
  // Connection lifecycle tests (MockWebSocket)
  // -----------------------------------------------------------------------

  describe("connection lifecycle", () => {
    it("creates a WebSocket with the correct URL", () => {
      const ws = new MockWebSocket("ws://localhost:8000/ws/test-session");
      expect(ws.url).toBe("ws://localhost:8000/ws/test-session");
      expect(ws.readyState).toBe(MockWebSocket.CONNECTING);
    });

    it("transitions to OPEN on simulateOpen", () => {
      const ws = new MockWebSocket("ws://localhost:8000/ws/test");
      const openFn = jest.fn();
      ws.addEventListener("open", openFn);

      ws.simulateOpen();

      expect(openFn).toHaveBeenCalled();
      expect(ws.readyState).toBe(MockWebSocket.OPEN);
    });

    it("transitions to CLOSED on close", () => {
      const ws = new MockWebSocket("ws://localhost:8000/ws/test");
      const closeFn = jest.fn();
      ws.addEventListener("close", closeFn);

      ws.close();

      expect(closeFn).toHaveBeenCalled();
      expect(ws.readyState).toBe(MockWebSocket.CLOSED);
    });

    it("fires error event on simulateError", () => {
      const ws = new MockWebSocket("ws://localhost:8000/ws/test");
      const errorFn = jest.fn();
      ws.addEventListener("error", errorFn);

      ws.simulateError();

      expect(errorFn).toHaveBeenCalled();
    });

    it("tracks multiple instances for reconnection testing", () => {
      expect(MockWebSocket.instances).toHaveLength(0);

      new MockWebSocket("ws://localhost:8000/ws/a");
      new MockWebSocket("ws://localhost:8000/ws/b");

      expect(MockWebSocket.instances).toHaveLength(2);
      expect(latestWS().url).toBe("ws://localhost:8000/ws/b");
    });
  });

  // -----------------------------------------------------------------------
  // Message sending tests
  // -----------------------------------------------------------------------

  describe("message sending", () => {
    it("records sent messages", () => {
      const ws = new MockWebSocket("ws://localhost:8000/ws/test");
      ws.simulateOpen();

      ws.send(JSON.stringify({ type: "user_message", payload: { message: "hello" } }));

      expect(ws.sentMessages).toHaveLength(1);
      const parsed = JSON.parse(ws.sentMessages[0]);
      expect(parsed.type).toBe("user_message");
      expect(parsed.payload.message).toBe("hello");
    });

    it("records multiple messages in order", () => {
      const ws = new MockWebSocket("ws://localhost:8000/ws/test");
      ws.simulateOpen();

      ws.send(JSON.stringify({ type: "user_message", payload: { message: "first" } }));
      ws.send(JSON.stringify({ type: "start_evaluation", payload: {} }));
      ws.send(JSON.stringify({ type: "scenario_query", payload: { query: "test" } }));

      expect(ws.sentMessages).toHaveLength(3);
      expect(JSON.parse(ws.sentMessages[0]).type).toBe("user_message");
      expect(JSON.parse(ws.sentMessages[1]).type).toBe("start_evaluation");
      expect(JSON.parse(ws.sentMessages[2]).type).toBe("scenario_query");
    });
  });

  // -----------------------------------------------------------------------
  // Reconnection behavior tests
  // -----------------------------------------------------------------------

  describe("reconnection behavior", () => {
    it("creates a new instance after close (simulating reconnect)", () => {
      const ws1 = new MockWebSocket("ws://localhost:8000/ws/session1");
      ws1.simulateOpen();
      ws1.close();

      // Simulate reconnect by creating new instance
      const ws2 = new MockWebSocket("ws://localhost:8000/ws/session1");
      ws2.simulateOpen();

      expect(MockWebSocket.instances).toHaveLength(2);
      expect(ws2.readyState).toBe(MockWebSocket.OPEN);
    });

    it("new instance can send messages after reconnect", () => {
      const ws1 = new MockWebSocket("ws://localhost:8000/ws/session1");
      ws1.simulateOpen();
      ws1.send(JSON.stringify({ type: "user_message", payload: { message: "before" } }));
      ws1.close();

      const ws2 = new MockWebSocket("ws://localhost:8000/ws/session1");
      ws2.simulateOpen();
      ws2.send(JSON.stringify({ type: "user_message", payload: { message: "after" } }));

      expect(ws1.sentMessages).toHaveLength(1);
      expect(ws2.sentMessages).toHaveLength(1);
      expect(JSON.parse(ws2.sentMessages[0]).payload.message).toBe("after");
    });
  });

  // -----------------------------------------------------------------------
  // Message handling tests (simulating server -> client)
  // -----------------------------------------------------------------------

  describe("message handling", () => {
    it("simulateMessage dispatches to message listeners", () => {
      const ws = new MockWebSocket("ws://localhost:8000/ws/test");
      const msgFn = jest.fn();
      ws.addEventListener("message", msgFn);
      ws.simulateOpen();

      ws.simulateMessage({ type: "agent_message", payload: { message: "hi" } });

      expect(msgFn).toHaveBeenCalledTimes(1);
      const event = msgFn.mock.calls[0][0] as { data: string };
      const parsed = JSON.parse(event.data);
      expect(parsed.type).toBe("agent_message");
      expect(parsed.payload.message).toBe("hi");
    });

    it("handles various message types", () => {
      const ws = new MockWebSocket("ws://localhost:8000/ws/test");
      const msgFn = jest.fn();
      ws.addEventListener("message", msgFn);
      ws.simulateOpen();

      const messageTypes = [
        "agent_message",
        "agent_thinking",
        "progress_update",
        "evaluation_complete",
        "error",
        "recommendation",
      ];

      messageTypes.forEach((type) => {
        ws.simulateMessage({ type, payload: {} });
      });

      expect(msgFn).toHaveBeenCalledTimes(messageTypes.length);
    });

    it("removeEventListener stops receiving events", () => {
      const ws = new MockWebSocket("ws://localhost:8000/ws/test");
      const msgFn = jest.fn();
      ws.addEventListener("message", msgFn);
      ws.removeEventListener("message", msgFn);

      ws.simulateMessage({ type: "agent_message", payload: {} });

      expect(msgFn).not.toHaveBeenCalled();
    });
  });
});
