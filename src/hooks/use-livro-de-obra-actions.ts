"use client";

import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/schemas/project-schema";
import { LivroObra, RdoEntry } from "@/schemas/compliance-schema";
import { Company } from "@/schemas/profile-schema";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface UseLivroDeObraActionsProps {
  userCompanyId: string | null;
  user: any; // Supabase User
  form: UseFormReturn<LivroObra>;
  selectedLivroObra: LivroObra | null;
  projects: Project[];
  rdoEntries: RdoEntry[];
  projectUsers: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  }[];
  companyData: Company | null;
  setIsDialogOpen: (isOpen: boolean) => void;
  setIsManualRdoDialogOpen: (isOpen: boolean) => void;
  setSelectedLivroObra: (livro: LivroObra | null) => void;
  fetchProjectsAndLivrosObra: () => Promise<void>;
  fetchRdoEntries: () => Promise<void>;
}

function getErrorMessage(err: unknown): string {
  if (!err) return "Erro desconhecido";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  const anyErr = err as any;
  return anyErr?.message ?? "Erro desconhecido";
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
  const handleCreateLivroObra = useCallback(
    async (data: LivroObra): Promise<void> => {
      if (!user || !userCompanyId) {
        toast.error(
          "Utilizador não autenticado ou empresa não encontrada."
        );
        console.error(
          "[useLivroDeObraActions.handleCreateLivroObra] missing user/company",
          { user: !!user, userCompanyId }
        );
        return;
      }

      try {
        const { data: newLivro, error } = await supabase
          .from("livros_obra")
          .insert({
            ...data,
            company_id: userCompanyId,
          })
          .select()
          .single();

        if (error) {
          console.error(
            "[useLivroDeObraActions.handleCreateLivroObra] livros_obra.insert error",
            error
          );
          toast.error(`Erro ao criar Livro de Obra: ${error.message}`);
          return;
        }

        if (!newLivro?.id) {
          console.error(
            "[useLivroDeObraActions.handleCreateLivroObra] insert returned no id",
            newLivro
          );
          toast.error("Erro ao criar Livro de Obra: ID não retornado.");
          return;
        }

        toast.success("Livro de Obra criado com sucesso!");
        form.reset();
        setIsDialogOpen(false);
        setSelectedLivroObra(newLivro);
        await fetchProjectsAndLivrosObra();
      } catch (err) {
        const msg = getErrorMessage(err);
        toast.error(`Erro ao criar Livro de Obra: ${msg}`);
        console.error(
          "[useLivroDeObraActions.handleCreateLivroObra] unexpected error",
          err
        );
      }
    },
    [
      user,
      userCompanyId,
      form,
      setIsDialogOpen,
      setSelectedLivroObra,
      fetchProjectsAndLivrosObra,
    ]
  );

  const handleSaveManualRdoEntry = useCallback(
    async (rdo: RdoEntry): Promise<void> => {
      const companyIdToUse = rdo.company_id ?? userCompanyId;
      const projectIdToUse =
        rdo.project_id ?? selectedLivroObra?.project_id;

      if (!user || !companyIdToUse || !projectIdToUse) {
        toast.error("Dados insuficientes para guardar o RDO manual.");
        console.error(
          "[useLivroDeObraActions.handleSaveManualRdoEntry] missing data",
          { user: !!user, companyIdToUse, projectIdToUse }
        );
        return;
      }

      try {
        const { error } = await supabase
          .from("rdo_entries")
          .insert({
            ...rdo,
            company_id: companyIdToUse,
            project_id: projectIdToUse,
            budget_id: selectedLivroObra?.budget_id ?? null,
            responsible_user_id: user.id,
            event_type: "manual_entry",
            status: "pending",
          });

        if (error) {
          console.error(
            "[useLivroDeObraActions.handleSaveManualRdoEntry] rdo_entries.insert error",
            error
          );
          toast.error(`Erro ao guardar RDO manual: ${error.message}`);
          return;
        }

        toast.success("Registo manual adicionado com sucesso!");
        setIsManualRdoDialogOpen(false);
        await fetchRdoEntries();
      } catch (err) {
        const msg = getErrorMessage(err);
        toast.error(`Erro ao guardar RDO manual: ${msg}`);
        console.error(
          "[useLivroDeObraActions.handleSaveManualRdoEntry] unexpected error",
          err
        );
      }
    },
    [
      user,
      userCompanyId,
      selectedLivroObra,
      setIsManualRdoDialogOpen,
      fetchRdoEntries,
    ]
  );

  /* =========================
     Helpers de segurança (PDF)
  ========================= */

  const escapeHTML = (value: unknown) => {
    const s = String(value ?? "");
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
      if (
        u.protocol === "http:" ||
        u.protocol === "https:" ||
        u.protocol === "blob:"
      ) {
        return url;
      }
    } catch {
      /* ignore */
    }
    return null;
  };

  const generatePdfContent = useCallback(
    (
      livro: LivroObra,
      project: Project | undefined,
      rdos: RdoEntry[],
      users: { id: string; first_name: string; last_name: string }[],
      company: Company | null
    ) => {
      const totalDias = rdos.length;
      const custoTotal = rdos.reduce((sum, rdo) => {
        const v =
          rdo.details?.new_executed_cost ??
          rdo.details?.total_planeado ??
          0;
        return sum + (Number(v) || 0);
      }, 0);

      const getEventTypeText = (eventType: string) => {
        switch (eventType) {
          case "manual_entry":
            return "Registo Manual";
          case "budget_approved":
            return "Orçamento Aprovado";
          case "budget_item_update":
            return "Atualização de Serviço";
          case "task_progress_update":
            return "Atualização de Fase";
          default:
            return "Evento Desconhecido";
        }
      };

      const rdoRows = rdos
        .map((rdo) => {
          const responsibleUser = users.find(
            (u) => u.id === rdo.responsible_user_id
          );
          const userName = responsibleUser
            ? `${responsibleUser.first_name} ${responsibleUser.last_name}`
            : "N/A";

          const eventTypeText = getEventTypeText(rdo.event_type);
          const costImpact =
            Number(
              rdo.details?.new_executed_cost ??
                rdo.details?.total_planeado ??
                0
            ) || 0;

          return `
            <tr>
              <td>${escapeHTML(formatDate(rdo.date))}</td>
              <td>${escapeHTML(eventTypeText)}</td>
              <td>${escapeHTML(rdo.description || "")}</td>
              <td>${escapeHTML(userName)}</td>
              <td style="text-align:right;">${escapeHT
