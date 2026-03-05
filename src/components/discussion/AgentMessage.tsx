"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentMessageState } from "@/hooks/useRequestStore";
import { Badge } from "@/components/ui/badge";

interface AgentMessageProps {
  message: AgentMessageState;
  avatarColor?: string;
  avatarInitials?: string;
}

const phaseLabels: Record<number, string> = {
  2: "Analysis",
  3: "Discussion",
  4: "Synthesis",
};

export function AgentMessage({ message, avatarColor = "bg-slate-600", avatarInitials }: AgentMessageProps) {
  const initials = avatarInitials ?? message.agentName.slice(0, 2).toUpperCase();
  const phaseLabel = phaseLabels[message.phase];
  const roundLabel = message.round ? `Round ${message.round}` : null;

  return (
    <div className="flex gap-3 py-3">
      <div className={`flex-shrink-0 w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">{message.agentName}</span>
          {phaseLabel && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {phaseLabel}
            </Badge>
          )}
          {roundLabel && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {roundLabel}
            </Badge>
          )}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse rounded-sm" />
          )}
        </div>
        <div className="prose prose-sm max-w-none text-foreground/90">
          {message.phase === 2 && message.structuredData ? (
            <AnalysisView data={message.structuredData as Record<string, unknown>} />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || "…"}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisView({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-foreground/80">{data.summary as string}</p>
      {Array.isArray(data.concerns) && (data.concerns as string[]).length > 0 && (
        <div>
          <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Concerns</p>
          <ul className="list-disc list-inside space-y-0.5">
            {(data.concerns as string[]).map((c, i) => (
              <li key={i} className="text-foreground/80">{c}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-xs text-muted-foreground">
          Risk: <span className="font-semibold text-foreground">{data.risk_score as number}/10</span>
        </span>
        <span className="text-xs text-muted-foreground">
          Stance: <span className="font-semibold text-foreground">{data.stance as string}</span>
        </span>
      </div>
    </div>
  );
}
