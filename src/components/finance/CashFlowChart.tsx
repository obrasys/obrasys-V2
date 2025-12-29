"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Invoice, Expense } from "@/schemas/invoicing-schema";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { TrendingUp } from "lucide-react";
import EmptyState from "@/components/EmptyState";

/* =========================
   TYPES
========================= */

interface CashFlowPoint {
  monthKey: string;
  label: string;
  entradas: number;
  saidas: number;
}

/* =========================
   COMPONENT
========================= */

interface CashFlowChartProps {
  invoices: Invoice[];
  expenses: Expense[];
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({
  invoices,
  expenses,
}) => {
  const data = useMemo(() => {
    const map = new Map<string, CashFlowPoint>();

    /* ENTRADAS — apenas faturas pagas */
    invoices
      .filter(
        (inv) =>
          inv.status === "paid" &&
          inv.payment_date
      )
      .forEach((inv) => {
        const key = format(
          parseISO(inv.payment_date),
          "yyyy-MM"
        );

        if (!map.has(key)) {
          map.set(key, {
            monthKey: key,
            label: format(
              parseISO(inv.payment_date),
              "MMM yy",
              { locale: pt }
            ),
            entradas: 0,
            saidas: 0,
          });
        }

        map.get(key)!.entradas +=
          inv.total_amount;
      });

    /* SAÍDAS — apenas despesas pagas */
    expenses
      .filter(
        (exp) =>
          exp.status === "paid" &&
          exp.payment_date
      )
      .forEach((exp) => {
        const key = format(
          parseISO(exp.payment_date),
          "yyyy-MM"
        );

        if (!map.has(key)) {
          map.set(key, {
            monthKey: key,
            label: format(
              parseISO(exp.payment_date),
              "MMM yy",
              { locale: pt }
            ),
            entradas: 0,
            saidas: 0,
          });
        }

        map.get(key)!.saidas += exp.amount;
      });

    return Array.from(map.values()).sort(
      (a, b) =>
        a.monthKey.localeCompare(
          b.monthKey
        )
    );
  }, [invoices, expenses]);

  /* =========================
     EMPTY STATE
  ========================= */

  if (data.length === 0) {
    return (
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Fluxo de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            title="Sem movimentos financeiros pagos"
            description="O fluxo de caixa será exibido quando existirem faturas ou despesas pagas."
          />
        </CardContent>
      </Card>
    );
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Fluxo de Caixa
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--muted))"
              />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) =>
                  `${v} €`
                }
              />
              <Tooltip
                formatter={(v: number) =>
                  `${v.toFixed(2)} €`
                }
                labelFormatter={(l) =>
                  `Mês: ${l}`
                }
                contentStyle={{
                  backgroundColor:
                    "hsl(var(--card))",
                  borderColor:
                    "hsl(var(--border))",
                  borderRadius:
                    "0.5rem",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="entradas"
                name="Entradas"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="saidas"
                name="Saídas"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;
