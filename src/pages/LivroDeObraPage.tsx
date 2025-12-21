"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, PlusCircle, FileText, CalendarDays, DollarSign, AlertTriangle, CheckCircle, Bot } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/schemas/project-schema";
import { LivroObra, LivroObraRdo, livroObraSchema } from "@/schemas/compliance-schema";
import { formatCurrency, formatDate } from "@/utils/formatters";

// Mock de RDOs para demonstração
const mockRdos: LivroObraRdo[] = [
  { id: uuidv4(), livro_obra_id: "", rdo_id: uuidv4(), data: "2024-07-01", resumo: "Início da escavação para fundações. Equipa de 5 trabalhadores.", custos_diarios: 350.00 },
  { id: uuidv4(), livro_obra_id: "", rdo_id: uuidv4(), data: "2024-07-02", resumo: "Continuação da escavação. Entrega de 10m³ de betão.", custos_diarios: 800.00 },
  { id: uuidv4(), livro_obra_id: "", rdo_id: uuidv4(), data: "2024-07-03", resumo: "Montagem de cofragem para sapatas. 3 trabalhadores.", custos_diarios: 210.00 },
  { id: uuidv4(), livro_obra_id: "", rdo_id: uuidv4(), data: "2024-07-04", resumo: "Vazamento de betão nas sapatas. 4 trabalhadores.", custos_diarios: 600.00 },
  { id: uuidv4(), livro_obra_id: "", rdo_id: uuidv4(), data: "2024-07-05", resumo: "Cura do betão e desmame de cofragem. 2 trabalhadores.", custos_diarios: 140.00 },
];

const LivroDeObraPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [livrosObra, setLivrosObra] = React.useState<LivroObra[]>([]);
  const [selectedLivroObra, setSelectedLivroObra] = React.useState<LivroObra | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const form = useForm<LivroObra>({
    resolver: zodResolver(livroObraSchema),
    defaultValues: {
      project_id: "",
      periodo_inicio: "",
      periodo_fim: "",
      estado: "em_preparacao",
      observacoes: "",
    },
  });

  const fetchProjectsAndLivrosObra = React.useCallback(async () => {
    setIsLoading(true);
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, nome, localizacao, cliente');

    if (projectsError) {
      toast.error(`Erro ao carregar obras: ${projectsError.message}`);
      console.error("Erro ao carregar obras:", projectsError);
    } else {
      setProjects(projectsData || []);
    }

    const { data: livrosObraData, error: livrosObraError } = await supabase
      .from('livros_obra')
      .select('*')
      .order('created_at', { ascending: false });

    if (livrosObraError) {
      toast.error(`Erro ao carregar livros de obra: ${livrosObraError.message}`);
      console.error("Erro ao carregar livros de obra:", livrosObraError);
    } else {
      setLivrosObra(livrosObraData || []);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchProjectsAndLivrosObra();
  }, [fetchProjectsAndLivrosObra]);

  const onSubmit = async (data: LivroObra) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Utilizador não autenticado.");

      const companyId = user.user_metadata.company_id;
      if (!companyId) throw new Error("ID da empresa não encontrado no perfil do utilizador.");

      const { data: newLivro, error } = await supabase
        .from('livros_obra')
        .insert({
          ...data,
          company_id: companyId,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Livro de Obra criado com sucesso!");
      form.reset();
      setIsDialogOpen(false);
      fetchProjectsAndLivrosObra();
      setSelectedLivroObra(newLivro); // Select the newly created book
    } catch (error: any) {
      toast.error(`Erro ao criar Livro de Obra: ${error.message}`);
      console.error("Erro ao criar Livro de Obra:", error);
    }
  };

  const generatePdfContent = (livro: LivroObra, project: Project | undefined, rdos: LivroObraRdo[]) => {
    const totalDias = rdos.length;
    const custoTotal = rdos.reduce((sum, rdo) => sum + rdo.custos_diarios, 0);

    const rdoRows = rdos.map(rdo => `
      <tr>
        <td style="border: 1px solid #ccc; padding: 8px;">${formatDate(rdo.data)}</td>
        <td style="border: 1px solid #ccc; padding: 8px;">${rdo.resumo || ''}</td>
        <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${formatCurrency(rdo.custos_diarios)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Livro de Obra Digital - ${project?.nome || 'N/A'}</title>
          <style>
              body { font-family: 'Red Hat Display', sans-serif; margin: 40px; color: #333; }
              h1, h2 { color: #00679d; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header-info p { margin: 5px 0; }
              .summary { margin-top: 30px; }
              .declaration { margin-top: 30px; font-style: italic; }
              .signatures { margin-top: 50px; display: flex; justify-content: space-around; }
              .signature-line { border-bottom: 1px solid #333; width: 250px; padding-bottom: 5px; }
              .footer { margin-top: 50px; font-size: 0.8em; text-align: center; color: #777; }
              @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
              }
          </style>
      </head>
      <body>
          <div class="no-print">
            <button onclick="window.print()" style="position: fixed; top: 20px; right: 20px; padding: 10px 20px; background-color: #00679d; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir PDF</button>
            <button onclick="window.close()" style="position: fixed; top: 20px; right: 150px; padding: 10px 20px; background-color: #ccc; color: #333; border: none; border-radius: 5px; cursor: pointer;">Fechar</button>
          </div>
          <h1>LIVRO DE OBRA DIGITAL</h1>
          <div class="header-info">
              <p><strong>Obra:</strong> ${project?.nome || 'N/A'}</p>
              <p><strong>Localização:</strong> ${project?.localizacao || 'N/A'}</p>
              <p><strong>Cliente:</strong> ${project?.cliente || 'N/A'}</p>
              <p><strong>Empresa Responsável:</strong> Obra Sys</p>
              <p><strong>Período:</strong> ${formatDate(livro.periodo_inicio)} a ${formatDate(livro.periodo_fim)}</p>
          </div>

          <h2>Tabela de Registos Diários</h2>
          <table>
              <thead>
                  <tr>
                      <th style="width: 15%;">Data</th>
                      <th style="width: 65%;">Descrição dos Trabalhos</th>
                      <th style="width: 20%; text-align: right;">Custos Diários (€)</th>
                  </tr>
              </thead>
              <tbody>
                  ${rdoRows}
              </tbody>
          </table>

          <div class="summary">
              <p><strong>Total de dias registados:</strong> ${totalDias}</p>
              <p><strong>Custo total do período:</strong> ${formatCurrency(custoTotal)}</p>
          </div>

          <p class="declaration">
              Declara-se que os registos acima refletem os trabalhos realizados no período indicado,
              com base nos Relatórios Diários de Obra (RDO).
          </p>

          <div class="signatures">
              <div>
                  <p class="signature-line"></p>
                  <p>Responsável Técnico</p>
                  <p>Data: ___/___/____</p>
              </div>
              <div>
                  <p class="signature-line"></p>
                  <p>Fiscal / Cliente</p>
                  <p>Data: ___/___/____</p>
              </div>
          </div>

          <div class="footer">
              <p>Documento gerado automaticamente pelo Obra Sys.</p>
              <p>IA de Conformidade Documental | Obra Sys</p>
          </div>
      </body>
      </html>
    `;
  };

  const handleGeneratePdf = () => {
    if (!selectedLivroObra) {
      toast.error("Selecione um Livro de Obra para gerar o PDF.");
      return;
    }
    const project = projects.find(p => p.id === selectedLivroObra.project_id);
    // Para demonstração, usamos mockRdos. Numa implementação real, seriam os rdos associados ao livro.
    const content = generatePdfContent(selectedLivroObra, project, mockRdos);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
    } else {
      toast.error("Não foi possível abrir a janela de impressão. Verifique as configurações de pop-up.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>A carregar dados...</p>
      </div>
    );
  }

  const currentProject = selectedLivroObra ? projects.find(p => p.id === selectedLivroObra.project_id) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
        <Button variant="ghost" onClick={() => navigate("/compliance")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2 md:mb-0">
          <ArrowLeft className="h-4 w-4" /> Voltar à Conformidade
        </Button>
        <div className="text-center md:text-right flex-grow">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Livro de Obra Digital</h1>
          <p className="text-muted-foreground text-sm">
            Gestão e consolidação dos registos diários da obra
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2 mt-2 md:mt-0">
          <PlusCircle className="h-4 w-4" /> Novo Livro de Obra
        </Button>
      </div>

      {/* Lista de Livros de Obra */}
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Livros de Obra Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {livrosObra.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {livrosObra.map((livro) => {
                const project = projects.find(p => p.id === livro.project_id);
                return (
                  <Card
                    key={livro.id}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-shadow",
                      selectedLivroObra?.id === livro.id && "border-primary ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedLivroObra(livro)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{project?.nome || "Obra Desconhecida"}</CardTitle>
                      <p className="text-sm text-muted-foreground">Período: {formatDate(livro.periodo_inicio)} - {formatDate(livro.periodo_fim)}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Estado: <span className="capitalize">{livro.estado.replace('_', ' ')}</span></p>
                      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setSelectedLivroObra(livro)}>
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Nenhum Livro de Obra encontrado"
              description="Crie um novo Livro de Obra para começar a gerir os registos diários."
              buttonText="Criar Novo Livro"
              onButtonClick={() => setIsDialogOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      {selectedLivroObra && (
        <>
          {/* Detalhes do Livro de Obra Selecionado */}
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">Detalhes do Livro de Obra</CardTitle>
              <Button onClick={handleGeneratePdf} className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Gerar PDF
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><span className="font-semibold">Obra:</span> {currentProject?.nome || "N/A"}</div>
              <div><span className="font-semibold">Localização:</span> {currentProject?.localizacao || "N/A"}</div>
              <div><span className="font-semibold">Cliente:</span> {currentProject?.cliente || "N/A"}</div>
              <div><span className="font-semibold">Período:</span> {formatDate(selectedLivroObra.periodo_inicio)} a {formatDate(selectedLivroObra.periodo_fim)}</div>
              <div><span className="font-semibold">Estado:</span> <span className="capitalize">{selectedLivroObra.estado.replace('_', ' ')}</span></div>
              <div><span className="font-semibold">Observações:</span> {selectedLivroObra.observacoes || "N/A"}</div>
            </CardContent>
          </Card>

          {/* RDOs Compilados (Mock) */}
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Registos Diários de Obra (RDOs)</CardTitle>
            </CardHeader>
            <CardContent>
              {mockRdos.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Data</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Descrição dos Trabalhos</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Custos Diários (€)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {mockRdos.map((rdo) => (
                        <tr key={rdo.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDate(rdo.data)}</td>
                          <td className="px-4 py-2 text-sm">{rdo.resumo}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-right text-sm">{formatCurrency(rdo.custos_diarios)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="Nenhum RDO compilado"
                  description="Os RDOs serão automaticamente compilados para o período selecionado."
                />
              )}
            </CardContent>
          </Card>

          {/* IA de Conformidade Documental */}
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" /> IA de Conformidade Documental
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium">
                  <span className="font-bold">Importante:</span> Este processo é informativo e não substitui aconselhamento jurídico ou técnico especializado.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                A IA atua como um agente de validação documental e organizacional, analisando o Livro de Obra Digital e os RDOs associados, o cronograma da obra, o orçamento aprovado e as aprovações existentes.
              </p>
              <h3 className="font-semibold text-md mt-4">Validações Executadas:</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>
                  <strong>Integridade do Livro de Obra:</strong>
                  <ul className="list-disc list-inside ml-4">
                    <li>Verificar se existem RDOs para todos os dias úteis: <span className="text-green-500">OK</span></li>
                    <li>Datas são contínuas no período: <span className="text-green-500">OK</span></li>
                    <li>Custos diários estão preenchidos: <span className="text-green-500">OK</span></li>
                  </ul>
                </li>
                <li>
                  <strong>Coerência Técnica:</strong>
                  <ul className="list-disc list-inside ml-4">
                    <li>Comparar progresso descrito × cronograma: <span className="text-orange-500">Alerta: Progresso do RDO (80%) superior ao do cronograma (70%) para a fase 'Fundações'.</span></li>
                    <li>Custos diários × orçamento: <span className="text-green-500">OK</span></li>
                  </ul>
                </li>
                <li>
                  <strong>Preparação para Aprovação:</strong>
                  <ul className="list-disc list-inside ml-4">
                    <li>Indicar se o Livro de Obra está completo: <span className="text-green-500">Completo</span></li>
                    <li>Tem lacunas: <span className="text-green-500">Nenhuma</span></li>
                    <li>Está pronto para submissão: <span className="text-orange-500">Requer revisão devido a inconsistência de progresso.</span></li>
                  </ul>
                </li>
              </ul>
              <h3 className="font-semibold text-md mt-4">Saída da IA:</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Status:</strong> <span className="text-orange-500">Com inconsistências</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Lista objetiva de alertas:</strong>
                <ul className="list-disc list-inside ml-4">
                  <li>Inconsistência de progresso na fase 'Fundações' entre RDO e cronograma.</li>
                </ul>
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Sugestões de correção:</strong>
                <ul className="list-disc list-inside ml-4">
                  <li>Rever e ajustar o progresso registado no RDO ou atualizar o cronograma.</li>
                  <li>Adicionar observações no Livro de Obra para justificar a diferença.</li>
                </ul>
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog para Criar Novo Livro de Obra */}
      <Popover open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <PopoverContent className="w-[400px] p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-semibold">Criar Novo Livro de Obra</CardTitle>
            <p className="text-sm text-muted-foreground">Defina o período e a obra para o novo Livro de Obra.</p>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Obra</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                name="periodo_inicio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
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
                name="periodo_fim"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim</FormLabel>
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
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Criar Livro de Obra</Button>
            </form>
          </Form>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LivroDeObraPage;