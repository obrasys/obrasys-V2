"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

import { Project, projectSchema } from "@/schemas/project-schema";
import { toast } from "sonner";
import { Client } from "@/schemas/client-schema";
import { supabase } from "@/integrations/supabase/client";

type ProjectFormValues = z.infer<typeof projectSchema>;

interface CreateEditProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  projectToEdit?: Project | null;
  initialBudgetId?: string | null;
}

const CreateEditProjectDialog: React.FC<CreateEditProjectDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
  initialBudgetId = null,
}) => {
  const [clients, setClients] = React.useState<Client[]>([]);

  React.useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, nome");

      if (error) {
        console.error(error);
        toast.error(
          `Erro ao carregar clientes: ${error.message}`
        );
        return;
      }

      setClients(data ?? []);
    };

    fetchClients();
  }, []);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      nome: "",
      client_id: null,
      localizacao: "",
      estado: "Planeada",
      progresso: 0,
      prazo: "",
      custo_planeado: 0,
      custo_real: 0,
      budget_id: initialBudgetId,
    },
  });

  React.useEffect(() => {
    if (projectToEdit) {
      form.reset(projectToEdit);
    } else {
      form.reset({
        nome: "",
        client_id: null,
        localizacao: "",
        estado: "Planeada",
        progresso: 0,
        prazo: "",
        custo_planeado: 0,
        custo_real: 0,
        budget_id: initialBudgetId,
      });
    }
  }, [projectToEdit, initialBudgetId, form]);

  const onSubmit = (data: ProjectFormValues) => {
    const project: Project = {
      ...data,
      // ⚠️ aceitável apenas se o backend fizer upsert
      id: data.id ?? uuidv4(),
    };

    onSave(project);
    toast.success(
      `Obra ${
        projectToEdit ? "atualizada" : "criada"
      } com sucesso!`
    );
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {projectToEdit
              ? "Editar Obra"
              : "Criar Nova Obra"}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes da obra.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Obra</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem
                          key={client.id}
                          value={client.id}
                        >
                          {client.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="localizacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Planeada">
                        Planeada
                      </SelectItem>
                      <SelectItem value="Em execução">
                        Em execução
                      </SelectItem>
                      <SelectItem value="Concluída">
                        Concluída
                      </SelectItem>
                      <SelectItem value="Suspensa">
                        Suspensa
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="progresso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progresso (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={field.value}
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(
                          v === "" ? 0 : Number(v)
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prazo"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Prazo</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value &&
                              "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? format(
                                new Date(field.value),
                                "PPP",
                                { locale: pt }
                              )
                            : "Selecione uma data"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={
                          field.value
                            ? new Date(field.value)
                            : undefined
                        }
                        onSelect={(date) =>
                          field.onChange(
                            date
                              ? format(
                                  date,
                                  "yyyy-MM-dd"
                                )
                              : ""
                          )
                        }
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
              control={form.control}
              name="custo_planeado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo Planeado</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      value={field.value}
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(
                          v === "" ? 0 : Number(v)
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="custo_real"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo Real</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      value={field.value}
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(
                          v === "" ? 0 : Number(v)
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* budget_id oculto */}
            <FormField
              control={form.control}
              name="budget_id"
              render={({ field }) => (
                <Input type="hidden" {...field} />
              )}
            />

            <Button type="submit" className="mt-4">
              {projectToEdit
                ? "Guardar Alterações"
                : "Criar Obra"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditProjectDialog;
