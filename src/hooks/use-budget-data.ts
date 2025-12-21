"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { toast } from "sonner";
import { Client } from "@/schemas/client-schema";
import { Article } from "@/schemas/article-schema";

interface UseBudgetDataResult {
  userCompanyId: string | null;
  clients: Client[];
  articles: Article[];
  isLoadingData: boolean;
  fetchClients: () => Promise<void>;
  fetchArticles: () => Promise<void>;
}

export function useBudgetData(): UseBudgetDataResult {
  const { user } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  // Fetch user's company ID
  const fetchUserCompanyId = React.useCallback(async () => {
    if (!user) {
      setUserCompanyId(null);
      setIsLoadingData(false);
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
      toast.error(`Erro ao carregar dados do perfil: ${profileError.message}`);
    } else if (profileData) {
      setUserCompanyId(profileData.company_id);
    }
    // Only set loading to false after all initial fetches are attempted
    // The individual fetch functions below will handle their own loading states if needed,
    // but for the overall page, we want to wait for the company ID first.
  }, [user]);

  // Fetch clients for the current company
  const fetchClients = React.useCallback(async () => {
    if (!userCompanyId) {
      setClients([]);
      return;
    }
    const { data, error } = await supabase.from('clients').select('id, nome').eq('company_id', userCompanyId);
    if (error) {
      toast.error(`Erro ao carregar clientes: ${error.message}`);
      console.error("Erro ao carregar clientes:", error);
    } else {
      setClients(data || []);
    }
  }, [userCompanyId]);

  // Fetch articles for the current company
  const fetchArticles = React.useCallback(async () => {
    if (!userCompanyId) {
      setArticles([]);
      return;
    }
    const { data, error } = await supabase.from('articles').select('*').eq('company_id', userCompanyId);
    if (error) {
      toast.error(`Erro ao carregar artigos: ${error.message}`);
      console.error("Erro ao carregar artigos:", error);
    } else {
      setArticles(data || []);
    }
  }, [userCompanyId]);

  React.useEffect(() => {
    const loadAllData = async () => {
      setIsLoadingData(true);
      await fetchUserCompanyId();
      // fetchClients and fetchArticles will be called in their own useEffects
      // once userCompanyId is set.
      setIsLoadingData(false); // Set overall loading to false after initial company ID fetch
    };
    loadAllData();
  }, [fetchUserCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchClients();
      fetchArticles();
    }
  }, [userCompanyId, fetchClients, fetchArticles]);

  return {
    userCompanyId,
    clients,
    articles,
    isLoadingData,
    fetchClients,
    fetchArticles,
  };
}