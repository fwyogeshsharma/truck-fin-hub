import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  TruckIcon,
  Package,
  Wallet,
  TrendingUp,
  Shield,
  Database,
  Activity,
  DollarSign,
  FileText,
  Settings
} from "lucide-react";
import { auth } from "@/lib/auth";
import { data } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { ThemeSelector } from "@/components/ThemeSelector";

/**
 * SuperAdminDashboard Component
 *
 * Dashboard for Super Admin role with elevated permissions.
 * This dashboard provides system-wide overview and administrative controls.
 */
const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const user = auth.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrips: 0,
    totalInvestments: 0,
    totalValue: 0,
    activeTrips: 0,
    completedTrips: 0,
    totalInvestors: 0,
    totalBorrowers: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [trips, investments] = await Promise.all([
          data.getTrips(),
          data.getInvestments(),
        ]);

        // Get all users from auth
        const allUsers = auth.getAllUsers();

        // Count borrowers (load_agent and load_owner roles)
        const totalBorrowers = allUsers.filter(u =>
          u.role === 'load_agent' || u.role === 'load_owner'
        ).length;

        // Count investors (lender role)
        const totalInvestors = allUsers.filter(u => u.role === 'lender').length;

        const activeTrips = trips.filter(t =>
          ['pending', 'funded', 'in_transit', 'escrowed'].includes(t.status)
        ).length;

        const completedTrips = trips.filter(t => t.status === 'completed').length;

        const totalValue = trips.reduce((sum, trip) => sum + trip.amount, 0);

        const totalInvestmentValue = investments.reduce((sum, inv) => sum + inv.amount, 0);

        setStats({
          totalUsers: allUsers.length,
          totalTrips: trips.length,
          totalInvestments: investments.length,
          totalValue: totalInvestmentValue,
          activeTrips,
          completedTrips,
          totalInvestors,
          totalBorrowers,
        });
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const dashboardStats = [
    {
      title: "Total Trips",
      value: stats.totalTrips,
      icon: TruckIcon,
      color: "primary",
      description: `${stats.activeTrips} active, ${stats.completedTrips} completed`,
    },
    {
      title: "Total Investments",
      value: stats.totalInvestments,
      icon: DollarSign,
      color: "secondary",
      description: `₹${(stats.totalValue / 100000).toFixed(1)}L total value`,
    },
    {
      title: "Active Trips",
      value: stats.activeTrips,
      icon: Activity,
      color: "accent",
      description: "Currently in progress",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout role="super_admin">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Super Admin Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              System-wide overview and administrative controls
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-lg">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            <span className="text-sm sm:text-base font-semibold text-purple-600">Super Admin Access</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {dashboardStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-full bg-${stat.color}/10 flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 text-${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Theme Selector */}
        <ThemeSelector />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Administrative functions and system management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-auto py-4"
                onClick={() => navigate('/platform-config')}
              >
                <Settings className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Platform Configuration</div>
                  <div className="text-xs text-muted-foreground">Configure fees, rates & limits</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2 h-auto py-4"
                onClick={() => navigate('/admin/users')}
              >
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Manage Users</div>
                  <div className="text-xs text-muted-foreground">View and manage all users</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2 h-auto py-4"
                onClick={() => navigate('/dashboard/admin')}
              >
                <Database className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">System Overview</div>
                  <div className="text-xs text-muted-foreground">View system metrics</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2 h-auto py-4"
              >
                <FileText className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Reports</div>
                  <div className="text-xs text-muted-foreground">Generate system reports</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Statistics</CardTitle>
              <CardDescription>Key metrics across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Borrowers</span>
                  </div>
                  <span className="font-semibold">{stats.totalBorrowers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Investors</span>
                  </div>
                  <span className="font-semibold">{stats.totalInvestors}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TruckIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Trips</span>
                  </div>
                  <span className="font-semibold">{stats.totalTrips}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Platform Value</span>
                  </div>
                  <span className="font-semibold">₹{(stats.totalValue / 100000).toFixed(1)}L</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Activity monitoring coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Notice */}
        <Card className="border-2 border-purple-500/50 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Super Admin Access</h4>
                <p className="text-sm text-muted-foreground">
                  You have full administrative access to all system functions. Use these privileges responsibly.
                  This role is not visible to regular users and has elevated permissions for system management.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
