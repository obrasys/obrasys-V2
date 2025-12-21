"use client";

import React from "react";
import EmptyState from "@/components/EmptyState";
import { Lightbulb } from "lucide-react";

const ReplanningSuggestionsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-primary dark:text-primary-foreground flex-grow">
          Sugestões de Replaneamento
        </h1>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
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