import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Budgeting from "./pages/Budgeting";
import ProjectManagement from "./pages/ProjectManagement";
import SupplyChain from "./pages/SupplyChain";
import FinanceManagement from "./pages/FinanceManagement";
import CRMPortal from "./pages/CRMPortal";
import AutomationIntelligence from "./pages/AutomationIntelligence";
import MainLayout from "./components/MainLayout"; // Import the new layout component

// Placeholder pages for sidebar navigation
import ProjectsPage from "./pages/ProjectsPage";
import SchedulePage from "./pages/SchedulePage";
import CollaboratorsPage from "./pages/CollaboratorsPage";
import CompliancePage from "./pages/CompliancePage";
import ReportsPage from "./pages/ReportsPage";
import PriceDatabasePage from "./pages/PriceDatabasePage";
import WorkItemsPage from "./pages/WorkItemsPage";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Routes that use the MainLayout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} /> {/* Dashboard as default for MainLayout */}
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
          </Route>

          {/* Routes that do NOT use the MainLayout (e.g., landing pages, auth pages, 404) */}
          <Route path="/modules" element={<Index />} /> {/* Old Index page moved to /modules */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;