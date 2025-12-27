import { generateCoverPage } from "./base-template";

export const generateLivroDeObraReportContent = (reportData: any, companyName: string, currentDate: string) => {
  // In a real scenario, reportData would contain a summary of Livros de Obra
  return `
    ${generateCoverPage("Relatório do Livro de Obra Digital", companyName, `Data de Geração: ${currentDate}`)}

    <h1>Relatório do Livro de Obra Digital</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
    </div>
    <h2>Resumo dos Livros de Obra</h2>
    <p>Este relatório apresentaria um resumo dos livros de obra existentes, com links para os detalhes.</p>
    <div class="summary">
        <p><strong>Livros de Obra Ativos:</strong> 3 (Exemplo)</p>
        <p><strong>Última Atualização:</strong> ${currentDate}</p>
    </div>
  `;
};