"use client";

import React from "react";

const ReportHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
      <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
        Geração de Relatórios
      </h1>
    </div>
  );
};

export default ReportHeader;