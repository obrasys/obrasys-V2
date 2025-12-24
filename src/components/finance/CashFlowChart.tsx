"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Invoice, Expense } from "@/schemas/invoicing-schema";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { TrendingUp } from "lucide-react";
import EmptyState from "@/components/EmptyState";

interface CashFlowChartProps {
  invoices: Invoice[];
  expenses: Expense[];
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ invoices, expenses }) => {
  // Aggregate data by month
  const aggregateData = () => {
    const monthlyData: { [key: string]: { month: string; invoices: number; expenses: number; } } = {};

    invoices.forEach(invoice => {
      const monthKey = format(parseISO(invoice.issue_date), "yyyy-MM");
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: format(parseISO(invoice.issue_date), "MMM yy", { locale: pt }), invoices: 0, expenses: 0 };
      }
      monthlyData[monthKey].invoices += invoice.total_amount;
    });

    expenses.forEach(expense => {
      const monthKey = format(parseISO(expense.due_date), "yyyy-MM");
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: format(parseISO(expense.due_date), "MMM yy", { locale: pt }), invoices: 0, expenses: 0 };
      }
      monthlyData[monthKey].expenses += expense.amount;
    });

    // Sort by month key
    return Object.keys(monthlyData)
      .sort()
      .map(key => monthlyData[key]);
  };

  const data = aggregateData();

  if (data.length === 0) {
    return (
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Fluxo de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            title="Dados de fluxo de caixa insuficientes"
            description="Adicione faturas e despesas para visualizar o fluxo de caixa do projeto."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Fluxo de Caixa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `${value}€`} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(2)}€`}
                labelFormatter={(label: string) => `Mês: ${label}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Line type="monotone" dataKey="invoices" name="Faturas" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="expenses" name="Despesas" stroke="hsl(var(--destructive))" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;