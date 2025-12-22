"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Alert {
  project_id: string;
  project_name: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
}

interface LivroDeObraAIComplianceProps {
  projectId: string | null;
}

const LivroDeObraAICompliance: React.FC<LivroDeObraAIComplianceProps> = ({ projectId }) => {
  const [aiAlerts, setAiAlerts] = useState<Alert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  const fetchAIAssessment = useCallback(async () => {
    if (!projectId) {
      toast.info("Selecione um Livro de Obra para analisar.");
      return;
    }

    setIsLoadingAlerts(true);
    setAiAlerts([]); // Clear previous alerts

    try {
      const SUPABASE_PROJECT_ID = 'odlalpqizulkzrzscmrd';
      const EDGE_FUNCTION_NAME = 'analyze-project-data';

      const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
        body: { project_id: projectId },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error("Erro ao invocar função Edge:", error);
        // Attempt to parse the detailed error from the Edge Function's response
        if (error.context?.error) {
          const edgeFunctionError = error.context.error;
          const errorMessage = edgeFunctionError.details || edgeFunctionError.message || 'Erro desconhecido';
          toast.error(`Erro da IA: ${errorMessage}`);
          console.error("Detalhes do erro da Edge Function:", edgeFunctionError);
        } else {
          toast.error(`Erro ao obter análise da IA: ${error.message}`);
        }
        throw error; // Re-throw to stop execution
      }

      if (data && data.length > 0) {
        setAiAlerts(data);
        toast.info("Análise da IA concluída. Verifique os alertas.");
      } else {
        setAiAlerts([]);
        toast.success("Nenhum risco ou anomalia detetada pelo AI Assistant.");
      }
    } catch (error: any) {
      // This catch block is for the re-thrown error or other client-side errors
      console.error("Erro geral no cliente ao analisar com IA:", error);
      // Fallback toast if the error wasn't handled more specifically above
      if (!error.context?.error) { // Only show generic if not already shown specific
        toast.error(`Ocorreu um erro inesperado: ${error.message}`);
      }
    } finally {
      setIsLoadingAlerts(false);
    }
  }, [projectId]);

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-orange-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> IA de Conformidade Documental
        </CardTitle>
        <Button
          onClick={fetchAIAssessment}
          disabled={!projectId || isLoadingAlerts}
          className="flex items-center gap-2"
        >
          {isLoadingAlerts ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> A Analisar...
            </>
          ) : (
            <>
              <Bot className="h-4 w-4" /> Analisar com IA
            </>
          )}
        </Button>
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

        {aiAlerts.length > 0 ? (
          <>
            <h3 className="font-semibold text-md mt-4">Alertas Detetados:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              {aiAlerts.map((alert, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className={cn("font-bold flex-shrink-0", getSeverityColor(alert.severity))}>
                    [{alert.severity.toUpperCase()}]:
                  </span>
                  <span>
                    <span className="font-semibold">{alert.title}:</span> {alert.message}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          !isLoadingAlerts && (
            <p className="text-sm text-muted-foreground italic">
              Clique em "Analisar com IA" para obter uma avaliação do projeto.
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default LivroDeObraAICompliance;