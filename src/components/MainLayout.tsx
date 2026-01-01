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

  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    React.useState(isMobile);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] =
    React.useState(false);

  // ✅ Build marker (não no topo do módulo)
  React.useEffect(() => {
    console.log("BUILD_MARKER_MAINLAYOUT", "2026-01-01-A");
  }, []);

  React.useEffect(() => {
    setIsSidebarCollapsed(isMobile);
  }, [isMobile]);

  /* -------------------------------------------------- */
  /* 🔒 GUARD CORRETO (ordem importa)                    */
  /* -------------------------------------------------- */

  // 1) ainda a resolver auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        A carregar sessão…
      </div>
    );
  }

  // 2) não autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3) autenticado mas profile ainda não veio (ou foi bloqueado)
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        A carregar perfil…
      </div>
    );
  }

  /* -------------------------------------------------- */
  /* 🏢 SUBSCRIÇÃO (só com profile válido)               */
  /* -------------------------------------------------- */

  const companyId = profile.company_id ?? null;

  const {
    data: subscriptionStatus,
    loading: isLoadingSubscription,
  } = useSubscriptionStatus(companyId);

  if (isLoadingSubscription) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        A verificar subscrição…
      </div>
    );
  }

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
  }, [
    isSubscriptionBlocked,
    location.pathname,
    navigate,
  ]);

  /* -------------------------------------------------- */
  /* 🔧 ACTIONS                                         */
  /* -------------------------------------------------- */

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(
        `Erro ao terminar sessão: ${error.message}`
      );
    } else {
      toast.success("Sessão terminada com sucesso!");
      navigate("/login");
    }
  };

  const firstName = profile.first_name || "";
  const lastName = profile.last_name || "";

  const userInitials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : user.email?.charAt(0).toUpperCase() ?? "U";

  /* -------------------------------------------------- */
  /* 🖥️ RENDER                                         */
  /* -------------------------------------------------- */

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          profile={profile}
          subscriptionStatus={subscriptionStatus ?? null}
          isSubscriptionBlocked={isSubscriptionBlocked}
        />
      </div>

      <main className="flex-1 p-4 md:p-6">
        <header className="flex items-center justify-between pb-4 border-b mb-4">
          <div className="md:hidden">
            <MobileSidebar
              profile={profile}
              subscriptionStatus={subscriptionStatus ?? null}
              isSubscriptionBlocked={isSubscriptionBlocked}
            >
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
                <Button
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile.avatar_url ?? undefined}
                    />
                    <AvatarFallback>
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56"
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium">
                      {firstName} {lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() =>
                    setIsEditProfileModalOpen(true)
                  }
                >
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() =>
                    navigate("/profile?tab=company")
                  }
                >
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
        onClose={() =>
          setIsEditProfileModalOpen(false)
        }
        onProfileUpdated={() => {}}
      />
    </div>
  );
};

/* -------------------------------------------------- */
/* 🔔 Notification Bell                                */
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