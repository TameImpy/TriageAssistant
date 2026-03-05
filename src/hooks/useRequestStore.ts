"use client";

import { create } from "zustand";
import type { SSEEvent } from "@/lib/streaming/events";
import type { FinalReport } from "@/types/report";

export interface AgentMessageState {
  agentId: string;
  agentName: string;
  phase: number;
  round?: number;
  content: string;
  messageId?: string;
  structuredData?: unknown;
  isStreaming: boolean;
}

export interface PhaseState {
  phase: 1 | 2 | 3 | 4;
  label: string;
  complete: boolean;
}

interface RequestStore {
  phases: PhaseState[];
  messages: AgentMessageState[];
  activeAgentId: string | null;
  finalReport: FinalReport | null;
  error: string | null;
  isStreaming: boolean;

  handleEvent: (event: SSEEvent) => void;
  reset: () => void;
}

const initialState = {
  phases: [],
  messages: [],
  activeAgentId: null,
  finalReport: null,
  error: null,
  isStreaming: false,
};

export const useRequestStore = create<RequestStore>((set) => ({
  ...initialState,

  handleEvent(event: SSEEvent) {
    set((state) => {
      switch (event.type) {
        case "phase_start":
          return {
            phases: [
              ...state.phases,
              { phase: event.phase, label: event.label, complete: false },
            ],
            isStreaming: true,
          };

        case "phase_complete":
          return {
            phases: state.phases.map((p) =>
              p.phase === event.phase ? { ...p, complete: true } : p
            ),
          };

        case "agent_start":
          return {
            activeAgentId: event.agentId,
            messages: [
              ...state.messages,
              {
                agentId: event.agentId,
                agentName: event.agentName,
                phase: event.phase,
                round: event.round,
                content: "",
                isStreaming: true,
              },
            ],
          };

        case "agent_token": {
          const msgs = state.messages.map((m) =>
            m.agentId === event.agentId && m.isStreaming
              ? { ...m, content: m.content + event.token }
              : m
          );
          return { messages: msgs };
        }

        case "agent_complete": {
          const msgs = state.messages.map((m) =>
            m.agentId === event.agentId && m.isStreaming
              ? {
                  ...m,
                  isStreaming: false,
                  messageId: event.messageId,
                  structuredData: event.structuredData,
                }
              : m
          );
          return {
            messages: msgs,
            activeAgentId: null,
          };
        }

        case "report_ready":
          return {
            finalReport: event.report,
            isStreaming: false,
          };

        case "error":
          return {
            error: event.message,
            isStreaming: false,
          };

        default:
          return state;
      }
    });
  },

  reset() {
    set(initialState);
  },
}));
