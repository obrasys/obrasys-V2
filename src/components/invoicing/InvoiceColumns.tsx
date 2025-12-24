"use client";

import { ColumnDef } from "@tanstack/react-table";
import { InvoiceWithRelations } from "@/schemas/invoicing-schema";
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

interface InvoiceColumnsProps {
  onView: (invoice: InvoiceWithRelations) => void;
  onEdit: (invoice: InvoiceWithRelations) => void;
  onRecordPayment: (invoice: InvoiceWithRelations) => void;
  onDelete: (id: string) => void;
}

export const createInvoiceColumns = ({ onView, onEdit, onRecordPayment, onDelete }: InvoiceColumnsProps): ColumnDef<InvoiceWithRelations>[] => [
  {
    accessorKey: "invoice_number",
    header: "Nº Fatura",
  },
  {
    accessorKey: "clients.nome",
    header: "Cliente",
    cell: ({ row }) => row.original.clients?.nome || "N/A",
  },
  {
    accessorKey: "projects.nome",
    header: "Obra",
    cell: ({ row }) => row.original.projects?.nome || "N/A",
  },
  {
    accessorKey: "issue_date",
    header: "Data Emissão",
    cell: ({ row }) => formatDate(row.getValue("issue_date")),
  },
  {
    accessorKey: "due_date",
    header: "Data Vencimento",
    cell: ({ row }) => formatDate(row.getValue("due_date")),
  },
  {
    accessorKey: "total_amount",
    header: () => <div className="text-right">Valor Total</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_amount"));
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
    },
  },
  {
    accessorKey: "paid_amount",
    header: () => <div className="text-right">Valor Pago</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("paid_amount"));
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as InvoiceWithRelations["status"];
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
      const invoice = row.original;

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
            <DropdownMenuItem onClick={() => onView(invoice)}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(invoice)}>
              <Edit className="mr-2 h-4 w-4" /> Editar Fatura
            </DropdownMenuItem>
            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <DropdownMenuItem onClick={() => onRecordPayment(invoice)}>
                <DollarSign className="mr-2 h-4 w-4" /> Registar Pagamento
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(invoice.id || "")} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar Fatura
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];