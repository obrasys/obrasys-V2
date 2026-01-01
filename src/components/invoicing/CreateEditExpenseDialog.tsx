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
  Expense,
  expenseSchema,
} from "@/schemas/invoicing-schema";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";

/* =========================
   PROPS
========================= */

interface CreateEditExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  expenseToEdit?: Expense | null;
  userCompanyId: string | null;
}

/* =========================
   COMPONENT
========================= */

const CreateEditExpenseDialog: React.FC<
  CreateEditExpenseDialogProps
> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  userCompanyId,
}) => {
  const { user } = useSession();
  const [isSaving, setIsSaving] =
    React.useState(false);

  const form = useForm<Expense>({
    resolver: zodResolver(expenseSchema),
    defaultValues:
      expenseToEdit || {
        supplier_name: "",
        description: "",
        amount: 0,
        due_date: format(new Date(), "yyyy-MM-dd"),
        status: "pending",
        notes: "",
      },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset(
        expenseToEdit || {
          supplier_name: "",
          description: "",
          amount: 0,
          due_date: format(new Date(), "yyyy-MM-dd"),
          status: "pending",
          notes: "",
        }
      );
    }
  }, [isOpen, expenseToEdit, form]);

  /* =========================
     SUBMIT
  ========================= */

  const onSubmit = async (data: Expense) => {
    if (!user || !userCompanyId) {
      toast.error(
        "Utilizador não autenticado ou empresa inválida."
      );
      return;
    }

    setIsSaving(true);

    const expenseDataToSave: Expense = {
      ...data,
      id: data.id || uuidv4(),
      company_id: userCompanyId,
    };

    const { error } = await supabase
      .from("expenses")
      .upsert(expenseDataToSave);

    if (error) {
      console.error(
        "[CreateEditExpenseDialog] upsert",
        error
      );
      toast.error(
        "Erro ao guardar despesa. Tente novamente."
      );
      setIsSaving(false);
      return;
    }

    toast.success(
      `Despesa ${
        expenseToEdit ? "atualizada" : "criada"
      } com sucesso!`
    );

    onSave(expenseDataToSave);
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
            {expenseToEdit
              ? "Editar Despesa"
              : "Criar Nova Despesa"}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes da despesa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="supplier_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nome do fornecedor"
                    />
                  </FormControl>
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
                    Descrição da Despesa *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ex: Compra de materiais"
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
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Data de Vencimento *
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
                      <SelectItem value="paid">
                        Paga
                      </SelectItem>
                      <SelectItem value="overdue">
                        Atrasada
                      </SelectItem>
                      <SelectItem value="cancelled">
                        Cancelada
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
                ) : expenseToEdit ? (
                  "Guardar Alterações"
                ) : (
                  "Criar Despesa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditExpenseDialog;
