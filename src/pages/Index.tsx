"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavButton from "@/components/NavButton"; // Importar NavButton

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full"> {/* Adicionado max-w-lg w-full */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Visão Geral dos Módulos Obra Sys</h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8">
          Explore os diferentes módulos da sua plataforma.
        </p>
        <div className="space-y-4">
          <NavButton to="/budgeting" size="lg" className="w-full"> {/* w-full para botões */}
            Ir para Módulo 1: Orçamentação
          </NavButton>
          <NavButton to="/project-management" size="lg" className="w-full">
            Ir para Módulo 2: Gestão de Projetos
          </NavButton>
          <NavButton to="/supply-chain" size="lg" className="w-full">
            Ir para Módulo 3: Cadeia de Abastecimento
          </NavButton>
          <NavButton to="/finance-management" size="lg" className="w-full">
            Ir para Módulo 4: Gestão Financeira
          </NavButton>
          <NavButton to="/crm-portal" size="lg" className="w-full">
            Ir para Módulo 5: CRM e Portal do Cliente
          </NavButton>
          <NavButton to="/automation-intelligence" size="lg" className="w-full">
            Ir para Módulo 6: Automação & Inteligência
          </NavButton>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;