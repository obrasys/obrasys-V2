export type RiskLevel = "low" | "medium" | "high";

/**
 * Avalia o risco com base no desvio financeiro
 */
export const getDeviationRisk = (
  planned: number,
  deviation: number
): RiskLevel => {
  if (deviation <= 0) return "low";
  if (planned > 0 && deviation / planned <= 0.1) {
    return "medium";
  }
  return "high";
};

export const riskBadgeMap: Record<
  RiskLevel,
  { label: string; className: string }
> = {
  low: {
    label: "Risco Baixo",
    className: "bg-green-100 text-green-700",
  },
  medium: {
    label: "Risco Médio",
    className: "bg-yellow-100 text-yellow-800",
  },
  high: {
    label: "Risco Alto",
    className: "bg-red-100 text-red-700",
  },
};
