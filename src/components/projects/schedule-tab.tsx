"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Play, CheckCircle, AlertTriangle, RefreshCw, PlusCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Schedule, ScheduleTask } from "@/schemas/project-schema"; // Alterado para ScheduleTask
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";

interface ScheduleTabProps {
  projectId: string;
  budgetId: string;
  onScheduleRefetch: () => void; // Novo prop para notificar o pai para refetch do projeto
  userCompanyId: string | null; // Novo prop para o ID da empresa
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ projectId, budgetId, onScheduleRefetch, userCompanyId }) => {
  const [schedule, setSchedule] = React.useState<Schedule | null>(null);
  const [tasks, setTasks] = React.useState<ScheduleTask[]>([]); // Alterado para tasks
  const [loading, setLoading] = React.useState(true);
  const [isCreatingSchedule, setIsCreatingSchedule] = React.useState(false);
  const [isEditingTask, setIsEditingTask] = React.useState<string | null>(null); // Alterado para isEditingTask
  const [editedTask, setEditedTask] = React.useState<Partial<ScheduleTask> | null>(null); // Alterado para editedTask

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
      const { data: fetchedTasks, error: tasksError } = await supabase // Alterado para fetchedTasks
        .from("schedule_tasks") // CORRIGIDO: Tabela correta
        .select("*")
        .eq("schedule_id", existingSchedule.id)
        .order("ordem", { ascending: true }); // Alterado para 'ordem'

      if (tasksError) {
        toast.error(`Erro ao carregar fases do cronograma: ${tasksError.message}`);
      } else {
        setTasks(fetchedTasks || []); // Alterado para setTasks
      }
    } else {
      setSchedule(null);
      setTasks([]); // Alterado para setTasks
    }
    setLoading(false);
  }, [projectId, budgetId]);

  React.useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const handleEditTask = (task: ScheduleTask) => { // Alterado para handleEditTask
    setIsEditingTask(task.id || null); // Alterado para isEditingTask
    setEditedTask({ ...task }); // Alterado para setEditedTask
  };

  const handleSaveTask = async () => { // Alterado para handleSaveTask
    if (!editedTask || !editedTask.id) return;

    try {
      let updatedTask = { ...editedTask }; // Alterado para updatedTask

      // Calculate duration if both dates are present
      if (updatedTask.data_inicio && updatedTask.data_fim) { // Alterado para data_inicio e data_fim
        const startDate = parseISO(updatedTask.data_inicio as string);
        const endDate = parseISO(updatedTask.data_fim as string);
        updatedTask.duracao_dias = differenceInDays(endDate, startDate) + 1; // Alterado para duracao_dias
      } else {
        updatedTask.duracao_dias = null; // Alterado para duracao_dias
      }

      const { error } = await supabase
        .from("schedule_tasks")
        .update({
          capitulo: updatedTask.capitulo, // Mapear para capitulo
          data_inicio: updatedTask.data_inicio, // Mapear para data_inicio
          data_fim: updatedTask.data_fim, // Mapear para data_fim
          duracao_dias: updatedTask.duracao_dias, // Mapear para duracao_dias
          estado: updatedTask.estado, // Mapear para estado
          progresso: updatedTask.progresso, // Mapear para progresso
          updated_at: new Date().toISOString(), // Adicionar updated_at
        })
        .eq("id", editedTask.id);

      if (error) {
        throw new Error(`Erro ao guardar fase: ${error.message}`);
      }

      toast.success("Fase do cronograma atualizada com sucesso!");
      setIsEditingTask(null); // Alterado para isEditingTask
      setEditedTask(null); // Alterado para setEditedTask
      fetchScheduleData(); // Refresh data
      onScheduleRefetch(); // Notificar o pai para refetch do projeto APÓS a fase ser salva
    } catch (error: any) {
      toast.error(`Falha ao guardar fase: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingTask(null); // Alterado para isEditingTask
    setEditedTask(null); // Alterado para setEditedTask
  };

  const handleCreateSchedule = async () => {
    if (!budgetId || !projectId || !userCompanyId) {
      toast.error("Dados insuficientes para criar o cronograma.");
      return;
    }

    setIsCreatingSchedule(true);
    try {
      const { error } = await supabase.rpc('create_schedule_from_budget', {
        p_budget_id: budgetId,
        p_project_id: projectId,
        p_company_id: userCompanyId,
      });

      if (error) {
        throw new Error(`Erro ao criar cronograma: ${error.message}`);
      }

      toast.success("Cronograma criado com sucesso!");
      fetchScheduleData(); // Refresh data to show the new schedule
      onScheduleRefetch(); // Notify parent to refetch project data (e.g., status)
    } catch (error: any) {
      toast.error(`Falha ao criar cronograma: ${error.message}`);
      console.error("Erro ao criar cronograma:", error);
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>A carregar cronograma...</p>
      </div>
    );
  }

  if (!schedule || tasks.length === 0) { // Alterado para tasks.length
    return (
      <EmptyState
        icon={CalendarDays}
        title="Cronograma não gerado"
        description="O cronograma será gerado automaticamente após a aprovação do orçamento e a criação da obra. Se não apareceu, pode gerá-lo manualmente."
        buttonText="Gerar Cronograma Agora"
        onButtonClick={handleCreateSchedule}
        // Desabilitar o botão se já estiver a criar ou se não houver budgetId
        disabled={isCreatingSchedule || !budgetId}
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
            {tasks.map((task) => ( // Alterado para task
              <Card key={task.id} className="p-4">
                {isEditingTask === task.id ? ( // Alterado para isEditingTask
                  <div className="space-y-2">
                    <Input
                      value={editedTask?.capitulo || ""} // Alterado para capitulo
                      onChange={(e) => setEditedTask({ ...editedTask, capitulo: e.target.value })} // Alterado para capitulo
                      placeholder="Nome da Fase"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editedTask?.data_inicio && "text-muted-foreground" // Alterado para data_inicio
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {editedTask?.data_inicio ? format(parseISO(editedTask.data_inicio as string), "PPP", { locale: pt }) : "Data de Início"} {/* Alterado para data_inicio */}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editedTask?.data_inicio ? parseISO(editedTask.data_inicio as string) : undefined} // Alterado para data_inicio
                          onSelect={(date) => setEditedTask({ ...editedTask, data_inicio: date ? format(date, "yyyy-MM-dd") : null })} // Alterado para data_inicio
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
                            !editedTask?.data_fim && "text-muted-foreground" // Alterado para data_fim
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {editedTask?.data_fim ? format(parseISO(editedTask.data_fim as string), "PPP", { locale: pt }) : "Data de Fim"} {/* Alterado para data_fim */}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editedTask?.data_fim ? parseISO(editedTask.data_fim as string) : undefined} // Alterado para data_fim
                          onSelect={(date) => setEditedTask({ ...editedTask, data_fim: date ? format(date, "yyyy-MM-dd") : null })} // Alterado para data_fim
                          initialFocus
                          locale={pt}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormControl>
                      <Select
                        value={editedTask?.estado || "Planeado"} // Alterado para estado
                        onValueChange={(value) => setEditedTask({ ...editedTask, estado: value as ScheduleTask["estado"] })} // Alterado para estado
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
                    </FormControl>
                    <Input
                      type="number"
                      value={editedTask?.progresso || 0} // Alterado para progresso
                      onChange={(e) => setEditedTask({ ...editedTask, progresso: parseFloat(e.target.value) })} // Alterado para progresso
                      placeholder="Progresso (%)"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveTask}>Guardar</Button> {/* Alterado para handleSaveTask */}
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-lg font-semibold mb-2">{task.capitulo}</CardTitle> {/* Alterado para capitulo */}
                    <p className="text-sm text-muted-foreground">
                      Início: {task.data_inicio ? format(parseISO(task.data_inicio), "PPP", { locale: pt }) : "N/A"} {/* Alterado para data_inicio */}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Fim: {task.data_fim ? format(parseISO(task.data_fim), "PPP", { locale: pt }) : "N/A"} {/* Alterado para data_fim */}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Duração: {task.duracao_dias !== null ? `${task.duracao_dias} dias` : "N/A"} {/* Alterado para duracao_dias */}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Estado:
                      {task.estado === "Concluído" && <CheckCircle className="h-4 w-4 text-green-500" />} {/* Alterado para estado */}
                      {task.estado === "Em execução" && <Play className="h-4 w-4 text-blue-500" />} {/* Alterado para estado */}
                      {task.estado === "Atrasado" && <AlertTriangle className="h-4 w-4 text-orange-500" />} {/* Alterado para estado */}
                      <span className={cn(
                        task.estado === "Concluído" && "text-green-500", // Alterado para estado
                        task.estado === "Em execução" && "text-blue-500", // Alterado para estado
                        task.estado === "Atrasado" && "text-orange-500", // Alterado para estado
                      )}>
                        {task.estado} {/* Alterado para estado */}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={task.progresso} className="flex-1 h-2" /> {/* Alterado para progresso */}
                      <span className="text-sm font-medium">{task.progresso}%</span> {/* Alterado para progresso */}
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => handleEditTask(task)}> {/* Alterado para handleEditTask */}
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