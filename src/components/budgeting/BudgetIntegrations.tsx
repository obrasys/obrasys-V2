"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EmptyState from "@/components/EmptyState";
import {
  HardHat,
  CalendarDays,
  FileText,
} from "lucide-react";

const BudgetIntegrations: React.FC = () => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* GESTÃO DE OBRAS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">
            Ligação com Gestão de Obras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={HardHat}
            title="Obras Integradas (em breve)"
            description="Acompanhe os orçamentos de cada obra diretamente aqui."
          />
        </CardContent>
      </Card>

      {/* CRONOGRAMA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">
            Ligação com Cronograma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CalendarDays}
            title="Cronogramas Detalhados (em breve)"
            description="Visualize e gere o cronograma financeiro de cada obra."
          />
        </CardContent>
      </Card>

      {/* RDO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">
            Ligação com RDO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="Diários de Obra (em breve)"
            description="Aceda aos diários de obra e relatórios de progresso financeiro."
          />
        </CardContent>
      </Card>
    </section>
  );
};

export default BudgetIntegrations;
