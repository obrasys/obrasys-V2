"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Filter,
  Download,
  UserPlus,
} from "lucide-react";

interface BudgetingHeaderProps {
  onRegisterClientClick: () => void;
  onNewBudgetClick: () => void;
}

const BudgetingHeader: React.FC<
  BudgetingHeaderProps
> = ({
  onRegisterClientClick,
  onNewBudgetClick,
}) => {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 md:pb-6 mb-4 md:mb-6 border-b">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
          Orçamentação e Controlo de Custos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Planeamento, acompanhamento e controlo financeiro da obra
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={onRegisterClientClick}
          aria-label="Cadastrar cliente"
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Cadastrar Cliente
        </Button>

        <Button
          onClick={onNewBudgetClick}
          aria-label="Criar novo orçamento"
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Novo Orçamento
        </Button>

        <Button
          variant="outline"
          disabled
          aria-disabled="true"
          aria-label="Filtros (em breve)"
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </Button>

        <Button
          variant="outline"
          disabled
          aria-disabled="true"
          aria-label="Exportar (em breve)"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>
    </header>
  );
};

export default BudgetingHeader;
