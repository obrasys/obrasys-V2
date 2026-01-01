"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CalendarDays,
  Play,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import {
  Schedule,
  ScheduleTask,
} from "@/schemas/project-schema";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface ScheduleTabProps {
  projectId: string;
  budgetId: string;
  onScheduleRefetch: () => void;
  userCompanyId: string | null;
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({
  projectId,
  budgetId,
  onScheduleRefetch,
  userCompanyId,
}) => {
  const [schedule, setSchedule] =
    React.useState<Schedule | null>(null);
  const [tasks, setTasks] =
    React.useState<ScheduleTask[]>([]);
  const [loading, setLoading] =
    React.useState(true);
  const [isCreatingSchedule, setIsCreatingSchedule] =
    React.useState(false);
  const [isEditingTask, setIsEditingTask] =
    React.useState<string | null>(null);

  const editForm = useForm<ScheduleTask>({
    defaultValues: {
      capitulo: "",
      data_inicio: null,
      data_fim: null,
      estado: "Planeado",
      progresso: 0,
    } as ScheduleTask,
  });

  const fetchScheduleData =
    React.useCallback(async () => {
      let isMounted = true;
      setLoading(true);

      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("project_id", projectId)
        .eq("budget_id", budgetId)
        .single();

      if (!isMounted) return;

      if (error && error.code !== "PGRST116") {
        toast.error(
          `Erro ao carregar cronograma: ${error.message}`
        );
        setLoading(false);
        return;
      }

      if (data) {
        setSchedule(data);

        const { data: taskData, error: taskError } =
          await supabase
            .from("schedule_tasks")
            .select("*")
            .eq("schedule_id", data.id)
            .order("ordem", {
              ascending: true,
            });

        if (!isMounted) return;

        if (taskError) {
          toast.error(
            `Erro ao carregar fases: ${taskError.message}`
          );
        } else {
          setTasks(taskData || []);
        }
      } else {
        setSchedule(null);
        setTasks([]);
      }

      setLoading(false);

      return () => {
        isMounted = false;
      };
    }, [projectId, budgetId]);

  React.useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const handleEditTask = (task: ScheduleTask) => {
    setIsEditingTask(task.id || null);
    editForm.reset(task);
  };

  const handleSaveTask = editForm.handleSubmit(
    async (data) => {
      if (!data?.id) return;

      try {
        const { error } = await supabase
          .from("schedule_tasks")
          .update({
            capitulo: data.capitulo,
            data_inicio: data.data_inicio,
            data_fim: data.data_fim,
            estado: data.estado,
            progresso: data.progresso,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        if (error) throw error;

        toast.success(
          "Fase do cronograma atualizada!"
        );
        setIsEditingTask(null);
        editForm.reset();
        fetchScheduleData();
        onScheduleRefetch();
      } catch (err: any) {
        toast.error(
          `Erro ao guardar fase: ${err.message}`
        );
      }
    }
  );

  const handleCreateSchedule = async () => {
    if (!budgetId || !projectId || !userCompanyId) {
      toast.error(
        "Dados insuficientes para criar cronograma."
      );
      return;
    }

    setIsCreatingSchedule(true);
    try {
      const { error } = await supabase.rpc(
        "create_schedule_from_budget",
        {
          p_budget_id: budgetId,
          p_project_id: projectId,
          p_company_id: userCompanyId,
        }
      );

      if (error) throw error;

      toast.success("Cronograma criado!");
      fetchScheduleData();
      onScheduleRefetch();
    } catch (err: any) {
      toast.error(
        `Erro ao criar cronograma: ${err.message}`
      );
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>A carregar cronograma…</p>
      </div>
    );
  }

  if (!schedule || tasks.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Cronograma não gerado"
        description="O cronograma pode ser gerado automaticamente a partir do orçamento."
        buttonText="Gerar Cronograma Agora"
        onButtonClick={handleCreateSchedule}
        buttonDisabled={
          isCreatingSchedule || !budgetId
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Cronograma da Obra
        </CardTitle>
        <Button
          variant="outline"
          onClick={fetchScheduleData}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <span>Progresso Geral</span>
          <Progress
            value={schedule.overall_progress}
            className="flex-1 h-3"
          />
          <strong>
            {schedule.overall_progress}%
          </strong>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4">
              <CardTitle className="text-lg mb-2">
                {task.capitulo}
              </CardTitle>

              <p className="text-sm">
                Início:{" "}
                {task.data_inicio
                  ? format(
                      parseISO(task.data_inicio),
                      "PPP",
                      { locale: pt }
                    )
                  : "N/A"}
              </p>

              <p className="text-sm">
                Fim:{" "}
                {task.data_fim
                  ? format(
                      parseISO(task.data_fim),
                      "PPP",
                      { locale: pt }
                    )
                  : "N/A"}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <Progress
                  value={task.progresso}
                  className="flex-1 h-2"
                />
                <span>{task.progresso}%</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={() =>
                  handleEditTask(task)
                }
              >
                Editar Fase
              </Button>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleTab;
