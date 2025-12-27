"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/work-items/data-table";
import { BudgetItem } from "@/schemas/budget-schema";
import { ColumnDef } from "@tanstack/react-table";
import EmptyState from "@/components/EmptyState";
import { FileText } from "lucide-react";

interface BudgetDetailTableProps<TData, TValue> {
  allBudgetItems: TData[];
  columns: ColumnDef<TData, TValue>[];
}

const BudgetDetailTable = <TData, TValue>({
  allBudgetItems,
  columns,
}: BudgetDetailTableProps<TData, TValue>) => {
  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Detalhe do Orçamento</CardTitle>
      </CardHeader>
      <CardContent>
        {allBudgetItems.length > 0 ? (
          <DataTable
            columns={columns}
            data={allBudgetItems}
            filterColumnId="servico"
            filterPlaceholder="Filtrar por serviço..."
            mobileHiddenColumnIds={[
              "capitulo",
              "unidade",
              "preco_unitario",
              "custo_planeado",
            ]}
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="Nenhum item de orçamento"
            description="Adicione itens para detalhar o seu orçamento."
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetDetailTable;