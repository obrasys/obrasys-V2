import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard"; // Import the new Dashboard
import Index from "./pages/Index"; // This will now be the modules overview
import NotFound from "./pages/NotFound";
import Budgeting from "./pages/Budgeting";
import ProjectManagement from "./pages/ProjectManagement";
import SupplyChain from "./pages/SupplyChain";
import FinanceManagement from "./pages/FinanceManagement";
import CRMPortal from "./pages/CRMPortal";

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
          <Route path="/" element={<Dashboard />} /> {/* New default route */}
          <Route path="/modules" element={<Index />} /> {/* Old Index page moved to /modules */}
          <Route path="/budgeting" element={<Budgeting />} />
          <Route path="/project-management" element={<ProjectManagement />} />
          <Route path="/supply-chain" element={<SupplyChain />} />
          <Route path="/finance-management" element={<FinanceManagement />} />
          <Route path="/crm-portal" element={<CRMPortal />} />

          {/* New placeholder routes for sidebar */}
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/collaborators" element={<CollaboratorsPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/price-database" element={<PriceDatabasePage />} />
          <Route path="/work-items" element={<WorkItemsPage />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;