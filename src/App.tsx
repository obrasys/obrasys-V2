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

import { Toaster } from "@/components/ui/sonner";

// Diagnostic logs
console.log("App.tsx: MainLayout is", typeof MainLayout);
console.log("App.tsx: Index is", typeof Index);
console.log("App.tsx: Login is", typeof Login);
console.log("App.tsx: Signup is", typeof Signup);
console.log("App.tsx: NotFound is", typeof NotFound);
console.log("App.tsx: Dashboard is", typeof Dashboard);
console.log("App.tsx: ProfilePage is", typeof ProfilePage);
console.log("App.tsx: Budgeting is", typeof Budgeting);
console.log("App.tsx: NewBudgetPage is", typeof NewBudgetPage);
console.log("App.tsx: ProjectManagement is", typeof ProjectManagement);
console.log("App.tsx: SupplyChain is", typeof SupplyChain);
console.log("App.tsx: CRMPortal is", typeof CRMPortal);
console.log("App.tsx: AutomationIntelligence is", typeof AutomationIntelligence);
console.log("App.tsx: AIAssistantAlertsPage is", typeof AIAssistantAlertsPage);
console.log("App.tsx: ReplanningSuggestionsPage is", typeof ReplanningSuggestionsPage);
console.log("App.tsx: AIAssistantPage is", typeof AIAssistantPage);
console.log("App.tsx: PerformanceAnalysisPage is", typeof PerformanceAnalysisPage);
console.log("App.tsx: ProjectsPage is", typeof ProjectsPage);
console.log("App.tsx: AccountsPage is", typeof AccountsPage);
console.log("App.tsx: PayrollIntegrationPage is", typeof PayrollIntegrationPage);
console.log("App.tsx: FinancialDashboardsPage is", typeof FinancialDashboardsPage);
console.log("App.tsx: WorkItemsPage is", typeof WorkItemsPage);
console.log("App.tsx: PriceDatabasePage is", typeof PriceDatabasePage);
console.log("App.tsx: ApprovalsPage is", typeof ApprovalsPage);
console.log("App.tsx: CollaboratorsPage is", typeof CollaboratorsPage);
console.log("App.tsx: ReportsPage is", typeof ReportsPage);
console.log("App.tsx: Toaster is", typeof Toaster);


const App = () => {
  return (
    <BrowserRouter>
      <SessionContextProvider>
        <Toaster richColors position="top-right" />
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
            <Route path="finance-management" element={<FinancialDashboardsPage />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="finance-management/payroll-integration" element={<PayrollIntegrationPage />} />
            <Route path="finance-management/dashboards" element={<FinancialDashboardsPage />} />
            <Route path="work-items" element={<WorkItemsPage />} />
            <Route path="price-database" element={<PriceDatabasePage />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="collaborators" element={<CollaboratorsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </SessionContextProvider>
    </BrowserRouter>
  );
};

export default App;