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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

import { Project, projectSchema } from "@/schemas/project-schema";
import { toast } from "sonner";
import { Client } from "@/schemas/client-schema"; // Import Client type
import { supabase } from "@/integrations/supabase/client"; // Import supabase

interface CreateEditProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  projectToEdit?: Project | null;
  initialBudgetId?: string | null; // Novo prop para ligar ao orçamento
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
      const { data, error } = await supabase.from('clients').select('id, nome');
      if (error) {
        toast.error(`Erro ao carregar clientes: ${error.message}`);
        console.error("Erro ao carregar clientes:", error);
      } else {
        setClients(data || []);
      }
    };
    fetchClients();
  }, []);

  const form = useForm<Project>({
    resolver: zodResolver(projectSchema),
    defaultValues: projectToEdit || {
      nome: "",
      client_id: "", // Alterado de 'cliente' para 'client_id'
      localizacao: "",
      estado: "Planeada",
      progresso: 0,
      prazo: "",
      custo_planeado: 0,
      custo_real: 0,
      budget_id: initialBudgetId, // Define o budget_id inicial
    },
  });

  React.useEffect(() => {
    if (projectToEdit) {
      form.reset(projectToEdit);
    } else {
      form.reset({
        nome: "",
        client_id: "", // Alterado de 'cliente' para 'client_id'
        localizacao: "",
        estado: "Planeada",
        progresso: 0,
        prazo: "",
        custo_planeado: 0,
        custo_real: 0,
        budget_id: initialBudgetId, // Garante que o budget_id é resetado ou mantido
      });
    }
  }, [projectToEdit, initialBudgetId, form]);

  const onSubmit = (data: Project) => {
    const newProject: Project = {
      ...data,
      id: data.id || uuidv4(), // Generate ID if new project
    };
    onSave(newProject);
    toast.success(`Obra ${projectToEdit ? "atualizada" : "criada"} com sucesso!`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{projectToEdit ? "Editar Obra" : "Criar Nova Obra"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da obra.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
              name="client_id" // Alterado de 'cliente' para 'client_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Planeada">Planeada</SelectItem>
                      <SelectItem value="Em execução">Em execução</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                      <SelectItem value="Suspensa">Suspensa</SelectItem>
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
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP", { locale: pt })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
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
                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Hidden field for budget_id */}
            <FormField
              control={form.control}
              name="budget_id"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-4">
              {projectToEdit ? "Guardar Alterações" : "Criar Obra"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditProjectDialog;