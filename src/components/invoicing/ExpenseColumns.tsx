"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Expense } from "@/schemas/invoicing-schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, DollarSign, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface ExpenseColumnsProps {
  onView: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onMarkAsPaid: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export const createExpenseColumns = ({ onView, onEdit, onMarkAsPaid, onDelete }: ExpenseColumnsProps): ColumnDef<Expense>[] => [
  {
    accessorKey: "supplier_name",
    header: "Fornecedor",
  },
  {
    accessorKey: "description",
    header: "Descrição",
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
    },
  },
  {
    accessorKey: "due_date",
    header: "Data Vencimento",
    cell: ({ row }) => formatDate(row.getValue("due_date")),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as Expense["status"];
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      let colorClass = "";

      switch (status) {
        case "pending":
          variant = "outline";
          colorClass = "border-orange-500 text-orange-600 dark:text-orange-400";
          break;
        case "paid":
          variant = "default";
          colorClass = "bg-green-500 hover:bg-green-600 text-white";
          break;
        case "overdue":
          variant = "destructive";
          break;
        case "cancelled":
          variant = "destructive";
          colorClass = "bg-gray-500 hover:bg-gray-600 text-white";
          break;
      }

      return <Badge className={cn(colorClass)} variant={variant}>{status.replace('_', ' ')}</Badge>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const expense = row.original;

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
            <DropdownMenuItem onClick={() => onView(expense)}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(expense)}>
              <Edit className="mr-2 h-4 w-4" /> Editar Despesa
            </DropdownMenuItem>
            {expense.status === "pending" && (
              <DropdownMenuItem onClick={() => onMarkAsPaid(expense)}>
                <DollarSign className="mr-2 h-4 w-4" /> Marcar como Paga
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(expense.id || "")} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar Despesa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];