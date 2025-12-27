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
import ProtectedRoute from "@/components/ProtectedRoute";

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
                <Route index element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="budgeting" element={<ProtectedRoute><Budgeting /></ProtectedRoute>} />
                <Route path="budgeting/new" element={<ProtectedRoute><NewBudgetPage /></ProtectedRoute>} />
                <Route path="budgeting/edit/:budgetId" element={<ProtectedRoute><NewBudgetPage /></ProtectedRoute>} />
                <Route path="project-management" element={<ProtectedRoute><ProjectManagement /></ProtectedRoute>} />
                <Route path="supply-chain" element={<ProtectedRoute><SupplyChain /></ProtectedRoute>} />
                <Route path="crm-portal" element={<ProtectedRoute><CRMPortal /></ProtectedRoute>} />
                <Route path="automation-intelligence" element={<ProtectedRoute><AutomationIntelligence /></ProtectedRoute>} />
                <Route path="automation-intelligence/ai-alerts" element={<ProtectedRoute><AIAssistantAlertsPage /></ProtectedRoute>} />
                <Route path="automation-intelligence/replanning-suggestions" element={<ProtectedRoute><ReplanningSuggestionsPage /></ProtectedRoute>} />
                <Route path="automation-intelligence/ai-assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
                <Route path="automation-intelligence/performance-analysis" element={<ProtectedRoute><PerformanceAnalysisPage /></ProtectedRoute>} />
                <Route path="compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
                <Route path="compliance/livro-de-obra" element={<ProtectedRoute><LivroDeObraPage /></ProtectedRoute>} />
                <Route path="compliance/checklist" element={<ProtectedRoute><ComplianceChecklistPage /></ProtectedRoute>} />
                <Route path="projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
                <Route path="schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
                <Route path="finance-management" element={<ProtectedRoute><FinanceManagement /></ProtectedRoute>} />
                <Route path="accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
                <Route path="finance-management/payroll-integration" element={<ProtectedRoute><PayrollIntegrationPage /></ProtectedRoute>} />
                <Route path="finance-management/dashboards" element={<ProtectedRoute><FinancialDashboardsPage /></ProtectedRoute>} />
                <Route path="work-items" element={<ProtectedRoute><WorkItemsPage /></ProtectedRoute>} />
                <Route path="price-database" element={<ProtectedRoute><PriceDatabasePage /></ProtectedRoute>} />
                <Route path="approvals" element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} />
                <Route path="collaborators" element={<ProtectedRoute><CollaboratorsPage /></ProtectedRoute>} />
                <Route path="reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
                <Route path="plans" element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />
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