"use client";

import React from "react";

interface ReportDescriptionProps {
  /**
   * Texto principal da descrição.
   * Se não for fornecido, usa o texto padrão.
   */
  text?: string;

  /**
   * Conteúdo customizado (opcional).
   * Tem prioridade sobre `text`.
   */
  children?: React.ReactNode;
}

const DEFAULT_TEXT =
  "Aceda a relatórios detalhados e personalizáveis para todas as áreas da sua gestão de obras.";

const ReportDescription: React.FC<
  ReportDescriptionProps
> = ({ text = DEFAULT_TEXT, children }) => {
  return (
    <section
      className="text-center max-w-3xl mx-auto mb-8"
      aria-describedby="reports-description"
    >
      <p
        id="reports-description"
        className="text-base md:text-lg text-muted-foreground leading-relaxed"
      >
        {children ?? text}
      </p>
    </section>
  );
};

export default ReportDescription;
