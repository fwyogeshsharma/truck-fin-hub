import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TruckIcon, Wallet, AlertTriangle, CheckCircle2, Clock, UserCheck, UserX, Settings } from "lucide-react";
import { auth } from "@/lib/auth";
import { data, Trip, Investment } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { apiClient } from '@/api/client';

const AdminDashboard = () => {
  const user = auth.getCurrentUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allInvestments, setAllInvestments] = useState<Investment[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);

  const fetchPendingApprovals = async () => {
    try {
      console.log('👤 Current user info:', {
        name: user?.name,
        role: user?.role,
        is_admin: user?.is_admin,
        company: user?.company,
        company_id: user?.company_id
      });

      // For company admins (is_admin), only fetch pending approvals for their company
      // For super_admin/admin, fetch all pending approvals
      const isCompanyAdmin = user?.is_admin === true && user?.company_id;
      const companyId = isCompanyAdmin ? user.company_id : undefined;

      console.log('🔍 Filtering logic:', {
        isCompanyAdmin,
        companyId,
        willFilterByCompany: !!companyId
      });

      const url = companyId
        ? `/users/pending-approvals?companyId=${companyId}`
        : '/users/pending-approvals';

      console.log('📡 Fetching pending approvals from:', url);

      const pendingUsers = await apiClient.get(url);
      console.log('✅ Fetched pending approvals:', {
        count: pendingUsers.length,
        users: pendingUsers.map((u: any) => ({
          name: u.name,
          company: u.company,
          company_id: u.company_id
        }))
      });
      setPendingApprovals(pendingUsers);
    } catch (error) {
      console.error('❌ Failed to fetch pending approvals:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [trips, investments] = await Promise.all([
          data.getTrips(),
          data.getInvestments()
        ]);
        const users = auth.getAllUsers();

        setAllTrips(trips);
        setAllUsers(users);
        setAllInvestments(investments);

        // Fetch pending approvals
        await fetchPendingApprovals();
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleApprove = async (userId: string) => {
    if (!user?.id) return;

    setApprovingUserId(userId);
    try {
      await apiClient.put(`/users/${userId}/approve`, { approvedBy: user.id });

      toast({
        title: "User Approved",
        description: "The shipper has been approved and can now log in.",
      });
      // Refresh pending approvals
      await fetchPendingApprovals();
    } catch (error) {
      console.error('Failed to approve user:', error);
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: "Failed to approve user. Please try again.",
      });
    } finally {
      setApprovingUserId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!user?.id) return;

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setApprovingUserId(userId);
    try {
      await apiClient.put(`/users/${userId}/reject`, { rejectedBy: user.id, reason });

      toast({
        title: "User Rejected",
        description: "The shipper request has been rejected.",
      });
      // Refresh pending approvals
      await fetchPendingApprovals();
    } catch (error) {
      console.error('Failed to reject user:', error);
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: "Failed to reject user. Please try again.",
      });
    } finally {
      setApprovingUserId(null);
    }
  };

  const stats = [
    {
      title: "Total Users",
      value: allUsers.length,
      icon: Users,
      color: "primary",
      detail: `${allUsers.filter(u => u.role === 'lender').length} Investors, ${allUsers.filter(u => u.role === 'load_owner').length} Borrowers`,
    },
    {
      title: "Total Trips",
      value: allTrips.length,
      icon: TruckIcon,
      color: "secondary",
      detail: `${allTrips.filter(t => t.status === 'completed').length} Completed`,
    },
    {
      title: "Platform Volume",
      value: `₹${(allTrips.reduce((sum, t) => sum + t.amount, 0) / 100000).toFixed(1)}L`,
      icon: Wallet,
      color: "accent",
      detail: `${allInvestments.length} Active investments`,
    },
    {
      title: "Pending Issues",
      value: "0",
      icon: AlertTriangle,
      color: "destructive",
      detail: "All systems operational",
    },
  ];

  const systemHealth = [
    { metric: "Payment Processing", status: "operational", uptime: "99.9%" },
    { metric: "User Authentication", status: "operational", uptime: "100%" },
    { metric: "Trip Management", status: "operational", uptime: "99.8%" },
    { metric: "Wallet System", status: "operational", uptime: "99.9%" },
  ];

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : "User"}'s Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {user?.is_admin && user?.company ?
                `${user.company} Admin - Manage company users and access` :
                'System overview and management'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/setup-debug')}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Setup Debug
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-full bg-${stat.color}/10 flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 text-${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.detail}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pending User Approvals - Grant Access Card */}
        <Card className={pendingApprovals.length > 0 ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Grant Access - Pending Shipper Approvals
            </CardTitle>
            <CardDescription>
              {user?.is_admin && user?.company ?
                `New shipper access requests for ${user.company}` :
                'Review and approve new shipper requests from all companies'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 px-4 border rounded-lg bg-muted/50">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No Pending Approvals
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.is_admin && user?.company
                    ? `No shipper access requests for ${user.company} at this time.`
                    : 'All shipper requests have been processed.'}
                </p>
                {!user?.is_admin && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-3">
                    ⚠️ Note: You're viewing as super admin. Company admins will only see their company's requests.
                  </p>
                )}
                {user?.is_admin && !user?.company_id && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      ⚠️ Setup Issue: You're marked as admin but have no company assigned.
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Please check the COMPANY-ADMIN-SETUP.md guide to properly configure your admin account.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((pendingUser) => (
                  <div key={pendingUser.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-background shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{pendingUser.name}</p>
                          <p className="text-xs text-muted-foreground">{pendingUser.email}</p>
                        </div>
                      </div>
                      <div className="ml-12 space-y-1">
                        <p className="text-xs text-muted-foreground">📞 Phone: {pendingUser.phone || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">🏢 Company: <span className="font-medium text-foreground">{pendingUser.company}</span></p>
                        <p className="text-xs text-muted-foreground">👤 Role: <span className="font-medium text-foreground">Shipper (load_agent)</span></p>
                        <p className="text-xs text-muted-foreground">📅 Requested: {new Date(pendingUser.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(pendingUser.id)}
                        disabled={approvingUserId === pendingUser.id}
                        className="bg-green-600 hover:bg-green-700 min-w-[120px]"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        {approvingUserId === pendingUser.id ? 'Approving...' : 'Grant Access'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(pendingUser.id)}
                        disabled={approvingUserId === pendingUser.id}
                        className="min-w-[120px]"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Deny Access
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Real-time platform status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemHealth.map((item) => (
                <div key={item.metric} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    <span className="font-medium">{item.metric}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Uptime: {item.uptime}</span>
                    <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded-full">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trips</CardTitle>
              <CardDescription>Latest trip activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allTrips.slice(0, 5).map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{trip.origin} → {trip.destination}</p>
                      <p className="text-xs text-muted-foreground">{trip.loadOwnerName}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      trip.status === 'completed' ? 'bg-secondary/20 text-secondary' :
                      trip.status === 'funded' ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>New registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {user.role && (
                      <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                        {user.role.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
