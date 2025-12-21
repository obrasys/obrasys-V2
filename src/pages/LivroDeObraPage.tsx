"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/schemas/project-schema";
import { LivroObra, LivroObraRdo, livroObraSchema } from "@/schemas/compliance-schema";
import { formatCurrency, formatDate } from "@/utils/formatters";

// Importar os novos componentes
import LivroDeObraHeader from "@/components/compliance/LivroDeObraHeader";
import LivroDeObraList from "@/components/compliance/LivroDeObraList";
import LivroDeObraDetailsCard from "@/components/compliance/LivroDeObraDetailsCard";
import LivroDeObraRdosTable from "@/components/compliance/LivroDeObraRdosTable";
import LivroDeObraAICompliance from "@/components/compliance/LivroDeObraAICompliance";
import CreateLivroDeObraDialog from "@/components/compliance/CreateLivroDeObraDialog";

// Mock de RDOs para demonstração
const mockRdos: LivroObraRdo[] = [
  { id: uuidv4(), livro_obra_id: "", rdo_id: uuidv4(), data: "2024-07-01", resumo: "Início da escavação para fundações. Equipa de 5 trabalhadores.", custos_diarios: 350.00 },
  { id: uuidv4(), livro_obra_id: "", rdo_id: uuidv4(), data: "2024-07-02", resumo: "Continuação da escavação. Entrega de 10m³ de betão.", custos_diarios: 800.00 },
  { id: uuidv4(), livro_obra_id: "", rdo_id: uuidv4(), data: "2024-07-03", resumo: "Montagem de cofragem para sapatas. 3 trabalhadores.", custos_diarios: 210.00 },
  { id: uuidv4(), livro_obra_id: "", rdo_id: uuidv4(), data: "2024-07-04", resumo: "Vazamento de betão nas sapatas. 4 trabalhadores.", custos_diarios: 600.00 },
  { id: uuidv4(), livro_obra_id: "", rdo_id: uuidv4(), data: "2024-07-05", resumo: "Cura do betão e desmame de cofragem. 2 trabalhadores.", custos_diarios: 140.00 },
];

const LivroDeObraPage = () => {
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

  const handleCreateLivroObra = async (data: LivroObra) => {
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
      <LivroDeObraHeader onNewLivroClick={() => setIsDialogOpen(true)} />

      <LivroDeObraList
        livrosObra={livrosObra}
        projects={projects}
        selectedLivroObra={selectedLivroObra}
        onSelectLivroObra={setSelectedLivroObra}
        onNewLivroClick={() => setIsDialogOpen(true)}
      />

      {selectedLivroObra && (
        <>
          <LivroDeObraDetailsCard
            selectedLivroObra={selectedLivroObra}
            currentProject={currentProject}
            onGeneratePdf={handleGeneratePdf}
          />

          <LivroDeObraRdosTable rdos={mockRdos} />

          <LivroDeObraAICompliance />
        </>
      )}

      <CreateLivroDeObraDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreateLivroObra}
        projects={projects}
        form={form}
      />
    </div>
  );
};

export default LivroDeObraPage;