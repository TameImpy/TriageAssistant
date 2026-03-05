import { Badge } from "@/components/ui/badge";

interface PhaseHeaderProps {
  phase: 1 | 2 | 3 | 4;
  label: string;
  complete: boolean;
}

const phaseColors: Record<number, string> = {
  1: "bg-blue-100 text-blue-800 border-blue-200",
  2: "bg-purple-100 text-purple-800 border-purple-200",
  3: "bg-amber-100 text-amber-800 border-amber-200",
  4: "bg-green-100 text-green-800 border-green-200",
};

export function PhaseHeader({ phase, label, complete }: PhaseHeaderProps) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1 h-px bg-border" />
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${phaseColors[phase] ?? ""}`}>
        <span>Phase {phase}</span>
        <span>—</span>
        <span>{label}</span>
        {complete && <span>✓</span>}
      </div>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
