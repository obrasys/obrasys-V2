import { formatCurrency } from "@/utils/formatters";
import { generateCoverPage } from "./base-template";
import { Article } from "@/schemas/article-schema";

export const generateArticlesCatalogReportContent = (reportData: any, companyName: string, currentDate: string) => {
  const { articles } = reportData;
  const totalArticles = articles.length;
  const averagePrice = totalArticles > 0 ? articles.reduce((sum: number, article: Article) => sum + article.preco_unitario, 0) / totalArticles : 0;

  return `
    ${generateCoverPage("Relatório de Catálogo de Artigos", companyName, `Data de Geração: ${currentDate}`)}

    <h1>Relatório de Catálogo de Artigos</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
    </div>
    <h2>Lista Completa de Artigos de Trabalho</h2>
    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Unidade</th>
                <th>Tipo</th>
                <th style="text-align: right;">Preço Unitário</th>
                <th>Categoria</th>
            </tr>
        </thead>
        <tbody>
            ${articles.map((article: Article) => `
              <tr>
                <td>${article.codigo}</td>
                <td>${article.descricao}</td>
                <td>${article.unidade}</td>
                <td>${article.tipo}</td>
                <td style="text-align: right;">${formatCurrency(article.preco_unitario)}</td>
                <td>${(article as any).categories?.nome || 'N/A'}</td>
              </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="summary">
        <p><strong>Total de Artigos:</strong> ${totalArticles}</p>
        <p><strong>Preço Médio por Artigo:</strong> ${formatCurrency(averagePrice)}</p>
    </div>
  `;
};