"use client";

import React from "react";
import EmptyState from "@/components/EmptyState";
import { BellRing } from "lucide-react";

const AlertsConfigurationPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Configurar Alertas Inteligentes
        </h1>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Defina regras personalizadas para receber notificações proativas sobre eventos críticos nos seus projetos.
        </p>
      </section>
      <EmptyState
        icon={BellRing}
        title="Nenhum alerta configurado"
        description="Comece a configurar alertas para ser notificado sobre atrasos, desvios de orçamento e outras ocorrências importantes."
        buttonText="Criar Novo Alerta"
        onButtonClick={() => console.log("Criar Novo Alerta")}
      />
    </div>
  );
};

export default AlertsConfigurationPage;