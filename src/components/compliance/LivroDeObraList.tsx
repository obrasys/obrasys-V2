"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { FileText } from "lucide-react";
import { LivroObra } from "@/schemas/compliance-schema";
import { Project } from "@/schemas/project-schema";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatters";

interface LivroDeObraListProps {
  livrosObra: LivroObra[];
  projects: Project[];
  selectedLivroObra: LivroObra | null;
  onSelectLivroObra: (livro: LivroObra) => void;
  onNewLivroClick: () => void;
}

const LivroDeObraList: React.FC<LivroDeObraListProps> = ({
  livrosObra,
  projects,
  selectedLivroObra,
  onSelectLivroObra,
  onNewLivroClick,
}) => {
  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Livros de Obra Existentes</CardTitle>
      </CardHeader>
      <CardContent>
        {livrosObra.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {livrosObra.map((livro) => {
              const project = projects.find(p => p.id === livro.project_id);
              return (
                <Card
                  key={livro.id}
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-shadow",
                    selectedLivroObra?.id === livro.id && "border-primary ring-2 ring-primary"
                  )}
                  onClick={() => onSelectLivroObra(livro)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{project?.nome || "Obra Desconhecida"}</CardTitle>
                    <p className="text-sm text-muted-foreground">Período: {formatDate(livro.periodo_inicio)} - {formatDate(livro.periodo_fim)}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Estado: <span className="capitalize">{livro.estado.replace('_', ' ')}</span></p>
                    <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => onSelectLivroObra(livro)}>
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="Nenhum Livro de Obra encontrado"
            description="Crie um novo Livro de Obra para começar a gerir os registos diários."
            buttonText="Criar Novo Livro"
            onButtonClick={onNewLivroClick}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default LivroDeObraList;