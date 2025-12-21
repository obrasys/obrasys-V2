"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/EmptyState";
import { CalendarDays } from "lucide-react";
import { LivroObraRdo } from "@/schemas/compliance-schema";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface LivroDeObraRdosTableProps {
  rdos: LivroObraRdo[];
}

const LivroDeObraRdosTable: React.FC<LivroDeObraRdosTableProps> = ({ rdos }) => {
  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Registos Diários de Obra (RDOs)</CardTitle>
      </CardHeader>
      <CardContent>
        {rdos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Descrição dos Trabalhos</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Custos Diários (€)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rdos.map((rdo) => (
                  <tr key={rdo.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDate(rdo.data)}</td>
                    <td className="px-4 py-2 text-sm">{rdo.resumo}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm">{formatCurrency(rdo.custos_diarios)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum RDO compilado"
            description="Os RDOs serão automaticamente compilados para o período selecionado."
          />
        )}
      </CardContent>
    </Card>
  );
};

export default LivroDeObraRdosTable;