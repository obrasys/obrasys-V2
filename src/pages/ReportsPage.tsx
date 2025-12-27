"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Printer,
  Loader2,
  CalendarDays,
} from "lucide-react";
import NavButton from "@/components/NavButton";
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { Project } from "@/schemas/project-schema";
import { Invoice, Expense, Payment } from "@/schemas/invoicing-schema";
import { BudgetDB, BudgetItemDB, BudgetChapterDB } from "@/schemas/budget-schema";
import { AiAlert } from "@/schemas/ai-alert-schema";
import { formatCurrency } from "@/utils/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const ReportsPage = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Report parameters state
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedProjectIdForReport, setSelectedProjectIdForReport] = useState<string | null>(null);

  // Fetch user's company ID
  const fetchUserCompanyId = useCallback(async () => {
    if (!user) {
      setUserCompanyId(null);
      return;
    }
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Erro ao carregar company_id do perfil:", profileError);
      setUserCompanyId(null);
    } else if (profileData) {
      setUserCompanyId(profileData.company_id);
    }
  }, [user]);

  // Fetch projects for the project selector
  const fetchProjects = useCallback(async () => {
    if (!userCompanyId) {
      setProjects([]);
      return;
    }
    const { data, error } = await supabase
      .from('projects')
      .select('id, nome, client_id, localizacao, custo_planeado, custo_real, budget_id, prazo, clients(nome)')
      .eq('company_id', userCompanyId)
      .order('nome', { ascending: true });

    if (error) {
      toast.error(`Erro ao carregar obras: ${error.message}`);
      console.error("Erro ao carregar obras:", error);
      setProjects([]);
    } else {
      const formattedProjects: Project[] = (data || []).map((project: any) => ({
        ...project,
        client_name: project.clients?.nome || "Cliente Desconhecido",
      }));
      setProjects(formattedProjects);
      if (!selectedProjectIdForReport && formattedProjects.length > 0) {
        setSelectedProjectIdForReport(formattedProjects[0].id);
      }
    }
  }, [userCompanyId, selectedProjectIdForReport]);

  useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
  }, [isSessionLoading, fetchUserCompanyId]);

  useEffect(() => {
    if (userCompanyId) {
      fetchProjects();
      setIsLoadingInitialData(false);
    }
  }, [userCompanyId, fetchProjects]);

  const generateReportContent = (reportName: string, reportData: any) => {
    const currentDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt });
    const companyName = reportData.company?.name || "Obra Sys Construções";
    const financialResponsible = "João Silva"; // Placeholder for now
    const projectName = reportData.project?.nome || 'N/A';
    const clientName = reportData.project?.client_name || 'N/A';
    const projectPeriod = reportData.project?.prazo ? `${format(parseISO(reportData.project.created_at), "dd/MM/yyyy")} - ${format(parseISO(reportData.project.prazo), "dd/MM/yyyy")}` : 'N/A';
    const reportMonthYear = reportData.monthYear ? format(parseISO(reportData.monthYear), "MMMM yyyy", { locale: pt }) : 'N/A';

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
      const { totalRevenue, totalExpenses, profitLoss, prevMonthComparison, revenueBySource, expensesByCategory } = reportData;
      content += `
        <div class="cover-page">
            <h1>Relatório Financeiro Mensal</h1>
            <p><strong>${companyName}</strong></p>
            <p>Mês / Ano: ${reportMonthYear}</p>
            <p>Responsável Financeiro: ${financialResponsible}</p>
        </div>

        <h1>Relatório Financeiro Mensal</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Mês / Ano:</strong> ${reportMonthYear}</p>
        </div>

        <h2>Resumo Executivo</h2>
        <div class="summary">
            <p><strong>Receita total do mês:</strong> ${formatCurrency(totalRevenue)}</p>
            <p><strong>Despesas totais:</strong> ${formatCurrency(totalExpenses)}</p>
            <p><strong>Resultado (Lucro / Prejuízo):</strong> ${formatCurrency(profitLoss)} (${profitLoss >= 0 ? 'Lucro' : 'Prejuízo'})</p>
            <p><strong>Comparação com mês anterior:</strong> ${prevMonthComparison.toFixed(1)}%</p>
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
                ${revenueBySource.map((item: any) => `
                  <tr><td>${item.source}</td><td style="text-align: right;">${formatCurrency(item.value)}</td><td style="text-align: right;">${item.percentage.toFixed(1)}%</td></tr>
                `).join('')}
                <tr><td><strong>Total</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalRevenue)}</strong></td><td style="text-align: right;"><strong>100%</strong></td></tr>
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
                ${expensesByCategory.map((item: any) => `
                  <tr><td>${item.category}</td><td style="text-align: right;">${formatCurrency(item.value)}</td></tr>
                `).join('')}
                <tr><td><strong>Total</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalExpenses)}</strong></td></tr>
            </tbody>
        </table>

        <h2>Resultado Financeiro</h2>
        <div class="summary">
            <p><strong>Lucro bruto:</strong> ${formatCurrency(totalRevenue - totalExpenses)}</p>
            <p><strong>Lucro líquido:</strong> ${formatCurrency(profitLoss)}</p>
            <p><strong>Margem (%):</strong> ${totalRevenue > 0 ? ((profitLoss / totalRevenue) * 100).toFixed(1) : 0}%</p>
        </div>

        <h2>Observações</h2>
        <p>
            <ul>
                <li>Custos fora do padrão: N/A</li>
                <li>Receitas extraordinárias: N/A</li>
                <li>Alertas: N/A</li>
            </ul>
        </p>
      `;
    } else if (reportName === "Relatório de Fluxo de Caixa") {
      const { initialBalance, totalEntries, totalExits, finalBalance, entries, exits, forecast } = reportData;
      content += `
        <div class="cover-page">
            <h1>Relatório de Fluxo de Caixa</h1>
            <p><strong>${companyName}</strong></p>
            <p>Mês / Ano: ${reportData.period}</p>
            <p>Responsável Financeiro: ${financialResponsible}</p>
        </div>

        <h1>Relatório de Fluxo de Caixa</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Período:</strong> ${reportData.period}</p>
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
                ${entries.map((entry: any) => `
                  <tr><td>${format(parseISO(entry.date), "dd/MM/yyyy")}</td><td>${entry.origin}</td><td style="text-align: right;">${formatCurrency(entry.amount)}</td></tr>
                `).join('')}
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
                ${exits.map((exit: any) => `
                  <tr><td>${format(parseISO(exit.date), "dd/MM/yyyy")}</td><td>${exit.destination}</td><td style="text-align: right;">${formatCurrency(exit.amount)}</td></tr>
                `).join('')}
            </tbody>
        </table>

        <h2>Resumo</h2>
        <div class="summary">
            <p><strong>Saldo inicial:</strong> ${formatCurrency(initialBalance)}</p>
            <p><strong>Total entradas:</strong> ${formatCurrency(totalEntries)}</p>
            <p><strong>Total saídas:</strong> ${formatCurrency(totalExits)}</p>
            <p><strong>Saldo final:</strong> ${formatCurrency(finalBalance)}</p>
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
                <tr><td>Próximos 30 dias</td><td style="text-align: right;">${formatCurrency(forecast.next30Days)}</td></tr>
                <tr><td>Próximos 60 dias</td><td style="text-align: right;">${formatCurrency(forecast.next60Days)}</td></tr>
                <tr><td>Próximos 90 dias</td><td style="text-align: right;">${formatCurrency(forecast.next90Days)}</td></tr>
            </tbody>
        </table>
      `;
    } else if (reportName === "Relatório Financeiro por Projeto / Obra") {
      const { project, budget, budgetItems, projectInvoices, projectAlerts } = reportData;
      const totalBudgeted = budget?.total_planeado || 0;
      const totalRealCost = budget?.total_executado || 0;
      const totalInvoiced = projectInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);
      const totalPaidInvoices = projectInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.paid_amount || 0), 0);
      const balanceToReceive = totalInvoiced - totalPaidInvoices;
      const profitLoss = totalInvoiced - totalRealCost;
      const margin = totalInvoiced > 0 ? (profitLoss / totalInvoiced) * 100 : 0;

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
                ${budgetItems.map((item: BudgetItemDB) => `
                  <tr><td>${item.servico}</td><td style="text-align: right;">${formatCurrency(item.custo_planeado)}</td></tr>
                `).join('')}
                <tr><td><strong>Total Orçamento</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalBudgeted)}</strong></td></tr>
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
                <tr><td>Mão de Obra</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_planeado * (item.tipo === 'equipe' ? 1 : 0)), 0))}</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_real_mao_obra || 0), 0))}</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_real_mao_obra || 0) - (item.custo_planeado * (item.tipo === 'equipe' ? 1 : 0)), 0))}</td></tr>
                <tr><td>Materiais</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_planeado * (item.tipo === 'material' ? 1 : 0)), 0))}</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_real_material || 0), 0))}</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_real_material || 0) - (item.custo_planeado * (item.tipo === 'material' ? 1 : 0)), 0))}</td></tr>
                <tr><td>Serviços/Outros</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_planeado * (item.tipo === 'servico' ? 1 : 0)), 0))}</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + ((item.custo_executado || 0) - (item.custo_real_material || 0) - (item.custo_real_mao_obra || 0)), 0))}</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + ((item.custo_executado || 0) - (item.custo_real_material || 0) - (item.custo_real_mao_obra || 0)) - (item.custo_planeado * (item.tipo === 'servico' ? 1 : 0)), 0))}</td></tr>
                <tr><td><strong>Total Custos</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalBudgeted)}</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalRealCost)}</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalRealCost - totalBudgeted)}</strong></td></tr>
            </tbody>
        </table>

        <h2>Receita</h2>
        <div class="summary">
            <p><strong>Valor contratado:</strong> ${formatCurrency(totalBudgeted)}</p>
            <p><strong>Valores faturados:</strong> ${formatCurrency(totalInvoiced)}</p>
            <p><strong>Saldo a receber:</strong> ${formatCurrency(balanceToReceive)}</p>
        </div>

        <h2>Resultado da Obra</h2>
        <div class="summary">
            <p><strong>Lucro / Prejuízo:</strong> ${formatCurrency(profitLoss)} (${profitLoss >= 0 ? 'Lucro' : 'Prejuízo'})</p>
            <p><strong>Margem (%):</strong> ${margin.toFixed(2)}%</p>
        </div>

        <h2>Alertas</h2>
        <p>
            <ul>
                ${projectAlerts.length > 0 ? projectAlerts.map((alert: AiAlert) => `
                  <li><span style="font-weight: bold; color: ${alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'orange' : 'blue'};">[${alert.severity?.toUpperCase()}]</span> ${alert.title}: ${alert.message}</li>
                `).join('') : '<li>Nenhum alerta crítico ou de aviso para este projeto.</li>'}
            </ul>
        </p>
      `;
    } else if (reportName === "Faturas") {
      const { invoices } = reportData;
      const totalInvoiced = invoices.reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);
      const totalPaidInvoices = invoices.reduce((sum: number, inv: Invoice) => sum + (inv.paid_amount || 0), 0);
      const totalPendingInvoices = totalInvoiced - totalPaidInvoices;

      content += `
        <h1>Relatório de Faturas</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Período:</strong> ${reportData.period}</p>
        </div>
        <h2>Visão Geral das Faturas</h2>
        <table>
            <thead>
                <tr>
                    <th>Nº Fatura</th>
                    <th>Cliente</th>
                    <th style="text-align: right;">Valor Total</th>
                    <th style="text-align: right;">Valor Pago</th>
                    <th>Estado</th>
                    <th>Data Vencimento</th>
                </tr>
            </thead>
            <tbody>
                ${invoices.map((inv: Invoice) => `
                  <tr>
                    <td>${inv.invoice_number}</td>
                    <td>${inv.clients?.nome || 'N/A'}</td>
                    <td style="text-align: right;">${formatCurrency(inv.total_amount)}</td>
                    <td style="text-align: right;">${formatCurrency(inv.paid_amount || 0)}</td>
                    <td>${inv.status.replace('_', ' ')}</td>
                    <td>${format(parseISO(inv.due_date), "dd/MM/yyyy")}</td>
                  </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Total Faturado:</strong> ${formatCurrency(totalInvoiced)}</p>
            <p><strong>Total Recebido:</strong> ${formatCurrency(totalPaidInvoices)}</p>
            <p><strong>Total Pendente:</strong> ${formatCurrency(totalPendingInvoices)}</p>
        </div>
      `;
    } else if (reportName === "Despesas") {
      const { expenses } = reportData;
      const totalExpenses = expenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
      const totalPaidExpenses = expenses.filter((exp: Expense) => exp.status === "paid").reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
      const totalPendingExpenses = expenses.filter((exp: Expense) => exp.status === "pending" || exp.status === "overdue").reduce((sum: number, exp: Expense) => sum + exp.amount, 0);

      content += `
        <h1>Relatório de Despesas</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Período:</strong> ${reportData.period}</p>
        </div>
        <h2>Análise Detalhada das Despesas</h2>
        <table>
            <thead>
                <tr>
                    <th>Fornecedor</th>
                    <th>Descrição</th>
                    <th style="text-align: right;">Valor</th>
                    <th>Estado</th>
                    <th>Data Vencimento</th>
                </tr>
            </thead>
            <tbody>
                ${expenses.map((exp: Expense) => `
                  <tr>
                    <td>${exp.supplier_name}</td>
                    <td>${exp.description}</td>
                    <td style="text-align: right;">${formatCurrency(exp.amount)}</td>
                    <td>${exp.status.replace('_', ' ')}</td>
                    <td>${format(parseISO(exp.due_date), "dd/MM/yyyy")}</td>
                  </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Total de Despesas:</strong> ${formatCurrency(totalExpenses)}</p>
            <p><strong>Total Pago:</strong> ${formatCurrency(totalPaidExpenses)}</p>
            <p><strong>Total Pendente:</strong> ${formatCurrency(totalPendingExpenses)}</p>
        </div>
      `;
    } else if (reportName === "Folha de Pagamento") {
      const { payrollEntries } = reportData;
      const totalPayrollCost = payrollEntries.reduce((sum: number, entry: any) => sum + entry.amount, 0);
      const totalPaidPayroll = payrollEntries.filter((entry: any) => entry.status === "paid").reduce((sum: number, entry: any) => sum + entry.amount, 0);
      const totalPendingPayroll = payrollEntries.filter((entry: any) => entry.status === "pending" || entry.status === "processed").reduce((sum: number, entry: any) => sum + entry.amount, 0);

      content += `
        <h1>Relatório de Folha de Pagamento</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Período:</strong> ${reportData.period}</p>
        </div>
        <h2>Custos de Mão de Obra</h2>
        <table>
            <thead>
                <tr>
                    <th>Colaborador</th>
                    <th>Obra</th>
                    <th>Tipo</th>
                    <th style="text-align: right;">Valor</th>
                    <th>Data</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${payrollEntries.map((entry: any) => `
                  <tr>
                    <td>${entry.users?.first_name || 'N/A'} ${entry.users?.last_name || ''}</td>
                    <td>${entry.projects?.nome || 'N/A'}</td>
                    <td>${entry.type.replace('_', ' ')}</td>
                    <td style="text-align: right;">${formatCurrency(entry.amount)}</td>
                    <td>${format(parseISO(entry.entry_date), "dd/MM/yyyy")}</td>
                    <td>${entry.status.replace('_', ' ')}</td>
                  </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Custo Total de Mão de Obra:</strong> ${formatCurrency(totalPayrollCost)}</p>
            <p><strong>Total Pago:</strong> ${formatCurrency(totalPaidPayroll)}</p>
            <p><strong>Total Pendente/Processado:</strong> ${formatCurrency(totalPendingPayroll)}</p>
        </div>
      `;
    } else if (reportName === "Progresso da Obra") {
      const { project, scheduleTasks } = reportData;
      const totalPlannedCost = project?.custo_planeado || 0;
      const totalRealCost = project?.custo_real || 0;
      const deviation = totalRealCost - totalPlannedCost;

      content += `
        <h1>Relatório de Progresso da Obra</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Projeto / Obra:</strong> ${projectName}</p>
            <p><strong>Cliente:</strong> ${clientName}</p>
            <p><strong>Período:</strong> ${projectPeriod}</p>
        </div>
        <h2>Acompanhamento de Progresso Físico e Financeiro</h2>
        <table>
            <thead>
                <tr>
                    <th>Fase / Capítulo</th>
                    <th>Estado</th>
                    <th style="text-align: right;">Progresso (%)</th>
                    <th>Data Início</th>
                    <th>Data Fim</th>
                    <th>Duração (dias)</th>
                </tr>
            </thead>
            <tbody>
                ${scheduleTasks.map((task: any) => `
                  <tr>
                    <td>${task.capitulo}</td>
                    <td>${task.estado}</td>
                    <td style="text-align: right;">${task.progresso}%</td>
                    <td>${task.data_inicio ? format(parseISO(task.data_inicio), "dd/MM/yyyy") : 'N/A'}</td>
                    <td>${task.data_fim ? format(parseISO(task.data_fim), "dd/MM/yyyy") : 'N/A'}</td>
                    <td style="text-align: right;">${task.duracao_dias || 'N/A'}</td>
                  </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Progresso Geral da Obra:</strong> ${project?.progresso || 0}%</p>
            <p><strong>Custo Planeado:</strong> ${formatCurrency(totalPlannedCost)}</p>
            <p><strong>Custo Real:</strong> ${formatCurrency(totalRealCost)}</p>
            <p><strong>Desvio de Custos:</strong> ${formatCurrency(deviation)}</p>
        </div>
      `;
    } else if (reportName === "Orçamento da Obra") {
      const { project, budget, budgetItems } = reportData;
      const totalBudgeted = budget?.total_planeado || 0;
      const totalExecuted = budget?.total_executado || 0;
      const deviation = totalExecuted - totalBudgeted;
      const deviationPercentage = totalBudgeted > 0 ? (deviation / totalBudgeted) * 100 : 0;

      content += `
        <h1>Relatório de Orçamento da Obra</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Projeto / Obra:</strong> ${projectName}</p>
            <p><strong>Cliente:</strong> ${clientName}</p>
            <p><strong>Período:</strong> ${projectPeriod}</p>
        </div>
        <h2>Comparativo de Orçamento (Planeado vs Real)</h2>
        <table>
            <thead>
                <tr>
                    <th>Serviço / Item</th>
                    <th style="text-align: right;">Qtd.</th>
                    <th>Un.</th>
                    <th style="text-align: right;">Preço Unit.</th>
                    <th style="text-align: right;">Custo Planeado</th>
                    <th style="text-align: right;">Custo Executado</th>
                    <th style="text-align: right;">Desvio (€)</th>
                </tr>
            </thead>
            <tbody>
                ${budgetItems.map((item: BudgetItemDB) => `
                  <tr>
                    <td>${item.servico}</td>
                    <td style="text-align: right;">${item.quantidade}</td>
                    <td>${item.unidade}</td>
                    <td style="text-align: right;">${formatCurrency(item.preco_unitario)}</td>
                    <td style="text-align: right;">${formatCurrency(item.custo_planeado)}</td>
                    <td style="text-align: right;">${formatCurrency(item.custo_executado)}</td>
                    <td style="text-align: right;">${formatCurrency(item.custo_executado - item.custo_planeado)}</td>
                  </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Orçamento Total:</strong> ${formatCurrency(totalBudgeted)}</p>
            <p><strong>Custo Executado:</strong> ${formatCurrency(totalExecuted)}</p>
            <p><strong>Desvio Total:</strong> ${formatCurrency(deviation)} (${deviationPercentage.toFixed(1)}%)</p>
        </div>
      `;
    } else if (reportName === "Catálogo de Artigos") {
      const { articles } = reportData;
      const totalArticles = articles.length;
      const averagePrice = totalArticles > 0 ? articles.reduce((sum: number, article: any) => sum + article.preco_unitario, 0) / totalArticles : 0;

      content += `
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
                ${articles.map((article: any) => `
                  <tr>
                    <td>${article.codigo}</td>
                    <td>${article.descricao}</td>
                    <td>${article.unidade}</td>
                    <td>${article.tipo}</td>
                    <td style="text-align: right;">${formatCurrency(article.preco_unitario)}</td>
                    <td>${article.categories?.nome || 'N/A'}</td>
                  </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Total de Artigos:</strong> ${totalArticles}</p>
            <p><strong>Preço Médio por Artigo:</strong> ${formatCurrency(averagePrice)}</p>
        </div>
      `;
    } else if (reportName === "Histórico de Preços") {
      content += `
        <h1>Relatório de Histórico de Preços</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> ${companyName}</p>
        </div>
        <h2>Evolução dos Preços dos Artigos</h2>
        <p>Este relatório apresentaria gráficos e tabelas mostrando a variação de preços de artigos selecionados ao longo do tempo.</p>
        <div class="summary">
            <p><strong>Artigo Mais Volátil:</strong> Cimento (Exemplo)</p>
            <p><strong>Aumento Médio Anual:</strong> 5% (Exemplo)</p>
        </div>
      `;
    } else if (reportName === "Alertas de IA") {
      const { alerts } = reportData;
      content += `
        <h1>Relatório de Alertas de IA</h1>
        <div class="header-info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Empresa:</strong> ${companyName}</p>
        </div>
        <h2>Alertas Gerados pelo Assistente de IA</h2>
        ${alerts.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>Projeto</th>
                    <th>Título</th>
                    <th>Mensagem</th>
                    <th>Severidade</th>
                    <th>Data</th>
                </tr>
            </thead>
            <tbody>
                ${alerts.map((alert: AiAlert) => `
                  <tr>
                    <td>${alert.projects?.nome || 'N/A'}</td>
                    <td>${alert.title}</td>
                    <td>${alert.message}</td>
                    <td>${alert.severity?.replace('_', ' ') || 'N/A'}</td>
                    <td>${alert.created_at ? format(parseISO(alert.created_at), "dd/MM/yyyy HH:mm") : 'N/A'}</td>
                  </tr>
                `).join('')}
            </tbody>
        </table>
        ` : `<p style="text-align: center; margin-top: 20px; color: #777;">Nenhum alerta de IA encontrado.</p>`}
      `;
    } else if (reportName === "Checklist de Conformidade") {
      content += `
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
    } else if (reportName === "Livro de Obra Digital") {
      content += `
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

  const handleGenerateReportClick = async (reportName: string) => {
    if (!userCompanyId) {
      toast.error("ID da empresa não encontrado. Por favor, faça login novamente.");
      return;
    }
    setIsLoadingReport(true);
    let reportData: any = { company: null, monthYear: selectedMonth };

    try {
      // Fetch company data
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userCompanyId)
        .single();
      if (companyError) console.error("Error fetching company data:", companyError);
      reportData.company = company;

      const startOfSelectedMonth = startOfMonth(parseISO(selectedMonth));
      const endOfSelectedMonth = endOfMonth(parseISO(selectedMonth));
      const startOfPrevMonth = startOfMonth(subMonths(parseISO(selectedMonth), 1));
      const endOfPrevMonth = endOfMonth(subMonths(parseISO(selectedMonth), 1));

      if (reportName === "Relatório Financeiro Mensal") {
        // Fetch invoices for current month
        const { data: currentMonthInvoices, error: invError } = await supabase
          .from('invoices')
          .select('total_amount, paid_amount')
          .eq('company_id', userCompanyId)
          .gte('issue_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('issue_date', format(endOfSelectedMonth, 'yyyy-MM-dd'))
          .in('status', ['paid', 'pending']);
        if (invError) throw invError;
        const totalRevenue = (currentMonthInvoices || []).reduce((sum, inv) => sum + inv.total_amount, 0);

        // Fetch expenses for current month
        const { data: currentMonthExpenses, error: expError } = await supabase
          .from('expenses')
          .select('amount, type:description') // Using description as a mock category for now
          .eq('company_id', userCompanyId)
          .gte('due_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('due_date', format(endOfSelectedMonth, 'yyyy-MM-dd'))
          .in('status', ['paid', 'pending', 'overdue']);
        if (expError) throw expError;
        const totalExpenses = (currentMonthExpenses || []).reduce((sum, exp) => sum + exp.amount, 0);

        // Fetch invoices for previous month for comparison
        const { data: prevMonthInvoices, error: prevInvError } = await supabase
          .from('invoices')
          .select('total_amount')
          .eq('company_id', userCompanyId)
          .gte('issue_date', format(startOfPrevMonth, 'yyyy-MM-dd'))
          .lte('issue_date', format(endOfPrevMonth, 'yyyy-MM-dd'))
          .in('status', ['paid', 'pending']);
        if (prevInvError) throw prevInvError;
        const prevMonthRevenue = (prevMonthInvoices || []).reduce((sum, inv) => sum + inv.total_amount, 0);

        const profitLoss = totalRevenue - totalExpenses;
        const prevMonthComparison = prevMonthRevenue > 0 ? ((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

        // Simplified revenue by source and expenses by category
        const revenueBySource = [
          { source: "Faturas Emitidas", value: totalRevenue, percentage: totalRevenue > 0 ? (totalRevenue / totalRevenue) * 100 : 0 },
        ];
        const expensesByCategory = [
          { category: "Despesas Registadas", value: totalExpenses },
        ];

        reportData = {
          ...reportData,
          totalRevenue,
          totalExpenses,
          profitLoss,
          prevMonthComparison,
          revenueBySource,
          expensesByCategory,
          period: `${format(startOfSelectedMonth, "dd/MM/yyyy")} - ${format(endOfSelectedMonth, "dd/MM/yyyy")}`,
        };

      } else if (reportName === "Relatório de Fluxo de Caixa") {
        // Fetch all payments and expenses for the year to calculate initial balance
        const startOfYear = startOfMonth(new Date(new Date().getFullYear(), 0, 1));
        const { data: allPayments, error: allPaymentsError } = await supabase
          .from('payments')
          .select('amount, payment_date')
          .eq('company_id', userCompanyId)
          .gte('payment_date', format(startOfYear, 'yyyy-MM-dd'))
          .lte('payment_date', format(endOfSelectedMonth, 'yyyy-MM-dd'));
        if (allPaymentsError) throw allPaymentsError;

        const { data: allExpenses, error: allExpensesError } = await supabase
          .from('expenses')
          .select('amount, due_date')
          .eq('company_id', userCompanyId)
          .gte('due_date', format(startOfYear, 'yyyy-MM-dd'))
          .lte('due_date', format(endOfSelectedMonth, 'yyyy-MM-dd'));
        if (allExpensesError) throw allExpensesError;

        let initialBalance = 0;
        // Calculate balance up to the start of the selected month
        (allPayments || []).forEach(p => {
          if (parseISO(p.payment_date) < startOfSelectedMonth) initialBalance += p.amount;
        });
        (allExpenses || []).forEach(e => {
          if (parseISO(e.due_date) < startOfSelectedMonth) initialBalance -= e.amount;
        });

        // Fetch payments for current month
        const { data: currentMonthPayments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount, payment_date, invoices(invoice_number)')
          .eq('company_id', userCompanyId)
          .gte('payment_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('payment_date', format(endOfSelectedMonth, 'yyyy-MM-dd'));
        if (paymentsError) throw paymentsError;
        const totalEntries = (currentMonthPayments || []).reduce((sum, p) => sum + p.amount, 0);
        const entries = (currentMonthPayments || []).map(p => ({
          date: p.payment_date,
          origin: `Pagamento Fatura ${p.invoices?.invoice_number || 'N/A'}`,
          amount: p.amount,
        }));

        // Fetch expenses for current month
        const { data: currentMonthExpensesFlow, error: expensesFlowError } = await supabase
          .from('expenses')
          .select('amount, due_date, description')
          .eq('company_id', userCompanyId)
          .gte('due_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('due_date', format(endOfSelectedMonth, 'yyyy-MM-dd'));
        if (expensesFlowError) throw expensesFlowError;
        const totalExits = (currentMonthExpensesFlow || []).reduce((sum, exp) => sum + exp.amount, 0);
        const exits = (currentMonthExpensesFlow || []).map(exp => ({
          date: exp.due_date,
          destination: exp.description,
          amount: exp.amount,
        }));

        const finalBalance = initialBalance + totalEntries - totalExits;

        // Mock forecast for now
        const forecast = {
          next30Days: finalBalance + 1500,
          next60Days: finalBalance + 2800,
          next90Days: finalBalance + 4000,
        };

        reportData = {
          ...reportData,
          initialBalance,
          totalEntries,
          totalExits,
          finalBalance,
          entries,
          exits,
          forecast,
          period: `${format(startOfSelectedMonth, "dd/MM/yyyy")} - ${format(endOfSelectedMonth, "dd/MM/yyyy")}`,
        };

      } else if (reportName === "Relatório Financeiro por Projeto / Obra") {
        if (!selectedProjectIdForReport) {
          toast.error("Selecione um projeto para gerar este relatório.");
          return;
        }
        const project = projects.find(p => p.id === selectedProjectIdForReport);
        if (!project) {
          toast.error("Projeto não encontrado.");
          return;
        }

        // Fetch budget for the project
        let budget: BudgetDB | null = null;
        let budgetItems: BudgetItemDB[] = [];
        if (project.budget_id) {
          const { data: fetchedBudget, error: budgetError } = await supabase
            .from('budgets')
            .select(`
              *,
              budget_chapters (
                budget_items (*)
              )
            `)
            .eq('id', project.budget_id)
            .single();
          if (budgetError && budgetError.code !== 'PGRST116') throw budgetError;
          if (fetchedBudget) {
            budget = fetchedBudget;
            budgetItems = fetchedBudget.budget_chapters.flatMap((chapter: any) => chapter.budget_items);
          }
        }

        // Fetch invoices for the project
        const { data: projectInvoices, error: invError } = await supabase
          .from('invoices')
          .select('*, clients(nome), projects(nome)')
          .eq('project_id', selectedProjectIdForReport)
          .eq('company_id', userCompanyId);
        if (invError) throw invError;

        // Fetch AI alerts for the project
        const { data: projectAlerts, error: alertsError } = await supabase
          .from('ai_alerts')
          .select('id, title, message, severity, created_at, projects(nome)')
          .eq('project_id', selectedProjectIdForReport)
          .eq('company_id', userCompanyId)
          .in('severity', ['critical', 'warning'])
          .eq('resolved', false)
          .order('created_at', { ascending: false });
        if (alertsError) throw alertsError;

        reportData = {
          ...reportData,
          project,
          budget,
          budgetItems,
          projectInvoices,
          projectAlerts: projectAlerts || [],
          period: `${format(parseISO(project.created_at), "dd/MM/yyyy")} - ${project.prazo ? format(parseISO(project.prazo), "dd/MM/yyyy") : 'N/A'}`,
        };

      } else if (reportName === "Faturas") {
        const { data: invoices, error: invError } = await supabase
          .from('invoices')
          .select('*, clients(nome), projects(nome)')
          .eq('company_id', userCompanyId)
          .gte('issue_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('issue_date', format(endOfSelectedMonth, 'yyyy-MM-dd'))
          .order('issue_date', { ascending: false });
        if (invError) throw invError;
        reportData = {
          ...reportData,
          invoices: invoices || [],
          period: `${format(startOfSelectedMonth, "dd/MM/yyyy")} - ${format(endOfSelectedMonth, "dd/MM/yyyy")}`,
        };

      } else if (reportName === "Despesas") {
        const { data: expenses, error: expError } = await supabase
          .from('expenses')
          .select('*')
          .eq('company_id', userCompanyId)
          .gte('due_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('due_date', format(endOfSelectedMonth, 'yyyy-MM-dd'))
          .order('due_date', { ascending: false });
        if (expError) throw expError;
        reportData = {
          ...reportData,
          expenses: expenses || [],
          period: `${format(startOfSelectedMonth, "dd/MM/yyyy")} - ${format(endOfSelectedMonth, "dd/MM/yyyy")}`,
        };

      } else if (reportName === "Folha de Pagamento") {
        const { data: payrollEntries, error: payrollError } = await supabase
          .from('payroll_entries')
          .select('*, projects(nome), users:profiles(first_name, last_name)')
          .eq('company_id', userCompanyId)
          .gte('entry_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('entry_date', format(endOfSelectedMonth, 'yyyy-MM-dd'))
          .order('entry_date', { ascending: false });
        if (payrollError) throw payrollError;
        reportData = {
          ...reportData,
          payrollEntries: payrollEntries || [],
          period: `${format(startOfSelectedMonth, "dd/MM/yyyy")} - ${format(endOfSelectedMonth, "yyyy-MM-dd")}`,
        };

      } else if (reportName === "Progresso da Obra") {
        if (!selectedProjectIdForReport) {
          toast.error("Selecione um projeto para gerar este relatório.");
          return;
        }
        const project = projects.find(p => p.id === selectedProjectIdForReport);
        if (!project) {
          toast.error("Projeto não encontrado.");
          return;
        }

        let scheduleTasks: any[] = [];
        if (project.budget_id) {
          const { data: schedule, error: scheduleError } = await supabase
            .from('schedules')
            .select('id')
            .eq('project_id', project.id)
            .single();
          if (scheduleError && scheduleError.code !== 'PGRST116') throw scheduleError;

          if (schedule) {
            const { data: tasks, error: tasksError } = await supabase
              .from('schedule_tasks')
              .select('*')
              .eq('schedule_id', schedule.id)
              .order('ordem', { ascending: true });
            if (tasksError) throw tasksError;
            scheduleTasks = tasks || [];
          }
        }

        reportData = {
          ...reportData,
          project,
          scheduleTasks,
          period: `${format(parseISO(project.created_at), "dd/MM/yyyy")} - ${project.prazo ? format(parseISO(project.prazo), "dd/MM/yyyy") : 'N/A'}`,
        };

      } else if (reportName === "Orçamento da Obra") {
        if (!selectedProjectIdForReport) {
          toast.error("Selecione um projeto para gerar este relatório.");
          return;
        }
        const project = projects.find(p => p.id === selectedProjectIdForReport);
        if (!project) {
          toast.error("Projeto não encontrado.");
          return;
        }

        let budget: BudgetDB | null = null;
        let budgetItems: BudgetItemDB[] = [];
        if (project.budget_id) {
          const { data: fetchedBudget, error: budgetError } = await supabase
            .from('budgets')
            .select(`
              *,
              budget_chapters (
                budget_items (*)
              )
            `)
            .eq('id', project.budget_id)
            .single();
          if (budgetError && budgetError.code !== 'PGRST116') throw budgetError;
          if (fetchedBudget) {
            budget = fetchedBudget;
            budgetItems = fetchedBudget.budget_chapters.flatMap((chapter: any) => chapter.budget_items);
          }
        }

        reportData = {
          ...reportData,
          project,
          budget,
          budgetItems,
          period: `${format(parseISO(project.created_at), "dd/MM/yyyy")} - ${project.prazo ? format(parseISO(project.prazo), "dd/MM/yyyy") : 'N/A'}`,
        };

      } else if (reportName === "Catálogo de Artigos") {
        const { data: articles, error: articlesError } = await supabase
          .from('articles')
          .select('*, categories(nome)')
          .eq('company_id', userCompanyId)
          .order('codigo', { ascending: true });
        if (articlesError) throw articlesError;
        reportData = { ...reportData, articles: articles || [] };

      } else if (reportName === "Histórico de Preços") {
        // This report is more complex and would require a dedicated price history table or more advanced logic.
        // Keeping it as a placeholder for now.
        toast.info("Este relatório requer dados de histórico de preços que ainda não estão implementados.");
        return;
      } else if (reportName === "Alertas de IA") {
        const { data: alerts, error: alertsError } = await supabase
          .from('ai_alerts')
          .select('*, projects(nome)')
          .eq('company_id', userCompanyId)
          .order('created_at', { ascending: false });
        if (alertsError) throw alertsError;
        reportData = { ...reportData, alerts: alerts || [] };
      }

      generateReportContent(reportName, reportData);
    } catch (error: any) {
      toast.error(`Erro ao gerar relatório: ${error.message}`);
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setIsLoadingReport(false);
    }
  };

  if (isLoadingInitialData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40 mt-2 md:mt-0" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

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

      {/* Seletores de Parâmetros */}
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Parâmetros do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="month-selector">Mês/Ano (para relatórios mensais)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedMonth && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {selectedMonth ? format(parseISO(selectedMonth), "MMMM yyyy", { locale: pt }) : "Selecione Mês/Ano"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  captionLayout="dropdown-buttons"
                  selected={selectedMonth ? parseISO(selectedMonth) : undefined}
                  onSelect={(date) => setSelectedMonth(date ? format(date, "yyyy-MM") : format(new Date(), "yyyy-MM"))}
                  fromYear={2000}
                  toYear={new Date().getFullYear() + 5}
                  locale={pt}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="project-selector">Obra (para relatórios por projeto)</Label>
            <Select
              value={selectedProjectIdForReport || "placeholder"}
              onValueChange={(value) => setSelectedProjectIdForReport(value === "placeholder" ? null : value)}
              disabled={projects.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma obra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>Selecione uma obra</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Relatório Financeiro Mensal")} disabled={isLoadingReport}>
              {isLoadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />} Gerar Relatório
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
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Relatório de Fluxo de Caixa")} disabled={isLoadingReport}>
              {isLoadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />} Gerar Relatório
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
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Faturas")} disabled={isLoadingReport}>
              {isLoadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />} Gerar Relatório
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
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Despesas")} disabled={isLoadingReport}>
              {isLoadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />} Gerar Relatório
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
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Folha de Pagamento")} disabled={isLoadingReport}>
              {isLoadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />} Gerar Relatório
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
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Relatório Financeiro por Projeto / Obra")} disabled={isLoadingReport || !selectedProjectIdForReport}>
              {isLoadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />} Gerar Relatório
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
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Progresso da Obra")} disabled={isLoadingReport || !selectedProjectIdForReport}>
              {isLoadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />} Gerar Relatório
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
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Orçamento da Obra")} disabled={isLoadingReport || !selectedProjectIdForReport}>
              {isLoadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />} Gerar Relatório
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
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Catálogo de Artigos")} disabled={isLoadingReport}>
              {isLoadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />} Gerar Relatório
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
            <Button className="mt-6 w-full" onClick={() => handleGenerateReportClick("Histórico de Preços")} disabled={isLoadingReport}>
              {isLoadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />} Gerar Relatório
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