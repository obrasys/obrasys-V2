"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Download, UserPlus } from "lucide-react";

interface BudgetingHeaderProps {
  onRegisterClientClick: () => void;
  onNewBudgetClick: () => void;
}

const BudgetingHeader: React.FC<BudgetingHeaderProps> = ({
  onRegisterClientClick,
  onNewBudgetClick,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Orçamentação e Controlo de Custos</h1>
        <p className="text-muted-foreground text-sm">
          Planeamento, acompanhamento e controlo financeiro da obra
        </p>
      </div>
      <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
        <Button onClick={onRegisterClientClick} variant="outline" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Cadastrar Cliente
        </Button>
        <Button onClick={onNewBudgetClick} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> Novo Orçamento
        </Button>
        <Button variant="outline" className="flex items-center gap-2" disabled>
          <Filter className="h-4 w-4" /> Filtros
        </Button>
        <Button variant="outline" className="flex items-center gap-2" disabled>
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>
    </div>
  );
};

export default BudgetingHeader;