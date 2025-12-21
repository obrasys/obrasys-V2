"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { LivroObra } from "@/schemas/compliance-schema";
import { Project } from "@/schemas/project-schema";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface LivroDeObraDetailsCardProps {
  selectedLivroObra: LivroObra;
  currentProject: Project | undefined;
  onGeneratePdf: () => void;
}

const LivroDeObraDetailsCard: React.FC<LivroDeObraDetailsCardProps> = ({
  selectedLivroObra,
  currentProject,
  onGeneratePdf,
}) => {
  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Detalhes do Livro de Obra</CardTitle>
        <Button onClick={onGeneratePdf} className="flex items-center gap-2">
          <FileText className="h-4 w-4" /> Gerar PDF
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><span className="font-semibold">Obra:</span> {currentProject?.nome || "N/A"}</div>
        <div><span className="font-semibold">Localização:</span> {currentProject?.localizacao || "N/A"}</div>
        <div><span className="font-semibold">Cliente:</span> {currentProject?.client_name || "N/A"}</div> {/* Usando client_name */}
        <div><span className="font-semibold">Período:</span> {formatDate(selectedLivroObra.periodo_inicio)} a {formatDate(selectedLivroObra.periodo_fim)}</div>
        <div><span className="font-semibold">Estado:</span> <span className="capitalize">{selectedLivroObra.estado.replace('_', ' ')}</span></div>
        <div><span className="font-semibold">Observações:</span> {selectedLivroObra.observacoes || "N/A"}</div>
      </CardContent>
    </Card>
  );
};

export default LivroDeObraDetailsCard;