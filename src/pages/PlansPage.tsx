"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PlanCard from "@/components/plans/PlanCard";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PlanType = "trialing" | "iniciante" | "profissional" | "empresa";

const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = React.useState<PlanType | null>(null);
  const [trialEnd, setTrialEnd] = React.useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = React.useState(true);
  const [isProcessingCheckout, setIsProcessingCheckout] = React.useState(false);

  // Buscar empresa e plano atual (com possível fim do trial)
  React.useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      // Fallback: se algo travar, garantimos que o loading termina
      if (!cancelled) setIsLoadingPlans(false);
    }, 4000);

    const fetchUserData = async () => {
      try {
        // Se não houver utilizador, termina carregamento
        if (!user) {
          if (!cancelled) {
            setUserCompanyId(null);
            setCurrentPlan(null);
            setTrialEnd(null);
            setIsLoadingPlans(false);
          }
          return;
        }

        // Carregar dados do perfil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("company_id, plan_type")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Erro ao carregar dados do perfil:", profileError);
          toast.error(`Erro ao carregar dados do perfil: ${profileError.message}`);
          if (!cancelled) {
            setUserCompanyId(null);
            setCurrentPlan(null);
          }
        } else if (profileData) {
          if (!cancelled) {
            setUserCompanyId(profileData.company_id);
            setCurrentPlan((profileData.plan_type || "trialing") as PlanType);
          }

          // Ler assinatura filtrando pela empresa
          if (profileData.company_id) {
            const { data: sub, error: subError } = await supabase
              .from("subscriptions")
              .select("trial_end, status, plan_type, company_id, created_at")
              .eq("company_id", profileData.company_id)
              .order("created_at", { ascending: false })
              .limit(1);

            if (subError) {
              console.error("Erro ao ler assinatura:", subError);
            } else if (sub && sub.length > 0) {
              const s = sub[0] as { trial_end: string | null; plan_type: PlanType | null };
              if (!cancelled) {
                if (s?.plan_type) setCurrentPlan((s.plan_type || "trialing") as PlanType);
                setTrialEnd(s?.trial_end || null);
              }
            }
          }
        }
      } catch (err) {
        console.error("Erro inesperado ao buscar dados de planos:", err);
        // Notificar sem bloquear a UI
        toast.error("Falha ao carregar informações de planos. Usando valores padrão.");
      } finally {
        if (!cancelled) setIsLoadingPlans(false);
      }
    };

    fetchUserData();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [user]);

  const handleSelectPlan = async (planName: string) => {
    if (!user || !userCompanyId) {
      toast.error("Utilizador não autenticado ou ID da empresa não encontrado.");
      return;
    }

    const normalizedPlan = planName.toLowerCase().replace(" ", "_");
    // Não iniciar checkout para o plano Empresa
    if (normalizedPlan === "empresa") {
      toast.info("Para o plano Empresa, por favor contacte as vendas para uma proposta personalizada.");
      return;
    }

    setIsProcessingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          company_id: userCompanyId,
          plan_type: normalizedPlan,
          customer_email: user.email,
        },
      });

      if (error) {
        // Mostrar detalhe do erro vindo da função, se existir
        const fnMessage = (data && (data as any).error) ? (data as any).error : error.message;
        console.error("Erro ao criar sessão de checkout:", error, data);
        toast.error(`Erro ao iniciar pagamento: ${fnMessage}`);
        return;
      }

      if (data?.url) {
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
      price: "€49/mês",
      features: [
        "Até 5 obras ativas",
        "2 utilizadores",
        "Orçamentação básica",
        "Relatórios diários",
        "Portal do cliente",
        "Suporte por email",
      ],
      buttonText: "Selecionar Plano",
      stripePriceId: "price_12345_iniciante",
    },
    {
      planName: "Profissional",
      description: "Para equipas em crescimento",
      price: "€99/mês",
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
      stripePriceId: "price_12345_profissional",
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

  // Cálculo simples de dias restantes de trial
  const daysLeft =
    currentPlan === "trialing" && trialEnd
      ? Math.max(
          0,
          Math.ceil(
            (new Date(trialEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Gestão de Assinatura
        </h1>
        <p className="text-sm md:text-base text-muted-foreground text-center md:text-right">
          Gerir o seu plano de assinatura, faturação e atualizar para funcionalidades premium
        </p>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-xs">
              Plano Atual
            </span>
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-xs">
              Planos Disponíveis
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Plano Atual */}
        <TabsContent value="current" className="mt-4">
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-sm border px-2 py-0.5 text-xs">
                  Gestão de Assinatura
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Estado Atual</p>
                <div className="flex items-center gap-2">
                  {currentPlan === "trialing" ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Período de Teste
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="capitalize">
                      {String(currentPlan || "trialing").replace("_", " ")}
                    </Badge>
                  )}
                  {daysLeft !== null && (
                    <span className="text-xs text-muted-foreground">
                      {daysLeft} {daysLeft === 1 ? "dia" : "dias"} restantes
                    </span>
                  )}
                </div>
              </div>

              {currentPlan === "trialing" && (
                <div className="rounded-md border bg-muted p-4 flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    O seu período de teste está a terminar. Considere fazer upgrade para continuar a usar todas as funcionalidades.
                  </p>
                </div>
              )}

              <Separator />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => navigate("#available")}
                  className="w-full sm:w-auto"
                >
                  Subscrever Plano
                </Button>
                {currentPlan && currentPlan !== "trialing" && (
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => toast.info("Gestão de faturação em breve.")}>
                    Gerir Faturação
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Planos Disponíveis */}
        <TabsContent value="available" className="mt-4" id="available">
          <section className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-2">Escolher Plano</h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Selecione o plano que melhor se adequa às suas necessidades.
            </p>
            {currentPlan && currentPlan !== "trialing" && (
              <p className="text-sm text-green-600 font-semibold mt-4">
                O seu plano atual é: <span className="capitalize">{String(currentPlan).replace("_", " ")}</span>.
              </p>
            )}
          </section>

          <Separator className="my-6 bg-gray-300 dark:bg-gray-700" />

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
                disabled={isProcessingCheckout || (currentPlan === plan.planName.toLowerCase().replace(" ", "_"))}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlansPage;