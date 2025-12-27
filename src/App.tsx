import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionContextProvider } from "@/components/SessionContextProvider";
import MainLayout from "@/components/MainLayout";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import ProfilePage from "@/pages/ProfilePage";
import Budgeting from "@/pages/Budgeting";
import NewBudgetPage from "@/pages/NewBudgetPage";
import ProjectManagement from "@/pages/ProjectManagement";
import SupplyChain from "@/pages/SupplyChain";
import CRMPortal from "@/pages/CRMPortal";
import AutomationIntelligence from "@/pages/AutomationIntelligence";
import CompliancePage from "@/pages/CompliancePage";
import LivroDeObraPage from "@/pages/LivroDeObraPage";
import ComplianceChecklistPage from "@/pages/ComplianceChecklistPage";
import AIAssistantAlertsPage from "@/pages/AIAssistantAlertsPage";
import ReplanningSuggestionsPage from "@/pages/ReplanningSuggestionsPage";
import AIAssistantPage from "@/pages/AIAssistantPage";
import PerformanceAnalysisPage from "@/pages/PerformanceAnalysisPage";
import ProjectsPage from "@/pages/ProjectsPage";
import AccountsPage from "@/pages/AccountsPage";
import PayrollIntegrationPage from "@/pages/PayrollIntegrationPage";
import FinancialDashboardsPage from "@/pages/FinancialDashboardsPage";
import WorkItemsPage from "@/pages/WorkItemsPage";
import PriceDatabasePage from "@/pages/PriceDatabasePage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import CollaboratorsPage from "@/pages/CollaboratorsPage";
import ReportsPage from "@/pages/ReportsPage";
import SchedulePage from "@/pages/SchedulePage";
import PlansPage from "@/pages/PlansPage"; // NEW: Import PlansPage

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/contexts/NotificationContext";
import FinanceManagement from "@/pages/FinanceManagement"; // Importar FinanceManagement

const App = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SessionContextProvider>
        <Toaster richColors position="top-right" />
        <TooltipProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Index />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="budgeting" element={<Budgeting />} />
                <Route path="budgeting/new" element={<NewBudgetPage />} />
                <Route path="budgeting/edit/:budgetId" element={<NewBudgetPage />} />
                <Route path="project-management" element={<ProjectManagement />} />
                <Route path="supply-chain" element={<SupplyChain />} />
                <Route path="crm-portal" element={<CRMPortal />} />
                <Route path="automation-intelligence" element={<AutomationIntelligence />} />
                <Route path="automation-intelligence/ai-alerts" element={<AIAssistantAlertsPage />} />
                <Route path="automation-intelligence/replanning-suggestions" element={<ReplanningSuggestionsPage />} />
                <Route path="automation-intelligence/ai-assistant" element={<AIAssistantPage />} />
                <Route path="automation-intelligence/performance-analysis" element={<PerformanceAnalysisPage />} />
                <Route path="compliance" element={<CompliancePage />} />
                <Route path="compliance/livro-de-obra" element={<LivroDeObraPage />} />
                <Route path="compliance/checklist" element={<ComplianceChecklistPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="finance-management" element={<FinanceManagement />} /> {/* Rota corrigida */}
                <Route path="accounts" element={<AccountsPage />} />
                <Route path="finance-management/payroll-integration" element={<PayrollIntegrationPage />} />
                <Route path="finance-management/dashboards" element={<FinancialDashboardsPage />} />
                <Route path="work-items" element={<WorkItemsPage />} />
                <Route path="price-database" element={<PriceDatabasePage />} />
                <Route path="approvals" element={<ApprovalsPage />} />
                <Route path="collaborators" element={<CollaboratorsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="plans" element={<PlansPage />} /> {/* NEW: Plans Page Route */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </NotificationProvider>
        </TooltipProvider>
      </SessionContextProvider>
    </BrowserRouter>
  );
};

export default App;