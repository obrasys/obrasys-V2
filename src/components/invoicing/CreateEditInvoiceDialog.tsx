"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarDays, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator"; // Adicionado: Importação do componente Separator

import { Invoice, InvoiceItem, invoiceSchema, invoiceItemSchema } from "@/schemas/invoicing-schema";
import { Project } from "@/schemas/project-schema";
import { Client } from "@/schemas/client-schema";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";

// Define a schema para o formulário completo, incluindo os itens
const fullInvoiceSchema = invoiceSchema.extend({
  items: z.array(invoiceItemSchema).min(1, "A fatura deve ter pelo menos um item."),
});

type FullInvoiceFormValues = z.infer<typeof fullInvoiceSchema>;

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
        const updatedItems = value.items?.map((item, index) => {
          const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
          newTotalAmount += lineTotal;
          if (form.getValues(`items.${index}.line_total`) !== lineTotal) {
            form.setValue(`items.${index}.line_total`, lineTotal);
          }
          return { ...item, line_total: lineTotal };
        });
        if (form.getValues('total_amount') !== newTotalAmount) {
          form.setValue('total_amount', newTotalAmount);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleAddItem = () => {
    appendItem({
      id: uuidv4(),
      description: "",
      quantity: 1,
      unit: "un",
      unit_price: 0,
      line_total: 0,
      budget_item_id: null,
      schedule_task_id: null,
    });
  };

  const handleRemoveItem = (index: number) => {
    removeItem(index);
  };

  const onSubmit = async (data: FullInvoiceFormValues) => {
    if (!userCompanyId) {
      toast.error("ID da empresa não encontrado.");
      return;
    }
    setIsSaving(true);
    try {
      const invoiceDataToSave: Invoice = {
        ...data,
        company_id: userCompanyId,
        id: data.id || uuidv4(),
        total_amount: data.items.reduce((sum, item) => sum + item.line_total, 0),
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoice_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Fatura *</FormLabel>
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
                      <FormLabel>Cliente *</FormLabel>
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
                  name="project_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obra (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma obra" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.nome}
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
                  name="issue_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Emissão *</FormLabel>
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
                                format(parseISO(field.value), "PPP", { locale: pt })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? parseISO(field.value) : undefined}
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
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Vencimento *</FormLabel>
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
                                format(parseISO(field.value), "PPP", { locale: pt })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? parseISO(field.value) : undefined}
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notas (opcional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <h3 className="text-lg font-semibold mb-2">Itens da Fatura</h3>
              {itemFields.length === 0 && (
                <p className="text-muted-foreground text-sm">Nenhum item adicionado. Adicione um item para começar.</p>
              )}
              <div className="space-y-4">
                {itemFields.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end border p-3 rounded-md">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Descrição *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Descrição do serviço/material" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qtd. *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Un. *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="un, m², h" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unit_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Unit. *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col">
                      <FormLabel>Total</FormLabel>
                      <Input value={form.watch(`items.${index}.line_total`).toFixed(2)} readOnly disabled />
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)} className="self-end">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={handleAddItem} className="mt-4 w-full">
                <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Item
              </Button>

              <div className="flex justify-end items-center gap-4 mt-6">
                <span className="text-lg font-semibold">Valor Total da Fatura:</span>
                <span className="text-2xl font-bold text-primary">{form.watch("total_amount").toFixed(2)} €</span>
              </div>

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