"use client";

import React from "react";
import EmptyState from "@/components/EmptyState";
import { ClipboardList } from "lucide-react";

const PayrollIntegrationPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Integração de Folha de Pagamento
        </h1>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Rastreie com precisão os custos de mão de obra, incluindo salários, benefícios e impostos, e integre com sistemas de folha de pagamento.
        </p>
      </section>
      <EmptyState
        icon={ClipboardList}
        title="Integração de Folha de Pagamento em Desenvolvimento"
        description="Esta funcionalidade permitirá gerir os custos de mão de obra e integrar com os seus sistemas de folha de pagamento."
      />
    </div>
  );
};

export default PayrollIntegrationPage;