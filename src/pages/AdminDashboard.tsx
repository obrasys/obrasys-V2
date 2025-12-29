"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Database } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  company_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  plan_type: string | null;
  created_at: string | null;
  updated_at: string | null;
  active_company_id: string | null;
};

type SubscriptionRow = {
  id: string;
  company_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  plan_type: string;
  trial_start: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  trialing: "bg-blue-100 text-blue-700",
  past_due: "bg-yellow-100 text-yellow-700",
  canceled: "bg-red-100 text-red-700",
  incomplete: "bg-orange-100 text-orange-700",
  paused: "bg-gray-200 text-gray-700",
};

const planColors: Record<string, string> = {
  iniciante: "bg-purple-100 text-purple-700",
  profissional: "bg-indigo-100 text-indigo-700",
  trialing: "bg-blue-100 text-blue-700",
};

function prettyDate(d?: string | null) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}

function ProfilesTable({ data }: { data: ProfileRow[] }) {
  const rows = useMemo(() => data, [data]);
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="p-3">Usuário</th>
            <th className="p-3">Plano</th>
            <th className="p-3">Função</th>
            <th className="p-3">Empresa</th>
            <th className="p-3">Telefone</th>
            <th className="p-3">Criado em</th>
            <th className="p-3">Atualizado em</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-muted" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {(r.first_name || "") + " " + (r.last_name || "") || r.id}
                    </span>
                    <span className="text-xs text-muted-foreground">{r.id}</span>
                  </div>
                </div>
              </td>
              <td className="p-3">
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${
                    planColors[(r.plan_type || "").toLowerCase()] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {r.plan_type || "-"}
                </span>
              </td>
              <td className="p-3">
                <Badge variant="outline" className="capitalize">
                  {r.role}
                </Badge>
              </td>
              <td className="p-3">
                <span className="text-xs">{r.company_id || "-"}</span>
              </td>
              <td className="p-3">{r.phone || "-"}</td>
              <td className="p-3">{prettyDate(r.created_at)}</td>
              <td className="p-3">{prettyDate(r.updated_at)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="p-6 text-center text-muted-foreground" colSpan={7}>
                Nenhum usuário encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SubscriptionsTable({ data }: { data: SubscriptionRow[] }) {
  const rows = useMemo(() => data, [data]);
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="p-3">Assinatura</th>
            <th className="p-3">Plano</th>
            <th className="p-3">Status</th>
            <th className="p-3">Trial</th>
            <th className="p-3">Período atual</th>
            <th className="p-3">Criado em</th>
            <th className="p-3">Atualizado em</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-3">
                <div className="flex flex-col">
                  <span className="font-medium">{r.stripe_subscription_id || r.id}</span>
                  <span className="text-xs text-muted-foreground">Empresa: {r.company_id}</span>
                </div>
              </td>
              <td className="p-3">
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${
                    planColors[(r.plan_type || "").toLowerCase()] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {r.plan_type}
                </span>
              </td>
              <td className="p-3">
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${
                    statusColors[(r.status || "").toLowerCase()] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td className="p-3">
                <div className="text-xs">
                  <div>Início: {prettyDate(r.trial_start)}</div>
                  <div>Fim: {prettyDate(r.trial_end)}</div>
                </div>
              </td>
              <td className="p-3">{prettyDate(r.current_period_end)}</td>
              <td className="p-3">{prettyDate(r.created_at)}</td>
              <td className="p-3">{prettyDate(r.updated_at)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="p-6 text-center text-muted-foreground" colSpan={7}>
                Nenhuma assinatura encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [subStatusFilter, setSubStatusFilter] = useState<string>("all");
  const [subPlanFilter, setSubPlanFilter] = useState<string>("all");

  useEffect(() => {
    setLoadingProfiles(true);
    supabase.from("profiles").select("*")
      .then(({ data, error }) => {
        if (error) {
          toast({
            title: "Erro ao carregar usuários",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        setProfiles((data || []) as ProfileRow[]);
      })
      .finally(() => setLoadingProfiles(false));

    setLoadingSubs(true);
    supabase.from("subscriptions").select("*")
      .then(({ data, error }) => {
        if (error) {
          toast({
            title: "Erro ao carregar assinaturas",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        setSubscriptions((data || []) as SubscriptionRow[]);
      })
      .finally(() => setLoadingSubs(false));
  }, []);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const name = ((p.first_name || "") + " " + (p.last_name || "")).toLowerCase();
      const matchesSearch =
        name.includes(userSearch.toLowerCase()) ||
        (p.id || "").toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = roleFilter === "all" || p.role === roleFilter;
      const matchesPlan = planFilter === "all" || (p.plan_type || "") === planFilter;
      return matchesSearch && matchesRole && matchesPlan;
    });
  }, [profiles, userSearch, roleFilter, planFilter]);

  const filteredSubs = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchesStatus = subStatusFilter === "all" || s.status === subStatusFilter;
      const matchesPlan = subPlanFilter === "all" || s.plan_type === subPlanFilter;
      return matchesStatus && matchesPlan;
    });
  }, [subscriptions, subStatusFilter, subPlanFilter]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Admin: Assinaturas e Usuários</h1>
          <p className="text-muted-foreground">
            Painel independente para visualizar e gerir informações de usuários e assinaturas.
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  <SectionHeader
                    title="Lista de usuários"
                    subtitle="Pesquise e filtre usuários por função e plano"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    placeholder="Pesquisar por nome ou ID"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as funções</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="fiscal">Fiscal</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="member">Membro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os planos</SelectItem>
                      <SelectItem value="trialing">Trial</SelectItem>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUserSearch("");
                      setRoleFilter("all");
                      setPlanFilter("all");
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>

                <Separator />

                {loadingProfiles ? (
                  <div className="p-6 text-center text-muted-foreground">Carregando usuários...</div>
                ) : (
                  <ProfilesTable data={filteredProfiles} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  <SectionHeader
                    title="Lista de assinaturas"
                    subtitle="Visualize status, plano e períodos"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Select value={subStatusFilter} onValueChange={setSubStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="trialing">Trial</SelectItem>
                      <SelectItem value="past_due">Em atraso</SelectItem>
                      <SelectItem value="canceled">Cancelada</SelectItem>
                      <SelectItem value="incomplete">Incompleta</SelectItem>
                      <SelectItem value="paused">Pausada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={subPlanFilter} onValueChange={setSubPlanFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os planos</SelectItem>
                      <SelectItem value="trialing">Trial</SelectItem>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="sm:col-span-2 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubStatusFilter("all");
                        setSubPlanFilter("all");
                      }}
                    >
                      Limpar filtros
                    </Button>
                    <Button
                      onClick={async () => {
                        setLoadingSubs(true);
                        const { data, error } = await supabase.from("subscriptions").select("*");
                        if (error) {
                          toast({
                            title: "Erro ao recarregar assinaturas",
                            description: error.message,
                            variant: "destructive",
                          });
                        } else {
                          setSubscriptions((data || []) as SubscriptionRow[]);
                          toast({ title: "Assinaturas atualizadas" });
                        }
                        setLoadingSubs(false);
                      }}
                    >
                      Recarregar
                    </Button>
                  </div>
                </div>

                <Separator />

                {loadingSubs ? (
                  <div className="p-6 text-center text-muted-foreground">Carregando assinaturas...</div>
                ) : (
                  <SubscriptionsTable data={filteredSubs} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}