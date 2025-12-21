"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { CalendarDays, HardHat } from "lucide-react";

const SchedulePage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Gestão de Cronogramas
        </h1>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Visualize e gira os cronogramas das suas obras. Os cronogramas são gerados automaticamente após a aprovação do orçamento e criação da obra.
        </p>
      </section>
      <EmptyState
        icon={CalendarDays}
        title="Cronogramas são geridos dentro das Obras"
        description="Para ver ou editar um cronograma, por favor, selecione uma obra na página de Gestão de Obras."
        buttonText="Ir para Gestão de Obras"
        onButtonClick={() => navigate("/projects")}
      />
    </div>
  );
};

export default SchedulePage;