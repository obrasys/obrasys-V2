"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";

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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/* =========================
   SCHEMA
========================= */

const manualRdoEntrySchema = z.object({
  data: z.string().min(1, "A data é obrigatória."),
  resumo: z.string().min(1, "O resumo é obrigatório."),
});

type ManualRdoEntryFormValues = z.infer<
  typeof manualRdoEntrySchema
>;

/* =========================
   PROPS
========================= */

interface ManualRdoEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  livroObraId: string;
  onSaved?: () => void;
}

/* =========================
   COMPONENT
========================= */

const ManualRdoEntryDialog: React.FC<
  ManualRdoEntryDialogProps
> = ({
  isOpen,
  onClose,
  livroObraId,
  onSaved,
}) => {
  const [isSaving, setIsSaving] =
    React.useState(false);

  const form = useForm<ManualRdoEntryFormValues>(
    {
      resolver: zodResolver(
        manualRdoEntrySchema
      ),
      defaultValues: {
        data: format(new Date(), "yyyy-MM-dd"),
        resumo: "",
      },
    }
  );

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        data: format(
          new Date(),
          "yyyy-MM-dd"
        ),
        resumo: "",
      });
    }
  }, [isOpen, form]);

  /* =========================
     SUBMIT
  ========================= */

  const onSubmit = async (
    values: ManualRdoEntryFormValues
  ) => {
    setIsSaving(true);

    const payload = {
      id: uuidv4(),
      livro_obra_id: livroObraId,
      rdo_id: uuidv4(),
      data: values.data,
      resumo: values.resumo,
      custos_diarios: 0,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("livro_obra_rdos")
      .insert([payload]);

    if (error) {
      console.error(error);
      toast.error(
        "Erro ao guardar RDO manual."
      );
      setIsSaving(false);
      return;
    }

    toast.success(
      "Registo diário adicionado ao Livro de Obra."
    );

    onSaved?.();
    onClose();
    setIsSaving(false);
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            Registo Manual – Livro de Obra
          </DialogTitle>
          <DialogDescription>
            Adicione um resumo diário oficial
            para o Livro de Obra.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              onSubmit
            )}
            className="space-y-4"
          >
            {/* DATA */}
            <FormField
              control={form.control}
              name="data"
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
                            "justify-between",
                            !field.value &&
                              "text-muted-foreground"
                          )}
                          disabled={isSaving}
                        >
                          {field.value
                            ? format(
                                parseISO(
                                  field.value
                                ),
                                "PPP",
                                {
                                  locale: pt,
                                }
                              )
                            : "Selecionar data"}
                          <CalendarDays className="h-4 w-4 opacity-50" />
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
                        initialFocus
                        locale={pt}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* RESUMO */}
            <FormField
              control={form.control}
              name="resumo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Resumo do Dia *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder="Ex: Execução de cofragem no piso 1. Reunião com fiscalização. Sem ocorrências."
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full"
            >
              {isSaving
                ? "A guardar..."
                : "Guardar Registo"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualRdoEntryDialog;
