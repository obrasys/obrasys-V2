"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Article } from "@/schemas/article-schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, Edit } from "lucide-react";
import { toast } from "sonner";

interface PriceDatabaseColumnsProps {
  onCopy: (id: string) => void;
  onEdit: (article: Article) => void;
}

export const createPriceDatabaseColumns = ({
  onCopy,
  onEdit,
}: PriceDatabaseColumnsProps): ColumnDef<Article>[] => [
  {
    accessorKey: "codigo",
    header: "Código",
  },
  {
    accessorKey: "descricao",
    header: "Descrição",
  },
  {
    accessorKey: "unidade",
    header: "Unidade",
  },
  {
    accessorKey: "preco_unitario",
    header: () => (
      <div className="text-right">Preço Unitário</div>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("preco_unitario");
      const amount = Number(raw);

      const formatted = Number.isFinite(amount)
        ? new Intl.NumberFormat("pt-PT", {
            style: "currency",
            currency: "EUR",
          }).format(amount)
        : "—";

      return (
        <div className="text-right font-medium">
          {formatted}
        </div>
      );
    },
  },
  {
    accessorKey: "category_name",
    header: "Categoria",
    cell: ({ row }) =>
      row.getValue("category_name") || "—",
  },
  {
    accessorKey: "fonte_referencia",
    header: "Fonte",
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const article = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">
                Abrir menu
              </span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              Ações
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                if (!article.id) {
                  toast.error(
                    "ID do artigo não disponível."
                  );
                  return;
                }
                onCopy(article.id);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar ID do Artigo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onEdit(article)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar Artigo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
