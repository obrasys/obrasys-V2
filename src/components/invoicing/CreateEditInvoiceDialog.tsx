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
import { toast } from "sonner";

import {
  Invoice,
  invoiceSchema,
  invoiceItemSchema,
} from "@/schemas/invoicing-schema";
import { Project } from "@/schemas/project-schema";
import { Client } from "@/schemas/client-schema";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";

import InvoiceGeneralForm from "./InvoiceGeneralForm";
import InvoiceItemsSection from "./InvoiceItemsSection";
import InvoiceTotalDisplay from "./InvoiceTotalDisplay";
import InvoiceFiscalSummary from "./InvoiceFiscalSummary";
import { calculateInvoiceFiscal } from "@/utils/invoice-calculations";

/* ======================================================
   SCHEMA COMPLETO
====================================================== */

export const fullInvoiceSchema = invoiceSchema.extend({
  items: z
    .array(invoiceItemSchema)
    .min(1, "A fatura deve ter pelo menos um item."),
});

export type FullInvoiceFormValues = z.infer<
  typeof fullInvoiceSchema
>;

interface CreateEditInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: FullInvoiceFormValues) => void;
  invoiceToEdit?: Invoice | null;
}

const CreateEditInvoiceDialog: React.FC<
  CreateEditInvoiceDialogProps
> = ({ isOpen, onClose, onSave, invoiceToEdit }) => {
  const { user } = useSession();

  const [userCompanyId, setUserCompanyId] =
    React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoadingData, setIsLoadingData] =
    React.useState(true);
  const [isSaving, setIsSaving] =
    React.useState(false);

  const form = useForm<FullInvoiceFormValues>({
    resolver: zodResolver(fullInvoiceSchema),
    defaultValues: {
      invoice_number: "",
      client_id: null,
      project_id: null,
      issue_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(
        new Date(
          new Date().setDate(
            new Date().getDate() + 30
          )
        ),
        "yyyy-MM-dd"
      ),
      total_amount: 0,
      vat_rate: 23,
      vat_amount: 0,
      withholding_rate: 11.5,
      withholding_amount: 0,
      total_to_receive: 0,
      paid_amount: 0,
      status: "pending",
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
    },
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  /* ======================================================
     LOAD COMPANY / DATA
  ====================================================== */

  React.useEffect(() => {
    const loadCompany = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      setUserCompanyId(data?.company_id ?? null);
    };
    loadCompany();
  }, [user]);

  React.useEffect(() => {
    if (!userCompanyId) return;

    const loadData = async () => {
      setIsLoadingData(true);

      const [projectsRes, clientsRes] =
        await Promise.all([
          supabase
            .from("projects")
            .select("id, nome")
            .eq("company_id", userCompanyId),
          supabase
            .from("clients")
            .select("id, nome")
            .eq("company_id", userCompanyId),
        ]);

      setProjects(projectsRes.data || []);
      setClients(clientsRes.data || []);

      setIsLoadingData(false);
    };

    loadData();
  }, [userCompanyId]);

  /* ======================================================
     CÁLCULOS AUTOMÁTICOS (IVA + RETENÇÃO)
  ====================================================== */

  React.useEffect(() => {
    const subscription = form.watch(() => {
      const items = form.getValues("items") || [];
      let subtotal = 0;

      items.forEach((item, index) => {
        const line =
          (item.quantity || 0) *
          (item.unit_price || 0);
        subtotal += line;

        if (
          form.getValues(
            `items.${index}.line_total`
          ) !== line
        ) {
          form.setValue(
            `items.${index}.line_total`,
            line,
            { shouldDirty: false }
          );
        }
      });

      const fiscal = calculateInvoiceFiscal(
        subtotal,
        form.getValues("vat_rate"),
        form.getValues("withholding_rate")
      );

      form.setValue("total_amount", fiscal.subtotal);
      form.setValue("vat_amount", fiscal.vatAmount);
      form.setValue(
        "withholding_amount",
        fiscal.withholdingAmount
      );
      form.setValue(
        "total_to_receive",
        fiscal.totalToReceive
      );
    });

    return () => subscription.unsubscribe();
  }, [form]);

  /* ======================================================
     SUBMIT
  ====================================================== */

  const onSubmit = async (data: FullInvoiceFormValues) => {
    if (!userCompanyId) {
      toast.error("Empresa não identificada.");
      return;
    }

    setIsSaving(true);

    try {
      const invoiceId = data.id || uuidv4();

      const invoiceData: Invoice = {
        ...data,
        id: invoiceId,
        company_id: userCompanyId,
      };

      await supabase.from("invoices").upsert(invoiceData);

      await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoiceId);

      await supabase.from("invoice_items").insert(
        data.items.map((item) => ({
          ...item,
          id: uuidv4(),
          invoice_id: invoiceId,
        }))
      );

      toast.success(
        invoiceToEdit
          ? "Fatura atualizada com sucesso!"
          : "Fatura criada com sucesso!"
      );

      onSave(data);
      onClose();
    } catch (error: any) {
      toast.error(
        `Erro ao guardar fatura: ${error.message}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>
            {invoiceToEdit
              ? "Editar Fatura"
              : "Criar Nova Fatura"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da fatura.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <InvoiceGeneralForm
                form={form}
                projects={projects}
                clients={clients}
              />

              <InvoiceItemsSection
                form={form}
                itemFields={itemFields}
                appendItem={appendItem}
                removeItem={removeItem}
              />

              <InvoiceTotalDisplay
                totalAmount={form.watch("total_amount")}
              />

              <InvoiceFiscalSummary
                subtotal={form.watch("total_amount")}
                vatAmount={form.watch("vat_amount")}
                withholdingAmount={form.watch(
                  "withholding_amount"
                )}
                totalToReceive={form.watch(
                  "total_to_receive"
                )}
              />

              <DialogFooter>
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
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Guardar Fatura
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
