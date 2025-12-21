"use client";

import React from "react";
import { Button } from "@/components/ui/button";

const CollaboratorsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Página de Colaboradores
        </h1>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Esta é uma página placeholder para a gestão de colaboradores.
        </p>
      </section>
    </div>
  );
};

export default CollaboratorsPage;