"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EmptyState from "@/components/EmptyState";
import { LineChart } from "lucide-react";

const BudgetCostControlChart: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
          <LineChart
            className="h-5 w-5 text-primary"
            aria-hidden="true"
          />
          Controlo de Custos
        </CardTitle>
      </CardHeader>

      <CardContent>
        <EmptyState
          icon={LineChart}
          title="Gráfico de Custos (em breve)"
          description="Aqui será apresentado um gráfico interativo com o comparativo entre o custo planeado e o custo executado ao longo da obra."
        />
      </CardContent>
    </Card>
  );
};

export default BudgetCostControlChart;
