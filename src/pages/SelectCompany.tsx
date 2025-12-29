"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2 } from "lucide-react";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type UserCompany = {
  company_id: string;
  companies: {
    id: string;
    name: string;
  };
};

const SelectCompany: React.FC = () => {
  const { user, companyId, setActiveCompany } = useSession();
  const [companies, setCompanies] = React.useState<UserCompany[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const loadCompanies = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_companies")
        .select(
          `
          company_id,
          companies (
            id,
            name
          )
        `
        )
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao carregar empresas:", error);
        toast.error("Não foi possível carregar as empresas.");
      }

      if (mounted) {
        setCompanies((data as UserCompany[]) || []);
        setIsLoading(false);
      }
    };

    loadCompanies();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleSetActive = async (id: string) => {
    try {
      await setActiveCompany(id);
      toast.success("Empresa ativa definida com sucesso!");
      // ❗ NÃO navegar aqui
      // ProtectedRoute fará o redirect automaticamente
    } catch (err: any) {
      toast.error(
        `Falha ao definir empresa ativa: ${err?.message || "Erro"}`
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          A carregar empresas…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">
            Selecionar Empresa Ativa
          </h1>
        </div>

        {companies.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Não encontramos empresas associadas à sua conta.
            Contacte o suporte se acha que isto é um erro.
          </p>
        )}

        <div className="space-y-2">
          {companies.map((uc) => {
            const isActive = uc.company_id === companyId;

            return (
              <Button
                key={uc.company_id}
                variant={isActive ? "default" : "outline"}
                className="w-full flex justify-between items-center"
                onClick={() => handleSetActive(uc.company_id)}
              >
                <span>{uc.companies?.name ?? uc.company_id}</span>
                {isActive && (
                  <CheckCircle2 className="h-4 w-4 text-white" />
                )}
              </Button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default SelectCompany;
