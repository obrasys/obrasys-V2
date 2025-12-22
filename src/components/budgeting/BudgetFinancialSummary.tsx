"use client";

import React from "react";
import { Calculator, DollarSign, TrendingUp, LineChart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KPICard from "@/components/KPICard";
import { formatCurrency } from "@/utils/formatters";

interface BudgetFinancialSummaryProps {
  currentBudgetTotal: number;
  totalExecuted: number; // NOVO: Receber o total executado
}

const BudgetFinancialSummary: React.FC<BudgetFinancialSummaryProps> = ({
  currentBudgetTotal,
  totalExecuted, // NOVO
}) => {
  // Para um novo orçamento, custo executado e desvio são 0, margem é 100%
  const executedCost = totalExecuted; // Usar o totalExecuted passado
  const budgetDeviation = executedCost - currentBudgetTotal;
  const budgetDeviationPercentage = currentBudgetTotal > 0 ? (budgetDeviation / currentBudgetTotal) * 100 : 0;
  const predictedFinalCost = currentBudgetTotal + budgetDeviation; // Estimativa de custo total
  const currentMargin = currentBudgetTotal > 0 ? ((currentBudgetTotal - executedCost) / currentBudgetTotal) * 100 : 0; // Margem de lucro atual

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
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetFinancialSummary;