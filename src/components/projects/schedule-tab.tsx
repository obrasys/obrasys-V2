"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Play, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Schedule, SchedulePhase } from "@/schemas/project-schema";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl } from "@/components/ui/form"; // Adicionado: Importação de FormControl

interface ScheduleTabProps {
  projectId: string;
  budgetId: string;
  onScheduleRefetch: () => void; // Novo prop para notificar o pai para refetch do projeto
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ projectId, budgetId, onScheduleRefetch }) => {
  const [schedule, setSchedule] = React.useState<Schedule | null>(null);
  const [phases, setPhases] = React.useState<SchedulePhase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isEditingPhase, setIsEditingPhase] = React.useState<string | null>(null);
  const [editedPhase, setEditedPhase] = React.useState<Partial<SchedulePhase> | null>(null);

  const fetchScheduleData = React.useCallback(async () => {
    setLoading(true);
    const { data: existingSchedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("*")
      .eq("project_id", projectId)
      .eq("budget_id", budgetId)
      .single();

    if (scheduleError && scheduleError.code !== 'PGRST116') { // PGRST116 means no rows found
      toast.error(`Erro ao carregar cronograma: ${scheduleError.message}`);
      setLoading(false);
      return;
    }

    if (existingSchedule) {
      setSchedule(existingSchedule);
      const { data: fetchedPhases, error: phasesError } = await supabase
        .from("schedule_phases")
        .select("*")
        .eq("schedule_id", existingSchedule.id)
        .order("order", { ascending: true });

      if (phasesError) {
        toast.error(`Erro ao carregar fases do cronograma: ${phasesError.message}`);
      } else {
        setPhases(fetchedPhases || []);
      }
    } else {
      setSchedule(null);
      setPhases([]);
    }
    setLoading(false);
    onScheduleRefetch(); // Notificar o pai para refetch do projeto após carregar o cronograma
  }, [projectId, budgetId, onScheduleRefetch]);

  React.useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const handleEditPhase = (phase: SchedulePhase) => {
    setIsEditingPhase(phase.id || null);
    setEditedPhase({ ...phase });
  };

  const handleSavePhase = async () => {
    if (!editedPhase || !editedPhase.id) return;

    try {
      let updatedPhase = { ...editedPhase };

      // Calculate duration if both dates are present
      if (updatedPhase.start_date && updatedPhase.end_date) {
        const startDate = parseISO(updatedPhase.start_date as string);
        const endDate = parseISO(updatedPhase.end_date as string);
        updatedPhase.duration_days = differenceInDays(endDate, startDate) + 1;
      } else {
        updatedPhase.duration_days = null;
      }

      const { error } = await supabase
        .from("schedule_phases") // Corrigido para schedule_phases
        .update(updatedPhase)
        .eq("id", editedPhase.id);

      if (error) {
        throw new Error(`Erro ao guardar fase: ${error.message}`);
      }

      toast.success("Fase do cronograma atualizada com sucesso!");
      setIsEditingPhase(null);
      setEditedPhase(null);
      fetchScheduleData(); // Refresh data, which will trigger project update via backend
    } catch (error: any) {
      toast.error(`Falha ao guardar fase: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPhase(null);
    setEditedPhase(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>A carregar cronograma...</p>
      </div>
    );
  }

  if (!schedule || phases.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Cronograma não gerado"
        description="O cronograma será gerado automaticamente após a aprovação do orçamento e a criação da obra."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" /> Cronograma da Obra
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchScheduleData}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium">Progresso Geral:</span>
            <Progress value={schedule.overall_progress} className="flex-1 h-3" />
            <span className="text-lg font-bold">{schedule.overall_progress}%</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phases.map((phase) => (
              <Card key={phase.id} className="p-4">
                {isEditingPhase === phase.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editedPhase?.chapter_name || ""}
                      onChange={(e) => setEditedPhase({ ...editedPhase, chapter_name: e.target.value })}
                      placeholder="Nome da Fase"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editedPhase?.start_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {editedPhase?.start_date ? format(parseISO(editedPhase.start_date as string), "PPP", { locale: pt }) : "Data de Início"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editedPhase?.start_date ? parseISO(editedPhase.start_date as string) : undefined}
                          onSelect={(date) => setEditedPhase({ ...editedPhase, start_date: date ? format(date, "yyyy-MM-dd") : null })}
                          initialFocus
                          locale={pt}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editedPhase?.end_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {editedPhase?.end_date ? format(parseISO(editedPhase.end_date as string), "PPP", { locale: pt }) : "Data de Fim"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editedPhase?.end_date ? parseISO(editedPhase.end_date as string) : undefined}
                          onSelect={(date) => setEditedPhase({ ...editedPhase, end_date: date ? format(date, "yyyy-MM-dd") : null })}
                          initialFocus
                          locale={pt}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormControl> {/* Adicionado FormControl */}
                      <Select
                        value={editedPhase?.status || "Planeado"}
                        onValueChange={(value) => setEditedPhase({ ...editedPhase, status: value as SchedulePhase["status"] })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planeado">Planeado</SelectItem>
                          <SelectItem value="Em execução">Em execução</SelectItem>
                          <SelectItem value="Concluído">Concluído</SelectItem>
                          <SelectItem value="Atrasado">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl> {/* Fechado FormControl */}
                    <Input
                      type="number"
                      value={editedPhase?.progress || 0}
                      onChange={(e) => setEditedPhase({ ...editedPhase, progress: parseFloat(e.target.value) })}
                      placeholder="Progresso (%)"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSavePhase}>Guardar</Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-lg font-semibold mb-2">{phase.chapter_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Início: {phase.start_date ? format(parseISO(phase.start_date), "PPP", { locale: pt }) : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Fim: {phase.end_date ? format(parseISO(phase.end_date), "PPP", { locale: pt }) : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Duração: {phase.duration_days !== null ? `${phase.duration_days} dias` : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Estado:
                      {phase.status === "Concluído" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {phase.status === "Em execução" && <Play className="h-4 w-4 text-blue-500" />}
                      {phase.status === "Atrasado" && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      <span className={cn(
                        phase.status === "Concluído" && "text-green-500",
                        phase.status === "Em execução" && "text-blue-500",
                        phase.status === "Atrasado" && "text-orange-500",
                      )}>
                        {phase.status}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={phase.progress} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{phase.progress}%</span>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => handleEditPhase(phase)}>
                      Editar Fase
                    </Button>
                  </>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleTab;