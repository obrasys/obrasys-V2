"use client";

import React from "react";
import EmptyState from "@/components/EmptyState";
import { Bot } from "lucide-react";

const AIAssistantPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Assistente de IA
        </h1>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Interaja com o assistente inteligente para obter previsões e insights sobre as suas tarefas e projetos.
        </p>
      </section>
      <EmptyState
        icon={Bot}
        title="Assistente de IA pronto para ajudar"
        description="Em breve, poderá interagir com o assistente para obter previsões de conclusão e outras informações úteis."
      />
    </div>
  );
};

export default AIAssistantPage;