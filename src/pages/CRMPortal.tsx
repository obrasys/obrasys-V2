"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, MessageCircleMore, CheckSquare, Signature, Eye } from "lucide-react"; // Import icons
import { Link } from "react-router-dom";

const CRMPortal = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto p-6 space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 pb-6">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar à Página Inicial
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold text-center text-primary dark:text-primary-foreground flex-grow">
            Módulo 5: CRM e Portal de Colaboração do Cliente
          </h1>
          <div className="w-48 md:block hidden"></div> {/* Placeholder for alignment on larger screens */}
        </div>

        {/* Introduction Section */}
        <section className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed">
            Este módulo foca-se na otimização da interação com o cliente, transformando-a numa experiência proativa e transparente.
          </p>
        </section>

        <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              <CardTitle className="text-xl font-semibold">Rastreamento e Gestão de Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Organizar e acompanhar leads de vendas, gerindo o pipeline desde o potencial cliente até ao cliente pagante.
              </p>
              <Button className="mt-6 w-full" disabled>
                Gerir Leads (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <MessageCircleMore className="h-8 w-8 text-green-500 dark:text-green-400" />
              <CardTitle className="text-xl font-semibold">Hub de Comunicação com o Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Canais de mensagens centralizados para clientes, reduzindo a desordem de e-mails e chamadas perdidas.
              </p>
              <Button className="mt-6 w-full" disabled>
                Comunicar (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <CheckSquare className="h-8 w-8 text-purple-500 dark:text-purple-400" />
              <CardTitle className="text-xl font-semibold">Gestão de Seleções</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Permitir que os clientes naveguem, selecionem e aprovem facilmente materiais, acabamentos e atualizações.
              </p>
              <Button className="mt-6 w-full" disabled>
                Gerir Seleções (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <Signature className="h-8 w-8 text-orange-500 dark:text-orange-400" />
              <CardTitle className="text-xl font-semibold">Aprovações Digitais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Facilitar assinaturas digitais e aprovações para seleções, ordens de alteração e outros documentos do projeto.
              </p>
              <Button className="mt-6 w-full" disabled>
                Aprovar Documentos (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <Eye className="h-8 w-8 text-red-500 dark:text-red-400" />
              <CardTitle className="text-xl font-semibold">Atualizações de Progresso e Transparência</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Fornecer aos clientes acesso a atualizações de projeto em tempo real, extratos financeiros e progresso visual.
              </p>
              <Button className="mt-6 w-full" disabled>
                Ver Progresso (Em breve)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CRMPortal;