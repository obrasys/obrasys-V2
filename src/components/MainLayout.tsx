"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, Settings, Menu, LogOut, User, Building2 } from "lucide-react"; // Importar o ícone Menu e outros
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile"; // Importar o hook
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EditProfileModal from "@/components/profile/EditProfileModal"; // Importar o novo modal

const MainLayout = () => {
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(isMobile);
  const { user, isLoading: isSessionLoading } = useSession();
  const [profile, setProfile] = React.useState<{ first_name: string | null; last_name: string | null; avatar_url: string | null; role: string | null; } | null>(null);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = React.useState(false); // Estado para o modal
  const navigate = useNavigate();

  React.useEffect(() => {
    setIsSidebarCollapsed(isMobile);
  }, [isMobile]);

  const fetchProfile = React.useCallback(async () => {
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Erro ao carregar perfil:", error);
        toast.error("Erro ao carregar dados do perfil.");
      } else {
        setProfile(data);
      }
    }
  }, [user]);

  React.useEffect(() => {
    if (!isSessionLoading && user) {
      fetchProfile();
    }
  }, [user, isSessionLoading, fetchProfile]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Erro ao terminar sessão: ${error.message}`);
    } else {
      toast.success('Sessão terminada com sucesso!');
      navigate('/login');
    }
  };

  const userInitials = profile?.first_name && profile?.last_name
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'US'; // Fallback to email initial

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />
      <main
        className={`flex-1 p-4 md:p-6 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "ml-0" : "ml-0"
        }`}
      >
        <header className="flex items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden text-muted-foreground hover:text-foreground"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} alt="User Avatar" />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsEditProfileModalOpen(true)}> {/* Abre o modal */}
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile?tab=company')}>
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Gestão da Empresa</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Terminar Sessão</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <Outlet /> {/* Aqui é onde as rotas filhas serão renderizadas */}
      </main>

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onProfileUpdated={fetchProfile} // Passa a função para atualizar o perfil no MainLayout
      />
    </div>
  );
};

export default MainLayout;