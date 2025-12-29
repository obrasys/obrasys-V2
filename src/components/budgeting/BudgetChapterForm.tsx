"use client";

import React, { useMemo, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  PlusCircle,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/lib/utils";

import { NewBudgetFormValues } from "@/schemas/budget-schema";
import { Article } from "@/schemas/article-schema";
import BudgetServiceRow from "./BudgetServiceRow";
import { toast } from "sonner";

interface BudgetChapterFormProps {
  form: UseFormReturn<NewBudgetFormValues>;
  isApproved: boolean;
  chapterIndex: number;
  chapterId: string;
  chapterFieldsLength: number;
  articles: Article[];
  handleAddService: (chapterIndex: number) => void;
  handleRemoveService: (
    chapterIndex: number,
    itemIndex: number
  ) => void;
  handleDuplicateService: (
    chapterIndex: number,
    itemIndex: number
  ) => void;
  removeChapter: (index: number) => void;
  moveChapter: (from: number, to: number) => void;
  userCompanyId: string | null;
}

const BudgetChapterForm: React.FC<
  BudgetChapterFormProps
> = ({
  form,
  isApproved,
  chapterIndex,
  chapterId,
  chapterFieldsLength,
  articles,
  handleAddService,
  handleRemoveService,
  handleDuplicateService,
  removeChapter,
  moveChapter,
  userCompanyId,
}) => {
  const chapterItems =
    form.watch(`chapters.${chapterIndex}.items`) ?? [];

  const serviceInputRef = useRef<HTMLInputElement>(null);

  const isChapterValid = useMemo(() => {
    if (chapterItems.length === 0) return false;

    return chapterItems.every(
      (item) =>
        Boolean(item.servico) &&
        Number(item.quantidade) > 0 &&
        Number(item.preco_unitario) > 0
    );
  }, [chapterItems]);

  const handleAddServiceAndFocus = () => {
    handleAddService(chapterIndex);

    // Aguarda render da nova linha
    setTimeout(() => {
      serviceInputRef.current?.focus();
    }, 100);
  };

  const handleRemoveChapter = () => {
    const confirmed = window.confirm(
      "Tem certeza que deseja eliminar este capítulo e todos os seus serviços?"
    );

    if (!confirmed) return;

    removeChapter(chapterIndex);
    toast.success("Capítulo removido com sucesso!");
  };

  return (
    <AccordionItem value={chapterId}>
      <AccordionTrigger asChild>
        <div className="flex w-full items-center justify-between py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">
              {form.watch(
                `chapters.${chapterIndex}.codigo`
              )}
              .{" "}
              {form.watch(
                `chapters.${chapterIndex}.nome`
              )}
            </span>

            <Badge variant="secondary">
              {chapterItems.length} serviços
            </Badge>

            {chapterItems.length > 0 && (
              <span
                className={cn(
                  "ml-2 flex items-center gap-1 text-sm",
                  isChapterValid
                    ? "text-green-600"
                    : "text-orange-500"
                )}
              >
                {isChapterValid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {isChapterValid
                  ? "Capítulo válido"
                  : "Serviços incompletos"}
              </span>
            )}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <div className="p-4 space-y-4 rounded-md border bg-muted/20">
          {/* DADOS DO CAPÍTULO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={`chapters.${chapterIndex}.codigo`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Código do Capítulo *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isApproved}
                      placeholder="Ex: 01"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`chapters.${chapterIndex}.nome`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nome do Capítulo *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isApproved}
                      placeholder="Ex: Fundações"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`chapters.${chapterIndex}.observacoes`}
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>
                    Observações
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      disabled={isApproved}
                      placeholder="Notas adicionais..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* AÇÕES DO CAPÍTULO */}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddServiceAndFocus}
              disabled={isApproved}
              aria-disabled={isApproved}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Serviço
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                chapterIndex > 0 &&
                moveChapter(
                  chapterIndex,
                  chapterIndex - 1
                )
              }
              disabled={
                chapterIndex === 0 || isApproved
              }
              aria-disabled={
                chapterIndex === 0 || isApproved
              }
            >
              <ChevronUp className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                chapterIndex <
                  chapterFieldsLength - 1 &&
                moveChapter(
                  chapterIndex,
                  chapterIndex + 1
                )
              }
              disabled={
                chapterIndex ===
                  chapterFieldsLength - 1 ||
                isApproved
              }
              aria-disabled={
                chapterIndex ===
                  chapterFieldsLength - 1 ||
                isApproved
              }
            >
              <ChevronDown className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemoveChapter}
              disabled={isApproved}
              aria-disabled={isApproved}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover Capítulo
            </Button>
          </div>

          <Separator />

          {/* SERVIÇOS */}
          {chapterItems.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nenhum serviço neste capítulo"
              description="Adicione serviços para detalhar este capítulo."
              buttonText="Adicionar Primeiro Serviço"
              onButtonClick={handleAddServiceAndFocus}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço *</TableHead>
                    <TableHead className="w-[80px]">
                      Qtd.
                    </TableHead>
                    <TableHead className="w-[80px]">
                      Un.
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      Preço Unit.
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      Custo Planeado
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      Material
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      Mão de Obra
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      Executado
                    </TableHead>
                    <TableHead className="w-[100px]">
                      Estado
                    </TableHead>
                    <TableHead className="w-[100px] text-right">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {chapterItems.map(
                    (item, itemIndex) => (
                      <BudgetServiceRow
                        key={item.id}
                        form={form}
                        isApproved={isApproved}
                        chapterIndex={chapterIndex}
                        itemIndex={itemIndex}
                        articles={articles}
                        handleRemoveService={
                          handleRemoveService
                        }
                        handleDuplicateService={
                          handleDuplicateService
                        }
                        focusRef={serviceInputRef}
                        userCompanyId={userCompanyId}
                      />
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default BudgetChapterForm;
