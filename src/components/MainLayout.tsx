"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import { Outlet } from "react-router-dom";
import { Bell, Settings, Menu } from "lucide-react"; // Importar o ícone Menu
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile"; // Importar o hook

const MainLayout = () => {
  const isMobile = useIsMobile();
  // A sidebar deve estar colapsada por padrão em dispositivos móveis
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(isMobile);

  // Atualizar o estado da sidebar quando o isMobile mudar
  React.useEffect(() => {
    setIsSidebarCollapsed(isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />
      <main
        className={`flex-1 p-4 md:p-6 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "ml-0" : "ml-0" // A classe ml-0 é suficiente, pois a sidebar não empurra o conteúdo
        }`}
      >
        <header className="flex items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          {/* Menu Hamburger para Mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden text-muted-foreground hover:text-foreground" // Visível apenas em mobile
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-grow">
            {/* O título da página será renderizado pelo conteúdo do Outlet */}
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
              BC
            </div>
          </div>
        </header>
        <Outlet /> {/* Aqui é onde as rotas filhas serão renderizadas */}
      </main>
    </div>
  );
};

export default MainLayout;