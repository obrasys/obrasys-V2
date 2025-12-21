"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ReportsPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Página de Relatórios</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Esta é uma página placeholder para a geração de relatórios.
        </p>
        <Link to="/dashboard">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar à Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ReportsPage;