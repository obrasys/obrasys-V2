import { generateCoverPage } from "./base-template";

export const generateComplianceChecklistReportContent = (reportData: any, companyName: string, currentDate: string) => {
  // In a real scenario, reportData would contain the checklist items and their status
  return `
    ${generateCoverPage("Relatório de Checklist de Conformidade", companyName, `Data de Geração: ${currentDate}`)}

    <h1>Relatório de Checklist de Conformidade</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
    </div>
    <h2>Estado das Verificações de Conformidade</h2>
    <p>Este relatório apresentaria o estado atual do checklist de conformidade.</p>
    <div class="summary">
        <p><strong>Itens Concluídos:</strong> 20/25 (Exemplo)</p>
        <p><strong>Conformidade Geral:</strong> 80% (Exemplo)</p>
    </div>
  `;
};