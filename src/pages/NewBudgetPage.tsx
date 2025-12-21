"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  PlusCircle,
  CalendarDays,
  Calculator,
  DollarSign,
  TrendingUp,
  LineChart,
  Check,
  AlertTriangle,
  Trash2,
  Edit,
  Copy,
  ChevronUp,
  ChevronDown,
  UserPlus,
  HardHat,
} from "lucide-react";
import KPICard from "@/components/KPICard";
import EmptyState from "@/components/EmptyState";
import { NewBudgetFormValues, newBudgetFormSchema, BudgetItem, BudgetChapterForm } from "@/schemas/budget-schema";
import { Client } from "@/schemas/client-schema";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CreateEditClientDialog from "@/components/budgeting/create-edit-client-dialog";
import CreateEditProjectDialog from "@/components/projects/create-edit-project-dialog";
import { Project } from "@/schemas/project-schema";
import { useSession } from "@/components/SessionContextProvider";
import { formatCurrency } from "@/utils/formatters";

const NewBudgetPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isClientDialogOpen, setIsClientDialogOpen] = React.useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);
  const [approvedBudgetId, setApprovedBudgetId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<NewBudgetFormValues>({
    resolver: zodResolver(newBudgetFormSchema),
    defaultValues: {
      nome: "",
      client_id: "",
      localizacao: "",
      tipo_obra: "Nova construção",
      data_orcamento: format(new Date(), "yyyy-MM-dd"),
      observacoes_gerais: "",
      estado: "Rascunho",
      chapters: [
        {
          id: uuidv4(),
          codigo: "01",
          nome: "Fundações",
          observacoes: "",
          items: [
            {
              id: uuidv4(),
              capitulo_id: "", // Will be set dynamically
              servico: "Escavação manual em vala",
              quantidade: 50,
              unidade: "m³",
              preco_unitario: 15.00,
              custo_planeado: 750.00,
              custo_executado: 0,
              desvio: 0,
              estado: "Planeado",
            },
          ],
        },
      ],
    },
  });

  const { fields: chapterFields, append: appendChapter, remove: removeChapter, move: moveChapter } = useFieldArray({
    control: form.control,
    name: "chapters",
  });

  // Fetch clients on component mount
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

  // Calculate custo_planeado for each item and total budget
  const calculateCosts = React.useCallback(() => {
    const currentChapters = form.getValues("chapters");
    let totalPlanned = 0;

    currentChapters.forEach((chapter, chapterIndex) => {
      chapter.items.forEach((item, itemIndex) => {
        const plannedCost = item.quantidade * item.preco_unitario;
        form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.custo_planeado`, plannedCost);
        totalPlanned += plannedCost;
      });
    });
    return totalPlanned;
  }, [form]);

  // Watch for changes in quantities and prices to recalculate costs
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name?.includes("quantidade") || name?.includes("preco_unitario")) {
        calculateCosts();
      }
    });
    calculateCosts(); // Initial calculation
    return () => subscription.unsubscribe();
  }, [form, calculateCosts]);

  const onSubmit = async (data: NewBudgetFormValues) => {
    if (!user) {
      toast.error("Utilizador não autenticado.");
      return;
    }
    setIsSaving(true);

    try {
      const companyId = user.user_metadata.company_id;
      if (!companyId) throw new Error("ID da empresa não encontrado no perfil do utilizador.");

      const totalPlanned = calculateCosts();

      // 1. Insert the main budget record
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          company_id: companyId,
          nome: data.nome,
          project_id: null, // Project is linked later
          total_planeado: totalPlanned,
          total_executado: 0,
          estado: data.estado,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      // 2. Insert budget items for each chapter
      const budgetItemsToInsert = data.chapters.flatMap((chapter) =>
        chapter.items.map((item) => ({
          company_id: companyId,
          budget_id: budgetData.id,
          capitulo: chapter.nome, // Use chapter name as capitulo
          servico: item.servico,
          quantidade: item.quantidade,
          unidade: item.unidade,
          preco_unitario: item.preco_unitario,
          custo_planeado: item.custo_planeado,
          custo_executado: 0,
          estado: item.estado,
          observacoes: "", // Add observacoes if needed in schema
        })),
      );

      const { error: itemsError } = await supabase
        .from('budget_items')
        .insert(budgetItemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Orçamento criado com sucesso!");
      navigate("/budgeting"); // Redirect to budgeting page
    } catch (error: any) {
      toast.error(`Erro ao criar orçamento: ${error.message}`);
      console.error("Erro ao criar orçamento:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddChapter = () => {
    const newChapterCode = String(chapterFields.length + 1).padStart(2, '0');
    appendChapter({
      id: uuidv4(),
      codigo: newChapterCode,
      nome: `Novo Capítulo ${newChapterCode}`,
      observacoes: "",
      items: [
        {
          id: uuidv4(),
          capitulo_id: "",
          servico: "Novo Serviço",
          quantidade: 1,
          unidade: "un",
          preco_unitario: 0,
          custo_planeado: 0,
          custo_executado: 0,
          desvio: 0,
          estado: "Planeado",
        },
      ],
    });
  };

  const handleAddService = (chapterIndex: number) => {
    const chapterId = chapterFields[chapterIndex].id;
    const newService: BudgetItem = {
      id: uuidv4(),
      capitulo_id: chapterId,
      servico: "Novo Serviço",
      quantidade: 1,
      unidade: "un",
      preco_unitario: 0,
      custo_planeado: 0,
      custo_executado: 0,
      desvio: 0,
      estado: "Planeado",
    };
    const currentItems = form.getValues(`chapters.${chapterIndex}.items`);
    form.setValue(`chapters.${chapterIndex}.items`, [...currentItems, newService]);
  };

  const handleRemoveService = (chapterIndex: number, itemIndex: number) => {
    const currentItems = form.getValues(`chapters.${chapterIndex}.items`);
    const updatedItems = currentItems.filter((_, idx) => idx !== itemIndex);
    form.setValue(`chapters.${chapterIndex}.items`, updatedItems);
    calculateCosts();
  };

  const handleDuplicateService = (chapterIndex: number, itemIndex: number) => {
    const serviceToDuplicate = form.getValues(`chapters.${chapterIndex}.items.${itemIndex}`);
    const duplicatedService = { ...serviceToDuplicate, id: uuidv4() };
    const currentItems = form.getValues(`chapters.${chapterIndex}.items`);
    const updatedItems = [...currentItems, duplicatedService];
    form.setValue(`chapters.${chapterIndex}.items`, updatedItems);
    calculateCosts();
  };

  const handleSaveClient = (newClient: Client) => {
    setClients((prevClients) => {
      if (newClient.id && prevClients.some((c) => c.id === newClient.id)) {
        return prevClients.map((c) => (c.id === newClient.id ? newClient : c));
      }
      return [...prevClients, newClient];
    });
    form.setValue("client_id", newClient.id || ""); // Select the newly created client
    toast.success(`Cliente ${newClient.nome} registado com sucesso!`);
  };

  const handleSaveProject = async (newProject: Project) => {
    if (!approvedBudgetId) {
      toast.error("Nenhum orçamento aprovado para associar à obra.");
      return;
    }
    try {
      const companyId = user?.user_metadata.company_id;
      if (!companyId) throw new Error("ID da empresa não encontrado no perfil do utilizador.");

      const { data, error } = await supabase
        .from('projects')
        .insert({
          id: newProject.id,
          nome: newProject.nome,
          client_id: newProject.client_id,
          localizacao: newProject.localizacao,
          estado: newProject.estado,
          progresso: newProject.progresso,
          prazo: newProject.prazo,
          custo_planeado: newProject.custo_planeado,
          custo_real: newProject.custo_real,
          budget_id: approvedBudgetId,
          company_id: companyId,
        })
        .select()
        .single();

      if (error) throw error;

      // Update the budget in DB to link the project
      const { error: updateBudgetError } = await supabase
        .from('budgets')
        .update({ project_id: data.id })
        .eq('id', approvedBudgetId);

      if (updateBudgetError) throw updateBudgetError;

      toast.success(`Obra "${newProject.nome}" criada e ligada ao orçamento!`);
      setIsProjectDialogOpen(false);
      navigate(`/projects`); // Navigate to projects page
    } catch (error: any) {
      toast.error(`Erro ao criar obra: ${error.message}`);
      console.error("Erro ao criar obra:", error);
    }
  };

  const handleApproveBudget = async () => {
    if (!form.formState.isValid) {
      toast.error("Por favor, corrija os erros no formulário antes de aprovar.");
      form.trigger(); // Trigger all validations to show errors
      return;
    }

    setIsSaving(true);
    try {
      const companyId = user?.user_metadata.company_id;
      if (!companyId) throw new Error("ID da empresa não encontrado no perfil do utilizador.");

      const currentBudgetValues = form.getValues();
      const totalPlanned = calculateCosts();

      // Update the budget status to 'Aprovado' in the database
      const { data: updatedBudget, error: updateError } = await supabase
        .from('budgets')
        .update({
          estado: "Aprovado",
          total_planeado: totalPlanned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentBudgetValues.id)
        .select()
        .single();

      if (updateError) throw updateError;

      form.setValue("estado", "Aprovado");
      setApprovedBudgetId(updatedBudget.id); // Store the ID of the approved budget
      toast.success("Orçamento aprovado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao aprovar orçamento: ${error.message}`);
      console.error("Erro ao aprovar orçamento:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentBudgetTotal = calculateCosts();
  const currentBudgetState = form.watch("estado");
  const isApproved = currentBudgetState === "Aprovado";

  // Basic validations for AI section
  const hasEmptyServices = form.watch("chapters").some(chapter =>
    chapter.items.some(item => !item.servico || item.quantidade === 0 || item.preco_unitario === 0)
  );
  const hasEmptyChapters = form.watch("chapters").some(chapter => chapter.items.length === 0);
  const allValidationsComplete = form.formState.isValid && !hasEmptyServices && !hasEmptyChapters;

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Novo Orçamento</h1>
          <p className="text-muted-foreground text-sm">
            Crie e detalhe um novo orçamento para as suas obras
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Button variant="ghost" onClick={() => navigate("/budgeting")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button type="submit" form="new-budget-form" disabled={isSaving || isApproved} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Guardar Rascunho
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form id="new-budget-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* SEÇÃO A — Dados Gerais do Orçamento */}
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Orçamento *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isApproved} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end gap-2">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Cliente *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isApproved}>
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
                <Button type="button" variant="outline" size="icon" onClick={() => setIsClientDialogOpen(true)} disabled={isApproved}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              <FormField
                control={form.control}
                name="localizacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Obra / Localização *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isApproved} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_obra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Obra *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isApproved}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de obra" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Nova construção">Nova construção</SelectItem>
                        <SelectItem value="Remodelação">Remodelação</SelectItem>
                        <SelectItem value="Ampliação">Ampliação</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_orcamento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Orçamento *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isApproved}
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
                name="observacoes_gerais"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Observações Gerais (opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={isApproved} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem className="md:col-span-2">
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input value={currentBudgetState} readOnly disabled className="capitalize" />
                </FormControl>
              </FormItem>
            </CardContent>
          </Card>

          {/* SEÇÃO B — Capítulos do Orçamento (NÚCLEO) */}
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">Capítulos e Serviços</CardTitle>
              <Button type="button" onClick={handleAddChapter} disabled={isApproved}>
                <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Capítulo
              </Button>
            </CardHeader>
            <CardContent>
              {chapterFields.length === 0 && (
                <EmptyState
                  icon={ClipboardList}
                  title="Nenhum capítulo adicionado"
                  description="Adicione capítulos para estruturar o seu orçamento."
                  buttonText="Adicionar Primeiro Capítulo"
                  onButtonClick={handleAddChapter}
                />
              )}
              <Accordion type="multiple" className="w-full">
                {chapterFields.map((chapter, chapterIndex) => (
                  <AccordionItem key={chapter.id} value={chapter.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{form.watch(`chapters.${chapterIndex}.codigo`)}. {form.watch(`chapters.${chapterIndex}.nome`)}</span>
                        <Badge variant="secondary">{form.watch(`chapters.${chapterIndex}.items`).length} serviços</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 border rounded-md space-y-4 bg-muted/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`chapters.${chapterIndex}.codigo`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código do Capítulo *</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={isApproved} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`chapters.${chapterIndex}.nome`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome do Capítulo *</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={isApproved} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`chapters.${chapterIndex}.observacoes`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Observações (opcional)</FormLabel>
                                <FormControl>
                                  <Textarea {...field} disabled={isApproved} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button type="button" variant="outline" size="sm" onClick={() => handleAddService(chapterIndex)} disabled={isApproved}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Serviço
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => moveChapter(chapterIndex, chapterIndex - 1)} disabled={chapterIndex === 0 || isApproved}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => moveChapter(chapterIndex, chapterIndex + 1)} disabled={chapterIndex === chapterFields.length - 1 || isApproved}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeChapter(chapterIndex)} disabled={isApproved}>
                            <Trash2 className="h-4 w-4 mr-2" /> Remover Capítulo
                          </Button>
                        </div>

                        <Separator className="my-4" />

                        {/* Serviços do Capítulo */}
                        {form.watch(`chapters.${chapterIndex}.items`).length === 0 ? (
                          <EmptyState
                            icon={ClipboardList}
                            title="Nenhum serviço neste capítulo"
                            description="Adicione serviços para detalhar este capítulo do orçamento."
                            buttonText="Adicionar Primeiro Serviço"
                            onButtonClick={() => handleAddService(chapterIndex)}
                          />
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Serviço</TableHead>
                                  <TableHead className="w-[100px]">Qtd.</TableHead>
                                  <TableHead className="w-[80px]">Un.</TableHead>
                                  <TableHead className="w-[120px] text-right">Preço Unit.</TableHead>
                                  <TableHead className="w-[120px] text-right">Custo Planeado</TableHead>
                                  <TableHead className="w-[100px]">Estado</TableHead>
                                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {form.watch(`chapters.${chapterIndex}.items`).map((item, itemIndex) => (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      <FormField
                                        control={form.control}
                                        name={`chapters.${chapterIndex}.items.${itemIndex}.servico`}
                                        render={({ field }) => (
                                          <FormItem className="mb-0">
                                            <FormControl>
                                              <Input {...field} disabled={isApproved} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <FormField
                                        control={form.control}
                                        name={`chapters.${chapterIndex}.items.${itemIndex}.quantidade`}
                                        render={({ field }) => (
                                          <FormItem className="mb-0">
                                            <FormControl>
                                              <Input type="number" step="0.01" {...field} disabled={isApproved} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <FormField
                                        control={form.control}
                                        name={`chapters.${chapterIndex}.items.${itemIndex}.unidade`}
                                        render={({ field }) => (
                                          <FormItem className="mb-0">
                                            <FormControl>
                                              <Input {...field} disabled={isApproved} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <FormField
                                        control={form.control}
                                        name={`chapters.${chapterIndex}.items.${itemIndex}.preco_unitario`}
                                        render={({ field }) => (
                                          <FormItem className="mb-0">
                                            <FormControl>
                                              <Input type="number" step="0.01" {...field} disabled={isApproved} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {formatCurrency(form.watch(`chapters.${chapterIndex}.items.${itemIndex}.custo_planeado`))}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">{item.estado}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleDuplicateService(chapterIndex, itemIndex)} disabled={isApproved}>
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveService(chapterIndex, itemIndex)} disabled={isApproved}>
                                          <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* SEÇÃO C — Resumo Financeiro (auto) */}
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <KPICard
                  title="Orçamento Total (€)"
                  value={formatCurrency(currentBudgetTotal)}
                  description="Valor planeado para a obra"
                  icon={Calculator}
                  iconColorClass="text-blue-500"
                />
                <KPICard
                  title="Custo Executado (€)"
                  value={formatCurrency(0)} // Always 0 for new budget
                  description="Valor já gasto"
                  icon={DollarSign}
                  iconColorClass="text-green-500"
                />
                <KPICard
                  title="Desvio Orçamental (€ / %)"
                  value={`${formatCurrency(0)} (0.0%)`} // Always 0 for new budget
                  description="Diferença entre planeado e executado"
                  icon={TrendingUp}
                  iconColorClass="text-green-500"
                />
                <KPICard
                  title="Custo Previsto Final (€)"
                  value={formatCurrency(currentBudgetTotal)}
                  description="Estimativa de custo total"
                  icon={LineChart}
                  iconColorClass="text-purple-500"
                />
                <KPICard
                  title="Margem Atual (%)"
                  value="100.0%" // Always 100% for new budget
                  description="Margem de lucro atual"
                  icon={DollarSign}
                  iconColorClass="text-green-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* SEÇÃO D — Validações Inteligentes (IA) */}
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" /> Validações Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Verificações automáticas para garantir a integridade do seu orçamento.
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li className={cn(form.formState.errors.nome ? "text-red-500" : "text-green-500")}>
                  Nome do orçamento preenchido: {form.formState.errors.nome ? "❌" : "✅"}
                </li>
                <li className={cn(form.formState.errors.client_id ? "text-red-500" : "text-green-500")}>
                  Cliente selecionado: {form.formState.errors.client_id ? "❌" : "✅"}
                </li>
                <li className={cn(form.formState.errors.localizacao ? "text-red-500" : "text-green-500")}>
                  Localização da obra preenchida: {form.formState.errors.localizacao ? "❌" : "✅"}
                </li>
                <li className={cn(form.formState.errors.chapters ? "text-red-500" : "text-green-500")}>
                  Pelo menos um capítulo: {form.formState.errors.chapters ? "❌" : "✅"}
                </li>
                <li className={cn(hasEmptyChapters ? "text-red-500" : "text-green-500")}>
                  Nenhum capítulo vazio: {hasEmptyChapters ? "❌" : "✅"}
                </li>
                <li className={cn(hasEmptyServices ? "text-red-500" : "text-green-500")}>
                  Todos os serviços com quantidade/preço válidos: {hasEmptyServices ? "❌" : "✅"}
                </li>
              </ul>
              <p className={cn("text-sm font-semibold mt-4", allValidationsComplete ? "text-green-600" : "text-orange-500")}>
                {allValidationsComplete
                  ? "O orçamento está pronto para ser aprovado!"
                  : "O orçamento pode ser aprovado quando todas as validações estiverem concluídas."}
              </p>
            </CardContent>
          </Card>

          {/* SEÇÃO E — Aprovação */}
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Aprovação do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!isApproved ? (
                <Button
                  type="button"
                  onClick={handleApproveBudget}
                  disabled={!allValidationsComplete || isSaving}
                  className="w-full flex items-center gap-2"
                >
                  <Check className="h-4 w-4" /> Aprovar Orçamento
                </Button>
              ) : (
                <>
                  <Badge className="w-fit text-lg px-4 py-2 bg-green-500 text-white">Orçamento Aprovado</Badge>
                  <p className="text-sm text-muted-foreground">
                    Este orçamento foi aprovado e está bloqueado para edição. Agora pode criar uma obra associada.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsProjectDialogOpen(true)}
                    disabled={!approvedBudgetId}
                    className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <HardHat className="h-4 w-4" /> Criar Obra a partir deste Orçamento
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </form>
      </Form>

      <CreateEditClientDialog
        isOpen={isClientDialogOpen}
        onClose={() => setIsClientDialogOpen(false)}
        onSave={handleSaveClient}
        clientToEdit={null}
      />

      {approvedBudgetId && (
        <CreateEditProjectDialog
          isOpen={isProjectDialogOpen}
          onClose={() => setIsProjectDialogOpen(false)}
          onSave={handleSaveProject}
          projectToEdit={null}
          initialBudgetId={approvedBudgetId}
        />
      )}
    </div>
  );
};

export default NewBudgetPage;