"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  FileText,
  DollarSign,
  HardHat,
  ClipboardList,
  Scale,
  BellRing,
  CheckSquare,
  BookText,
  Wallet,
  ReceiptText,
  TrendingUp,
  History,
  Archive,
  Printer, // Importar o ícone da impressora
} from "lucide-react";
import NavButton from "@/components/NavButton";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const ReportsPage = () => {
  const generateReportContent = (reportName: string, data: any) => {
    const currentDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt });
    const currentMonthYear = format(new Date(), "MMMM yyyy", { locale: pt });
    const companyName = "Obra Sys Construções"; // Placeholder
    const financialResponsible = "João Silva"; // Placeholder
    const projectName = "Projeto Residencial Alfa"; // Placeholder for project report
    const clientName = "Cliente Exemplo, Lda."; // Placeholder for project report
    const projectPeriod = "01/01/2024 - 31/12/2024"; // Placeholder for project report

    let content = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Relatório: ${reportName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
              body { font-family: 'Red Hat Display', sans-serif; margin: 40px; color: #333; line-height: 1.6; }
              h1 { color: #00679d; text-align: center; margin-bottom: 30px; }
              h2 { color: #00679d; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 40px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: 600; }
              .header-info { margin-bottom: 30px; background-color: #f9f9f9; padding: 15px; border-radius: 8px; }
              .header-info p { margin: 8px 0; font-size: 0.95em; }
              .summary { margin-top: 30px; padding: 15px; background-color: #e6f7ff; border-left: 5px solid #00679d; border-radius: 8px; }
              .summary p { margin: 5px 0; font-weight: 500; }
              .footer { margin-top: 50px; font-size: 0.75em; text-align: center; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
              .no-print { position: fixed; top: 20px; right: 20px; z-index: 1000; }
              .cover-page { text-align: center; page-break-after: always; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; }
              .cover-page h1 { font-size: 3em; margin-bottom: 20px; }
              .cover-page p { font-size: 1.5em; margin-bottom: 10px; }
              @media print {
                  .no-print { display: none; }
              }
          </style>
      </head>
      <body>
          <div class="no-print">
            <button onclick="window.print()" style="padding: 10px 20px; background-color: #00679d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Imprimir</button>
            <button onclick="window.close()" style="padding: 10px 20px; background-color: #ccc; color: #333; border: none; border-radius: 5px; cursor: pointer;">Fechar</button>
          </div>
    `;

    if (reportName === "Relatório Financeiro Mensal") {
      content += `
        <div class="cover-page">
            <h1>Relatório Financeiro Mensal</h1>
            <p><strong>${companyName}</strong></p>
            <p>Mês / Ano: ${currentMonthYear}</p>
            <p>Responsável Financeiro: ${financialResponsible}</p>
        </div>

        <h1>Relatório Financeiro Mensal</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Mês / Ano:</strong> ${currentMonthYear}</p>
        </div>

        <h2>Resumo Executivo</h2>
        <div class="summary">
            <p><strong>Receita total do mês:</strong> 15.000,00 €</p>
            <p><strong>Despesas totais:</strong> 10.000,00 €</p>
            <p><strong>Resultado (Lucro / Prejuízo):</strong> 5.000,00 € (Lucro)</p>
            <p><strong>Comparação com mês anterior:</strong> +10%</p>
        </div>

        <h2>Receitas</h2>
        <table>
            <thead>
                <tr>
                    <th>Fonte</th>
                    <th style="text-align: right;">Valor (€)</th>
                    <th style="text-align: right;">%</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Serviços</td><td style="text-align: right;">12.000,00 €</td><td style="text-align: right;">80%</td></tr>
                <tr><td>Produtos</td><td style="text-align: right;">2.000,00 €</td><td style="text-align: right;">13.3%</td></tr>
                <tr><td>Assinaturas</td><td style="text-align: right;">1.000,00 €</td><td style="text-align: right;">6.7%</td></tr>
                <tr><td><strong>Total</strong></td><td style="text-align: right;"><strong>15.000,00 €</strong></td><td style="text-align: right;"><strong>100%</strong></td></tr>
            </tbody>
        </table>

        <h2>Despesas</h2>
        <table>
            <thead>
                <tr>
                    <th>Categoria</th>
                    <th style="text-align: right;">Valor (€)</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Pessoal</td><td style="text-align: right;">5.000,00 €</td></tr>
                <tr><td>Marketing</td><td style="text-align: right;">1.000,00 €</td></tr>
                <tr><td>Tecnologia</td><td style="text-align: right;">1.500,00 €</td></tr>
                <tr><td>Operacionais</td><td style="text-align: right;">2.000,00 €</td></tr>
                <tr><td>Impostos</td><td style="text-align: right;">500,00 €</td></tr>
                <tr><td><strong>Total</strong></td><td style="text-align: right;"><strong>10.000,00 €</strong></td></tr>
            </tbody>
        </table>

        <h2>Resultado Financeiro</h2>
        <div class="summary">
            <p><strong>Lucro bruto:</strong> 7.000,00 €</p>
            <p><strong>Lucro líquido:</strong> 5.000,00 €</p>
            <p><strong>Margem (%):</strong> 33.3%</p>
        </div>

        <h2>Observações</h2>
        <p>
            <ul>
                <li>Custos fora do padrão: Aumento de 20% em despesas operacionais devido a manutenção inesperada de equipamento.</li>
                <li>Receitas extraordinárias: Nenhuma.</li>
                <li>Alertas: A margem de lucro está estável, mas o aumento das despesas operacionais deve ser monitorizado.</li>
            </ul>
        </p>
      `;
    } else if (reportName === "Relatório de Fluxo de Caixa") {
      content += `
        <div class="cover-page">
            <h1>Relatório de Fluxo de Caixa</h1>
            <p><strong>${companyName}</strong></p>
            <p>Mês / Ano: ${currentMonthYear}</p>
            <p>Responsável Financeiro: ${financialResponsible}</p>
        </div>

        <h1>Relatório de Fluxo de Caixa</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Mês / Ano:</strong> ${currentMonthYear}</p>
        </div>

        <h2>Entradas</h2>
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Origem</th>
                    <th style="text-align: right;">Valor (€)</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>05/07/2024</td><td>Pagamento Cliente A (Fatura INV-2024-001)</td><td style="text-align: right;">1.500,00 €</td></tr>
                <tr><td>12/07/2024</td><td>Pagamento Cliente B (Adiantamento)</td><td style="text-align: right;">1.000,00 €</td></tr>
                <tr><td>18/07/2024</td><td>Empréstimo Bancário</td><td style="text-align: right;">5.000,00 €</td></tr>
            </tbody>
        </table>

        <h2>Saídas</h2>
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Destino</th>
                    <th style="text-align: right;">Valor (€)</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>03/07/2024</td><td>Salários (Junho)</td><td style="text-align: right;">5.000,00 €</td></tr>
                <tr><td>08/07/2024</td><td>Fornecedor X (Materiais)</td><td style="text-align: right;">350,00 €</td></tr>
                <tr><td>15/07/2024</td><td>Renda Escritório</td><td style="text-align: right;">800,00 €</td></tr>
            </tbody>
        </table>

        <h2>Resumo</h2>
        <div class="summary">
            <p><strong>Saldo inicial:</strong> 2.000,00 €</p>
            <p><strong>Total entradas:</strong> 7.500,00 €</p>
            <p><strong>Total saídas:</strong> 6.150,00 €</p>
            <p><strong>Saldo final:</strong> 3.350,00 €</p>
        </div>

        <h2>Previsão Próximos 30/60/90 dias</h2>
        <table>
            <thead>
                <tr>
                    <th>Período</th>
                    <th style="text-align: right;">Saldo Previsto (€)</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Próximos 30 dias</td><td style="text-align: right;">+1.500,00 €</td></tr>
                <tr><td>Próximos 60 dias</td><td style="text-align: right;">+2.800,00 €</td></tr>
                <tr><td>Próximos 90 dias</td><td style="text-align: right;">+4.000,00 €</td></tr>
            </tbody>
        </table>
      `;
    } else if (reportName === "Relatório Financeiro por Projeto / Obra") {
      content += `
        <div class="cover-page">
            <h1>Relatório Financeiro por Projeto / Obra</h1>
            <p><strong>${companyName}</strong></p>
            <p>Projeto: ${projectName}</p>
            <p>Período: ${projectPeriod}</p>
        </div>

        <h1>Relatório Financeiro por Projeto / Obra</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Projeto / Obra:</strong> ${projectName}</p>
            <p><strong>Cliente:</strong> ${clientName}</p>
            <p><strong>Período:</strong> ${projectPeriod}</p>
        </div>

        <h2>Orçamento Previsto</h2>
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th style="text-align: right;">Valor (€)</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Fundações</td><td style="text-align: right;">10.000,00 €</td></tr>
                <tr><td>Estruturas</td><td style="text-align: right;">25.000,00 €</td></tr>
                <tr><td>Acabamentos</td><td style="text-align: right;">15.000,00 €</td></tr>
                <tr><td><strong>Total Orçamento</strong></td><td style="text-align: right;"><strong>50.000,00 €</strong></td></tr>
            </tbody>
        </table>

        <h2>Custos Reais</h2>
        <table>
            <thead>
                <tr>
                    <th>Categoria</th>
                    <th style="text-align: right;">Previsto (€)</th>
                    <th style="text-align: right;">Real (€)</th>
                    <th style="text-align: right;">Diferença (€)</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Mão de Obra</td><td style="text-align: right;">15.000,00 €</td><td style="text-align: right;">16.500,00 €</td><td style="text-align: right;">+1.500,00 €</td></tr>
                <tr><td>Materiais</td><td style="text-align: right;">20.000,00 €</td><td style="text-align: right;">21.000,00 €</td><td style="text-align: right;">+1.000,00 €</td></tr>
                <tr><td>Subempreitadas</td><td style="text-align: right;">10.000,00 €</td><td style="text-align: right;">9.500,00 €</td><td style="text-align: right;">-500,00 €</td></tr>
                <tr><td>Equipamentos</td><td style="text-align: right;">5.000,00 €</td><td style="text-align: right;">6.000,00 €</td><td style="text-align: right;">+1.000,00 €</td></tr>
                <tr><td><strong>Total Custos</strong></td><td style="text-align: right;"><strong>50.000,00 €</strong></td><td style="text-align: right;"><strong>53.000,00 €</strong></td><td style="text-align: right;"><strong>+3.000,00 €</strong></td></tr>
            </tbody>
        </table>

        <h2>Receita</h2>
        <div class="summary">
            <p><strong>Valor contratado:</strong> 60.000,00 €</p>
            <p><strong>Valores faturados:</strong> 40.000,00 €</p>
            <p><strong>Saldo a receber:</strong> 20.000,00 €</p>
        </div>

        <h2>Resultado da Obra</h2>
        <div class="summary">
            <p><strong>Lucro / Prejuízo:</strong> 7.000,00 € (Lucro)</p>
            <p><strong>Margem (%):</strong> 11.67%</p>
        </div>

        <h2>Alertas</h2>
        <p>
            <ul>
                <li>Estouro de orçamento: Custos de mão de obra e materiais excederam o previsto em 10% e 5%, respetivamente.</li>
                <li>Atrasos financeiros: Pagamento da 2ª tranche do cliente com 15 dias de atraso.</li>
            </ul>
        </p>
      `;
    } else if (reportName === "Faturas") {
      content += `
        <h1>Relatório de Faturas</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> Obra Sys Construções</p>
            <p><strong>Período:</strong> Últimos 30 dias (Exemplo)</p>
        </div>
        <h2>Visão Geral das Faturas</h2>
        <table>
            <thead>
                <tr>
                    <th>Nº Fatura</th>
                    <th>Cliente</th>
                    <th>Valor Total</th>
                    <th>Valor Pago</th>
                    <th>Estado</th>
                    <th>Data Vencimento</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>INV-2024-001</td><td>Cliente A</td><td>1.500,00 €</td><td>1.500,00 €</td><td>Pago</td><td>15/07/2024</td></tr>
                <tr><td>INV-2024-002</td><td>Cliente B</td><td>2.300,00 €</td><td>1.000,00 €</td><td>Pendente</td><td>20/07/2024</td></tr>
                <tr><td>INV-2024-003</td><td>Cliente C</td><td>800,00 €</td><td>0,00 €</td><td>Atrasado</td><td>01/07/2024</td></tr>
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Total Faturado:</strong> 4.600,00 €</p>
            <p><strong>Total Recebido:</strong> 2.500,00 €</p>
            <p><strong>Total Pendente:</strong> 2.100,00 €</p>
        </div>
      `;
    } else if (reportName === "Despesas") {
      content += `
        <h1>Relatório de Despesas</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> Obra Sys Construções</p>
            <p><strong>Período:</strong> Últimos 30 dias (Exemplo)</p>
        </div>
        <h2>Análise Detalhada das Despesas</h2>
        <table>
            <thead>
                <tr>
                    <th>Fornecedor</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Estado</th>
                    <th>Data Vencimento</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Fornecedor X</td><td>Compra de cimento</td><td>350,00 €</td><td>Pago</td><td>10/07/2024</td></tr>
                <tr><td>Fornecedor Y</td><td>Aluguer de equipamento</td><td>500,00 €</td><td>Pendente</td><td>25/07/2024</td></tr>
                <tr><td>Fornecedor Z</td><td>Serviços de eletricidade</td><td>200,00 €</td><td>Atrasado</td><td>05/07/2024</td></tr>
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Total de Despesas:</strong> 1.050,00 €</p>
            <p><strong>Total Pago:</strong> 350,00 €</p>
            <p><strong>Total Pendente:</strong> 700,00 €</p>
        </div>
      `;
    } else if (reportName === "Folha de Pagamento") {
      content += `
        <h1>Relatório de Folha de Pagamento</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> Obra Sys Construções</p>
            <p><strong>Período:</strong> Últimos 30 dias (Exemplo)</p>
        </div>
        <h2>Custos de Mão de Obra</h2>
        <table>
            <thead>
                <tr>
                    <th>Colaborador</th>
                    <th>Obra</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>João Silva</td><td>Obra A</td><td>Salário</td><td>1.200,00 €</td><td>30/06/2024</td><td>Pago</td></tr>
                <tr><td>Maria Santos</td><td>Obra B</td><td>Salário</td><td>900,00 €</td><td>30/06/2024</td><td>Pendente</td></tr>
                <tr><td>Pedro Costa</td><td>Obra A</td><td>Horas Extras</td><td>150,00 €</td><td>10/07/2024</td><td>Processado</td></tr>
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Custo Total de Mão de Obra:</strong> 2.250,00 €</p>
            <p><strong>Total Pago:</strong> 1.200,00 €</p>
            <p><strong>Total Pendente/Processado:</strong> 1.050,00 €</p>
        </div>
      `;
    } else if (reportName === "Progresso da Obra") {
      content += `
        <h1>Relatório de Progresso da Obra</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> Obra Sys Construções</p>
            <p><strong>Período:</strong> Últimos 30 dias (Exemplo)</p>
        </div>
        <h2>Acompanhamento de Progresso Físico e Financeiro</h2>
        <table>
            <thead>
                <tr>
                    <th>Obra</th>
                    <th>Estado</th>
                    <th>Progresso (%)</th>
                    <th>Custo Planeado</th>
                    <th>Custo Real</th>
                    <th>Desvio</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Projeto Residencial</td><td>Em execução</td><td>65%</td><td>50.000,00 €</td><td>55.000,00 €</td><td>+5.000,00 €</td></tr>
                <tr><td>Remodelação Escritório</td><td>Concluída</td><td>100%</td><td>15.000,00 €</td><td>14.500,00 €</td><td>-500,00 €</td></tr>
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Média de Progresso:</strong> 82.5%</p>
            <p><strong>Desvio Total de Custos:</strong> +4.500,00 €</p>
        </div>
      `;
    } else if (reportName === "Orçamento da Obra") {
      content += `
        <h1>Relatório de Orçamento da Obra</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> Obra Sys Construções</p>
            <p><strong>Período:</strong> Últimos 30 dias (Exemplo)</p>
        </div>
        <h2>Comparativo de Orçamento (Planeado vs Real)</h2>
        <table>
            <thead>
                <tr>
                    <th>Obra</th>
                    <th>Orçamento Total</th>
                    <th>Custo Executado</th>
                    <th>Desvio (€)</th>
                    <th>Desvio (%)</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Projeto Residencial</td><td>50.000,00 €</td><td>55.000,00 €</td><td>+5.000,00 €</td><td>+10%</td></tr>
                <tr><td>Remodelação Escritório</td><td>15.000,00 €</td><td>14.500,00 €</td><td>-500,00 €</td><td>-3.3%</td></tr>
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Desvio Médio:</strong> +3.5%</p>
        </div>
      `;
    } else if (reportName === "Catálogo de Artigos") {
      content += `
        <h1>Relatório de Catálogo de Artigos</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> Obra Sys Construções</p>
        </div>
        <h2>Lista Completa de Artigos de Trabalho</h2>
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>Unidade</th>
                    <th>Tipo</th>
                    <th>Preço Unitário</th>
                    <th>Categoria</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>MO-001</td><td>Oficial de Construção</td><td>Hora</td><td>Mão de Obra</td><td>30,50 €</td><td>Mão de Obra (Geral)</td></tr>
                <tr><td>EST-001</td><td>Betão Armado (Colocado)</td><td>m3</td><td>Fornecimento e Aplicação</td><td>425,00 €</td><td>Estrutura e Alvenaria</td></tr>
                <tr><td>PIN-002</td><td>Pintura Interior (Paredes + Tinta)</td><td>m2</td><td>Fornecimento e Aplicação</td><td>14,00 €</td><td>Pinturas</td></tr>
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Total de Artigos:</strong> 150 (Exemplo)</p>
            <p><strong>Preço Médio por Artigo:</strong> 85,00 € (Exemplo)</p>
        </div>
      `;
    } else if (reportName === "Histórico de Preços") {
      content += `
        <h1>Relatório de Histórico de Preços</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> Obra Sys Construções</p>
        </div>
        <h2>Evolução dos Preços dos Artigos</h2>
        <p>Este relatório apresentaria gráficos e tabelas mostrando a variação de preços de artigos selecionados ao longo do tempo.</p>
        <div class="summary">
            <p><strong>Artigo Mais Volátil:</strong> Cimento (Exemplo)</p>
            <p><strong>Aumento Médio Anual:</strong> 5% (Exemplo)</p>
        </div>
      `;
    }

    content += `
          <div class="footer">
              <p>Documento gerado automaticamente pelo Obra Sys.</p>
          </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
    } else {
      toast.error("Não foi possível abrir a janela de impressão. Verifique as configurações de pop-up.");
    }
  };

  const handleGenerateReportClick = (reportName: string) => {
    generateReportContent(reportName, {});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Geração de Relatórios
        </h1>
      </div>

      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Aceda a relatórios detalhados e personalizáveis para todas as áreas da sua gestão de obras.
        </p>
      </section>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Relatórios Financeiros */}
      <h2 className="text-xl font-semibold mb-4 text-primary">Relatórios Financeiros</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Scale className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Relatório Financeiro Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Acompanhe a saúde financeira mês a mês e apoie decisões rápidas.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Relatório Financeiro Mensal")}>
              <Printer className="h-4 w-4 mr-2" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <TrendingUp className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            <CardTitle className="text-xl font-semibold">Relatório de Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Garantir liquidez e evitar surpresas.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Relatório de Fluxo de Caixa")}>
              <Printer className="h-4 w-4 mr-2" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <ReceiptText className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Relatório de Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Visão geral das faturas emitidas, pagas e pendentes.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Faturas")}>
              <Printer className="h-4 w-4 mr-2" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Wallet className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Relatório de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Análise detalhada das despesas por fornecedor, categoria e estado.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Despesas")}>
              <Printer className="h-4 w-4 mr-2" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <ClipboardList className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <CardTitle className="text-xl font-semibold">Relatório de Folha de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Custos de mão de obra, salários e benefícios por projeto e colaborador.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Folha de Pagamento")}>
              <Printer className="h-4 w-4 mr-2" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Relatórios de Obra */}
      <h2 className="text-xl font-semibold mb-4 text-primary">Relatórios de Obra</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <HardHat className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Relatório Financeiro por Projeto / Obra</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Controlar rentabilidade de cada obra/projeto.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Relatório Financeiro por Projeto / Obra")}>
              <Printer className="h-4 w-4 mr-2" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <HardHat className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Relatório de Progresso da Obra</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Acompanhamento do progresso físico e financeiro de cada projeto.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Progresso da Obra")}>
              <Printer className="h-4 w-4 mr-2" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <DollarSign className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Relatório de Orçamento da Obra</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Comparativo entre o orçamento planeado e o custo real da obra.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Orçamento da Obra")}>
              <Printer className="h-4 w-4 mr-2" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <BookText className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <CardTitle className="text-xl font-semibold">Livro de Obra Digital</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Consolidação dos Registos Diários de Obra (RDOs) em formato digital.
            </p>
            <NavButton className="mt-6 w-full" to="/compliance/livro-de-obra">
              Aceder Livro de Obra
            </NavButton>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Relatórios de Base de Dados */}
      <h2 className="text-xl font-semibold mb-4 text-primary">Relatórios de Base de Dados</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Archive className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Catálogo de Artigos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Lista completa de todos os artigos de trabalho (serviços, materiais, equipas).
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Catálogo de Artigos")}>
              <Printer className="h-4 w-4 mr-2" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <History className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Histórico de Preços</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Evolução dos preços dos artigos ao longo do tempo.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Histórico de Preços")}>
              <Printer className="h-4 w-4 mr-2" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Outros Relatórios */}
      <h2 className="text-xl font-semibold mb-4 text-primary">Outros Relatórios</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <BellRing className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Alertas de IA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Relatório de alertas gerados pelo assistente de IA.
            </p>
            <NavButton className="mt-6 w-full" to="/automation-intelligence/ai-alerts">
              Ver Alertas
            </NavButton>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <CheckSquare className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Checklist de Conformidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Estado das verificações de conformidade legal e operacional.
            </p>
            <NavButton className="mt-6 w-full" to="/compliance/checklist">
              Consultar Checklist
            </NavButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;