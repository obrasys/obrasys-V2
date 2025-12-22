"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/EmptyState";
import { HardHat, CalendarDays, FileText } from "lucide-react";

const BudgetIntegrations: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Ligação com Gestão de Obras</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={HardHat}
            title="Obras Integradas (Em breve)"
            description="Acompanhe os orçamentos de cada obra diretamente aqui."
          />
        </CardContent>
      </Card>
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Ligação com Cronograma</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CalendarDays}
            title="Cronogramas Detalhados (Em breve)"
            description="Visualize e gere o cronograma financeiro de cada obra."
          />
        </CardContent>
      </Card>
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Ligação com RDO</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="Diários de Obra (Em breve)"
            description="Aceda aos diários de obra e relatórios de progresso financeiro."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetIntegrations;