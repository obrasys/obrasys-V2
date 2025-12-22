"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate, useSearchParams } from "react-router-dom"; // Importar useSearchParams

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/schemas/project-schema";
import { LivroObra, RdoEntry, livroObraSchema, rdoEntrySchema } from "@/schemas/compliance-schema"; // Import RdoEntry and rdoEntrySchema
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useSession } from "@/components/SessionContextProvider"; // Import useSession

// Importar os novos componentes
import LivroDeObraList from "@/components/compliance/LivroDeObraList";
import LivroDeObraDetailsCard from "@/components/compliance/LivroDeObraDetailsCard";
import LivroDeObraAICompliance from "@/components/compliance/LivroDeObraAICompliance";
import CreateLivroDeObraDialog from "@/components/compliance/CreateLivroDeObraDialog";
import RdoTimeline from "@/components/compliance/RdoTimeline"; // Import the new RdoTimeline
import ManualRdoEntryDialog from "@/components/compliance/ManualRdoEntryDialog"; // Import the new ManualRdoEntryDialog

import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState"; // Corrected import path
import { FileText, PlusCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const LivroDeObraPage = () => {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [livrosObra, setLivrosObra] = React.useState<LivroObra[]>([]);
  const [selectedLivroObra, setSelectedLivroObra] = React.useState<LivroObra | null>(null);
  const [rdoEntries, setRdoEntries] = React.useState<RdoEntry[]>([]); // State for RDO entries
  const [projectUsers, setProjectUsers] = React.useState<{ id: string; first_name: string; last_name: string; avatar_url: string | null; }[]>([]); // State for users involved in project
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isManualRdoDialogOpen, setIsManualRdoDialogOpen] = React.useState(false);
  const navigate = useNavigate();
  const { user } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const initialProjectIdFromUrl = searchParams.get("projectId");
  const [preselectedProjectId, setPreselectedProjectId] = React.useState<string | null>(initialProjectIdFromUrl);

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

  const fetchProjectsAndLivrosObra = React.useCallback(async () => {
    setIsLoading(true);
    if (!userCompanyId) {
      setIsLoading(false);
      return;
    }

    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, nome, localizacao, client_id, budget_id, prazo, created_at, clients(nome)') // Adicionado budget_id, prazo, created_at
      .eq('company_id', userCompanyId);

    if (projectsError) {
      toast.error(`Erro ao carregar obras: ${projectsError.message}`);
      console.error("Erro ao carregar obras:", projectsError);
    } else {
      const formattedProjects: Project[] = (projectsData || []).map((project: any) => ({
        ...project,
        client_name: project.clients?.nome || "Cliente Desconhecido",
      }));
      setProjects(formattedProjects);
    }

    let query = supabase
      .from('livros_obra')
      .select('*')
      .eq('company_id', userCompanyId)
      .order('created_at', { ascending: false });

    if (preselectedProjectId) {
      query = query.eq('project_id', preselectedProjectId);
    }

    const { data: livrosObraData, error: livrosObraError } = await query;

    if (livrosObraError) {
      toast.error(`Erro ao carregar livros de obra: ${livrosObraError.message}`);
      console.error("Erro ao carregar livros de obra:", livrosObraError);
    } else {
      setLivrosObra(livrosObraData || []);
      // If a project was preselected and no books found, open dialog
      if (preselectedProjectId && (livrosObraData === null || livrosObraData.length === 0)) {
        setIsDialogOpen(true); // Open dialog to create new book for this project
        form.setValue('project_id', preselectedProjectId); // Pre-fill project ID
        // Also pre-fill dates if project data is available
        const projectForDialog = projectsData?.find(p => p.id === preselectedProjectId);
        if (projectForDialog) {
          const today = new Date();
          const defaultEndDate = projectForDialog.prazo && !isNaN(new Date(projectForDialog.prazo).getTime())
            ? format(parseISO(projectForDialog.prazo), "yyyy-MM-dd")
            : format(new Date(today.setFullYear(today.getFullYear() + 1)), "yyyy-MM-dd");
          form.setValue('periodo_inicio', format(new Date(), "yyyy-MM-dd"));
          form.setValue('periodo_fim', defaultEndDate);
          form.setValue('budget_id', projectForDialog.budget_id); // Pre-fill budget_id
        }
      } else if (livrosObraData && livrosObraData.length > 0 && !selectedLivroObra) {
        setSelectedLivroObra(livrosObraData[0]);
      }
    }
    setIsLoading(false);
  }, [userCompanyId, preselectedProjectId, selectedLivroObra, form]); // Add form to dependencies

  // Define fetchRdoEntries as a useCallback
  const fetchRdoEntries = React.useCallback(async () => {
    if (!selectedLivroObra?.project_id || !userCompanyId) {
      setRdoEntries([]);
      setProjectUsers([]);
      return;
    }

    // Fetch RDO entries for the selected project and within the Livro de Obra's period
    const { data: rdoData, error: rdoError } = await supabase
      .from('rdo_entries')
      .select('*, responsible_user:profiles!rdo_entries_responsible_user_id_fkey(id, first_name, last_name, avatar_url)') // Explicitly use the foreign key
      .eq('project_id', selectedLivroObra.project_id)
      .eq('company_id', userCompanyId)
      .gte('date', selectedLivroObra.periodo_inicio)
      .lte('date', selectedLivroObra.periodo_fim)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }); // Order by creation time for events on the same day

    if (rdoError) {
      toast.error(`Erro ao carregar RDOs: ${rdoError.message}`);
      console.error("Erro ao carregar RDOs:", rdoError);
      setRdoEntries([]);
      setProjectUsers([]);
    } else {
      const formattedRdos: RdoEntry[] = (rdoData || []).map((rdo: any) => ({
        ...rdo,
        responsible_user_id: rdo.responsible_user?.id || null, // Ensure responsible_user_id is set
      }));
      setRdoEntries(formattedRdos);

      // Extract unique users from RDO entries
      const usersDetails = (rdoData || []).map((rdo: any) => rdo.responsible_user).filter(Boolean);
      const uniqueUsers = Array.from(new Map(usersDetails.map((user: any) => [user.id, user])).values());
      setProjectUsers(uniqueUsers);
    }
  }, [selectedLivroObra, userCompanyId]);


  React.useEffect(() => {
    fetchUserCompanyId();
  }, [fetchUserCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchProjectsAndLivrosObra();
    }
  }, [userCompanyId, fetchProjectsAndLivrosObra]);

  React.useEffect(() => {
    fetchRdoEntries();
  }, [selectedLivroObra, fetchRdoEntries]);

  const handleCreateLivroObra = async (data: LivroObra) => {
    try {
      if (!user || !userCompanyId) throw new Error("Utilizador não autenticado ou ID da empresa não encontrado.");

      const { data: newLivro, error } = await supabase
        .from('livros_obra')
        .insert({
          ...data,
          company_id: userCompanyId,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Livro de Obra criado com sucesso!");
      form.reset();
      setIsDialogOpen(false);
      setSelectedLivroObra(newLivro); // Select the newly created book
      fetchProjectsAndLivrosObra(); // Refresh list
    } catch (error: any) {
      toast.error(`Erro ao criar Livro de Obra: ${error.message}`);
      console.error("Erro ao criar Livro de Obra:", error);
    }
  };

  const handleSaveManualRdoEntry = async (rdo: RdoEntry) => {
    try {
      if (!user || !userCompanyId || !selectedLivroObra) {
        throw new Error("Dados insuficientes para guardar o RDO manual.");
      }

      const { error } = await supabase
        .from('rdo_entries')
        .insert({
          ...rdo,
          company_id: userCompanyId,
          project_id: selectedLivroObra.project_id,
          budget_id: selectedLivroObra.budget_id, // Link to the budget of the selected LivroObra
          responsible_user_id: user.id,
          event_type: 'manual_entry',
          status: 'pending',
        });

      if (error) throw error;

      toast.success("Registo manual adicionado com sucesso!");
      setIsManualRdoDialogOpen(false);
      fetchRdoEntries(); // Refresh RDOs
    } catch (error: any) {
      toast.error(`Erro ao guardar RDO manual: ${error.message}`);
      console.error("Erro ao guardar RDO manual:", error);
    }
  };

  const generatePdfContent = (livro: LivroObra, project: Project | undefined, rdos: RdoEntry[], users: { id: string; first_name: string; last_name: string; }[]) => {
    const totalDias = rdos.length;
    const custoTotal = rdos.reduce((sum, rdo) => {
      // Attempt to parse cost from details if available, otherwise default to 0
      const costFromDetails = rdo.details?.new_executed_cost || rdo.details?.total_planeado || 0;
      return sum + costFromDetails;
    }, 0);

    const getEventTypeText = (eventType: string) => {
      switch (eventType) {
        case 'manual_entry': return "Registo Manual";
        case 'budget_approved': return "Orçamento Aprovado";
        case 'budget_item_update': return "Atualização de Serviço";
        case 'task_progress_update': return "Atualização de Fase";
        default: return "Evento Desconhecido";
      }
    };

    const rdoRows = rdos.map(rdo => {
      const responsibleUser = users.find(u => u.id === rdo.responsible_user_id);
      const userName = responsibleUser ? `${responsibleUser.first_name} ${responsibleUser.last_name}` : 'N/A';
      const eventTypeText = getEventTypeText(rdo.event_type);
      const costImpact = rdo.details?.new_executed_cost || rdo.details?.total_planeado || 0;

      return `
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px;">${formatDate(rdo.date)}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${eventTypeText}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${rdo.description || ''}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${userName}</td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${formatCurrency(costImpact)}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Livro de Obra Digital - ${project?.nome || 'N/A'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
              body { font-family: 'Red Hat Display', sans-serif; margin: 40px; color: #333; line-height: 1.6; }
              h1 { color: #00679d; text-align: center; margin-bottom: 30px; }
              h2 { color: #00679d; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 40px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: 600; }
              .header-info { margin-bottom: 30px; background-color: #f9f9f9; padding: 15px; border-radius: 8px; }
              .header-info p { margin: 8px 0; font-size: 0.95em; }
              .summary { margin-top: 30px; padding: 15px; background-color: #e6f7ff; border-left: 5px solid #00679d; border-radius: 8px; }
              .summary p { margin: 5px 0; font-weight: 500; }
              .declaration { margin-top: 30px; font-style: italic; text-align: center; color: #555; }
              .signatures { margin-top: 60px; display: flex; justify-content: space-around; text-align: center; }
              .signature-block { width: 45%; }
              .signature-line { border-bottom: 1px solid #333; width: 80%; margin: 0 auto 10px auto; padding-bottom: 5px; }
              .footer { margin-top: 50px; font-size: 0.75em; text-align: center; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
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
              <p><strong>Cliente:</strong> ${project?.client_name || 'N/A'}</p>
              <p><strong>Empresa Responsável:</strong> Obra Sys</p>
              <p><strong>Período:</strong> ${formatDate(livro.periodo_inicio)} a ${formatDate(livro.periodo_fim)}</p>
              <p><strong>Estado do Livro:</strong> <span style="text-transform: capitalize;">${livro.estado.replace('_', ' ')}</span></p>
              ${livro.observacoes ? `<p><strong>Observações:</strong> ${livro.observacoes}</p>` : ''}
          </div>

          <h2>Registos Diários de Obra (RDOs)</h2>
          ${rdos.length > 0 ? `
          <table>
              <thead>
                  <tr>
                      <th style="width: 15%;">Data</th>
                      <th style="width: 15%;">Tipo de Evento</th>
                      <th style="width: 40%;">Descrição</th>
                      <th style="width: 15%;">Responsável</th>
                      <th style="width: 15%; text-align: right;">Impacto Custo (€)</th>
                  </tr>
              </thead>
              <tbody>
                  ${rdoRows}
              </tbody>
          </table>
          ` : `<p style="text-align: center; margin-top: 20px; color: #777;">Nenhum RDO disponível para este período.</p>`}

          <div class="summary">
              <p><strong>Total de registos no período:</strong> ${totalDias}</p>
              <p><strong>Custo total registado no período:</strong> ${formatCurrency(custoTotal)}</p>
          </div>

          <p class="declaration">
              Declara-se que os registos acima refletem os trabalhos e eventos ocorridos no período indicado,
              com base nos Registos Diários de Obra (RDOs) automáticos e manuais.
          </p>

          <div class="signatures">
              <div class="signature-block">
                  <p class="signature-line"></p>
                  <p>Responsável Técnico</p>
                  <p>Data: ___/___/____</p>
              </div>
              <div class="signature-block">
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
    const content = generatePdfContent(selectedLivroObra, project, rdoEntries, projectUsers);
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40 mt-2 md:mt-0" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const currentProject = selectedLivroObra ? projects.find(p => p.id === selectedLivroObra.project_id) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Livro de Obra Digital</h1>
          <p className="text-muted-foreground text-sm">
            Gestão e consolidação dos registos diários da obra
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Button variant="ghost" onClick={() => navigate("/compliance")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button onClick={() => setIsManualRdoDialogOpen(true)} disabled={!selectedLivroObra} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
            <PlusCircle className="h-4 w-4" /> Registo Manual
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Novo Livro de Obra
          </Button>
        </div>
      </div>

      <LivroDeObraList
        livrosObra={livrosObra}
        projects={projects}
        selectedLivroObra={selectedLivroObra}
        onSelectLivroObra={setSelectedLivroObra}
        onNewLivroClick={() => setIsDialogOpen(true)}
      />

      {selectedLivroObra ? (
        <>
          <LivroDeObraDetailsCard
            selectedLivroObra={selectedLivroObra}
            currentProject={currentProject}
            onGeneratePdf={handleGeneratePdf}
          />

          <RdoTimeline rdos={rdoEntries} projectUsers={projectUsers} />

          <LivroDeObraAICompliance projectId={selectedLivroObra.project_id} />
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={FileText}
            title="Selecione um Livro de Obra"
            description="Escolha um Livro de Obra da lista acima para ver os seus detalhes, RDOs e análise de conformidade, ou crie um novo."
            buttonText="Criar Novo Livro de Obra"
            onButtonClick={() => setIsDialogOpen(true)}
          />
        </div>
      )}

      <CreateLivroDeObraDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreateLivroObra}
        projects={projects}
        form={form}
      />

      {selectedLivroObra && userCompanyId && (
        <ManualRdoEntryDialog
          isOpen={isManualRdoDialogOpen}
          onClose={() => setIsManualRdoDialogOpen(false)}
          onSave={handleSaveManualRdoEntry}
          projectId={selectedLivroObra.project_id}
          companyId={userCompanyId}
        />
      )}
    </div>
  );
};

export default LivroDeObraPage;