"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LivroDeObraHeaderProps {
  onBackClick: () => void;
  onManualRdoClick: () => void;
  onNewLivroClick: () => void;
  isManualRdoButtonDisabled: boolean;
}

const LivroDeObraHeader: React.FC<LivroDeObraHeaderProps> = ({
  onBackClick,
  onManualRdoClick,
  onNewLivroClick,
  isManualRdoButtonDisabled,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Livro de Obra Digital</h1>
        <p className="text-muted-foreground text-sm">
          Gestão e consolidação dos registos diários da obra
        </p>
      </div>
      <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
        <Button variant="ghost" onClick={onBackClick} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button onClick={onManualRdoClick} disabled={isManualRdoButtonDisabled} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
          <PlusCircle className="h-4 w-4" /> Registo Manual
        </Button>
        <Button onClick={onNewLivroClick} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> Novo Livro de Obra
        </Button>
      </div>
    </div>
  );
};

export default LivroDeObraHeader;