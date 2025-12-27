import { generateCoverPage } from "./base-template";

export const generatePriceHistoryReportContent = (reportData: any, companyName: string, currentDate: string) => {
  return `
    ${generateCoverPage("Relatório de Histórico de Preços", companyName, `Data de Geração: ${currentDate}`)}

    <h1>Relatório de Histórico de Preços</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
    </div>
    <h2>Evolução dos Preços dos Artigos</h2>
    <p>Este relatório requer dados de histórico de preços que ainda não estão implementados.</p>
    <div class="summary">
        <p><strong>Artigo Mais Volátil:</strong> Cimento (Exemplo)</p>
        <p><strong>Aumento Médio Anual:</strong> 5% (Exemplo)</p>
    </div>
  `;
};