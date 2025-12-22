"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/EmptyState";
import { LineChart } from "lucide-react";

const BudgetCostControlChart: React.FC = () => {
  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold flex items-center gap-2">
          <LineChart className="h-5 w-5 text-primary" /> Controlo de Custos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={LineChart}
          title="Gráfico de Comparativo de Custos (Em breve)"
          description="Um gráfico interativo mostrará o comparativo entre o custo planeado e o custo executado."
        />
      </CardContent>
    </Card>
  );
};

export default BudgetCostControlChart;