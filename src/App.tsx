import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import RoleSelection from "./pages/RoleSelection";
import LoadOwnerDashboard from "./pages/dashboard/LoadOwner";
import TransporterDashboard from "./pages/dashboard/Transporter";
import LenderDashboard from "./pages/dashboard/Lender";
import AdminDashboard from "./pages/dashboard/Admin";
import CreateTrip from "./pages/CreateTrip";
import InvestmentOpportunities from "./pages/InvestmentOpportunities";
import MyInvestments from "./pages/MyInvestments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/dashboard/load_owner" element={<LoadOwnerDashboard />} />
          <Route path="/dashboard/transporter" element={<TransporterDashboard />} />
          <Route path="/dashboard/lender" element={<LenderDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/create-trip" element={<CreateTrip />} />
          <Route path="/opportunities" element={<InvestmentOpportunities />} />
          <Route path="/investments" element={<MyInvestments />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
