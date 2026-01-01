"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Project } from "@/schemas/project-schema";
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
  Trash2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ColumnsProps {
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

export const createProjectColumns = ({
  onView,
  onEdit,
  onDelete,
}: ColumnsProps): ColumnDef<Project>[] => [
  {
    accessorKey: "nome",
    header: "Nome da Obra",
  },
  {
    accessorKey: "client_name",
    header: "Cliente",
    cell: ({ row }) =>
      row.getValue("client_name") || "—",
  },
  {
    accessorKey: "localizacao",
    header: "Localização",
    cell: ({ row }) =>
      row.getValue("localizacao") || "—",
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado =
        row.getValue("estado") as
          | "Em execução"
          | "Concluída"
          | "Suspensa"
          | "Planeada";

      let variant:
        | "default"
        | "secondary"
        | "destructive"
        | "outline" = "secondary";
      let colorClass = "";

      switch (estado) {
        case "Em execução":
          variant = "default";
          colorClass =
            "bg-blue-500 hover:bg-blue-600 text-white";
          break;
        case "Concluída":
          variant = "default";
          colorClass =
            "bg-green-500 hover:bg-green-600 text-white";
          break;
        case "Suspensa":
          variant = "destructive";
          break;
        case "Planeada":
          variant = "outline";
          break;
        default:
          variant = "secondary";
      }

      return (
        <Badge
          variant={variant}
          className={cn(colorClass)}
        >
          {estado || "—"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "progresso",
    header: "Progresso (%)",
    cell: ({ row }) => {
      const raw = Number(
        row.getValue("progresso")
      );
      const progress = Number.isFinite(raw)
        ? Math.min(100, Math.max(0, raw))
        : 0;

      return (
        <div className="flex items-center gap-2">
          <Progress
            value={progress}
            className="w-[100px]"
          />
          <span className="text-sm text-muted-foreground">
            {progress}%
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "prazo",
    header: "Prazo",
    cell: ({ row }) =>
      row.getValue("prazo") || "—",
  },
  {
    accessorKey: "custo_planeado",
    header: () => (
      <div className="text-right">
        Custo Planeado
      </div>
    ),
    cell: ({ row }) => {
      const raw = row.getValue(
        "custo_planeado"
      );
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
    accessorKey: "custo_real",
    header: () => (
      <div className="text-right">
        Custo Real
      </div>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("custo_real");
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
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const project = row.original;

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
              onClick={() => onView(project)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onEdit(project)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                if (!project.id) return;
                onDelete(project.id);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
