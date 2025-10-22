import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { auth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { apiClient } from '@/api/client';

interface DebugInfo {
  currentUser: any;
  allUsers: any[];
  companies: any[];
  pendingApprovals: any[];
  pendingForCompany: any[];
}

const AdminSetupDebug = () => {
  const user = auth.getCurrentUser();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel
      const [users, companies, allPending, companyPending] = await Promise.all([
        apiClient.get('/migrations/list-users'),
        apiClient.get('/companies?active=true'),
        apiClient.get('/users/pending-approvals'),
        user?.company_id
          ? apiClient.get(`/users/pending-approvals?companyId=${user.company_id}`)
          : Promise.resolve([])
      ]);

      setDebugInfo({
        currentUser: user,
        allUsers: users.users || [],
        companies,
        pendingApprovals: allPending,
        pendingForCompany: companyPending,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading debug info...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isCompanyAdmin = user?.is_admin === true && user?.company_id;
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Setup Debug</h1>
            <p className="text-muted-foreground mt-1">
              Diagnostic information for company admin approval system
            </p>
          </div>
          <Button onClick={fetchDebugInfo} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-red-600 dark:text-red-400">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current User Status</CardTitle>
            <CardDescription>Your account configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">User ID</span>
                <span className="text-sm text-muted-foreground font-mono">{user?.id || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Name</span>
                <span className="text-sm text-muted-foreground">{user?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Role</span>
                <span className="text-sm text-muted-foreground">{user?.role || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Is Admin</span>
                <span className="text-sm">
                  {user?.is_admin ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 inline" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 inline" />
                  )}
                  <span className="ml-2 text-muted-foreground">{user?.is_admin ? 'Yes' : 'No'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Company</span>
                <span className="text-sm text-muted-foreground">{user?.company || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Company ID</span>
                <span className="text-sm text-muted-foreground font-mono">{user?.company_id || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Admin Type</span>
                <span className="text-sm text-muted-foreground">
                  {isSuperAdmin ? 'Super Admin (sees all requests)' :
                   isCompanyAdmin ? 'Company Admin (sees only company requests)' :
                   'Regular User (no admin access)'}
                </span>
              </div>
            </div>

            {/* Status Check */}
            <div className="mt-6 p-4 border rounded-lg bg-muted/50">
              <h3 className="text-sm font-semibold mb-3">Setup Status</h3>
              <div className="space-y-2">
                {isSuperAdmin ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-600">Super Admin Access</p>
                      <p className="text-xs text-muted-foreground">You can see all pending approvals from all companies.</p>
                    </div>
                  </div>
                ) : isCompanyAdmin ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-600">Company Admin Configured</p>
                      <p className="text-xs text-muted-foreground">You can see pending approvals for {user?.company}.</p>
                    </div>
                  </div>
                ) : user?.is_admin && !user?.company_id ? (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Incomplete Setup</p>
                      <p className="text-xs text-muted-foreground">You're marked as admin but have no company assigned. Run the setup script.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-600">Not a Company Admin</p>
                      <p className="text-xs text-muted-foreground">You need is_admin=true and company_id set to approve users.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>All Pending Approvals</CardTitle>
              <CardDescription>All pending requests (across all companies)</CardDescription>
            </CardHeader>
            <CardContent>
              {!debugInfo?.pendingApprovals || debugInfo?.pendingApprovals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No pending requests</p>
              ) : (
                <div className="space-y-2">
                  {debugInfo?.pendingApprovals?.map((u: any) => (
                    <div key={u.id} className="p-3 border rounded-lg text-xs">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-muted-foreground">{u.email}</p>
                      <p className="text-muted-foreground">Company: {u.company}</p>
                      <p className="text-muted-foreground">Company ID: {u.company_id}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {user?.company_id && (
            <Card>
              <CardHeader>
                <CardTitle>Your Company's Pending</CardTitle>
                <CardDescription>Requests for {user?.company}</CardDescription>
              </CardHeader>
              <CardContent>
                {!debugInfo?.pendingForCompany || debugInfo?.pendingForCompany.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No pending requests for your company</p>
                ) : (
                  <div className="space-y-2">
                    {debugInfo?.pendingForCompany?.map((u: any) => (
                      <div key={u.id} className="p-3 border rounded-lg text-xs">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-muted-foreground">{u.email}</p>
                        <p className="text-muted-foreground">Company: {u.company}</p>
                        <p className="text-muted-foreground">Company ID: {u.company_id}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* All Users */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>All registered users and their admin status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Company</th>
                    <th className="text-left p-2">Is Admin</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {debugInfo?.allUsers.map((u: any) => (
                    <tr key={u.id} className="border-b">
                      <td className="p-2">{u.name}</td>
                      <td className="p-2 text-muted-foreground">{u.email}</td>
                      <td className="p-2 text-muted-foreground">{u.role}</td>
                      <td className="p-2 text-muted-foreground">{u.company || '-'}</td>
                      <td className="p-2">
                        {u.is_admin ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          u.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                          u.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {u.approval_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Companies */}
        <Card>
          <CardHeader>
            <CardTitle>Available Companies</CardTitle>
            <CardDescription>Companies that users can request access to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-3">
              {debugInfo?.companies.map((c: any) => (
                <div key={c.id} className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">{c.display_name || c.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">ID: {c.id}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        {!isCompanyAdmin && !isSuperAdmin && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>How to become a company admin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>To approve shipper requests, you need to be set as a company admin. Run this PowerShell command:</p>
                <div className="bg-black/80 text-white p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  <pre>{`$body = @{
    userId = "${user?.id}"
    companyId = "COMPANY_ID_HERE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/migrations/set-company-admin" \`
  -Method Post \`
  -Body $body \`
  -ContentType "application/json"`}</pre>
                </div>
                <p className="text-muted-foreground">Or use the setup script:</p>
                <div className="bg-black/80 text-white p-3 rounded-lg font-mono text-xs">
                  .\\setup-company-admin.ps1
                </div>
                <p className="text-muted-foreground">See COMPANY-ADMIN-SETUP.md for detailed instructions.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSetupDebug;
