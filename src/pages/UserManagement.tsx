import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { auth } from "@/lib/auth";
import { apiClient } from "@/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Clock,
  CheckCircle,
  UserCheck,
  UserX,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * User Management Page
 *
 * For company admins to manage users and approve access requests
 */
const UserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);

  // Security check - only admins can access
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

  const fetchPendingApprovals = async () => {
    try {
      console.log('🔍 [UserManagement] Current user details:', {
        name: user?.name,
        email: user?.email,
        role: user?.role,
        is_admin: user?.is_admin,
        company: user?.company,
        company_id: user?.company_id
      });

      // For company admins (is_admin), only fetch pending approvals for their company
      const isCompanyAdmin = user?.is_admin === true && user?.company_id;
      const companyId = isCompanyAdmin ? user.company_id : undefined;

      console.log('🔍 [UserManagement] Filtering logic:', {
        isCompanyAdmin,
        companyId,
        willFilterByCompany: !!companyId
      });

      const url = companyId
        ? `/users/pending-approvals?companyId=${companyId}`
        : '/users/pending-approvals';

      console.log('📡 [UserManagement] Fetching from:', url);

      const pendingUsers = await apiClient.get(url);
      console.log('✅ [UserManagement] Fetched pending approvals:', {
        count: pendingUsers.length,
        users: pendingUsers.map((u: any) => ({
          name: u.name,
          company: u.company,
          company_id: u.company_id,
          approval_status: u.approval_status
        }))
      });
      setPendingApprovals(pendingUsers);
    } catch (error) {
      console.error('❌ [UserManagement] Failed to fetch pending approvals:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      // Build API URL with company filter for company admins
      let url = '/users';

      // Company admins should only see users from their company
      if (user?.is_admin && user?.company_id && user?.role !== 'super_admin') {
        url = `/users?company_id=${user.company_id}`;
      }

      // Fetch users from API (filtered by company on backend for security)
      const users = await apiClient.get(url);
      setAllUsers(users);

      console.log('👥 Fetched users:', {
        total: users.length,
        isCompanyAdmin: user?.is_admin,
        companyId: user?.company_id,
        role: user?.role,
        filtered: url.includes('company_id')
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users from database',
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchPendingApprovals(),
          fetchAllUsers()
        ]);
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
        description: "The user has been approved and can now log in.",
      });
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
        description: "The user request has been rejected.",
      });
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

  if (loading) {
    return (
      <DashboardLayout role={user?.role || 'admin'}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading user management...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user?.role || 'admin'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin-panel')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Panel
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.company ?
                `Manage users and access requests for ${user.company}` :
                'Manage all users and access requests'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending-approvals" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="pending-approvals">
              <Clock className="h-4 w-4 mr-2" />
              Pending Approvals
              {pendingApprovals.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-600 text-white text-xs rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all-users">
              <Users className="h-4 w-4 mr-2" />
              All Users
            </TabsTrigger>
          </TabsList>

          {/* Pending Approvals Tab */}
          <TabsContent value="pending-approvals" className="mt-6">
            <Card className={pendingApprovals.length > 0 ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Grant Access - Pending User Approvals
                </CardTitle>
                <CardDescription>
                  {user?.company ?
                    `Review and approve new user access requests for ${user.company}` :
                    'Review and approve new user access requests'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-8 px-4 border rounded-lg bg-muted/50">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      No Pending Approvals
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.company
                        ? `No user access requests for ${user.company} at this time.`
                        : 'All user requests have been processed.'}
                    </p>
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
                            <p className="text-xs text-muted-foreground">👤 Role: <span className="font-medium text-foreground">{pendingUser.role?.replace('_', ' ')}</span></p>
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
          </TabsContent>

          {/* All Users Tab */}
          <TabsContent value="all-users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Users
                </CardTitle>
                <CardDescription>
                  {user?.company ?
                    `View all users in ${user.company}` :
                    'View all users in the system'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allUsers.length === 0 ? (
                    <div className="text-center py-8 px-4 border rounded-lg bg-muted/50">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No users found</p>
                    </div>
                  ) : (
                    allUsers.map((usr) => (
                      <div key={usr.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Shield className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{usr.name}</p>
                              <p className="text-xs text-muted-foreground">{usr.email}</p>
                            </div>
                          </div>
                          <div className="ml-10 space-y-1">
                            <p className="text-xs text-muted-foreground">🏢 Company: {usr.company || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">👤 Role: <span className="font-medium">{usr.role?.replace('_', ' ')}</span></p>
                            <p className="text-xs text-muted-foreground">
                              Status: <span className={`font-medium ${usr.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                {usr.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
