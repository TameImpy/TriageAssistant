import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { AgentPerspective } from "@/types/report";

interface AgentPOVProps {
  perspective: AgentPerspective;
  avatarColor?: string;
  avatarInitials?: string;
  avatarEmoji?: string;
}

const stanceColors: Record<string, string> = {
  APPROVE: "text-green-700",
  "APPROVE WITH CONDITIONS": "text-amber-700",
  APPROVE_WITH_CONDITIONS: "text-amber-700",
  DEFER: "text-amber-700",
  REJECT: "text-red-700",
};

function getStanceColor(stance: string): string {
  for (const [key, color] of Object.entries(stanceColors)) {
    if (stance.toUpperCase().includes(key)) return color;
  }
  return "text-foreground";
}

export function AgentPOV({ perspective, avatarColor = "bg-slate-600", avatarInitials, avatarEmoji }: AgentPOVProps) {
  const display = avatarEmoji ?? (avatarInitials ?? perspective.agentName.slice(0, 2).toUpperCase());

  return (
    <AccordionItem value={perspective.agentId} className="border rounded-lg px-4 mb-2">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold ${avatarEmoji ? "text-lg" : "text-xs"}`}>
            {display}
          </div>
          <div>
            <p className="font-semibold text-sm">{perspective.agentName}</p>
            <p className={`text-xs font-medium ${getStanceColor(perspective.finalStance)}`}>
              {perspective.finalStance} · Risk {perspective.riskScore}/10
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-2 pb-1 space-y-3">
          {perspective.keyConcerns.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Key Concerns
              </p>
              <ul className="list-disc list-inside space-y-1">
                {perspective.keyConcerns.map((concern, i) => (
                  <li key={i} className="text-sm text-foreground/80">{concern}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Final Recommendation
            </p>
            <p className={`text-sm font-medium ${getStanceColor(perspective.recommendation)}`}>
              {perspective.recommendation}
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
