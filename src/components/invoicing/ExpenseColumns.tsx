"use client";

import React from "react";
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

const safeNumber = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

const safeLabel = (value: unknown): string => {
  const s = String(value ?? "").trim();
  return s ? s : "—";
};

const normalizeStatusLabel = (status: string) =>
  status.replace(/_/g, " ");

const isPastDue = (dueDate: unknown) => {
  const raw = String(dueDate ?? "");
  if (!raw) return false;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return false;
  // compara só por data/hora local (ok para tabela)
  return date.getTime() < Date.now();
};

export const createExpenseColumns = ({
  onView,
  onEdit,
  onMarkAsPaid,
  onDelete,
}: ExpenseColumnsProps): ColumnDef<Expense>[] => [
  {
    accessorKey: "supplier_name",
    header: "Fornecedor",
    cell: ({ row }) => safeLabel(row.getValue("supplier_name")),
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => safeLabel(row.getValue("description")),
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
      const amount = safeNumber(row.getValue("amount"));
      return (
        <div className="text-right font-medium">
          {formatCurrency(amount)}
        </div>
      );
    },
  },
  {
    accessorKey: "due_date",
    header: "Data Vencimento",
    cell: ({ row }) => {
      const due = row.getValue("due_date");
      const dueStr = String(due ?? "");
      return dueStr ? formatDate(dueStr) : "—";
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const rawStatus = row.getValue("status") as Expense["status"];
      const due = row.getValue("due_date");

      // Overdue “visual” (sem mexer no DB):
      const displayStatus: Expense["status"] =
        rawStatus === "pending" && isPastDue(due) ? "overdue" : rawStatus;

      let variant: "default" | "secondary" | "destructive" | "outline" =
        "secondary";
      let colorClass = "";

      switch (displayStatus) {
        case "pending":
          variant = "outline";
          colorClass =
            "border-orange-500 text-orange-600 dark:text-orange-400";
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

      return (
        <Badge className={cn(colorClass)} variant={variant}>
          {normalizeStatusLabel(displayStatus)}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const expense = row.original;
      const hasId = Boolean(expense.id);

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

            <DropdownMenuItem
              onClick={() => {
                if (!hasId) return;
                onDelete(expense.id!);
              }}
              className={cn(
                "text-red-600",
                !hasId && "opacity-50 pointer-events-none"
              )}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar Despesa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
