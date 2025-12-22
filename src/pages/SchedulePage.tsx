"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { CalendarDays, HardHat, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "@/components/SessionContextProvider";
import { Project } from "@/schemas/project-schema";
import ScheduleTab from "@/components/projects/schedule-tab"; // Importar o ScheduleTab

const SchedulePage = () => {
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = React.useState(true);

  // Fetch user's company ID
  const fetchUserCompanyId = React.useCallback(async () => {
    if (!user) {
      setUserCompanyId(null);
      return;
    }
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Erro ao carregar company_id do perfil:", profileError);
      setUserCompanyId(null);
    } else if (profileData) {
      setUserCompanyId(profileData.company_id);
    }
  }, [user]);

  // Fetch projects for the current company
  const fetchProjects = React.useCallback(async () => {
    if (!userCompanyId) {
      setProjects([]);
      setLoadingProjects(false);
      return;
    }
    setLoadingProjects(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, nome, budget_id'); // Apenas os campos necessários

    if (error) {
      toast.error(`Erro ao carregar obras: ${error.message}`);
      console.error("Erro ao carregar obras:", error);
      setProjects([]);
    } else {
      setProjects(data || []);
      // Se não houver projeto selecionado, tenta selecionar o primeiro com budget_id
      if (!selectedProjectId && data && data.length > 0) {
        const firstProjectWithBudget = data.find(p => p.budget_id);
        if (firstProjectWithBudget) {
          setSelectedProjectId(firstProjectWithBudget.id);
        }
      }
    }
    setLoadingProjects(false);
  }, [userCompanyId, selectedProjectId]);

  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
  }, [isSessionLoading, fetchUserCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchProjects();
    }
  }, [userCompanyId, fetchProjects]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (loadingProjects) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>A carregar obras...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Gestão de Cronogramas
        </h1>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Visualize e faça a gestão dos cronogramas das suas obras. Os cronogramas são gerados automaticamente após a aprovação do orçamento e criação da obra.
        </p>
      </section>

      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">Selecionar Obra</CardTitle>
          <Button variant="outline" onClick={fetchProjects}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar Obras
          </Button>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <Select
              value={selectedProjectId || ""}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Selecione uma obra para ver o cronograma" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <EmptyState
              icon={HardHat}
              title="Nenhuma obra encontrada"
              description="Crie uma nova obra na página de Gestão de Obras para poder gerir os seus cronogramas."
              buttonText="Ir para Gestão de Obras"
              onButtonClick={() => navigate("/projects")}
            />
          )}
        </CardContent>
      </Card>

      {selectedProject && selectedProject.budget_id ? (
        <ScheduleTab
          projectId={selectedProject.id}
          budgetId={selectedProject.budget_id}
          onScheduleRefetch={fetchProjects} // Passar fetchProjects para atualizar a lista de obras
          userCompanyId={userCompanyId}
        />
      ) : selectedProjectId && !selectedProject?.budget_id ? (
        <EmptyState
          icon={CalendarDays}
          title="Cronograma não disponível"
          description="Esta obra ainda não tem um orçamento aprovado e associado para gerar um cronograma."
          buttonText="Ir para Orçamentação"
          onButtonClick={() => navigate("/budgeting")}
        />
      ) : (
        projects.length > 0 && (
          <EmptyState
            icon={CalendarDays}
            title="Selecione uma obra"
            description="Escolha uma obra no menu acima para visualizar e gerir o seu cronograma."
          />
        )
      )}
    </div>
  );
};

export default SchedulePage;