"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, Settings, Menu, LogOut, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
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
import EditProfileModal from "@/components/profile/EditProfileModal";
import { seedDefaultArticles } from "@/utils/initial-data";
import { useNotification } from "@/contexts/NotificationContext";
import { Profile } from "@/schemas/profile-schema"; // Import Profile schema

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  profile: Profile | null; // Use Profile schema
}

const MainLayout = () => {
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(isMobile);
  const { user, profile: sessionProfile, isLoading: isSessionLoading } = useSession(); // Get profile from session context
  const [profile, setProfile] = React.useState<Profile | null>(null); // Local state for profile
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    setIsSidebarCollapsed(isMobile);
  }, [isMobile]);

  const fetchProfile = React.useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, role, company_id, plan_type') // Fetch plan_type
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.warn("[MainLayout] No profile found for user. Assuming trigger will handle or profile is being created.");
        setProfile(null);
      } else {
        console.error("[MainLayout] Erro ao carregar perfil:", profileError);
        toast.error(`Erro ao carregar dados do perfil: ${profileError.message}`);
        setProfile(null);
      }
    } else {
      setProfile(profileData);
    }
  }, [user]);

  React.useEffect(() => {
    if (!isSessionLoading && user) {
      fetchProfile();
    }
    console.log("[MainLayout] User:", user, "Profile:", profile, "UserCompanyId from profile:", profile?.company_id);
  }, [user, isSessionLoading, fetchProfile]);


  // NEW: Effect to seed default articles if not already seeded for the company
  React.useEffect(() => {
    const checkAndSeedArticles = async () => {
      if (profile?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('default_articles_seeded')
          .eq('id', profile.company_id)
          .single();

        if (companyError) {
          console.error("[MainLayout] Erro ao verificar estado de seeding da empresa:", companyError);
          return;
        }

        if (!companyData?.default_articles_seeded) {
          console.log("[MainLayout] Seeding default articles for new company:", profile.company_id);
          await seedDefaultArticles(profile.company_id);
          // After seeding, refetch profile to update the company_id (if it was just created)
          // and ensure the `default_articles_seeded` flag is recognized.
          fetchProfile();
        }
      }
    };

    if (!isSessionLoading && user && profile) {
      checkAndSeedArticles();
    }
  }, [isSessionLoading, user, profile, fetchProfile]);


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

  const userInitials: string = profile?.first_name && profile?.last_name
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'US';

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        profile={profile}
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
            {/* Notification Bell with Badge */}
            <NotificationBell /> {/* NEW component for the bell */}
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage key={profile?.avatar_url || 'default-user-avatar'} src={profile?.avatar_url || undefined} alt="User Avatar" />
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
                <DropdownMenuItem onClick={() => setIsEditProfileModalOpen(true)}>
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
        <Outlet />
      </main>

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onProfileUpdated={fetchProfile}
      />
    </div>
  );
};

// NEW: NotificationBell component to display the bell icon and badge
const NotificationBell: React.FC = () => {
  const { notificationCount, hasNotifications } = useNotification();
  const navigate = useNavigate();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => navigate('/dashboard')} // Navigate to dashboard to see notifications
      >
        <Bell className="h-5 w-5" />
      </Button>
      {hasNotifications && (
        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-background bg-red-500" />
      )}
    </div>
  );
};

export default MainLayout;