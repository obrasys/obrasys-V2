"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import PlanCard from "@/components/plans/PlanCard";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = React.useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = React.useState(true);
  const [isProcessingCheckout, setIsProcessingCheckout] = React.useState(false);

  // Fetch user's company ID and current plan
  React.useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setUserCompanyId(null);
        setCurrentPlan(null);
        setIsLoadingPlans(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id, plan_type')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Erro ao carregar dados do perfil:", profileError);
        toast.error(`Erro ao carregar dados do perfil: ${profileError.message}`);
        setUserCompanyId(null);
        setCurrentPlan(null);
      } else if (profileData) {
        setUserCompanyId(profileData.company_id);
        setCurrentPlan(profileData.plan_type);
      }

      setIsLoadingPlans(false);
    };

    if (!isSessionLoading) {
      fetchUserData();
    }
  }, [user, isSessionLoading]);

  const handleSelectPlan = async (planName: string) => {
    if (!user || !userCompanyId) {
      toast.error("Utilizador não autenticado ou ID da empresa não encontrado.");
      return;
    }

    setIsProcessingCheckout(true);
    try {
      // Call Edge Function to create Stripe Checkout Session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          company_id: userCompanyId,
          plan_type: planName.toLowerCase().replace(' ', '_'), // e.g., "iniciante" or "profissional"
          customer_email: user.email,
        },
      });

      if (error) {
        console.error("Erro ao criar sessão de checkout:", error);
        toast.error(`Erro ao iniciar pagamento: ${error.message}`);
        return;
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        toast.error("Não foi possível obter o URL de checkout do Stripe.");
      }
    } catch (error: any) {
      console.error("Erro inesperado ao selecionar plano:", error);
      toast.error(`Ocorreu um erro inesperado: ${error.message}`);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const plans = [
    {
      planName: "Iniciante",
      description: "Perfeito para pequenos projetos",
      price: "€49",
      features: [
        "Até 5 obras ativas",
        "2 utilizadores",
        "Orçamentação básica",
        "Relatórios diários",
        "Portal do cliente",
        "Suporte por email",
      ],
      buttonText: "Selecionar Plano",
      stripePriceId: "price_12345_iniciante", // Placeholder - REPLACE WITH ACTUAL STRIPE PRICE ID
    },
    {
      planName: "Profissional",
      description: "Para equipas em crescimento",
      price: "€99",
      features: [
        "Obras ilimitadas",
        "10 utilizadores",
        "Orçamentação avançada",
        "Relatórios diários + fotos",
        "Livro de obra digital",
        "Portal do cliente",
        "Gestão documental",
        "Planeamento de tarefas",
        "Suporte prioritário",
      ],
      isPopular: true,
      buttonText: "Selecionar Plano",
      stripePriceId: "price_12345_profissional", // Placeholder - REPLACE WITH ACTUAL STRIPE PRICE ID
    },
    {
      planName: "Empresa",
      description: "Para grandes organizações",
      price: "Personalizado",
      features: [
        "Tudo do plano Profissional",
        "Utilizadores ilimitados",
        "Integrações personalizadas",
        "IA para orçamentação",
        "Relatórios avançados",
        "Suporte dedicado 24/7",
        "Treino da equipa",
        "SLA garantida",
      ],
      buttonText: "Contactar Vendas",
    },
  ];

  if (isLoadingPlans) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">A carregar planos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Escolher Plano
        </h1>
      </div>

      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Selecione o plano que melhor se adequa às suas necessidades.
        </p>
        {currentPlan && currentPlan !== "trialing" && (
          <p className="text-sm text-green-600 font-semibold mt-4">
            O seu plano atual é: <span className="capitalize">{currentPlan.replace('_', ' ')}</span>.
          </p>
        )}
      </section>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {plans.map((plan) => (
          <PlanCard
            key={plan.planName}
            planName={plan.planName}
            description={plan.description}
            price={plan.price}
            features={plan.features}
            isPopular={plan.isPopular}
            buttonText={plan.buttonText}
            onSelectPlan={handleSelectPlan}
            disabled={isProcessingCheckout || (currentPlan === plan.planName.toLowerCase().replace(' ', '_'))}
          />
        ))}
      </div>

      <Card className="bg-card text-card-foreground border border-border mt-8">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Precisa de algo personalizado?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Contacte-nos para soluções empresariais personalizadas com preços especiais.
          </p>
          <Button variant="outline" onClick={() => toast.info("Funcionalidade de Contactar Vendas em desenvolvimento.")}>
            Contactar Vendas
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlansPage;