"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/work-items/data-table";
import { ColumnDef } from "@tanstack/react-table";
import EmptyState from "@/components/EmptyState";
import { FileText } from "lucide-react";

interface BudgetDetailTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
}

const BudgetDetailTable = <TData, TValue>({
  data,
  columns,
}: BudgetDetailTableProps<TData, TValue>) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl tracking-tight">
          Detalhe do Orçamento
        </CardTitle>
      </CardHeader>

      <CardContent>
        {data.length > 0 ? (
          <DataTable
            columns={columns}
            data={data}
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
