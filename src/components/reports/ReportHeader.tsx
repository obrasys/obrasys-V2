"use client";

import React from "react";

interface ReportHeaderProps {
  /** Título do módulo/página */
  title?: string;

  /** Área opcional para ações (botões, filtros rápidos, etc.) */
  children?: React.ReactNode;
}

const DEFAULT_TITLE = "Geração de Relatórios";

const ReportHeader: React.FC<ReportHeaderProps> = ({
  title = DEFAULT_TITLE,
  children,
}) => {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
      <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary flex-1">
        {title}
      </h1>

      {children ? (
        <div className="flex items-center gap-2">
          {children}
        </div>
      ) : null}
    </header>
  );
};

export default ReportHeader;
