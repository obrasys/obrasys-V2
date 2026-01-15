"use client";

import React from "react";
import {
  Outlet,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  Bell,
  Settings,
  Menu,
  LogOut,
  User,
  Building2,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import EditProfileModal from "@/components/profile/EditProfileModal";

import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { supabase } from "@/integrations/supabase/client";
import { useNotification } from "@/contexts/NotificationContext";
import { toast } from "sonner";

/* =========================
   CONFIG
========================= */

const PAID_ROUTES = [
  "/dashboard",
  "/projects",
  "/budgeting",
  "/schedule",
  "/collaborators",
  "/approvals",
  "/finance-management",
  "/reports",
  "/compliance",
  "/price-database",
  "/work-items",
  "/automation-intelligence",
];

/* =========================
   COMPONENT
========================= */

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const { user, profile, isLoading } = useSession();

  console.log("[DEBUG AGENT] MainLayout render state:", {
    hasUser: !!user,
    hasProfile: !!profile,
    isLoading
  });

  // Só resolve companyId quando profile existir
  const companyId = profile?.company_id ?? null;

  // Evita chamar o hook com undefined (ordem estável e sem loops)
  const { data: subscriptionStatus, loading: isLoadingSubscription } =
    useSubscriptionStatus(companyId);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(isMobile);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = React.useState(false);

  React.useEffect(() => {
    setIsSidebarCollapsed(isMobile);
  }, [isMobile]);

  // MOVIDO: calcular bloqueio e declarar useEffect ANTES de qualquer return
  // MOVIDO: calcular bloqueio e declarar useEffect ANTES de qualquer return
  const isSubscriptionBlocked =
    subscriptionStatus?.computed_status === "expired";

  React.useEffect(() => {
    if (
      isSubscriptionBlocked &&
      PAID_ROUTES.some((route) =>
        location.pathname.startsWith(route)
      )
    ) {
      navigate("/plans", { replace: true });
    }
  }, [isSubscriptionBlocked, location.pathname, navigate]);

  // Seeding check (Rebuilt Logic)
  // We run this once when profile is loaded to ensure data exists.
  // We capture errors to avoid breaking the UI.
  React.useEffect(() => {
    if (user && profile?.company_id) {
      import("@/utils/initial-data").then(async ({ seedDefaultArticles, ensureDefaultCategories }) => {
        try {
          // Run silently in background
          await Promise.all([
            ensureDefaultCategories(profile.company_id),
            seedDefaultArticles(profile.company_id)
          ]);
        } catch (err) {
          console.warn("[MainLayout] Seeding check failed (non-critical):", err);
        }
      }).catch(err => console.error("Failed to load seeding utils", err));
    }
  }, [user, profile?.company_id]);

  // 1. CARREGANDO: Mostra loader simples
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">A carregar sua sessão...</p>
        </div>
      </div>
    );
  }

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

  // 2. ERRO: Não está carregando, mas não tem perfil (e deveria ter, pois ProtectedRoute já validou session)
  // Isso acontece quando a sessão existe mas o fetch do profile falhou.
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <User className="h-8 w-8 text-red-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Não foi possível carregar seu perfil
            </h1>
            <p className="text-muted-foreground">
              Sua sessão está ativa, mas houve um erro ao recuperar seus dados de perfil.
              Isso pode ocorrer devido a uma falha momentânea de conexão.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto"
            >
              Tentar Novamente
            </Button>

            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full sm:w-auto"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair e Entrar
            </Button>
          </div>
        </div>
      </div>
    );
  }



  const firstName = profile?.first_name || "";
  const lastName = profile?.last_name || "";
  const userInitials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          profile={profile}
          subscriptionStatus={subscriptionStatus ?? null}
        />
      </div>

      <main className="flex-1 p-4 md:p-6">
        <header className="flex items-center justify-between pb-4 border-b mb-4">
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
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium">
                      {firstName} {lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email}
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
        onProfileUpdated={() => { }}
      />
    </div>
  );
};

/* -------------------------------------------------- */
/* 🔔 Notification Bell                               */
/* -------------------------------------------------- */

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