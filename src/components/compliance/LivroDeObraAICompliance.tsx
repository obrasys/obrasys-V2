"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bot } from "lucide-react";

const LivroDeObraAICompliance: React.FC = () => {
  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> IA de Conformidade Documental
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium">
            <span className="font-bold">Importante:</span> Este processo é informativo e não substitui aconselhamento jurídico ou técnico especializado.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          A IA atua como um agente de validação documental e organizacional, analisando o Livro de Obra Digital e os RDOs associados, o cronograma da obra, o orçamento aprovado e as aprovações existentes.
        </p>
        <h3 className="font-semibold text-md mt-4">Validações Executadas:</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>
            <strong>Integridade do Livro de Obra:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>Verificar se existem RDOs para todos os dias úteis: <span className="text-green-500">OK</span></li>
              <li>Datas são contínuas no período: <span className="text-green-500">OK</span></li>
              <li>Custos diários estão preenchidos: <span className="text-green-500">OK</span></li>
            </ul>
          </li>
          <li>
            <strong>Coerência Técnica:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>Comparar progresso descrito × cronograma: <span className="text-orange-500">Alerta: Progresso do RDO (80%) superior ao do cronograma (70%) para a fase 'Fundações'.</span></li>
              <li>Custos diários × orçamento: <span className="text-green-500">OK</span></li>
            </ul>
          </li>
          <li>
            <strong>Preparação para Aprovação:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>Indicar se o Livro de Obra está completo: <span className="text-green-500">Completo</span></li>
              <li>Tem lacunas: <span className="text-green-500">Nenhuma</span></li>
              <li>Está pronto para submissão: <span className="text-orange-500">Requer revisão devido a inconsistência de progresso.</span></li>
            </ul>
          </li>
        </ul>
        <h3 className="font-semibold text-md mt-4">Saída da IA:</h3>
        <p className="text-sm text-muted-foreground">
          <strong>Status:</strong> <span className="text-orange-500">Com inconsistências</span>
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Lista objetiva de alertas:</strong>
          <ul className="list-disc list-inside ml-4">
            <li>Inconsistência de progresso na fase 'Fundações' entre RDO e cronograma.</li>
          </ul>
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Sugestões de correção:</strong>
          <ul className="list-disc list-inside ml-4">
            <li>Rever e ajustar o progresso registado no RDO ou atualizar o cronograma.</li>
            <li>Adicionar observações no Livro de Obra para justificar a diferença.</li>
          </ul>
        </p>
      </CardContent>
    </Card>
  );
};

export default LivroDeObraAICompliance;