"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  BookText,
  CheckSquare,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import NavButton from "@/components/NavButton"; // Importar NavButton

const CompliancePage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Conformidade e Cliente
        </h1>
      </div>

      {/* Subtitle */}
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Gestão documental, aprovações e verificação de conformidade da obra.
        </p>
      </section>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Livro de Obra Digital */}
        <Card className="hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <BookText className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">
              Livro de Obra Digital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Gerir e consolidar os RDOs (Relatórios Diários de Obra) num Livro de
              Obra Digital, estruturado e organizado para consulta e validação.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-4 space-y-1">
              <li>Compilar RDOs automaticamente</li>
              <li>Gerar folha formal do Livro de Obra</li>
              <li>
                Preparar documentação para: Aprovação, Fiscalização, Arquivo
              </li>
            </ul>
            <NavButton
              className="mt-6 w-full"
              to="/compliance/livro-de-obra"
            >
              Gerir Livro de Obra
            </NavButton>
          </CardContent>
        </Card>

        {/* Gestão de Aprovações */}
        <Card className="hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <CheckSquare className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">
              Gestão de Aprovações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Centralizar o controlo de aprovações pendentes, garantindo
              rastreabilidade e histórico completo das decisões.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-4 space-y-1">
              <li>Visualizar aprovações pendentes</li>
              <li>Consultar histórico de aprovações</li>
              <li>Registar data, responsável e estado</li>
            </ul>
            <Button className="mt-6 w-full" disabled>
              Ver Aprovações
            </Button>
          </CardContent>
        </Card>

        {/* Checklist de Conformidade */}
        <Card className="hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <ClipboardList className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <CardTitle className="text-xl font-semibold">
              Checklist de Conformidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Checklist orientativo com verificações importantes para apoiar o
              cumprimento da conformidade legal da obra.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-4 space-y-1">
              <li>Verificações administrativas</li>
              <li>Verificações documentais</li>
              <li>Verificações operacionais básicas</li>
            </ul>

            <div className="flex items-start gap-2 p-3 mt-4 rounded-md bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium">
                <span className="font-bold">Importante:</span> Este checklist é
                informativo e não substitui aconselhamento jurídico ou técnico
                especializado. Consulte sempre os profissionais adequados.
              </p>
            </div>

            <Button className="mt-6 w-full" disabled>
              Consultar Checklist
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompliancePage;