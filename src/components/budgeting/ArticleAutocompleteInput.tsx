"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
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

const ArticleAutocompleteInput: React.FC<ArticleAutocompleteInputProps> = ({
  value,
  onValueChange,
  onSelectArticle,
  userCompanyId,
  disabled,
  placeholder = "Pesquisar serviço ou material...",
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [suggestions, setSuggestions] = useState<Article[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        setSuggestions([]);
        return;
      }
      if (!userCompanyId) return;

      setIsLoadingSuggestions(true);
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('company_id', userCompanyId)
        .ilike('descricao', `%${debouncedSearchTerm}%`) // Case-insensitive search
        .limit(10);

      if (error) {
        console.error("Erro ao buscar sugestões de artigos:", error);
        toast.error("Erro ao buscar sugestões de artigos.");
        setSuggestions([]);
      } else {
        setSuggestions(data || []);
      }
      setIsLoadingSuggestions(false);
    };

    fetchSuggestions();
  }, [debouncedSearchTerm, userCompanyId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onValueChange(newValue);
    setOpen(true); // Open popover when typing
  };

  const handleSelectItem = (article: Article) => {
    onSelectArticle(article);
    setSearchTerm(article.descricao);
    onValueChange(article.descricao);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="h-10 px-3 py-2"
        />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Pesquisar artigo..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="h-9"
          />
          <CommandList>
            {isLoadingSuggestions && <CommandEmpty>A carregar sugestões...</CommandEmpty>}
            {!isLoadingSuggestions && suggestions.length === 0 && (
              <CommandEmpty>Nenhum artigo encontrado.</CommandEmpty>
            )}
            <CommandGroup>
              {suggestions.map((article) => (
                <CommandItem
                  key={article.id}
                  value={article.descricao}
                  onSelect={() => handleSelectItem(article)}
                >
                  {article.descricao} ({article.codigo}) - {article.unidade} - {article.preco_unitario}€
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ArticleAutocompleteInput;