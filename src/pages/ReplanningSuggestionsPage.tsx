"use client";

import React from "react";
import EmptyState from "@/components/EmptyState";
import { Lightbulb } from "lucide-react";

const ReplanningSuggestionsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Sugestões de Replaneamento
        </h1>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Receba recomendações baseadas em IA para ajustar cronogramas e recursos em resposta a imprevistos.
        </p>
      </section>
      <EmptyState
        icon={Lightbulb}
        title="Nenhuma sugestão de replaneamento disponível"
        description="As sugestões de replaneamento aparecerão aqui com base na análise contínua dos seus projetos."
      />
    </div>
  );
};

export default ReplanningSuggestionsPage;