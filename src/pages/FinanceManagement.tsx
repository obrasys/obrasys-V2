"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CreditCard, Banknote, ClipboardList, LayoutDashboard, Printer } from "lucide-react";

const FinanceManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Gestão Financeira e Relatórios
        </h1>
      </div>

      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Este módulo é essencial para garantir a saúde financeira dos projetos e da empresa, fornecendo uma visão clara e em tempo real dos custos e receitas.
        </p>
      </section>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <CreditCard className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Faturação e Cobrança</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Automatizar a geração de faturas com base em seleções aprovadas, progresso e trabalho concluído, com cobrança de pagamentos simplificada.
            </p>
            <Button className="mt-6 w-full" disabled>
              Gerir Faturas (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Banknote className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Contas a Pagar/Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Gerir faturas, pedidos e pagamentos, garantindo clareza financeira e transações atempadas.
            </p>
            <Button className="mt-6 w-full" disabled>
              Gerir Contas (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <ClipboardList className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <CardTitle className="text-xl font-semibold">Integração de Folha de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Rastrear com precisão os custos de mão de obra, incluindo salários, benefícios e impostos, e integrar com sistemas de folha de pagamento.
            </p>
            <Button className="mt-6 w-full" disabled>
              Integrar Folha (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <LayoutDashboard className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            <CardTitle className="text-xl font-semibold">Painéis Financeiros Abrangentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Fornecer informações em tempo real sobre custos de trabalho, margens, previsões e fluxo de caixa.
            </p>
            <Button className="mt-6 w-full" disabled>
              Ver Painéis (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Printer className="h-8 w-8 text-red-500 dark:text-red-400" />
            <CardTitle className="text-xl font-semibold">Relatórios Personalizados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Gerar resumos financeiros adaptados para análise interna, relatórios de clientes e comunicação com as partes interessadas.
            </p>
            <Button className="mt-6 w-full" disabled>
              Gerar Relatórios (Em breve)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceManagement;