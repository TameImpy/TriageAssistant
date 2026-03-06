"use client";

import { useEffect, useRef } from "react";
import { useRequestStore } from "@/hooks/useRequestStore";
import { PhaseHeader } from "./PhaseHeader";
import { AgentMessage } from "./AgentMessage";
import { TypingIndicator } from "./TypingIndicator";
import type { AgentConfig } from "@/config/agents.schema";

interface DiscussionFeedProps {
  agentConfigs?: AgentConfig[];
}

export function DiscussionFeed({ agentConfigs = [] }: DiscussionFeedProps) {
  const phases = useRequestStore((s) => s.phases);
  const messages = useRequestStore((s) => s.messages);
  const activeAgentId = useRequestStore((s) => s.activeAgentId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeAgentId]);

  function getAgentConfig(agentId: string) {
    return agentConfigs.find((a) => a.id === agentId);
  }

  const activeAgent = activeAgentId ? getAgentConfig(activeAgentId) : null;

  if (phases.length === 0 && messages.length === 0) {
    return null;
  }

  // Render messages grouped by phase
  let currentPhase = 0;
  const items: React.ReactNode[] = [];

  for (const message of messages) {
    if (message.phase !== currentPhase) {
      currentPhase = message.phase;
      const phase = phases.find((p) => p.phase === message.phase);
      if (phase) {
        items.push(
          <PhaseHeader
            key={`phase-${phase.phase}`}
            phase={phase.phase as 1 | 2 | 3 | 4}
            label={phase.label}
            complete={phase.complete}
          />
        );
      }
    }

    const config = getAgentConfig(message.agentId);
    items.push(
      <AgentMessage
        key={`${message.agentId}-${message.phase}-${message.round ?? 0}-${message.content.length}`}
        message={message}
        avatarColor={config?.persona.avatarColor}
        avatarInitials={config?.persona.avatarInitials}
        avatarEmoji={config?.persona.avatarEmoji}
      />
    );
  }

  return (
    <div className="space-y-1">
      {items}
      {activeAgentId && (
        <TypingIndicator
          agentName={activeAgent?.name ?? activeAgentId}
          agentTitle={activeAgent?.persona.title}
          avatarColor={activeAgent?.persona.avatarColor}
          avatarInitials={activeAgent?.persona.avatarInitials}
          avatarEmoji={activeAgent?.persona.avatarEmoji}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
