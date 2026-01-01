"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  PayrollEntry,
  payrollEntrySchema,
} from "@/schemas/payroll-schema";
import { Project } from "@/schemas/project-schema";
import { Profile } from "@/schemas/profile-schema";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";

/* =========================
   PROPS
========================= */

interface CreateEditPayrollEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: PayrollEntry) => void;
  entryToEdit?: PayrollEntry | null;
  projects: Project[];
  companyMembers: Profile[];
  userCompanyId: string | null;
}

/* =========================
   COMPONENT
========================= */

const CreateEditPayrollEntryDialog: React.FC<
  CreateEditPayrollEntryDialogProps
> = ({
  isOpen,
  onClose,
  onSave,
  entryToEdit,
  projects,
  companyMembers,
  userCompanyId,
}) => {
  const { user } = useSession();
  const [isSaving, setIsSaving] =
    React.useState(false);

  const form = useForm<PayrollEntry>({
    resolver: zodResolver(payrollEntrySchema),
    defaultValues:
      entryToEdit || {
        entry_date: format(new Date(), "yyyy-MM-dd"),
        description: "",
        amount: 0,
        type: "salary",
        status: "pending",
        notes: "",
        project_id: null,
        user_id: null,
      },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset(
        entryToEdit || {
          entry_date: format(
            new Date(),
            "yyyy-MM-dd"
          ),
          description: "",
          amount: 0,
          type: "salary",
          status: "pending",
          notes: "",
          project_id: null,
          user_id: null,
        }
      );
    }
  }, [isOpen, entryToEdit, form]);

  /* =========================
     SUBMIT
  ========================= */

  const onSubmit = async (data: PayrollEntry) => {
    if (!user || !userCompanyId) {
      toast.error(
        "Utilizador não autenticado ou empresa inválida."
      );
      return;
    }

    setIsSaving(true);

    const payrollDataToSave: PayrollEntry = {
      ...data,
      id: data.id || uuidv4(),
      company_id: userCompanyId,
    };

    const { error } = await supabase
      .from("payroll_entries")
      .upsert(payrollDataToSave);

    if (error) {
      console.error(
        "[CreateEditPayrollEntryDialog] upsert",
        error
      );
      toast.error(
        "Erro ao guardar registo de folha de pagamento."
      );
      setIsSaving(false);
      return;
    }

    toast.success(
      `Registo ${
        entryToEdit ? "atualizado" : "criado"
      } com sucesso!`
    );

    onSave(payrollDataToSave);
    onClose();
    setIsSaving(false);
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {entryToEdit
              ? "Editar Registo de Folha de Pagamento"
              : "Criar Novo Registo de Folha de Pagamento"}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes do registo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="entry_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Data do Registo *
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value &&
                              "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? format(
                                parseISO(
                                  field.value
                                ),
                                "PPP",
                                { locale: pt }
                              )
                            : "Selecione uma data"}
                          <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
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
                            ? parseISO(
                                field.value
                              )
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
                        locale={pt}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Descrição *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ex: Salário mensal"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="salary">
                          Salário
                        </SelectItem>
                        <SelectItem value="bonus">
                          Bónus
                        </SelectItem>
                        <SelectItem value="overtime">
                          Horas Extras
                        </SelectItem>
                        <SelectItem value="tax">
                          Imposto
                        </SelectItem>
                        <SelectItem value="benefit">
                          Benefício
                        </SelectItem>
                        <SelectItem value="other">
                          Outro
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Colaborador (opcional)
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um colaborador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companyMembers.map(
                          (member) => (
                            <SelectItem
                              key={member.id}
                              value={member.id!}
                            >
                              {member.first_name}{" "}
                              {member.last_name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Obra (opcional)
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma obra" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map(
                          (project) => (
                            <SelectItem
                              key={project.id}
                              value={project.id}
                            >
                              {project.nome}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">
                        Pendente
                      </SelectItem>
                      <SelectItem value="processed">
                        Processado
                      </SelectItem>
                      <SelectItem value="paid">
                        Pago
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Notas (opcional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Notas adicionais"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A Guardar...
                  </>
                ) : entryToEdit ? (
                  "Guardar Alterações"
                ) : (
                  "Criar Registo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditPayrollEntryDialog;
