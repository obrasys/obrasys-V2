"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import { Outlet } from "react-router-dom";
import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

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
        className={`flex-1 p-6 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "ml-0" : "ml-0"
        }`}
      >
        {/* This header is a generic one for all pages within the layout.
            Individual pages can override or extend this with their specific titles/actions. */}
        <header className="flex items-center justify-between pb-6 border-b border-border mb-6">
          <div className="flex-grow">
            {/* The actual page title will be rendered by the Outlet content */}
          </div>
          <div className="flex items-center space-x-4">
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
        <Outlet /> {/* This is where the child routes will render */}
      </main>
    </div>
  );
};

export default MainLayout;