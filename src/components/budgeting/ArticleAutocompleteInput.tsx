"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Article } from "@/schemas/article-schema";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface ArticleAutocompleteInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSelectArticle: (article: Article) => void;
  userCompanyId: string;
  disabled?: boolean;
  placeholder?: string;
}

const MIN_CHARS = 2;
const LIMIT = 10;

const ArticleAutocompleteInput: React.FC<ArticleAutocompleteInputProps> = ({
  value,
  onValueChange,
  onSelectArticle,
  userCompanyId,
  disabled,
  placeholder = "Pesquisar serviço ou material...",
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value ?? "");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [suggestions, setSuggestions] = useState<Article[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Keep local input synced with external value changes
  useEffect(() => {
    setSearchTerm(value ?? "");
  }, [value]);

  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchSuggestions = async () => {
      const term = (debouncedSearchTerm ?? "").trim();

      if (!userCompanyId) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      if (!term || term.length < MIN_CHARS) {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
        // Fecha se o utilizador apagou / ficou curto demais
        setOpen(false);
        return;
      }

      setIsLoadingSuggestions(true);

      const { data, error } = await supabase
        .from("articles")
        // Evitar select('*') para performance
        .select("id, descricao, codigo, unidade, preco_unitario, company_id")
        .eq("company_id", userCompanyId)
        .ilike("descricao", `%${term}%`)
        .limit(LIMIT);

      if (cancelled) return;

      if (error) {
        console.error("Erro ao buscar sugestões de artigos:", error);
        toast.error("Erro ao buscar sugestões de artigos.");
        setSuggestions([]);
        setOpen(true); // mantém aberto para feedback "Nenhum artigo..." / erro
      } else {
        setSuggestions(data ?? []);
        setOpen(true); // abre quando tem term válido
      }

      setIsLoadingSuggestions(false);
    };

    fetchSuggestions();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm, userCompanyId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    setSearchTerm(newValue);
    onValueChange(newValue);

    // UX: só abrir se já tiver um termo minimamente pesquisável
    if (newValue.trim().length >= MIN_CHARS) {
      setOpen(true);
    } else {
      setOpen(false);
      setSuggestions([]);
    }
  };

  const handleSelectItem = (article: Article) => {
    onSelectArticle(article);

    const descricao = article.descricao ?? "";
    setSearchTerm(descricao);
    onValueChange(descricao);

    setOpen(false);
  };

  const handleFocus = () => {
    if (disabled) return;
    if (searchTerm.trim().length >= MIN_CHARS && (suggestions.length > 0 || isLoadingSuggestions)) {
      setOpen(true);
    }
  };

  const handleBlur = () => {
    // Popover lida bem com cliques internos, mas em alguns browsers blur pode fechar cedo.
    // Mantemos comportamento padrão via onOpenChange.
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("h-10 px-3 py-2", disabled && "opacity-70")}
          autoComplete="off"
        />
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandList>
            {isLoadingSuggestions && (
              <CommandEmpty>A carregar sugestões...</CommandEmpty>
            )}

            {!isLoadingSuggestions && suggestions.length === 0 && (
              <CommandEmpty>Nenhum artigo encontrado.</CommandEmpty>
            )}

            <CommandGroup>
              {suggestions.map((article) => {
                const preco = typeof article.preco_unitario === "number"
                  ? currencyFormatter.format(article.preco_unitario)
                  : "—";

                return (
                  <CommandItem
                    key={article.id}
                    value={article.descricao ?? ""}
                    onSelect={() => handleSelectItem(article)}
                    className="cursor-pointer"
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate">
                          {article.descricao}{" "}
                          <span className="text-muted-foreground">
                            ({article.codigo || "—"})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          Unidade: {article.unidade || "—"}
                        </div>
                      </div>

                      <div className="shrink-0 text-sm font-medium">
                        {preco}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ArticleAutocompleteInput;
