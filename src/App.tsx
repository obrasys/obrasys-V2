import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Budgeting from "./pages/Budgeting";
import ProjectManagement from "./pages/ProjectManagement";
import SupplyChain from "./pages/SupplyChain";
import FinanceManagement from "./pages/FinanceManagement";
import CRMPortal from "./pages/CRMPortal";
import AutomationIntelligence from "./pages/AutomationIntelligence";
import MainLayout from "./components/MainLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { SessionContextProvider, useSession } from "./components/SessionContextProvider";

// Placeholder pages for sidebar navigation
import ProjectsPage from "./pages/ProjectsPage";
import SchedulePage from "./pages/SchedulePage";
import CollaboratorsPage from "./pages/CollaboratorsPage";
import CompliancePage from "./pages/CompliancePage";
import ReportsPage from "./pages/ReportsPage";
import PriceDatabasePage from "./pages/PriceDatabasePage";
import WorkItemsPage from "./pages/WorkItemsPage";

// New pages for Automation & Intelligence module
import AlertsConfigurationPage from "./pages/AlertsConfigurationPage";
import ReplanningSuggestionsPage from "./pages/ReplanningSuggestionsPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import PerformanceAnalysisPage from "./pages/PerformanceAnalysisPage";


const queryClient = new QueryClient();

// ProtectedRoute component to check authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div>A carregar...</div>; // Or a loading spinner
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// TEMPORARILY SIMPLIFIED APPCONTENT FOR DIAGNOSIS
const AppContent = () => (
  <div>
    <h1>App Content Placeholder</h1>
    <p>If you see this, the issue is likely within the Routes definition.</p>
  </div>
);

const App = () => (
  <React.Fragment>
    <Toaster />
    <Sonner />
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <SessionContextProvider>
            <AppContent />
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </React.Fragment>
);

export default App;