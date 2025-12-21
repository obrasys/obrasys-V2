"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
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
  Database,
  ClipboardList,
  LogOut,
  Zap, // Import Zap icon for Automation
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();

  const navItems = [
    {
      name: "Painel de Controlo",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      name: "Orçamentos",
      icon: DollarSign,
      href: "/budgeting",
    },
    {
      name: "Obras",
      icon: HardHat,
      href: "/projects",
    },
    {
      name: "Cronograma",
      icon: CalendarDays,
      href: "/schedule",
    },
    {
      name: "Colaboradores",
      icon: Users,
      href: "/collaborators",
    },
    {
      name: "Conformidade",
      icon: ShieldCheck,
      href: "/compliance",
    },
    {
      name: "Financeiro",
      icon: Banknote,
      href: "/finance-management",
    },
    {
      name: "Relatórios",
      icon: FileText,
      href: "/reports",
    },
    {
      name: "Base de Preços",
      icon: Database,
      href: "/price-database",
    },
    {
      name: "Artigos de Trabalho",
      icon: ClipboardList,
      href: "/work-items",
    },
    {
      name: "Automação & Inteligência", // New item
      icon: Zap, // Using Zap icon
      href: "/automation-intelligence",
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out fixed md:relative z-50", // Adicionado fixed e z-50 para mobile
        isCollapsed ? "w-16" : "w-64",
        isCollapsed && "md:w-16", // Colapsado em mobile e desktop
        !isCollapsed && "md:w-64", // Expandido em desktop
        isCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0" // Esconder/mostrar sidebar em mobile
      )}
    >
      {/* Header / Logo */}
      <div
        className={cn(
          "flex items-center justify-between h-16 px-4 border-b border-sidebar-border",
          isCollapsed && "justify-center px-0",
        )}
      >
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/marca_nav_bar.png" alt="Obra Sys Logo" className="h-8 w-auto" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed ? "mx-auto" : "ml-auto",
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Profile */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 border-b border-sidebar-border",
          isCollapsed && "flex-col py-4",
        )}
      >
        <Avatar className="h-9 w-9">
          <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
          <AvatarFallback>BC</AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Bezerrra Cavalcanti</span>
            <span className="text-xs text-muted-foreground">Administrador</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              location.pathname === item.href
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground",
              isCollapsed && "justify-center",
            )}
          >
            <item.icon className="h-5 w-5" />
            {!isCollapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer / Trial & Logout */}
      <div className="p-4 space-y-4 border-t border-sidebar-border">
        {!isCollapsed && (
          <Card className="bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-blue-500" />
              <span>Trial Gratuito</span>
              <span className="ml-auto px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs">
                10d
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              10 dias restantes
            </p>
          </Card>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center gap-3 justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center px-0",
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