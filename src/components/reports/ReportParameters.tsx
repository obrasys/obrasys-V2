"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Project } from "@/schemas/project-schema"; // Assuming Project schema is available

interface ReportParametersProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedProjectIdForReport: string | null;
  setSelectedProjectIdForReport: (projectId: string | null) => void;
  projects: Project[];
  isLoadingProjects: boolean;
}

const ReportParameters: React.FC<ReportParametersProps> = ({
  selectedMonth,
  setSelectedMonth,
  selectedProjectIdForReport,
  setSelectedProjectIdForReport,
  projects,
  isLoadingProjects,
}) => {
  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Parâmetros do Relatório</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="month-selector">Mês/Ano (para relatórios mensais)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedMonth && "text-muted-foreground"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {selectedMonth ? format(parseISO(selectedMonth), "MMMM yyyy", { locale: pt }) : "Selecione Mês/Ano"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                captionLayout="dropdown-buttons"
                selected={selectedMonth ? parseISO(selectedMonth) : undefined}
                onSelect={(date) => setSelectedMonth(date ? format(date, "yyyy-MM") : format(new Date(), "yyyy-MM"))}
                fromYear={2000}
                toYear={new Date().getFullYear() + 5}
                locale={pt}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col space-y-2">
          <Label htmlFor="project-selector">Obra (para relatórios por projeto)</Label>
          <Select
            value={selectedProjectIdForReport || "placeholder"}
            onValueChange={(value) => setSelectedProjectIdForReport(value === "placeholder" ? null : value)}
            disabled={isLoadingProjects || projects.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma obra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder" disabled>Selecione uma obra</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportParameters;