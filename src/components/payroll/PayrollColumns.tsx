"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PayrollEntryWithRelations } from "@/schemas/payroll-schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, DollarSign, Trash2, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface PayrollColumnsProps {
  onView: (entry: PayrollEntryWithRelations) => void;
  onEdit: (entry: PayrollEntryWithRelations) => void;
  onMarkAsPaid: (entry: PayrollEntryWithRelations) => void;
  onDelete: (id: string) => void;
}

export const createPayrollColumns = ({ onView, onEdit, onMarkAsPaid, onDelete }: PayrollColumnsProps): ColumnDef<PayrollEntryWithRelations>[] => [
  {
    accessorKey: "entry_date",
    header: "Data",
    cell: ({ row }) => formatDate(row.getValue("entry_date")),
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
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as PayrollEntryWithRelations["type"];
      return <span className="capitalize">{type.replace('_', ' ')}</span>;
    },
  },
  {
    accessorKey: "projects.nome",
    header: "Obra",
    cell: ({ row }) => row.original.projects?.nome || "N/A",
  },
  {
    accessorKey: "users.first_name",
    header: "Colaborador",
    cell: ({ row }) => {
      const user = row.original.users;
      return user ? `${user.first_name} ${user.last_name}` : "N/A";
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as PayrollEntryWithRelations["status"];
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
        case "processed":
          variant = "default";
          colorClass = "bg-blue-500 hover:bg-blue-600 text-white";
          break;
      }

      return <Badge className={cn(colorClass)} variant={variant}>{status.replace('_', ' ')}</Badge>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const entry = row.original;

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
            <DropdownMenuItem onClick={() => onView(entry)}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(entry)}>
              <Edit className="mr-2 h-4 w-4" /> Editar Registo
            </DropdownMenuItem>
            {entry.status === "pending" && (
              <DropdownMenuItem onClick={() => onMarkAsPaid(entry)}>
                <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Pago
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(entry.id || "")} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar Registo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];