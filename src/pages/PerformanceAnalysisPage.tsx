"use client";

import React from "react";
import EmptyState from "@/components/EmptyState";
import { Activity, Monitor } from "lucide-react";

const PerformanceAnalysisPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-primary dark:text-primary-foreground flex-grow">
          Análise de Performance e BI
        </h1>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Avalie o desempenho de cada empreitada com métricas detalhadas e painéis interativos para uma visão estratégica completa.
        </p>
      </section>
      <EmptyState
        icon={Activity}
        title="Dados de performance em breve"
        description="Aqui encontrará gráficos e relatórios detalhados sobre o desempenho dos seus projetos e da sua empresa."
      />
    </div>
  );
};

export default PerformanceAnalysisPage;