"use client";

import React from "react";
import { Outlet, useNavigate, Navigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { Bell, Settings, Menu, LogOut, User, Building2 } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import EditProfileModal from "@/components/profile/EditProfileModal";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { useNotification } from "@/contexts/NotificationContext";
import { toast } from "sonner";

const MainLayout = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { user, profile, isLoading } = useSession();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(isMobile);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = React.useState(false);

  React.useEffect(() => {
    setIsSidebarCollapsed(isMobile);
  }, [isMobile]);

  /* ------------------------------------------------------------------ */
  /* 🔐 PROTEÇÃO DE RENDER (CRÍTICO)                                     */
  /* ------------------------------------------------------------------ */

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        A carregar sessão…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        A preparar o teu perfil…
      </div>
    );
  }

  /* ------------------------------------------------------------------ */

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Erro ao terminar sessão: ${error.message}`);
    } else {
      toast.success("Sessão terminada com sucesso!");
      navigate("/login");
    }
  };

  const userInitials =
    profile.first_name && profile.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
      : user.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          profile={profile}
        />
      </div>

      {/* Conteúdo */}
      <main className="flex-1 p-4 md:p-6">
        <header className="flex items-center justify-between pb-4 border-b mb-4">
          {/* Mobile menu */}
          <div className="md:hidden">
            <MobileSidebar profile={profile}>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </MobileSidebar>
          </div>

          <div className="flex-grow" />

          <div className="flex items-center gap-2">
            <NotificationBell />

            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url ?? undefined} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium">
                      {profile.first_name} {profile.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setIsEditProfileModalOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate("/profile?tab=company")}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Gestão da Empresa
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Terminar Sessão
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <Outlet />
      </main>

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 🔔 Notification Bell                                                */
/* ------------------------------------------------------------------ */

const NotificationBell: React.FC = () => {
  const { hasNotifications } = useNotification();
  const navigate = useNavigate();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/dashboard")}
      >
        <Bell className="h-5 w-5" />
      </Button>

      {hasNotifications && (
        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
      )}
    </div>
  );
};

export default MainLayout;