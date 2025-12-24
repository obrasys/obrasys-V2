"use client";

import React from "react";
import EmptyState from "@/components/EmptyState";
import { LayoutDashboard } from "lucide-react";

const FinancialDashboardsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Painéis Financeiros Abrangentes
        </h1>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Visualize informações em tempo real sobre custos de trabalho, margens, previsões e fluxo de caixa.
        </p>
      </section>
      <EmptyState
        icon={LayoutDashboard}
        title="Painéis Financeiros em Desenvolvimento"
        description="Aqui encontrará gráficos e relatórios interativos para uma visão estratégica completa da sua empresa."
      />
    </div>
  );
};

export default FinancialDashboardsPage;