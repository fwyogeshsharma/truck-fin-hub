import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { auth } from "@/lib/auth";
import { loadThemeFromDatabase } from "@/lib/theme-loader";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import TermsAcceptance from "./pages/TermsAcceptance";
import RoleSelection from "./pages/RoleSelection";
import LoadOwnerDashboard from "./pages/dashboard/LoadOwner";
import TransporterDashboard from "./pages/dashboard/Transporter";
import LenderDashboard from "./pages/dashboard/Lender";
import AdminDashboard from "./pages/dashboard/Admin";
import SuperAdminDashboard from "./pages/dashboard/SuperAdmin";
import LoadAgentDashboard from "./pages/dashboard/LoadAgent";
import CreateTrip from "./pages/CreateTrip";
import InvestmentOpportunities from "./pages/InvestmentOpportunities";
import MyInvestments from "./pages/MyInvestments";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import KYC from "./pages/KYC";
import ShipperKYC from "./pages/ShipperKYC";
import KYCAdmin from "./pages/KYCAdmin";
import PlatformConfiguration from "./pages/PlatformConfig";
import NotificationSettings from "./pages/NotificationSettings";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import AdminPanel from "./pages/AdminPanel";
import UserManagement from "./pages/UserManagement";
import TransactionRequests from "./pages/TransactionRequests";
import AdminSetupDebug from "./pages/AdminSetupDebug";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize mock load agent users on app load
    auth.initializeMockUsers();

    // Load theme colors from database
    loadThemeFromDatabase();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/terms" element={<TermsAcceptance />} />
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/dashboard/load_owner" element={<LoadOwnerDashboard />} />
          <Route path="/dashboard/transporter" element={<TransporterDashboard />} />
          <Route path="/dashboard/lender" element={<LenderDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/super_admin" element={<SuperAdminDashboard />} />
          <Route path="/dashboard/load_agent" element={<LoadAgentDashboard />} />
          <Route path="/create-trip" element={<CreateTrip />} />
          <Route path="/opportunities" element={<InvestmentOpportunities />} />
          <Route path="/investments" element={<MyInvestments />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/kyc" element={<KYC />} />
          <Route path="/shipper-kyc" element={<ShipperKYC />} />
          <Route path="/admin/kyc" element={<KYCAdmin />} />
          <Route path="/platform-config" element={<PlatformConfiguration />} />
          <Route path="/settings/notifications" element={<NotificationSettings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/transaction-requests" element={<TransactionRequests />} />
          <Route path="/admin/setup-debug" element={<AdminSetupDebug />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
