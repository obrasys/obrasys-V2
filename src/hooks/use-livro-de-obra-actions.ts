"use client";

import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { format } from "date-fns"; // Import format for PDF generation

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { Project } from "@/schemas/project-schema";
import { LivroObra, RdoEntry } from "@/schemas/compliance-schema";
import { Company } from "@/schemas/profile-schema";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface UseLivroDeObraActionsProps {
  userCompanyId: string | null;
  user: any; // Supabase User type
  form: UseFormReturn<LivroObra>;
  selectedLivroObra: LivroObra | null;
  projects: Project[];
  rdoEntries: RdoEntry[];
  projectUsers: { id: string; first_name: string; last_name: string; avatar_url: string | null; }[];
  companyData: Company | null;
  setIsDialogOpen: (isOpen: boolean) => void;
  setIsManualRdoDialogOpen: (isOpen: boolean) => void;
  setSelectedLivroObra: (livro: LivroObra | null) => void;
  fetchProjectsAndLivrosObra: () => Promise<void>;
  fetchRdoEntries: () => Promise<void>;
}

export function useLivroDeObraActions({
  userCompanyId,
  user,
  form,
  selectedLivroObra,
  projects,
  rdoEntries,
  projectUsers,
  companyData,
  setIsDialogOpen,
  setIsManualRdoDialogOpen,
  setSelectedLivroObra,
  fetchProjectsAndLivrosObra,
  fetchRdoEntries,
}: UseLivroDeObraActionsProps) {

  const handleCreateLivroObra = useCallback(async (data: LivroObra) => {
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
      setSelectedLivroObra(newLivro);
      fetchProjectsAndLivrosObra();
    } catch (error: any) {
      toast.error(`Erro ao criar Livro de Obra: ${error.message}`);
      console.error("Erro ao criar Livro de Obra:", error);
    }
  }, [user, userCompanyId, form, setIsDialogOpen, setSelectedLivroObra, fetchProjectsAndLivrosObra]);

  const handleSaveManualRdoEntry = useCallback(async (rdo: RdoEntry) => {
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
          budget_id: selectedLivroObra.budget_id,
          responsible_user_id: user.id,
          event_type: 'manual_entry',
          status: 'pending',
        });

      if (error) throw error;

      toast.success("Registo manual adicionado com sucesso!");
      setIsManualRdoDialogOpen(false);
      fetchRdoEntries();
    } catch (error: any) {
      toast.error(`Erro ao guardar RDO manual: ${error.message}`);
      console.error("Erro ao guardar RDO manual:", error);
    }
  }, [user, userCompanyId, selectedLivroObra, setIsManualRdoDialogOpen, fetchRdoEntries]);

  const escapeHTML = (str: any) => {
    const s = String(str ?? "");
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const safeImageUrl = (url?: string | null) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "blob:") {
        return url;
      }
    } catch (_) { /* ignore */ }
    return null;
  };

  const generatePdfContent = useCallback((livro: LivroObra, project: Project | undefined, rdos: RdoEntry[], users: { id: string; first_name: string; last_name: string; }[], company: Company | null) => {
    const totalDias = rdos.length;
    const custoTotal = rdos.reduce((sum, rdo) => {
      const costFromDetails = rdo.details?.new_executed_cost || rdo.details?.total_planeado || 0;
      return sum + (Number(costFromDetails) || 0);
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
      const costImpactVal = rdo.details?.new_executed_cost || rdo.details?.total_planeado || 0;
      const costImpact = Number(costImpactVal) || 0;

      return `
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px;">${escapeHTML(formatDate(rdo.date))}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${escapeHTML(eventTypeText)}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${escapeHTML(rdo.description || '')}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${escapeHTML(userName)}</td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${escapeHTML(formatCurrency(costImpact))}</td>
        </tr>
      `;
    }).join('');

    const safeLogo = safeImageUrl(company?.logo_url);

    return `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: blob:; style-src 'self' 'unsafe-inline' https:; font-src https: data:; connect-src 'none'; frame-ancestors 'none';">
          <title>Livro de Obra Digital - ${escapeHTML(project?.nome || 'N/A')}</title>
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
              .company-logo { max-height: 60px; margin-bottom: 15px; }
              @media print {
                  body { margin: 0; }
              }
          </style>
      </head>
      <body>
          <h1>LIVRO DE OBRA DIGITAL</h1>
          <div class="header-info">
              ${safeLogo ? `<img src="${escapeHTML(safeLogo)}" alt="${escapeHTML(company?.name || 'Empresa')} Logo" class="company-logo" />` : ''}
              <p><strong>Empresa:</strong> ${escapeHTML(company?.name || 'N/A')}</p>
              <p><strong>NIF da Empresa:</strong> ${escapeHTML(company?.nif || 'N/A')}</p>
              <p><strong>Endereço da Empresa:</strong> ${escapeHTML(company?.address || 'N/A')}</p>
              <p><strong>Obra:</strong> ${escapeHTML(project?.nome || 'N/A')}</p>
              <p><strong>Localização da Obra:</strong> ${escapeHTML(project?.localizacao || 'N/A')}</p>
              <p><strong>Cliente:</strong> ${escapeHTML((project as any)?.client_name || 'N/A')}</p>
              <p><strong>Período do Livro:</strong> ${escapeHTML(formatDate(livro.periodo_inicio))} a ${escapeHTML(formatDate(livro.periodo_fim))}</p>
              <p><strong>Estado do Livro:</strong> <span style="text-transform: capitalize;">${escapeHTML(livro.estado.replace('_', ' '))}</span></p>
              ${livro.observacoes ? `<p><strong>Observações do Livro:</strong> ${escapeHTML(livro.observacoes)}</p>` : ''}
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
              <p><strong>Total de registos no período:</strong> ${escapeHTML(String(totalDias))}</p>
              <p><strong>Custo total registado no período:</strong> ${escapeHTML(formatCurrency(custoTotal))}</p>
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
  }, [formatDate, formatCurrency]);

  const handleGeneratePdf = useCallback(() => {
    if (!selectedLivroObra) {
      toast.error("Selecione um Livro de Obra para gerar o PDF.");
      return;
    }
    const project = projects.find(p => p.id === selectedLivroObra.project_id);
    const content = generatePdfContent(selectedLivroObra, project, rdoEntries, projectUsers, companyData);
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (printWindow) {
      try {
        // Try to sever the opener reference defensively
        // Some browsers ignore features; this is an additional safeguard.
        // @ts-ignore
        printWindow.opener = null;
      } catch (_) {}
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
    } else {
      toast.error("Não foi possível abrir a janela de impressão. Verifique as configurações de pop-up.");
    }
  }, [selectedLivroObra, projects, rdoEntries, projectUsers, companyData, generatePdfContent]);

  return {
    handleCreateLivroObra,
    handleSaveManualRdoEntry,
    handleGeneratePdf,
  };
}