"use client";

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  DollarSign,
  HardHat,
  CalendarDays,
  Users,
  ShieldCheck,
  Banknote,
  FileText,
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Scale,
  Archive,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import TrialBanner from "@/components/TrialBanner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NavButton from "@/components/NavButton";
import { Profile } from "@/schemas/profile-schema";
import { CompanySubscriptionStatus } from "@/schemas/subscription-schema";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  profile: Profile | null;
  subscriptionStatus: CompanySubscriptionStatus | null;
  isSubscriptionBlocked: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  toggleSidebar,
  profile,
  subscriptionStatus,
  isSubscriptionBlocked,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const plan = subscriptionStatus?.subscription_plan ?? "trialing";

  const navItems = [
    { name: "Painel de Controlo", icon: LayoutDashboard, href: "/dashboard", paid: false },
    { name: "Obras", icon: HardHat, href: "/projects", paid: false },

    { name: "Orçamentos", icon: DollarSign, href: "/budgeting", paid: true },
    { name: "Cronograma", icon: CalendarDays, href: "/schedule", paid: true },
    { name: "Colaboradores", icon: Users, href: "/collaborators", paid: true },
    { name: "Gestão de Aprovações", icon: CheckSquare, href: "/approvals", paid: true },
    { name: "Financeiro", icon: Banknote, href: "/finance-management", paid: true },
    { name: "Relatórios", icon: FileText, href: "/reports", paid: true },
    { name: "Conformidade", icon: ShieldCheck, href: "/compliance", paid: true },
    { name: "Base de Preços", icon: Scale, href: "/price-database", paid: true },
    { name: "Artigos de Trabalho", icon: Archive, href: "/work-items", paid: true },
    { name: "Automação & Inteligência", icon: Zap, href: "/automation-intelligence", paid: true },

    { name: "Nossos Planos", icon: Scale, href: "/plans", paid: false },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Erro ao terminar sessão: ${error.message}`);
      return;
    }
    toast.success("Sessão terminada com sucesso!");
    navigate("/login");
  };

  const initials =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
      : "U";

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r transition-all duration-300 fixed md:relative z-50",
        isCollapsed ? "w-16" : "w-64",
        isCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/marca_nav_bar.png" alt="Obra Sys" className="h-8" />
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      {/* Perfil */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar className="h-9 w-9">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              {profile?.first_name} {profile?.last_name}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              Plano: {plan}
            </span>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const blocked = item.paid && isSubscriptionBlocked;

          return (
            <NavButton
              key={item.name}
              to={blocked ? "/plans" : item.href}
              variant="ghost"
              disabled={blocked}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm justify-start",
                location.pathname.startsWith(item.href)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground",
                isCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span>{item.name}</span>}
            </NavButton>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-4 border-t">
        {!isCollapsed && subscriptionStatus && (
          <TrialBanner subscription={subscriptionStatus} />
        )}

        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 justify-start",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
