"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Users, MessageCircleMore, CheckSquare, Signature, Eye } from "lucide-react"; // Import icons
// Removed Link and ArrowLeft as navigation is handled by Sidebar

const CRMPortal = () => {
  return (
    <div className="space-y-6"> {/* Main content wrapper */}
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6">
        {/* Removed "Voltar à Página Inicial" button */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-primary dark:text-primary-foreground flex-grow">
          Módulo 5: CRM e Portal de Colaboração do Cliente
        </h1>
        {/* Removed placeholder div */}
      </div>

      {/* Introduction Section */}
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Este módulo foca-se na otimização da interação com o cliente, transformando-a numa experiência proativa e transparente.
        </p>
      </section>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Rastreamento e Gestão de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Organizar e acompanhar leads de vendas, gerindo o pipeline desde o potencial cliente até ao cliente pagante.
            </p>
            <Button className="mt-6 w-full" disabled>
              Gerir Leads (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <MessageCircleMore className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Hub de Comunicação com o Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Canais de mensagens centralizados para clientes, reduzindo a desordem de e-mails e chamadas perdidas.
            </p>
            <Button className="mt-6 w-full" disabled>
              Comunicar (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <CheckSquare className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <CardTitle className="text-xl font-semibold">Gestão de Seleções</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Permitir que os clientes naveguem, selecionem e aprovem facilmente materiais, acabamentos e atualizações.
            </p>
            <Button className="mt-6 w-full" disabled>
              Gerir Seleções (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Signature className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            <CardTitle className="text-xl font-semibold">Aprovações Digitais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Facilitar assinaturas digitais e aprovações para seleções, ordens de alteração e outros documentos do projeto.
            </p>
            <Button className="mt-6 w-full" disabled>
              Aprovar Documentos (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Eye className="h-8 w-8 text-red-500 dark:text-red-400" />
            <CardTitle className="text-xl font-semibold">Atualizações de Progresso e Transparência</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Fornecer aos clientes acesso a atualizações de projeto em tempo real, extratos financeiros e progresso visual.
            </p>
            <Button className="mt-6 w-full" disabled>
              Ver Progresso (Em breve)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMPortal;