"use client";

import React from "react";
import { Calculator, DollarSign, TrendingUp, LineChart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KPICard from "@/components/KPICard";
import { formatCurrency } from "@/utils/formatters";

interface BudgetFinancialSummaryProps {
  currentBudgetTotal: number;
}

const BudgetFinancialSummary: React.FC<BudgetFinancialSummaryProps> = ({
  currentBudgetTotal,
}) => {
  // Para um novo orçamento, custo executado e desvio são 0, margem é 100%
  const executedCost = 0;
  const budgetDeviation = 0;
  const budgetDeviationPercentage = 0;
  const predictedFinalCost = currentBudgetTotal;
  const currentMargin = currentBudgetTotal > 0 ? 100 : 0;

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Resumo Financeiro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KPICard
            title="Orçamento Total (€)"
            value={formatCurrency(currentBudgetTotal)}
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
            iconColorClass="text-green-500"
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
            iconColorClass="text-green-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetFinancialSummary;