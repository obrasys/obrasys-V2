"use client";

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import NavButton from "@/components/NavButton";
import {
  LayoutDashboard,
  DollarSign,
  HardHat,
  CalendarDays,
  Users,
  ShieldCheck,
  Banknote,
  FileText,
  Scale,
  Archive,
  Zap,
  LogOut,
} from "lucide-react";
import { Profile } from "@/schemas/profile-schema";
import { useSession } from "@/components/SessionContextProvider";
import { hasPlan, isAdmin } from "@/utils/access";

interface MobileSidebarProps {
  profile: Profile | null;
  children: React.ReactNode; // Trigger button (menu icon)
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ profile, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSession();

  const userPlanType = profile?.plan_type || "trialing";
  const adminBypass =
    isAdmin(profile) || ((user?.email || "").toLowerCase() === "snapimoveis@gmail.com");

  const navItems = [
    { name: "Painel de Controlo", icon: LayoutDashboard, href: "/dashboard", minPlan: "trialing" },
    { name: "Orçamentos", icon: DollarSign, href: "/budgeting", minPlan: "trialing" },
    { name: "Obras", icon: HardHat, href: "/projects", minPlan: "trialing" },
    { name: "Cronograma", icon: CalendarDays, href: "/schedule", minPlan: "profissional" },
    { name: "Colaboradores", icon: Users, href: "/collaborators", minPlan: "profissional" },
    { name: "Conformidade", icon: ShieldCheck, href: "/compliance", minPlan: "trialing" },
    { name: "Gestão de Aprovações", icon: Zap, href: "/approvals", minPlan: "profissional" },
    { name: "Financeiro", icon: Banknote, href: "/finance-management", minPlan: "trialing" },
    { name: "Relatórios", icon: FileText, href: "/reports", minPlan: "trialing" },
    { name: "Nossos Planos", icon: Zap, href: "/plans", minPlan: "trialing" },
    { name: "Base de Preços", icon: Scale, href: "/price-database", minPlan: "trialing" },
    { name: "Artigos de Trabalho", icon: Archive, href: "/work-items", minPlan: "trialing" },
    { name: "Automação & Inteligência", icon: Zap, href: "/automation-intelligence", minPlan: "profissional" },
  ];

  const isPlanSufficient = (requiredPlan: string) =>
    adminBypass || hasPlan(userPlanType, requiredPlan);

  const userInitials =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
      : user?.email?.charAt(0).toUpperCase() || "US";

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
          <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.avatar_url || undefined} alt="User Avatar" />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">
                {profile?.first_name} {profile?.last_name}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {profile?.role || "Cliente"}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                Plano: {userPlanType.replace("_", " ")}
              </span>
            </div>
          </div>

          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavButton
                key={item.name}
                to={item.href}
                variant="ghost"
                className={cn(
                  "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium justify-start",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  location.pathname === item.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground"
                )}
                disabled={!isPlanSufficient(item.minPlan)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavButton>
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <NavButton
              to="/login"
              variant="ghost"
              onClick={() => navigate("/login")}
              className="w-full flex items-center gap-3 justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </NavButton>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;