"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LivroDeObraHeaderProps {
  onNewLivroClick: () => void;
}

const LivroDeObraHeader: React.FC<LivroDeObraHeaderProps> = ({ onNewLivroClick }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
      <Button variant="ghost" onClick={() => navigate("/compliance")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2 md:mb-0">
        <ArrowLeft className="h-4 w-4" /> Voltar à Conformidade
      </Button>
      <div className="text-center md:text-right flex-grow">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Livro de Obra Digital</h1>
        <p className="text-muted-foreground text-sm">
          Gestão e consolidação dos registos diários da obra
        </p>
      </div>
      <Button onClick={onNewLivroClick} className="flex items-center gap-2 mt-2 md:mt-0">
        <PlusCircle className="h-4 w-4" /> Novo Livro de Obra
      </Button>
    </div>
  );
};

export default LivroDeObraHeader;