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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import PlanCard, {
  PlanId,
} from "@/components/plans/PlanCard";
import { useSession } from "@/components/SessionContextProvider";
import { toast } from "sonner";
import { Loader2, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { supabase } from "@/integrations/supabase/client";

/* =========================
   TYPES
========================= */

type PlanType = PlanId; // "iniciante" | "profissional" | "empresa"

const planLabelMap: Record<PlanType, string> = {
  iniciante: "Iniciante",
  profissional: "Profissional",
  empresa: "Empresa",
};

/* =========================
   COMPONENT
========================= */

const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isLoading } = useSession();

  const {
    subscription,
    plan,
    loading: loadingSub,
  } = useSubscriptionStatus(profile?.company_id);

  const [isProcessingCheckout, setIsProcessingCheckout] =
    React.useState(false);

  if (isLoading || loadingSub) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">
          A carregar planos…
        </p>
      </div>
    );
  }

  async function handleSelectPlan(planType: PlanType) {
    if (planType === "empresa") {
      toast.info(
        "Plano Empresa disponível apenas via contacto comercial."
      );
      return;
    }

    setIsProcessingCheckout(true);

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "create-checkout-session",
          {
            body: {
              plan_type: planType,
            },
          }
        );

      if (error || !data?.url) {
        throw error;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast.error("Erro ao iniciar checkout.");
    } finally {
      setIsProcessingCheckout(false);
    }
  }

  const plans: {
    planId: PlanType;
    planName: string;
    description: string;
    priceLabel: string;
    features: string[];
    isPopular?: boolean;
  }[] = [
    {
      planId: "iniciante",
      planName: "Iniciante",
      description: "Perfeito para pequenos projetos",
      priceLabel: "49€ / mês + IVA",
      features: [
        "Até 5 obras ativas",
        "2 utilizadores",
        "Orçamentação básica",
        "Relatórios diários",
        "Portal do cliente",
      ],
    },
    {
      planId: "profissional",
      planName: "Profissional",
      description: "Para equipas em crescimento",
      priceLabel: "99€ / mês + IVA",
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
      planId: "empresa",
      planName: "Empresa",
      description: "Para grandes organizações",
      priceLabel: "Personalizado",
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
              <CardTitle>
                Estado da Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan && (
                <Badge variant="outline">
                  {planLabelMap[plan]}
                </Badge>
              )}

              {subscription?.status ===
                "trialing" && (
                <div className="flex gap-2 items-center text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Trial ativo
                </div>
              )}

              <Separator />

              <Button
                onClick={() =>
                  navigate("#available")
                }
              >
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
                key={p.planId}
                planId={p.planId}
                planName={p.planName}
                description={p.description}
                priceLabel={p.priceLabel}
                features={p.features}
                isPopular={p.isPopular}
                disabled={
                  plan === p.planId ||
                  isProcessingCheckout
                }
                isLoading={isProcessingCheckout}
                buttonText={
                  plan === p.planId
                    ? "Plano Atual"
                    : "Selecionar"
                }
                onSelectPlan={handleSelectPlan}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlansPage;
