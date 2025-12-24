"use client";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Category, Subcategory, Article } from "@/schemas/article-schema";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { nome: "01 – Trabalhos Preparatórios", descricao: "Atividades iniciais e de preparação do local da obra." },
  { nome: "02 – Demolições", descricao: "Remoção de estruturas existentes." },
  { nome: "03 – Movimento de Terras", descricao: "Escavações, aterros e nivelamento do terreno." },
  { nome: "04 – Estruturas", descricao: "Construção de fundações, pilares, vigas e lajes." },
  { nome: "05 – Alvenarias", descricao: "Construção de paredes e divisórias." },
  { nome: "06 – Coberturas", descricao: "Instalação de telhados e sistemas de impermeabilização." },
  { nome: "07 – Revestimentos", descricao: "Aplicação de materiais de acabamento em superfícies." },
  { nome: "08 – Canalizações", descricao: "Instalação de sistemas de água e esgoto." },
  { nome: "09 – Eletricidade", descricao: "Instalação de sistemas elétricos." },
  { nome: "10 – AVAC", descricao: "Instalação de sistemas de aquecimento, ventilação e ar condicionado." },
  { nome: "11 – Carpintarias", descricao: "Instalação de elementos de madeira, como portas e armários." },
  { nome: "12 – Acabamentos", descricao: "Pinturas, pavimentos e outros detalhes finais." },
  { nome: "13 – Arranjos Exteriores", descricao: "Paisagismo, pavimentos exteriores e infraestruturas." },
];

export async function ensureDefaultCategories(companyId: string) {
  if (!companyId) {
    console.error("ensureDefaultCategories: companyId is missing.");
    return;
  }

  try {
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('nome')
      .eq('company_id', companyId);

    if (fetchError) {
      throw new Error(`Erro ao verificar categorias existentes: ${fetchError.message}`);
    }

    const existingCategoryNames = new Set(existingCategories.map(cat => cat.nome));
    const categoriesToInsert = DEFAULT_CATEGORIES.filter(
      defaultCat => !existingCategoryNames.has(defaultCat.nome)
    ).map(defaultCat => ({
      ...defaultCat,
      id: uuidv4(), // Generate UUID for new categories
      company_id: companyId,
    }));

    if (categoriesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('categories')
        .insert(categoriesToInsert);

      if (insertError) {
        throw new Error(`Erro ao inserir categorias padrão: ${insertError.message}`);
      }
      toast.success(`${categoriesToInsert.length} categorias padrão adicionadas!`);
    } else {
      console.log("Todas as categorias padrão já existem.");
    }
  } catch (error: any) {
    console.error("Erro em ensureDefaultCategories:", error);
    toast.error(`Falha ao configurar categorias padrão: ${error.message}`);
  }
}

// Updated DEFAULT_ARTICLES_CSV with 'Código' and 'Fonte de Referência' columns
const DEFAULT_ARTICLES_CSV = `Categoria;Subcategoria;Código;Serviço;Tipo;Unidade;Preço Min;Preço Max;Média Estimada;Fonte de Referência;Notas
Mão de Obra (Geral);;MO-001;Oficial de Construção (Pedreiro);Mão de Obra;Hora;30.50;60.00;30.50;Tabela Salarial;Valor base oficial vs mercado urbano
Mão de Obra (Geral);;MO-002;Servente / Ajudante;Mão de Obra;Hora;20.00;30.00;20.00;Tabela Salarial;Pressionado pelo SMN
Mão de Obra (Geral);;MO-003;Ladrilhador / Azulejador;Mão de Obra;Hora;30.00;40.00;35.00;Mercado;Frequentemente cobrado por m2
Mão de Obra (Geral);;MO-004;Pintor;Mão de Obra;Hora;20.00;35.00;25.00;Mercado;
Mão de Obra (Técnica);;MO-005;Eletricista Certificado;Mão de Obra;Hora;25.00;70.00;45.00;Mercado;Urgências podem ir a 150€
Mão de Obra (Técnica);;MO-006;Canalizador / Picheleiro;Mão de Obra;Hora;25.00;45.00;35.00;Mercado;Urgências 80€-150€
Mão de Obra (Técnica);;MO-007;Técnico AVAC / Gás;Mão de Obra;Hora;35.00;50.00;42.50;Mercado;Alta procura
Logística;;LOG-001;Taxa de Deslocação (Urbana);Serviço;Un;30.00;60.00;45.00;Custo Interno;Lisboa/Porto/Leiria
Logística;;LOG-002;Ajudas de Custo (Viatura);Despesa;Km;0.36;0.36;0.36;Valor Fiscal;Valor fiscal referência
Estrutura e Alvenaria;;EST-001;Betão Armado (Colocado);Fornecimento e Aplicação;m3;350.00;500.00;425.00;Fornecedor;Inclui aço/cofragem/betão
Estrutura e Alvenaria;;EST-002;Cofragem (Montagem);Mão de Obra;m2;20.00;60.00;40.00;Mercado;Varia com complexidade
Estrutura e Alvenaria;;EST-003;Alvenaria Tijolo Cerâmico;Fornecimento e Aplicação;m2;35.00;50.00;42.50;Fornecedor;Tijolo 11/15
Estrutura e Alvenaria;;EST-004;Bloco Térmico/Acústico;Fornecimento e Aplicação;m2;55.00;75.00;65.00;Fornecedor;
Estrutura e Alvenaria;;EST-005;Reboco Projetado (Exterior);Fornecimento e Aplicação;m2;25.00;35.00;30.00;Mercado;
Estrutura e Alvenaria;;EST-006;Estuque Projetado (Interior);Fornecimento e Aplicação;m2;18.00;28.00;23.00;Mercado;Acabamento liso
Estrutura e Alvenaria;;EST-007;Muro de Blocos (Simples);Fornecimento e Aplicação;m2;40.00;45.00;42.50;Mercado;Bloco cimento
Escavação;;ESC-001;Escavação em Terra Branda;Serviço;m3;15.00;30.00;22.50;Máquina;Máquina
Escavação;;ESC-002;Movimentação de Terras (Geral);Serviço;m3;15.00;50.00;27.50;Máquina;Inclui transporte vazadouro
Pavimentos e Revestimentos;;PAV-001;Assentamento Cerâmico (<60x60);Mão de Obra;m2;35.00;55.00;45.00;Mercado;Exclui materiais
Pavimentos e Revestimentos;;PAV-002;Assentamento Grandes Formatos;Mão de Obra;m2;45.00;70.00;57.50;Mercado;Exclui materiais
Pavimentos e Revestimentos;;PAV-003;Fornecimento e Aplicação Cerâmico;Fornecimento e Aplicação;m2;50.00;120.00;85.00;Fornecedor;Material gama média
Pavimentos e Revestimentos;;PAV-004;Aplicação Soleiras/Peitoris;Mão de Obra;Un;80.00;80.00;80.00;Mercado;Até 3ml
Pavimentos e Revestimentos;;PAV-005;Calçada Portuguesa;Mão de Obra;m2;35.00;90.00;62.50;Mercado;Depende do desenho
Pavimentos e Revestimentos;;PAV-006;Pavimento Flutuante (Aplicação);Mão de Obra;m2;6.00;10.00;8.00;Mercado;Sem regularização base
Pavimentos e Revestimentos;;PAV-007;Pavimento Flutuante (Regularização);Mão de Obra;m2;10.00;25.00;17.50;Mercado;Se base necessitar nivelamento
Pladur e Tetos Falsos;;PLA-001;Teto Falso (Standard);Fornecimento e Aplicação;m2;28.00;35.00;31.50;Fornecedor;Perfileria + Placa
Pladur e Tetos Falsos;;PLA-002;Teto Falso (Hidrófugo);Fornecimento e Aplicação;m2;32.00;40.00;36.00;Fornecedor;WC/Cozinhas
Pladur e Tetos Falsos;;PLA-003;Divisória Simples;Fornecimento e Aplicação;m2;35.00;45.00;40.00;Fornecedor;
Pladur e Tetos Falsos;;PLA-004;Divisória com Isolamento (Lã);Fornecimento e Aplicação;m2;45.00;55.00;50.00;Fornecedor;
Isolamento (Capoto);;ISO-001;Sistema ETICS (EPS 60mm);Fornecimento e Aplicação;m2;52.00;58.00;55.00;Fornecedor;Chave na mão
Isolamento (Capoto);;ISO-002;Sistema ETICS (EPS 80mm);Fornecimento e Aplicação;m2;58.00;72.00;65.00;Fornecedor;Chave na mão
Pinturas;;PIN-001;Pintura Interior (Paredes);Mão de Obra;m2;4.00;8.00;6.00;Mercado;Só aplicação
Pinturas;;PIN-002;Pintura Interior (Paredes + Tinta);Fornecimento e Aplicação;m2;8.00;20.00;14.00;Fornecedor;Inclui tinta mate
Pinturas;;PIN-003;Pintura Tetos;Fornecimento e Aplicação;m2;8.00;14.00;11.00;Fornecedor;
Pinturas;;PIN-004;Pintura Exterior (Fachadas);Fornecimento e Aplicação;m2;13.00;25.00;19.00;Mercado;Pode exigir andaime extra
Pinturas;;PIN-005;Lacagem Portas (Unidade);Serviço;Un;60.00;150.00;105.00;Mercado;Aro + Folha
Carpintaria;;CAR-001;Instalação Porta Interior (Kit);Mão de Obra;Un;65.00;100.00;82.50;Mercado;Apenas montagem
Carpintaria;;CAR-002;Porta Interior (Fornecimento + Montagem);Fornecimento e Aplicação;Un;300.00;600.00;450.00;Fornecedor;Porta standard
Instalações Elétricas;;ELE-001;Ponto de Luz / Tomada;Fornecimento e Aplicação;Un;45.00;65.00;55.00;Mercado;Abertura roço e aparelhagem
Instalações Elétricas;;ELE-002;Quadro Elétrico (Substituição);Serviço;Un;150.00;400.00;275.00;Mercado;Residencial
Instalações Elétricas;;ELE-003;Renovação T2/T3;Serviço;Verba;2500.00;5000.00;3750.00;Mercado;Projeto global
Canalização;;CAN-001;Ponto de Água / Esgoto;Fornecimento e Aplicação;Un;150.00;250.00;200.00;Mercado;Por dispositivo
Canalização;;CAN-002;Renovação WC Completo;Fornecimento e Aplicação;Verba;1500.00;2500.00;2000.00;Mercado;Infraestruturas apenas
Canalização;;CAN-003;Substituição Torneira;Mão de Obra;Un;30.00;50.00;40.00;Mercado;Mais deslocação
Canalização;;CAN-004;Instalação Louça Sanitária;Mão de Obra;Un;35.00;70.00;52.50;Mercado;Por peça (sanita/bidé)
Telhados;;TEL-001;Estrutura Madeira + Telha;Fornecimento e Aplicação;m2;50.00;90.00;70.00;Fornecedor;Substituição
Telhados;;TEL-002;Limpeza de Telhado;Serviço;m2;3.00;6.00;4.50;Mercado;Lavagem alta pressão
Aluguer Equipamento;;ALU-001;Retroescavadora;Serviço;Hora;35.00;50.00;42.50;Fornecedor;Com manobrador
Aluguer Equipamento;;ALU-002;Andaimes;Serviço;m2/dia;0.05;0.15;0.10;Fornecedor;Grandes áreas/longo prazo
`;

const mapPortugueseTypeToEnum = (type: string): Article['tipo'] => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("serviço") || lowerType.includes("fornecimento e aplicação") || lowerType.includes("aluguer")) return "servico";
  if (lowerType.includes("material") || lowerType.includes("despesa")) return "material"; // Mapping 'Despesa' to 'material' as a generic item
  if (lowerType.includes("mão de obra") || lowerType.includes("equipa") || lowerType.includes("equipe")) return "equipe";
  return "material"; // Default to material if not recognized
};

export async function seedDefaultArticles(companyId: string) {
  if (!companyId) {
    console.error("seedDefaultArticles: companyId is missing.");
    return;
  }

  try {
    // Check if articles have already been seeded for this company
    const { data: companyData, error: companyFetchError } = await supabase
      .from('companies')
      .select('default_articles_seeded')
      .eq('id', companyId)
      .single();

    if (companyFetchError) {
      throw new Error(`Erro ao verificar estado de seeding da empresa: ${companyFetchError.message}`);
    }

    if (companyData?.default_articles_seeded) {
      console.log("Artigos padrão já foram carregados para esta empresa.");
      return;
    }

    // Parse the CSV content
    const results = Papa.parse(DEFAULT_ARTICLES_CSV, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';', // Specify semicolon delimiter
    });

    const rows = results.data as any[];
    if (rows.length === 0) {
      console.warn("O CSV de artigos padrão está vazio ou não contém dados válidos.");
      return;
    }

    // Fetch existing categories and subcategories for the company
    const { data: existingCategories, error: catError } = await supabase
      .from('categories')
      .select('id, nome')
      .eq('company_id', companyId);
    if (catError) throw new Error(`Erro ao carregar categorias existentes: ${catError.message}`);
    const categoryMap = new Map<string, string>(existingCategories.map(c => [c.nome.toLowerCase(), c.id]));

    const { data: existingSubcategories, error: subCatError } = await supabase
      .from('subcategories')
      .select('id, nome, categoria_id')
      .eq('company_id', companyId);
    if (subCatError) throw new Error(`Erro ao carregar subcategorias existentes: ${subCatError.message}`);
    const subcategoryMap = new Map<string, Subcategory>(existingSubcategories.map(sc => [`${sc.categoria_id}-${sc.nome.toLowerCase()}`, sc]));

    const articlesToInsert: Article[] = [];
    let categoriesCreated = 0;
    let subcategoriesCreated = 0;

    for (const row of rows) {
      try {
        const categoriaNome = row["Categoria"]?.trim();
        const subcategoriaNome = row["Subcategoria"]?.trim();
        const codigo = row["Código"]?.trim();
        const descricao = row["Serviço"]?.trim(); // Mapped from "Serviço"
        const unidade = row["Unidade"]?.trim();
        const precoUnitario = parseFloat(row["Média Estimada"]); // Mapped from "Média Estimada"
        const tipo = mapPortugueseTypeToEnum(row["Tipo"]?.trim() || "");
        const fonteReferencia = row["Fonte de Referência"]?.trim();
        const observacoes = row["Notas"]?.trim(); // Mapped from "Notas"

        if (!codigo || !descricao || !unidade || isNaN(precoUnitario) || precoUnitario < 0 || !tipo || !fonteReferencia || !categoriaNome) {
          console.warn(`Skipping row due to incomplete/invalid data: ${JSON.stringify(row)}`);
          continue;
        }

        let categoryId: string | null = categoryMap.get(categoriaNome.toLowerCase()) || null;
        if (!categoryId) {
          const { data: newCat, error: insertCatError } = await supabase
            .from('categories')
            .insert({ id: uuidv4(), company_id: companyId, nome: categoriaNome, descricao: categoriaNome })
            .select('id')
            .single();
          if (insertCatError) throw new Error(`Erro ao criar categoria '${categoriaNome}': ${insertCatError.message}`);
          categoryId = newCat.id;
          categoryMap.set(categoriaNome.toLowerCase(), categoryId);
          categoriesCreated++;
        }

        let subcategoryId: string | null = null;
        if (subcategoriaNome && categoryId) {
          const subcategoryKey = `${categoryId}-${subcategoriaNome.toLowerCase()}`;
          const existingSub = subcategoryMap.get(subcategoryKey);
          if (existingSub) {
            subcategoryId = existingSub.id;
          } else {
            const { data: newSubCat, error: insertSubCatError } = await supabase
              .from('subcategories')
              .insert({ id: uuidv4(), company_id: companyId, categoria_id: categoryId, nome: subcategoriaNome, descricao: subcategoriaNome })
              .select('id')
              .single();
            if (insertSubCatError) throw new Error(`Erro ao criar subcategoria '${subcategoriaNome}' para categoria '${categoriaNome}': ${insertSubCatError.message}`);
            subcategoryId = newSubCat.id;
            subcategoryMap.set(subcategoryKey, { id: subcategoryId, nome: subcategoriaNome, categoria_id: categoryId });
            subcategoriesCreated++;
          }
        }

        articlesToInsert.push({
          id: uuidv4(),
          company_id: companyId,
          codigo,
          descricao,
          unidade,
          categoria_id: categoryId,
          subcategoria_id: subcategoryId,
          tipo,
          preco_unitario: precoUnitario,
          fonte_referencia: fonteReferencia,
          observacoes,
        });
      } catch (rowError: any) {
        console.error(`Erro ao processar linha do CSV: ${rowError.message} - Row: ${JSON.stringify(row)}`);
      }
    }

    if (articlesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('articles')
        .insert(articlesToInsert);

      if (insertError) {
        throw new Error(`Erro ao inserir artigos padrão: ${insertError.message}`);
      }
      toast.success(`${articlesToInsert.length} artigos padrão carregados!`);
    } else {
      console.log("Nenhum artigo padrão válido para inserir.");
    }

    // Mark default articles as seeded for this company
    const { error: updateCompanyError } = await supabase
      .from('companies')
      .update({ default_articles_seeded: true })
      .eq('id', companyId);

    if (updateCompanyError) {
      console.error("Erro ao atualizar estado 'default_articles_seeded':", updateCompanyError);
    }

    console.log(`Seeding de artigos padrão concluído para a empresa ${companyId}. Categorias criadas: ${categoriesCreated}, Subcategorias criadas: ${subcategoriesCreated}, Artigos inseridos: ${articlesToInsert.length}.`);

  } catch (error: any) {
    console.error("Erro em seedDefaultArticles:", error);
    toast.error(`Falha ao carregar artigos padrão: ${error.message}`);
  }
}