"use client";

import React from "react";
import KPICard from "@/components/KPICard";
import { Calculator, DollarSign, TrendingUp, LineChart } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface BudgetFinancialKPIsProps {
  totalBudget: number;
  executedCost: number;
  budgetDeviation: number;
  budgetDeviationPercentage: number;
  predictedFinalCost: number;
  currentMargin: number;
}

const BudgetFinancialKPIs: React.FC<BudgetFinancialKPIsProps> = ({
  totalBudget,
  executedCost,
  budgetDeviation,
  budgetDeviationPercentage,
  predictedFinalCost,
  currentMargin,
}) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
      <KPICard
        title="Orçamento Total (€)"
        value={formatCurrency(totalBudget)}
        description="Valor planeado para a obra"
        icon={Calculator}
        iconColorClass="text-blue-500"
      />
      <KPICard
        title="Custo Executado (€)"
        value={formatCurrency(executedCost)}
        description="Valor já gasto"
        icon={DollarSign}
        iconColorClass="text-green-500"
      />
      <KPICard
        title="Desvio Orçamental (€ / %)"
        value={`${formatCurrency(budgetDeviation)} (${budgetDeviationPercentage.toFixed(1)}%)`}
        description="Diferença entre planeado e executado"
        icon={TrendingUp}
        iconColorClass={budgetDeviation >= 0 ? "text-red-500" : "text-green-500"}
      />
      <KPICard
        title="Custo Previsto Final (€)"
        value={formatCurrency(predictedFinalCost)}
        description="Estimativa de custo total"
        icon={LineChart}
        iconColorClass="text-purple-500"
      />
      <KPICard
        title="Margem Atual (%)"
        value={`${currentMargin.toFixed(1)}%`}
        description="Margem de lucro atual"
        icon={DollarSign}
        iconColorClass={currentMargin >= 0 ? "text-green-500" : "text-red-500"}
      />
    </section>
  );
};

export default BudgetFinancialKPIs;