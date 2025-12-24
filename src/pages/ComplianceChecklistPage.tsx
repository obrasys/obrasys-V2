"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, AlertTriangle, Save, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  category: "administrative" | "documentary" | "operational";
  item: string;
  checked: boolean;
}

const initialChecklist: ChecklistItem[] = [
  // Verificações administrativas
  { id: "admin-1", category: "administrative", item: "Licença de construção obtida e afixada no local da obra.", checked: false },
  { id: "admin-2", category: "administrative", item: "Seguro de responsabilidade civil da obra ativo.", checked: false },
  { id: "admin-3", category: "administrative", item: "Alvará da empresa de construção válido.", checked: false },
  { id: "admin-4", category: "administrative", item: "Comunicação prévia de início de trabalhos às autoridades competentes.", checked: false },
  { id: "admin-5", category: "administrative", item: "Registo de trabalhadores e respetivas licenças/certificações.", checked: false },

  // Verificações documentais
  { id: "doc-1", category: "documentary", item: "Projeto de arquitetura e especialidades aprovado e disponível no local.", checked: false },
  { id: "doc-2", category: "documentary", item: "Caderno de encargos e mapa de quantidades atualizados.", checked: false },
  { id: "doc-3", category: "documentary", item: "Contratos com subempreiteiros e fornecedores assinados e arquivados.", checked: false },
  { id: "doc-4", category: "documentary", item: "Plano de segurança e saúde em obra (PSS) elaborado e implementado.", checked: false },
  { id: "doc-5", category: "documentary", item: "Fichas de segurança dos materiais perigosos disponíveis.", checked: false },
  { id: "doc-6", category: "documentary", item: "Livro de Obra Digital atualizado com os registos diários.", checked: false },

  // Verificações operacionais básicas
  { id: "op-1", category: "operational", item: "Sinalização de segurança e equipamentos de proteção individual (EPI) adequados e em uso.", checked: false },
  { id: "op-2", category: "operational", item: "Área de armazenamento de materiais organizada e segura.", checked: false },
  { id: "op-3", category: "operational", item: "Acesso à obra controlado e seguro.", checked: false },
  { id: "op-4", category: "operational", item: "Gestão de resíduos de construção e demolição (RCD) conforme legislação.", checked: false },
  { id: "op-5", category: "operational", item: "Equipamentos e máquinas com manutenção em dia e certificações válidas.", checked: false },
];

const ComplianceChecklistPage = () => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);

  const handleCheck = (id: string, checked: boolean) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked } : item))
    );
  };

  const handleSaveChecklist = () => {
    // In a real application, this would persist the checklist status to a database.
    // For now, we'll just show a toast.
    toast.success("Checklist de conformidade guardado com sucesso!");
    console.log("Checklist saved:", checklist);
  };

  const handleResetChecklist = () => {
    if (window.confirm("Tem certeza que deseja redefinir o checklist? Todas as alterações serão perdidas.")) {
      setChecklist(initialChecklist);
      toast.info("Checklist redefinido.");
    }
  };

  const getCategoryTitle = (category: ChecklistItem['category']) => {
    switch (category) {
      case 'administrative': return 'Verificações Administrativas';
      case 'documentary': return 'Verificações Documentais';
      case 'operational': return 'Verificações Operacionais Básicas';
      default: return 'Outras Verificações';
    }
  };

  const groupedChecklist = checklist.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {} as Record<ChecklistItem['category'], ChecklistItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Checklist de Conformidade
        </h1>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Button onClick={handleSaveChecklist} className="flex items-center gap-2">
            <Save className="h-4 w-4" /> Guardar Checklist
          </Button>
          <Button variant="outline" onClick={handleResetChecklist} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Redefinir
          </Button>
        </div>
      </div>

      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Checklist orientativo com verificações importantes para apoiar o cumprimento da conformidade legal da obra.
        </p>
        <div className="flex items-start gap-2 p-3 mt-4 rounded-md bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium">
            <span className="font-bold">Importante:</span> Este checklist é informativo e não substitui aconselhamento jurídico ou técnico especializado. Consulte sempre os profissionais adequados.
          </p>
        </div>
      </section>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Verificações Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {Object.keys(groupedChecklist).map((categoryKey) => {
              const category = categoryKey as ChecklistItem['category'];
              const items = groupedChecklist[category];
              return (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-lg font-semibold">
                    {getCategoryTitle(category)}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 p-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={item.id}
                          checked={item.checked}
                          onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
                        />
                        <Label htmlFor={item.id} className="text-base font-normal cursor-pointer">
                          {item.item}
                        </Label>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceChecklistPage;