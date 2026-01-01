"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ReportProjectOption {
  id: string;
  nome: string;
}

interface ReportParametersProps {
  /** Mês selecionado (normalizado) */
  selectedMonth: Date | null;
  setSelectedMonth: (date: Date | null) => void;

  /** Projeto selecionado */
  selectedProjectId: string | null;
  setSelectedProjectId: (
    projectId: string | null
  ) => void;

  projects: ReportProjectOption[];
  isLoadingProjects: boolean;
}

const ReportParameters: React.FC<
  ReportParametersProps
> = ({
  selectedMonth,
  setSelectedMonth,
  selectedProjectId,
  setSelectedProjectId,
  projects,
  isLoadingProjects,
}) => {
  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Parâmetros do Relatório
        </CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MÊS / ANO */}
        <div className="flex flex-col gap-2">
          <Label>Mês / Ano</Label>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedMonth &&
                    "text-muted-foreground"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {selectedMonth
                  ? format(
                      selectedMonth,
                      "MMMM yyyy",
                      { locale: pt }
                    )
                  : "Selecionar mês"}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedMonth ?? undefined}
                onSelect={(date) =>
                  setSelectedMonth(date ?? null)
                }
                captionLayout="dropdown"
                fromYear={2000}
                toYear={
                  new Date().getFullYear() + 5
                }
                locale={pt}
              />
            </PopoverContent>
          </Popover>

          <p className="text-xs text-muted-foreground">
            Usado em relatórios mensais e
            financeiros.
          </p>
        </div>

        {/* PROJETO */}
        <div className="flex flex-col gap-2">
          <Label>Obra</Label>

          <Select
            value={selectedProjectId ?? ""}
            onValueChange={(value) =>
              setSelectedProjectId(
                value || null
              )
            }
            disabled={
              isLoadingProjects ||
              projects.length === 0
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar obra" />
            </SelectTrigger>

            <SelectContent>
              {projects.map((project) => (
                <SelectItem
                  key={project.id}
                  value={project.id}
                >
                  {project.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            Usado em relatórios por obra.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportParameters;
