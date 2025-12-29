"use client";

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Article } from "@/schemas/article-schema";
import { Search, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmptyState from "@/components/EmptyState";

interface ArticleSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

const ArticleSelectDialog: React.FC<ArticleSelectDialogProps> = ({
  isOpen,
  onClose,
  articles,
  onSelectArticle,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredArticles = useMemo(() => {
    if (!normalizedSearch) return articles;

    return articles.filter((article) => {
      return (
        article.codigo?.toLowerCase().includes(normalizedSearch) ||
        article.descricao?.toLowerCase().includes(normalizedSearch) ||
        article.unidade?.toLowerCase().includes(normalizedSearch) ||
        article.tipo?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [articles, normalizedSearch]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const handleSelect = (article: Article) => {
    onSelectArticle(article);
    setSearchTerm("");
    onClose();
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setSearchTerm("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[800px] flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Selecionar Artigo</DialogTitle>
          <DialogDescription>
            Pesquise e selecione um artigo da sua base de dados.
          </DialogDescription>
        </DialogHeader>

        {/* SEARCH */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Pesquisar por código, descrição, unidade ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />

            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Limpar pesquisa"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                onClick={handleClearSearch}
              >
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        {/* LIST */}
        <ScrollArea className="flex-grow px-6 pb-6">
          {filteredArticles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[80px]">Unidade</TableHead>
                  <TableHead className="w-[80px]">Tipo</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Preço Unit.
                  </TableHead>
                  <TableHead className="w-[90px] text-center">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">
                      {article.codigo || "—"}
                    </TableCell>

                    <TableCell className="max-w-[300px] truncate">
                      {article.descricao || "—"}
                    </TableCell>

                    <TableCell>
                      {article.unidade || "—"}
                    </TableCell>

                    <TableCell className="capitalize">
                      {article.tipo || "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      {typeof article.preco_unitario === "number"
                        ? currencyFormatter.format(
                            article.preco_unitario
                          )
                        : "—"}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelect(article)}
                      >
                        Selecionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Search}
              title="Nenhum artigo encontrado"
              description="Tente ajustar os seus termos de pesquisa ou adicione novos artigos na Base de Artigos de Construção."
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleSelectDialog;
