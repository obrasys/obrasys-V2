"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2 } from "lucide-react";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const SelectCompany: React.FC = () => {
  const { user, companyId, setActiveCompany } = useSession();
  const [suggestedCompanyId, setSuggestedCompanyId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    let mounted = true;
    const loadSuggestion = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      // Usa a função RPC current_company_id como sugestão (não grava automaticamente)
      const { data, error } = await supabase.rpc("current_company_id");
      if (error) {
        console.error("Erro ao obter sugestão de empresa:", error);
      }
      if (mounted) {
        setSuggestedCompanyId(data ? String(data) : null);
        setIsLoading(false);
      }
    };
    loadSuggestion();
    return () => { mounted = false; };
  }, [user]);

  const handleSetActive = async (id: string | null) => {
    try {
      await setActiveCompany?.(id);
      toast.success("Empresa ativa definida com sucesso!");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(`Falha ao definir empresa ativa: ${err?.message || "Erro"}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">A carregar empresas…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Selecionar Empresa Ativa</h1>
        </div>

        {companyId ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm">Já existe uma empresa ativa definida.</span>
          </div>
        ) : suggestedCompanyId ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Encontrámos uma empresa associada à sua conta. Confirme para usá-la como ativa.
            </p>
            <div className="rounded border p-3 text-sm">
              <span className="font-mono">{suggestedCompanyId}</span>
            </div>
            <Button className="w-full" onClick={() => handleSetActive(suggestedCompanyId)}>
              Definir como empresa ativa
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleSetActive(null)}>
              Limpar empresa ativa
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Não encontramos uma empresa associada. Se acha que isto é um erro, contacte o suporte.
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
              Ir para o Painel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SelectCompany;