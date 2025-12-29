"use client";

import { ColumnDef } from "@tanstack/react-table";
import { BudgetItem } from "@/schemas/budget-schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Edit,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* =========================
   HELPERS
========================= */

const formatCurrency = (value: unknown): string => {
  const number =
    typeof value === "number"
      ? value
      : Number(value);

  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(Number.isFinite(number) ? number : 0);
};

interface ColumnsProps {
  onView: (budgetItem: BudgetItem) => void;
  onEdit: (budgetItem: BudgetItem) => void;
}

export const createBudgetColumns = ({
  onView,
  onEdit,
}: ColumnsProps): ColumnDef<BudgetItem>[] => [
  {
    accessorKey: "capitulo",
    header: "Capítulo / Fase",
  },
  {
    accessorKey: "servico",
    header: "Serviço",
  },
  {
    accessorKey: "quantidade",
    header: "Quantidade",
  },
  {
    accessorKey: "unidade",
    header: "Unidade",
  },
  {
    accessorKey: "preco_unitario",
    header: () => (
      <div className="text-right">
        Preço Unitário
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(
          row.getValue("preco_unitario")
        )}
      </div>
    ),
  },
  {
    accessorKey: "custo_planeado",
    header: () => (
      <div className="text-right">
        Custo Planeado
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(
          row.getValue("custo_planeado")
        )}
      </div>
    ),
  },
  {
    accessorKey: "custo_executado",
    header: () => (
      <div className="text-right">
        Custo Executado
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(
          row.getValue("custo_executado")
        )}
      </div>
    ),
  },
  {
    accessorKey: "desvio",
    header: () => (
      <div className="text-right">
        Desvio
      </div>
    ),
    cell: ({ row }) => {
      const value = Number(
        row.getValue("desvio")
      );
      const colorClass =
        value > 0
          ? "text-red-600"
          : value < 0
          ? "text-green-600"
          : "text-muted-foreground";

      return (
        <div
          className={cn(
            "text-right font-medium",
            colorClass
          )}
        >
          {formatCurrency(value)}
        </div>
      );
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado =
        row.getValue(
          "estado"
        ) as BudgetItem["estado"];

      const map = {
        Planeado: {
          variant: "outline",
          className:
            "text-muted-foreground",
        },
        "Em andamento": {
          variant: "default",
          className:
            "bg-blue-600 text-white",
        },
        Concluído: {
          variant: "default",
          className:
            "bg-green-600 text-white",
        },
        Atrasado: {
          variant: "destructive",
          className: "",
        },
      } as const;

      const cfg = map[estado];

      return (
        <Badge
          variant={cfg.variant}
          className={cfg.className}
        >
          {estado}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const budgetItem = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir ações"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              Ações
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() =>
                onView(budgetItem)
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                onEdit(budgetItem)
              }
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              disabled
              className="text-red-600"
            >
              Eliminar (em breve)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
