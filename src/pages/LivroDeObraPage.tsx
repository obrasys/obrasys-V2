"use client";

import React from "react";
import { useNavigate } from "react-router-dom";

import { LivroObra } from "@/schemas/compliance-schema";
import { Project } from "@/schemas/project-schema";

// Importar os novos componentes e hooks
import LivroDeObraList from "@/components/compliance/LivroDeObraList";
import LivroDeObraDetailsCard from "@/components/compliance/LivroDeObraDetailsCard";
import LivroDeObraAICompliance from "@/components/compliance/LivroDeObraAICompliance";
import CreateLivroDeObraDialog from "@/components/compliance/CreateLivroDeObraDialog";
import RdoTimeline from "@/components/compliance/RdoTimeline";
import ManualRdoEntryDialog from "@/components/compliance/ManualRdoEntryDialog";
import LivroDeObraHeader from "@/components/compliance/LivroDeObraHeader"; // NEW: Import LivroDeObraHeader

import { useLivroDeObraData } from "@/hooks/use-livro-de-obra-data"; // NEW: Import data hook
import { useLivroDeObraActions } from "@/hooks/use-livro-de-obra-actions"; // NEW: Import actions hook

import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import { FileText } from "lucide-react";

const LivroDeObraPage = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isManualRdoDialogOpen, setIsManualRdoDialogOpen] = React.useState(false);

  // Use o hook de dados
  const {
    projects,
    livrosObra,
    selectedLivroObra,
    rdoEntries,
    projectUsers,
    companyData,
    isLoading,
    userCompanyId,
    form,
    setSelectedLivroObra,
    fetchProjectsAndLivrosObra,
    fetchRdoEntries,
  } = useLivroDeObraData();

  // Use o hook de ações
  const {
    handleCreateLivroObra,
    handleSaveManualRdoEntry,
    handleGeneratePdf,
  } = useLivroDeObraActions({
    userCompanyId,
    user: null, // user is not directly used in actions, but passed for context if needed
    form,
    selectedLivroObra,
    projects,
    rdoEntries,
    projectUsers,
    companyData,
    setIsDialogOpen,
    setIsManualRdoDialogOpen,
    setSelectedLivroObra,
    fetchProjectsAndLivrosObra,
    fetchRdoEntries,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40 mt-2 md:mt-0" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const currentProject = selectedLivroObra ? projects.find(p => p.id === selectedLivroObra.project_id) : undefined;

  return (
    <div className="space-y-6">
      <LivroDeObraHeader
        onBackClick={() => navigate("/compliance")}
        onManualRdoClick={() => setIsManualRdoDialogOpen(true)}
        onNewLivroClick={() => setIsDialogOpen(true)}
        isManualRdoButtonDisabled={!selectedLivroObra}
      />

      <LivroDeObraList
        livrosObra={livrosObra}
        projects={projects}
        selectedLivroObra={selectedLivroObra}
        onSelectLivroObra={setSelectedLivroObra}
        onNewLivroClick={() => setIsDialogOpen(true)}
      />

      {selectedLivroObra ? (
        <>
          <LivroDeObraDetailsCard
            selectedLivroObra={selectedLivroObra}
            currentProject={currentProject}
            onGeneratePdf={handleGeneratePdf}
          />

          <RdoTimeline rdos={rdoEntries} projectUsers={projectUsers} />

          <LivroDeObraAICompliance projectId={selectedLivroObra.project_id} />
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={FileText}
            title="Selecione um Livro de Obra"
            description="Escolha um Livro de Obra da lista acima para ver os seus detalhes, RDOs e análise de conformidade, ou crie um novo."
            buttonText="Criar Novo Livro de Obra"
            onButtonClick={() => setIsDialogOpen(true)}
          />
        </div>
      )}

      <CreateLivroDeObraDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreateLivroObra}
        projects={projects}
        form={form}
      />

      {selectedLivroObra && userCompanyId && (
        <ManualRdoEntryDialog
          isOpen={isManualRdoDialogOpen}
          onClose={() => setIsManualRdoDialogOpen(false)}
          onSave={handleSaveManualRdoEntry}
          projectId={selectedLivroObra.project_id}
          companyId={userCompanyId}
        />
      )}
    </div>
  );
};

export default LivroDeObraPage;