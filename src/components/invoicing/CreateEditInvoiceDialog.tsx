"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

import {
  Invoice,
  invoiceSchema,
  invoiceItemSchema,
} from "@/schemas/invoicing-schema";
import { Project } from "@/schemas/project-schema";
import { Client } from "@/schemas/client-schema";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";

import InvoiceGeneralForm from "./InvoiceGeneralForm";
import InvoiceItemsSection from "./InvoiceItemsSection";
import InvoiceTotalDisplay from "./InvoiceTotalDisplay";

/* =========================
   SCHEMA COMPLETO
========================= */

const fullInvoiceSchema = invoiceSchema.extend({
  vat_rate: z.number().optional().default(23),
  items: z
    .array(invoiceItemSchema)
    .min(1, "A fatura deve ter pelo menos um item."),
});

export type FullInvoiceFormValues = z.infer<typeof fullInvoiceSchema>;

interface CreateEditInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice & { items: any[] }) => void;
  invoiceToEdit?: Invoice | null;
}

const CreateEditInvoiceDialog: React.FC<CreateEditInvoiceDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  invoiceToEdit,
}) => {
  const { user } = useSession();

  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  /* =========================
     FORM
  ========================= */

  const form = useForm<FullInvoiceFormValues>({
    resolver: zodResolver(fullInvoiceSchema),
    defaultValues: {
      invoice_number: "",
      client_id: null,
      project_id: null,
      issue_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      ),
      vat_rate: 23,
      total_amount: 0,
      paid_amount: 0,
      status: "pending",
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  /* =========================
     LOAD COMPANY
  ========================= */

  React.useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast.error("Erro ao obter empresa do utilizador");
          return;
        }
        setUserCompanyId(data.company_id);
      });
  }, [user]);

  /* =========================
     LOAD PROJECTS & CLIENTS
  ========================= */

  React.useEffect(() => {
    if (!userCompanyId) return;

    setIsLoadingData(true);

    Promise.all([
      supabase
        .from("projects")
        .select("id, nome")
        .eq("company_id", userCompanyId),
      supabase
        .from("clients")
        .select("id, nome")
        .eq("company_id", userCompanyId),
    ]).then(([projectsRes, clientsRes]) => {
      if (!projectsRes.error)
        setProjects(projectsRes.data || []);
      if (!clientsRes.error)
        setClients(clientsRes.data || []);
      setIsLoadingData(false);
    });
  }, [userCompanyId]);

  /* =========================
     POPULATE EDIT
  ========================= */

  React.useEffect(() => {
    if (!isOpen || isLoadingData) return;

    if (invoiceToEdit) {
      form.reset({
        ...invoiceToEdit,
        issue_date: format(parseISO(invoiceToEdit.issue_date), "yyyy-MM-dd"),
        due_date: format(parseISO(invoiceToEdit.due_date), "yyyy-MM-dd"),
        vat_rate: invoiceToEdit.vat_rate ?? 23,
      });

      supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceToEdit.id)
        .then(({ data }) => {
          form.setValue("items", data || []);
        });
    } else {
      form.reset({
        invoice_number: "",
        client_id: null,
        project_id: null,
        issue_date: format(new Date(), "yyyy-MM-dd"),
        due_date: format(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          "yyyy-MM-dd"
        ),
        vat_rate: 23,
        status: "pending",
        paid_amount: 0,
        notes: "",
        items: [
          {
            id: uuidv4(),
            description: "",
            quantity: 1,
            unit: "un",
            unit_price: 0,
            line_total: 0,
            budget_item_id: null,
            schedule_task_id: null,
          },
        ],
      });
    }
  }, [isOpen, isLoadingData, invoiceToEdit, form]);

  /* =========================
     CALCULATE TOTALS
  ========================= */

  React.useEffect(() => {
    const sub = form.watch((values) => {
      let subtotal = 0;

      values.items?.forEach((item, i) => {
        const lineTotal =
          (item.quantity || 0) * (item.unit_price || 0);
        subtotal += lineTotal;
        form.setValue(`items.${i}.line_total`, lineTotal);
      });

      const vatRate = values.vat_rate ?? 0;
      const vatAmount = subtotal * (vatRate / 100);
      const total = subtotal + vatAmount;

      form.setValue("total_amount", total);
    });

    return () => sub.unsubscribe();
  }, [form]);

  /* =========================
     SUBMIT
  ========================= */

  const onSubmit = async (data: FullInvoiceFormValues) => {
    if (!userCompanyId) {
      toast.error("Empresa não encontrada.");
      return;
    }

    setIsSaving(true);

    try {
      const invoiceId = data.id ?? uuidv4();

      const subtotal = data.items.reduce(
        (s, i) => s + i.line_total,
        0
      );
      const vatAmount = subtotal * ((data.vat_rate ?? 0) / 100);

      const invoiceToSave = {
        id: invoiceId,
        company_id: userCompanyId,
        client_id: data.client_id,
        project_id: data.project_id,
        invoice_number: data.invoice_number,
        issue_date: data.issue_date,
        due_date: data.due_date,
        subtotal,
        vat_rate: data.vat_rate,
        vat_amount: vatAmount,
        total_amount: subtotal + vatAmount,
        paid_amount: data.paid_amount ?? 0,
        status: data.status,
        notes: data.notes ?? null,
      };

      const { data: savedInvoice, error } = await supabase
        .from("invoices")
        .upsert(invoiceToSave, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", savedInvoice.id);

      const itemsToInsert = data.items.map((item) => ({
        id: item.id ?? uuidv4(),
        invoice_id: savedInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        line_total: item.line_total,
        budget_item_id: item.budget_item_id ?? null,
        schedule_task_id: item.schedule_task_id ?? null,
      }));

      await supabase.from("invoice_items").insert(itemsToInsert);

      toast.success("Fatura guardada com sucesso.");
      onSave({ ...savedInvoice, items: itemsToInsert });
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) {
    return (
      <Dialog open={isOpen}>
        <DialogContent>
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0">
        <DialogHeader className="p-6">
          <DialogTitle>
            {invoiceToEdit ? "Editar Fatura" : "Nova Fatura"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da fatura.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <InvoiceGeneralForm
                form={form}
                projects={projects}
                clients={clients}
              />

              <InvoiceItemsSection
                form={form}
                itemFields={fields}
                appendItem={append}
                removeItem={remove}
              />

              <InvoiceTotalDisplay totalAmount={form.watch("total_amount")} />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "A guardar..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditInvoiceDialog;
