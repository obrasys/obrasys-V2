"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PlanCard from "@/components/plans/PlanCard";
import { useSession } from "@/components/SessionContextProvider";
import { toast } from "sonner";
import { Loader2, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { supabase } from "@/integrations/supabase/client";

type PlanKey = "free" | "starter" | "pro" | "enterprise";

const planMap: Record<PlanKey, string> = {
  free: "Trial",
  starter: "Iniciante",
  pro: "Profissional",
  enterprise: "Empresa",
};

const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isLoading } = useSession();

  const {
    subscription,
    plan,
    isActive,
    loading: loadingSub,
  } = useSubscriptionStatus(profile?.company_id);

  const [isProcessingCheckout, setIsProcessingCheckout] =
    React.useState(false);

  if (isLoading || loadingSub) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">
          A carregar planos...
        </p>
      </div>
    );
  }

  async function handleSelectPlan(planKey: PlanKey) {
    if (!profile?.company_id) {
      toast.error("Empresa não encontrada.");
      return;
    }

    if (planKey === "enterprise") {
      toast.info(
        "Plano Empresa disponível apenas via contacto comercial."
      );
      return;
    }

    setIsProcessingCheckout(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-stripe-checkout",
        {
          body: {
            company_id: profile.company_id,
            plan_key: planKey,
          },
        }
      );

      if (error) throw error;

      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao iniciar pagamento.");
    } finally {
      setIsProcessingCheckout(false);
    }
  }

  const plans = [
    {
      planKey: "starter" as PlanKey,
      planName: "Iniciante",
      description: "Perfeito para pequenos projetos",
      price: "49€ / mês + IVA",
      features: [
        "Até 5 obras ativas",
        "2 utilizadores",
        "Orçamentação básica",
        "Relatórios diários",
        "Portal do cliente",
      ],
    },
    {
      planKey: "pro" as PlanKey,
      planName: "Profissional",
      description: "Para equipas em crescimento",
      price: "99€ / mês + IVA",
      features: [
        "Obras ilimitadas",
        "10 utilizadores",
        "Livro de obra digital",
        "Planeamento",
        "Relatórios com fotos",
      ],
      isPopular: true,
    },
    {
      planKey: "enterprise" as PlanKey,
      planName: "Empresa",
      description: "Para grandes organizações",
      price: "Personalizado",
      features: [
        "Tudo do Profissional",
        "Utilizadores ilimitados",
        "SLA dedicado",
        "Integrações customizadas",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">
        Gestão de Assinatura
      </h1>

      <Tabs defaultValue="current">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="current">
            Plano Atual
          </TabsTrigger>
          <TabsTrigger value="available">
            Planos Disponíveis
          </TabsTrigger>
        </TabsList>

        {/* PLANO ATUAL */}
        <TabsContent value="current" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado da Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant="outline">
                {planMap[plan]}
              </Badge>

              {subscription?.status === "trialing" && (
                <div className="flex gap-2 items-center text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Trial ativo
                </div>
              )}

              <Separator />

              <Button onClick={() => navigate("#available")}>
                Alterar Plano
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLANOS */}
        <TabsContent value="available" className="mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <PlanCard
                key={p.planKey}
                planName={p.planName}
                description={p.description}
                price={p.price}
                features={p.features}
                isPopular={p.isPopular}
                disabled={
                  plan === p.planKey || isProcessingCheckout
                }
                buttonText={
                  plan === p.planKey
                    ? "Plano Atual"
                    : "Selecionar"
                }
                onSelectPlan={() =>
                  handleSelectPlan(p.planKey)
                }
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlansPage;
