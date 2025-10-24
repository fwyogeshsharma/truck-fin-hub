import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { auth } from "@/lib/auth";
import { apiClient } from "@/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  Building2,
  TruckIcon,
  Wallet,
  FileText,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Admin Panel Page
 *
 * Main admin dashboard for company admins to manage their company operations
 */
const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();
  const [companyData, setCompanyData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrips: 0,
    activeTrips: 0,
    totalRevenue: 0,
  });

  // Security check - only users with is_admin flag can access
  useEffect(() => {
    if (!user?.is_admin && user?.role !== 'super_admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'This page is only accessible to Admins',
      });
      navigate('/');
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!user?.company_id) {
        return;
      }

      try {
        const data = await apiClient.get(`/companies/${user.company_id}`);
        setCompanyData(data);
      } catch (error) {
        console.error('Error fetching company data:', error);
      }
    };

    fetchCompanyData();
  }, [user?.company_id]);

  const adminCards = [
    {
      title: "Company Management",
      description: "Manage company details, settings, and configurations",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      onClick: () => {
        toast({
          title: "Coming Soon",
          description: "Company management features will be available soon",
        });
      },
    },
    {
      title: "User Management",
      description: "View and manage company users, approve access requests",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      onClick: () => {
        navigate('/user-management');
      },
    },
    {
      title: "Trip Management",
      description: "Monitor and manage all trips for your company",
      icon: TruckIcon,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      onClick: () => {
        toast({
          title: "Coming Soon",
          description: "Trip management features will be available soon",
        });
      },
    },
    {
      title: "Financial Overview",
      description: "View company finances, wallets, and transactions",
      icon: Wallet,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      onClick: () => {
        toast({
          title: "Coming Soon",
          description: "Financial overview features will be available soon",
        });
      },
    },
    {
      title: "Reports & Analytics",
      description: "Generate reports and view analytics for your company",
      icon: BarChart3,
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
      onClick: () => {
        toast({
          title: "Coming Soon",
          description: "Reports & analytics features will be available soon",
        });
      },
    },
    {
      title: "Documents & KYC",
      description: "Manage company documents and KYC verification",
      icon: FileText,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      onClick: () => {
        toast({
          title: "Coming Soon",
          description: "Document management features will be available soon",
        });
      },
    },
  ];

  return (
    <DashboardLayout role={user?.role || 'admin'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Admin Panel
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {companyData ? `Manage ${companyData.display_name}` : 'Manage your company operations'}
            </p>
          </div>
        </div>

        {/* Company Info Card */}
        {companyData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Company Information
              </CardTitle>
              <CardDescription>Overview of your company details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company Name</p>
                  <p className="font-semibold">{companyData.display_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{companyData.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{companyData.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GST Number</p>
                  <p className="font-semibold">{companyData.gst_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      companyData.is_verified
                        ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400'
                    }`}>
                      {companyData.is_verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{companyData.city && companyData.state ? `${companyData.city}, ${companyData.state}` : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alert if no company assigned */}
        {!companyData && user?.is_admin && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">No Company Assigned</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                    You are an admin but no company has been assigned to your account yet. Please contact a super admin.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TruckIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{stats.totalTrips}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Trips</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{stats.activeTrips}</p>
                <p className="text-sm text-muted-foreground mt-1">Active Trips</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Wallet className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Features Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Admin Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.title}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={card.onClick}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${card.bgColor}`}>
                        <Icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{card.title}</h3>
                        <p className="text-sm text-muted-foreground">{card.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-200">Admin Panel Features</h3>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  As an admin, you have access to manage your company's operations. More features will be added soon to help you efficiently manage users, trips, finances, and analytics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;
