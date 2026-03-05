import type { RiskItem } from "@/types/report";

interface RiskMatrixProps {
  risks: RiskItem[];
}

const severityColors: Record<string, string> = {
  low: "text-green-700 bg-green-50",
  medium: "text-amber-700 bg-amber-50",
  high: "text-orange-700 bg-orange-50",
  critical: "text-red-700 bg-red-50",
};

const likelihoodColors: Record<string, string> = {
  low: "text-green-700",
  medium: "text-amber-700",
  high: "text-orange-700",
};

export function RiskMatrix({ risks }: RiskMatrixProps) {
  if (risks.length === 0) {
    return <p className="text-sm text-muted-foreground">No risks identified.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-semibold text-foreground">Risk</th>
            <th className="pb-2 pr-4 font-semibold text-foreground w-24">Severity</th>
            <th className="pb-2 pr-4 font-semibold text-foreground w-24">Likelihood</th>
            <th className="pb-2 font-semibold text-foreground">Mitigation</th>
          </tr>
        </thead>
        <tbody>
          {risks.map((risk, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2.5 pr-4 text-foreground/90">{risk.risk}</td>
              <td className="py-2.5 pr-4">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[risk.severity] ?? ""}`}>
                  {risk.severity}
                </span>
              </td>
              <td className={`py-2.5 pr-4 font-medium ${likelihoodColors[risk.likelihood] ?? ""}`}>
                {risk.likelihood}
              </td>
              <td className="py-2.5 text-foreground/80">{risk.mitigation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
