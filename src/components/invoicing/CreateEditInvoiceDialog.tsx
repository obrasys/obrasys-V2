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

import { Invoice, InvoiceItem, invoiceSchema, invoiceItemSchema } from "@/schemas/invoicing-schema";
import { Project } from "@/schemas/project-schema";
import { Client } from "@/schemas/client-schema";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";

// Importar os novos componentes modulares
import InvoiceGeneralForm from "./InvoiceGeneralForm";
import InvoiceItemsSection from "./InvoiceItemsSection";
import InvoiceTotalDisplay from "./InvoiceTotalDisplay";

// Define a schema para o formulário completo, incluindo os itens
export const fullInvoiceSchema = invoiceSchema.extend({
  items: z.array(invoiceItemSchema).min(1, "A fatura deve ter pelo menos um item."),
});

export type FullInvoiceFormValues = z.infer<typeof fullInvoiceSchema>;

interface CreateEditInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: FullInvoiceFormValues) => void;
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

  const form = useForm<FullInvoiceFormValues>({
    resolver: zodResolver(fullInvoiceSchema),
    defaultValues: {
      ...invoiceToEdit,
      issue_date: invoiceToEdit?.issue_date ? format(parseISO(invoiceToEdit.issue_date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      due_date: invoiceToEdit?.due_date ? format(parseISO(invoiceToEdit.due_date), "yyyy-MM-dd") : format(new Date(new Date().setDate(new Date().getDate() + 30)), "yyyy-MM-dd"), // Default 30 days
      items: [], // Will be populated in useEffect
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Fetch user's company ID
  const fetchUserCompanyId = React.useCallback(async () => {
    if (!user) {
      setUserCompanyId(null);
      return;
    }
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Erro ao carregar company_id do perfil:", profileError);
      setUserCompanyId(null);
    } else if (profileData) {
      setUserCompanyId(profileData.company_id);
    }
  }, [user]);

  // Fetch projects and clients
  const fetchData = React.useCallback(async () => {
    if (!userCompanyId) {
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    const [projectsRes, clientsRes] = await Promise.all([
      supabase.from('projects').select('id, nome').eq('company_id', userCompanyId),
      supabase.from('clients').select('id, nome').eq('company_id', userCompanyId),
    ]);

    if (projectsRes.error) {
      toast.error(`Erro ao carregar obras: ${projectsRes.error.message}`);
      console.error("Erro ao carregar obras:", projectsRes.error);
    } else {
      setProjects(projectsRes.data || []);
    }

    if (clientsRes.error) {
      toast.error(`Erro ao carregar clientes: ${clientsRes.error.message}`);
      console.error("Erro ao carregar clientes:", clientsRes.error);
    } else {
      setClients(clientsRes.data || []);
    }
    setIsLoadingData(false);
  }, [userCompanyId]);

  React.useEffect(() => {
    fetchUserCompanyId();
  }, [fetchUserCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchData();
    }
  }, [userCompanyId, fetchData]);

  // Populate form with existing invoice data and items
  React.useEffect(() => {
    const populateForm = async () => {
      if (invoiceToEdit) {
        form.reset({
          ...invoiceToEdit,
          issue_date: invoiceToEdit.issue_date ? format(parseISO(invoiceToEdit.issue_date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
          due_date: invoiceToEdit.due_date ? format(parseISO(invoiceToEdit.due_date), "yyyy-MM-dd") : format(new Date(new Date().setDate(new Date().getDate() + 30)), "yyyy-MM-dd"), // Default 30 days
        });

        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoiceToEdit.id);

        if (itemsError) {
          toast.error(`Erro ao carregar itens da fatura: ${itemsError.message}`);
          console.error("Erro ao carregar itens da fatura:", itemsError);
          form.setValue('items', []);
        } else {
          form.setValue('items', itemsData || []);
        }
      } else {
        form.reset({
          invoice_number: "",
          client_id: "",
          project_id: null,
          issue_date: format(new Date(), "yyyy-MM-dd"),
          due_date: format(new Date(new Date().setDate(new Date().getDate() + 30)), "yyyy-MM-dd"),
          total_amount: 0,
          paid_amount: 0,
          status: "pending",
          notes: "",
          items: [{
            id: uuidv4(),
            description: "",
            quantity: 1,
            unit: "un",
            unit_price: 0,
            line_total: 0,
            budget_item_id: null,
            schedule_task_id: null,
          }],
        });
      }
    };

    if (!isLoadingData) { // Only populate once initial data is loaded
      populateForm();
    }
  }, [invoiceToEdit, form, isLoadingData]);

  // Calculate line_total and total_amount whenever items change
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name?.startsWith("items")) {
        let newTotalAmount = 0;
        value.items?.forEach((item, index) => {
          const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
          newTotalAmount += lineTotal;
          if (form.getValues(`items.${index}.line_total`) !== lineTotal) {
            form.setValue(`items.${index}.line_total`, lineTotal);
          }
        });
        if (form.getValues('total_amount') !== newTotalAmount) {
          form.setValue('total_amount', newTotalAmount);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: FullInvoiceFormValues) => {
    if (!userCompanyId) {
      toast.error("ID da empresa não encontrado.");
      return;
    }
    setIsSaving(true);
    try {
      // Explicitly pick fields for the 'invoices' table
      const invoiceDataToSave: Invoice = {
        id: data.id || uuidv4(),
        company_id: userCompanyId,
        project_id: data.project_id,
        client_id: data.client_id,
        invoice_number: data.invoice_number,
        issue_date: data.issue_date,
        due_date: data.due_date,
        total_amount: data.items.reduce((sum, item) => sum + item.line_total, 0),
        paid_amount: data.paid_amount,
        status: data.status,
        notes: data.notes,
      };

      let currentInvoiceId = invoiceDataToSave.id;

      // Upsert invoice
      const { data: upsertedInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .upsert(invoiceDataToSave)
        .select()
        .single();

      if (invoiceError) throw invoiceError;
      currentInvoiceId = upsertedInvoice.id;

      // Delete existing items if editing
      if (invoiceToEdit) {
        await supabase.from('invoice_items').delete().eq('invoice_id', currentInvoiceId);
      }

      // Insert new/updated items
      const itemsToInsert = data.items.map(item => ({
        ...item,
        invoice_id: currentInvoiceId,
        id: uuidv4(), // Ensure new IDs for items on upsert
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success(`Fatura ${invoiceToEdit ? "atualizada" : "criada"} com sucesso!`);
      onSave(data); // Pass the full form data back to parent
      onClose();
    } catch (error: any) {
      toast.error(`Erro ao guardar fatura: ${error.message}`);
      console.error("Erro ao guardar fatura:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>A carregar...</DialogTitle>
            <DialogDescription>A carregar dados de projetos e clientes.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{invoiceToEdit ? "Editar Fatura" : "Criar Nova Fatura"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da fatura e adicione os itens.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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

              <InvoiceTotalDisplay totalAmount={form.watch("total_amount")} />

              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={onClose} type="button" disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A Guardar...
                    </>
                  ) : (
                    invoiceToEdit ? "Guardar Alterações" : "Criar Fatura"
                  )}
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