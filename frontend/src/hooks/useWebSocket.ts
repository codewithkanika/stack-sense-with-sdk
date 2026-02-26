"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEvaluationStore, ChatMessage } from "@/store/evaluationStore";
import { StackRecommendation, ApprovalRequest } from "@/types";

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";
const MAX_RECONNECT_DELAY = 30_000;

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useWebSocket(sessionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1_000);
  const intentionalClose = useRef(false);

  const {
    setConnectionStatus,
    addMessage,
    setPhase,
    setProgress,
    setRecommendation,
    setPendingApproval,
    connectionStatus,
  } = useEvaluationStore();

  /** Send a JSON payload over the WebSocket */
  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  /** Dispatch an incoming server message to the store */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(event.data as string);
      } catch {
        return; // ignore non-JSON frames
      }

      const type = parsed.type as string | undefined;
      const payload = (parsed.payload ?? parsed) as Record<string, unknown>;

      switch (type) {
        case "agent_message": {
          const msg: ChatMessage = {
            id: makeId(),
            role: "agent",
            content: (payload.message ?? payload.content ?? "") as string,
            timestamp: new Date(),
            type: "agent_message",
          };
          addMessage(msg);
          break;
        }

        case "agent_thinking": {
          const msg: ChatMessage = {
            id: makeId(),
            role: "system",
            content: (payload.message ?? payload.content ?? "") as string,
            timestamp: new Date(),
            type: "agent_thinking",
          };
          addMessage(msg);
          break;
        }

        case "approval_request": {
          const approval = payload as unknown as ApprovalRequest;
          setPendingApproval(approval);
          setPhase("awaiting_approval");
          const msg: ChatMessage = {
            id: makeId(),
            role: "system",
            content: "Awaiting your approval on the proposed stack.",
            timestamp: new Date(),
            type: "approval_request",
          };
          addMessage(msg);
          break;
        }

        case "recommendation": {
          const rec = payload as unknown as StackRecommendation;
          setRecommendation(rec);
          break;
        }

        case "progress_update": {
          const agent = (payload.agent ?? payload.subagent ?? "") as string;
          const status = (payload.status ?? "running") as
            | "pending"
            | "running"
            | "done";
          if (agent) {
            setProgress(agent, status);
          }
          const progressMsg: ChatMessage = {
            id: makeId(),
            role: "system",
            content:
              (payload.message as string) ??
              `${agent}: ${status}`,
            timestamp: new Date(),
            type: "progress_update",
          };
          addMessage(progressMsg);
          setPhase("evaluating");
          break;
        }

        case "evaluation_complete": {
          setPhase("completed");
          const msg: ChatMessage = {
            id: makeId(),
            role: "system",
            content: "Evaluation complete!",
            timestamp: new Date(),
            type: "evaluation_complete",
          };
          addMessage(msg);
          break;
        }

        case "error": {
          const msg: ChatMessage = {
            id: makeId(),
            role: "system",
            content:
              (payload.message ?? payload.error ?? "An error occurred.") as string,
            timestamp: new Date(),
            type: "error",
          };
          addMessage(msg);
          break;
        }

        default:
          // Unknown message type -- surface it as a system message
          if (type) {
            const msg: ChatMessage = {
              id: makeId(),
              role: "system",
              content: (payload.message ?? JSON.stringify(payload)) as string,
              timestamp: new Date(),
              type,
            };
            addMessage(msg);
          }
          break;
      }
    },
    [addMessage, setPhase, setProgress, setRecommendation, setPendingApproval],
  );

  /** Establish a WebSocket connection */
  const connect = useCallback(() => {
    if (!sessionId) return;

    // Clean up any existing connection
    if (wsRef.current) {
      intentionalClose.current = true;
      wsRef.current.close();
    }

    setConnectionStatus("connecting");
    intentionalClose.current = false;

    const ws = new WebSocket(`${WS_BASE_URL}/${sessionId}`);
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      setConnectionStatus("connected");
      reconnectDelay.current = 1_000; // reset backoff on success
    });

    ws.addEventListener("message", handleMessage);

    ws.addEventListener("close", () => {
      setConnectionStatus("disconnected");
      wsRef.current = null;

      if (!intentionalClose.current) {
        // Auto-reconnect with exponential backoff
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(
            reconnectDelay.current * 2,
            MAX_RECONNECT_DELAY,
          );
          connect();
        }, reconnectDelay.current);
      }
    });

    ws.addEventListener("error", () => {
      // The close handler will fire after error, which triggers reconnect
    });
  }, [sessionId, setConnectionStatus, handleMessage]);

  /** Connect when sessionId changes; clean up on unmount */
  useEffect(() => {
    if (!sessionId) return;

    connect();

    return () => {
      intentionalClose.current = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return { send, connectionStatus };
}
