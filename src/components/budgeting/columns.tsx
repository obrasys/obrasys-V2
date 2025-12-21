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
import { MoreHorizontal, Eye, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ColumnsProps {
  onView: (budgetItem: BudgetItem) => void;
  onEdit: (budgetItem: BudgetItem) => void;
}

export const createBudgetColumns = ({ onView, onEdit }: ColumnsProps): ColumnDef<BudgetItem>[] => [
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
    header: () => <div className="text-right">Preço Unitário</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("preco_unitario"));
      const formatted = new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "custo_planeado",
    header: () => <div className="text-right">Custo Planeado</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("custo_planeado"));
      const formatted = new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "custo_executado",
    header: () => <div className="text-right">Custo Executado</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("custo_executado"));
      const formatted = new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "desvio",
    header: () => <div className="text-right">Desvio</div>,
    cell: ({ row }) => {
      const desvio = parseFloat(row.getValue("desvio"));
      const formatted = new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
      }).format(desvio);
      const colorClass = desvio > 0 ? "text-red-500" : desvio < 0 ? "text-green-500" : "text-muted-foreground";
      return <div className={cn("text-right font-medium", colorClass)}>{formatted}</div>;
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("estado") as BudgetItem["estado"];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      let colorClass = "";

      switch (estado) {
        case "Em andamento":
          variant = "default";
          colorClass = "bg-blue-500 hover:bg-blue-600 text-white";
          break;
        case "Concluído":
          variant = "default";
          colorClass = "bg-green-500 hover:bg-green-600 text-white";
          break;
        case "Atrasado":
          variant = "destructive";
          break;
      }

      return <Badge className={cn(colorClass)} variant={variant}>{estado}</Badge>;
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
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(budgetItem)}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(budgetItem)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];