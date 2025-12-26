"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { Project } from "@/schemas/project-schema";
import { LivroObra, RdoEntry, livroObraSchema } from "@/schemas/compliance-schema";
import { Company } from "@/schemas/profile-schema";

interface UseLivroDeObraDataResult {
  projects: Project[];
  livrosObra: LivroObra[];
  selectedLivroObra: LivroObra | null;
  rdoEntries: RdoEntry[];
  projectUsers: { id: string; first_name: string; last_name: string; avatar_url: string | null; }[];
  companyData: Company | null;
  isLoading: boolean;
  userCompanyId: string | null;
  form: ReturnType<typeof useForm<LivroObra>>;
  setSelectedLivroObra: React.Dispatch<React.SetStateAction<LivroObra | null>>;
  fetchProjectsAndLivrosObra: () => Promise<void>;
  fetchRdoEntries: () => Promise<void>;
}

export function useLivroDeObraData(): UseLivroDeObraDataResult {
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [livrosObra, setLivrosObra] = useState<LivroObra[]>([]);
  const [selectedLivroObra, setSelectedLivroObra] = useState<LivroObra | null>(null);
  const [rdoEntries, setRdoEntries] = useState<RdoEntry[]>([]);
  const [projectUsers, setProjectUsers] = useState<{ id: string; first_name: string; last_name: string; avatar_url: string | null; }[]>([]);
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const initialProjectIdFromUrl = searchParams.get("projectId");
  const [preselectedProjectId, setPreselectedProjectId] = useState<string | null>(initialProjectIdFromUrl);

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
  const fetchUserCompanyId = useCallback(async () => {
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

  // Fetch company data
  const fetchCompanyData = useCallback(async () => {
    if (!userCompanyId) {
      setCompanyData(null);
      return;
    }
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', userCompanyId)
      .single();

    if (error) {
      console.error("Erro ao carregar dados da empresa:", error);
      toast.error(`Erro ao carregar dados da empresa: ${error.message}`);
      setCompanyData(null);
    } else {
      setCompanyData(data);
    }
  }, [userCompanyId]);

  const fetchProjectsAndLivrosObra = useCallback(async () => {
    setIsLoading(true);
    if (!userCompanyId) {
      setIsLoading(false);
      return;
    }

    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, nome, localizacao, client_id, budget_id, prazo, created_at, clients(nome)')
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
        // This logic will be moved to the parent component (LivroDeObraPage)
        // as it involves setting dialog open state.
      } else if (livrosObraData && livrosObraData.length > 0 && !selectedLivroObra) {
        setSelectedLivroObra(livrosObraData[0]);
      }
    }
    setIsLoading(false);
  }, [userCompanyId, preselectedProjectId, selectedLivroObra, form]);

  const fetchRdoEntries = useCallback(async () => {
    if (!selectedLivroObra?.project_id || !userCompanyId) {
      setRdoEntries([]);
      setProjectUsers([]);
      return;
    }

    const { data: rdoData, error: rdoError } = await supabase
      .from('rdo_entries')
      .select('*, responsible_user:profiles!rdo_entries_responsible_user_id_fkey(id, first_name, last_name, avatar_url)')
      .eq('project_id', selectedLivroObra.project_id)
      .eq('company_id', userCompanyId)
      .gte('date', selectedLivroObra.periodo_inicio)
      .lte('date', selectedLivroObra.periodo_fim)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (rdoError) {
      toast.error(`Erro ao carregar RDOs: ${rdoError.message}`);
      console.error("Erro ao carregar RDOs:", rdoError);
      setRdoEntries([]);
      setProjectUsers([]);
    } else {
      const formattedRdos: RdoEntry[] = (rdoData || []).map((rdo: any) => ({
        ...rdo,
        responsible_user_id: rdo.responsible_user?.id || null,
      }));
      setRdoEntries(formattedRdos);

      const usersDetails = (rdoData || []).map((rdo: any) => rdo.responsible_user).filter(Boolean);
      const uniqueUsers = Array.from(new Map(usersDetails.map((user: any) => [user.id, user])).values());
      setProjectUsers(uniqueUsers);
    }
  }, [selectedLivroObra, userCompanyId]);

  useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
  }, [isSessionLoading, fetchUserCompanyId]);

  useEffect(() => {
    if (userCompanyId) {
      fetchProjectsAndLivrosObra();
      fetchCompanyData();
    }
  }, [userCompanyId, fetchProjectsAndLivrosObra, fetchCompanyData]);

  useEffect(() => {
    fetchRdoEntries();
  }, [selectedLivroObra, fetchRdoEntries]);

  // Logic to pre-fill form for new Livro de Obra if project is preselected
  useEffect(() => {
    if (preselectedProjectId && projects.length > 0 && !selectedLivroObra && livrosObra.length === 0) {
      const projectForDialog = projects.find(p => p.id === preselectedProjectId);
      if (projectForDialog) {
        const today = new Date();
        const defaultEndDate = projectForDialog.prazo && !isNaN(new Date(projectForDialog.prazo).getTime())
          ? format(parseISO(projectForDialog.prazo), "yyyy-MM-dd")
          : format(new Date(today.setFullYear(today.getFullYear() + 1)), "yyyy-MM-dd");
        form.setValue('project_id', preselectedProjectId);
        form.setValue('periodo_inicio', format(new Date(), "yyyy-MM-dd"));
        form.setValue('periodo_fim', defaultEndDate);
        form.setValue('budget_id', projectForDialog.budget_id);
      }
    }
  }, [preselectedProjectId, projects, selectedLivroObra, livrosObra, form]);


  return {
    projects,
    livrosObra,
    selectedLivroObra,
    rdoEntries,
    projectUsers,
    companyData,
    isLoading,
    userCompanyId,
    form,
    setSelectedLivroObra,
    fetchProjectsAndLivrosObra,
    fetchRdoEntries,
  };
}