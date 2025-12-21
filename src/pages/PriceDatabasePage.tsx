"use client";

import React from "react";
// Removed Link and ArrowLeft as navigation is handled by Sidebar
import { Button } from "@/components/ui/button"; // Keep Button for potential future use

const PriceDatabasePage = () => {
  return (
    <div className="space-y-6"> {/* Main content wrapper */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-primary dark:text-primary-foreground flex-grow">
          Página de Base de Preços
        </h1>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Esta é uma página placeholder para a base de dados de preços.
        </p>
      </section>
      {/* Removed "Voltar à Dashboard" button */}
    </div>
  );
};

export default PriceDatabasePage;