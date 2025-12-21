import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Budgeting from "./pages/Budgeting";
import ProjectManagement from "./pages/ProjectManagement";
import SupplyChain from "./pages/SupplyChain";
import FinanceManagement from "./pages/FinanceManagement";
import CRMPortal from "./pages/CRMPortal"; // Import the new CRMPortal page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/budgeting" element={<Budgeting />} />
          <Route path="/project-management" element={<ProjectManagement />} />
          <Route path="/supply-chain" element={<SupplyChain />} />
          <Route path="/finance-management" element={<FinanceManagement />} />
          <Route path="/crm-portal" element={<CRMPortal />} /> {/* New route for CRM Portal */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;