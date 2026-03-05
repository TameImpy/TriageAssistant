import type { Recommendation, RiskLevel } from "@/types/request";

interface RecommendationBadgeProps {
  recommendation: Recommendation;
  riskLevel?: RiskLevel;
  size?: "sm" | "lg";
}

const recommendationStyles: Record<Recommendation, string> = {
  APPROVE: "bg-green-100 text-green-800 border-green-300",
  "APPROVE WITH CONDITIONS": "bg-amber-100 text-amber-800 border-amber-300",
  DEFER: "bg-amber-100 text-amber-800 border-amber-300",
  REJECT: "bg-red-100 text-red-800 border-red-300",
};

const riskStyles: Record<RiskLevel, string> = {
  low: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

export function RecommendationBadge({
  recommendation,
  riskLevel,
  size = "sm",
}: RecommendationBadgeProps) {
  const sizeClass = size === "lg" ? "text-lg px-4 py-2 font-bold" : "text-xs px-2.5 py-1 font-semibold";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={`inline-flex items-center rounded-full border ${sizeClass} ${recommendationStyles[recommendation]}`}
      >
        {recommendation}
      </span>
      {riskLevel && (
        <span
          className={`inline-flex items-center rounded-full border text-xs px-2.5 py-1 font-medium ${riskStyles[riskLevel]}`}
        >
          {riskLevel.toUpperCase()} RISK
        </span>
      )}
    </div>
  );
}
