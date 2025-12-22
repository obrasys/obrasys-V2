"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Play, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Schedule, ScheduleTask } from "@/schemas/project-schema";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface ScheduleTabProps {
  projectId: string;
  budgetId: string;
  onScheduleRefetch: () => void;
  userCompanyId: string | null;
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ projectId, budgetId, onScheduleRefetch, userCompanyId }) => {
  const [schedule, setSchedule] = React.useState<Schedule | null>(null);
  const [tasks, setTasks] = React.useState<ScheduleTask[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreatingSchedule, setIsCreatingSchedule] = React.useState(false);
  const [isEditingTask, setIsEditingTask] = React.useState<string | null>(null);
  // Removido: const [editedTask, setEditedTask] = React.useState<Partial<ScheduleTask> | null>(null);
  
  const editForm = useForm<ScheduleTask>();

  const fetchScheduleData = React.useCallback(async () => {
    setLoading(true);
    const { data: existingSchedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("*")
      .eq("project_id", projectId)
      .eq("budget_id", budgetId)
      .single();

    if (scheduleError && scheduleError.code !== 'PGRST116') {
      toast.error(`Erro ao carregar cronograma: ${scheduleError.message}`);
      setLoading(false);
      return;
    }

    if (existingSchedule) {
      setSchedule(existingSchedule);
      const { data: fetchedTasks, error: tasksError } = await supabase
        .from("schedule_tasks")
        .select("*")
        .eq("schedule_id", existingSchedule.id)
        .order("ordem", { ascending: true });

      if (tasksError) {
        toast.error(`Erro ao carregar fases do cronograma: ${tasksError.message}`);
      } else {
        setTasks(fetchedTasks || []);
      }
    } else {
      setSchedule(null);
      setTasks([]);
    }
    setLoading(false);
  }, [projectId, budgetId]);

  React.useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const handleEditTask = (task: ScheduleTask) => {
    setIsEditingTask(task.id || null);
    editForm.reset(task);
  };

  const handleSaveTask = editForm.handleSubmit(async (data: ScheduleTask) => {
    if (!data || !data.id) return;

    try {
      let updatedTask = { ...data };

      if (updatedTask.data_inicio && updatedTask.data_fim) {
        const startDate = parseISO(updatedTask.data_inicio as string);
        const endDate = parseISO(updatedTask.data_fim as string);
        updatedTask.duracao_dias = differenceInDays(endDate, startDate) + 1;
      } else {
        updatedTask.duracao_dias = null;
      }

      const { error } = await supabase
        .from("schedule_tasks")
        .update({
          capitulo: updatedTask.capitulo,
          data_inicio: updatedTask.data_inicio,
          data_fim: updatedTask.data_fim,
          duracao_dias: updatedTask.duracao_dias,
          estado: updatedTask.estado,
          progresso: updatedTask.progresso,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (error) {
        throw new Error(`Erro ao guardar fase: ${error.message}`);
      }

      toast.success("Fase do cronograma atualizada com sucesso!");
      setIsEditingTask(null);
      editForm.reset();
      fetchScheduleData();
      onScheduleRefetch();
    } catch (error: any) {
      toast.error(`Falha ao guardar fase: ${error.message}`);
    }
  });

  const handleCancelEdit = () => {
    setIsEditingTask(null);
    editForm.reset();
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
      fetchScheduleData();
      onScheduleRefetch();
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

  if (!schedule || tasks.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Cronograma não gerado"
        description="O cronograma será gerado automaticamente após a aprovação do orçamento e a criação da obra. Se não apareceu, pode gerá-lo manualmente."
        buttonText="Gerar Cronograma Agora"
        onButtonClick={handleCreateSchedule}
        buttonDisabled={isCreatingSchedule || !budgetId} // Usar buttonDisabled
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
            {tasks.map((task) => (
              <Card key={task.id} className="p-4">
                {isEditingTask === task.id ? (
                  <Form {...editForm}>
                    <form onSubmit={handleSaveTask} className="space-y-2">
                      <FormField
                        control={editForm.control}
                        name="capitulo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Nome da Fase</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Nome da Fase"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="data_inicio"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="sr-only">Data de Início</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    {field.value ? format(parseISO(field.value as string), "PPP", { locale: pt }) : "Data de Início"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? parseISO(field.value as string) : undefined}
                                  onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                                  initialFocus
                                  locale={pt}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="data_fim"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="sr-only">Data de Fim</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    {field.value ? format(parseISO(field.value as string), "PPP", { locale: pt }) : "Data de Fim"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? parseISO(field.value as string) : undefined}
                                  onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                                  initialFocus
                                  locale={pt}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="estado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Estado</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "Planeado"}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Planeado">Planeado</SelectItem>
                                <SelectItem value="Em execução">Em execução</SelectItem>
                                <SelectItem value="Concluído">Concluído</SelectItem>
                                <SelectItem value="Atrasado">Atrasado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="progresso"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Progresso (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                placeholder="Progresso (%)"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">Guardar</Button>
                        <Button type="button" size="sm" variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <>
                    <CardTitle className="text-lg font-semibold mb-2">{task.capitulo}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Início: {task.data_inicio ? format(parseISO(task.data_inicio), "PPP", { locale: pt }) : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Fim: {task.data_fim ? format(parseISO(task.data_fim), "PPP", { locale: pt }) : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Duração: {task.duracao_dias !== null ? `${task.duracao_dias} dias` : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Estado:
                      {task.estado === "Concluído" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {task.estado === "Em execução" && <Play className="h-4 w-4 text-blue-500" />}
                      {task.estado === "Atrasado" && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      <span className={cn(
                        task.estado === "Concluído" && "text-green-500",
                        task.estado === "Em execução" && "text-blue-500",
                        task.estado === "Atrasado" && "text-orange-500",
                      )}>
                        {task.estado}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={task.progresso} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{task.progresso}%</span>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => handleEditTask(task)}>
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