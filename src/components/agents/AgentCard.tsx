import { Badge } from "@/components/ui/badge";
import type { AgentConfig } from "@/config/agents.schema";

interface AgentCardProps {
  agent: AgentConfig;
  onClick?: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        onClick ? "cursor-pointer hover:bg-muted/50" : ""
      } ${!agent.enabled ? "opacity-50" : ""}`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full ${agent.persona.avatarColor} flex items-center justify-center text-white text-sm font-bold`}
      >
        {agent.persona.avatarInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{agent.name}</p>
          {!agent.enabled && (
            <Badge variant="outline" className="text-xs">Disabled</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{agent.persona.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Risk weight: {agent.riskWeighting}/10 · Vote weight: {agent.voteWeight}x
        </p>
      </div>
    </div>
  );
}
