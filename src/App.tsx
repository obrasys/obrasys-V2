import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip"; // Re-included
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

const AppContent = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    {/* Routes that use the MainLayout and are protected */}
    <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="budgeting" element={<Budgeting />} />
      <Route path="project-management" element={<ProjectManagement />} />
      <Route path="supply-chain" element={<SupplyChain />} />
      <Route path="finance-management" element={<FinanceManagement />} />
      <Route path="crm-portal" element={<CRMPortal />} />
      <Route path="automation-intelligence" element={<AutomationIntelligence />} />

      {/* Placeholder routes for sidebar */}
      <Route path="projects" element={<ProjectsPage />} />
      <Route path="schedule" element={<SchedulePage />} />
      <Route path="collaborators" element={<CollaboratorsPage />} />
      <Route path="compliance" element={<CompliancePage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="price-database" element={<PriceDatabasePage />} />
      <Route path="work-items" element={<WorkItemsPage />} />

      {/* New routes for Automation & Intelligence features */}
      <Route path="automation-intelligence/alerts-configuration" element={<AlertsConfigurationPage />} />
      <Route path="automation-intelligence/replanning-suggestions" element={<ReplanningSuggestionsPage />} />
      <Route path="automation-intelligence/ai-assistant" element={<AIAssistantPage />} />
      <Route path="automation-intelligence/performance-analysis" element={<PerformanceAnalysisPage />} />
    </Route>

    {/* Routes that do NOT use the MainLayout (e.g., landing pages, 404) */}
    <Route path="/modules" element={<Index />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <React.Fragment>
    <Toaster />
    <Sonner />
    <QueryClientProvider client={queryClient}>
      <TooltipProvider> {/* Re-included */}
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