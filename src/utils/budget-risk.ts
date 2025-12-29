export type RiskLevel = "low" | "medium" | "high";

/* =========================
   DESVIO ORÇAMENTAL
========================= */

/**
 * Avalia risco com base no desvio percentual
 */
export const getDeviationRisk = (
  deviationPercentage: number
): RiskLevel => {
  if (deviationPercentage <= 0) return "low";
  if (deviationPercentage <= 10) return "medium";
  return "high";
};

/* =========================
   MARGEM
========================= */

/**
 * Avalia risco com base na margem atual
 */
export const getMarginRisk = (
  marginPercentage: number
): RiskLevel => {
  if (marginPercentage >= 15) return "low";
  if (marginPercentage >= 5) return "medium";
  return "high";
};

/* =========================
   MAPAS VISUAIS
========================= */

export const riskColorMap: Record<RiskLevel, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-700",
};
