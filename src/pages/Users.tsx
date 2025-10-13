import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users as UsersIcon,
  Search,
  Shield,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Users Management Page
 *
 * Super Admin page to view and manage all platform users
 */
const Users = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  // Security check - only super admin can access
  useEffect(() => {
    if (user?.role !== 'super_admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'This page is only accessible to Super Admins',
      });
      navigate('/');
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    const users = auth.getAllUsers();
    setAllUsers(users);
    setFilteredUsers(users);
  }, []);

  useEffect(() => {
    let filtered = allUsers;

    // Filter by role
    if (filterRole !== "all") {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
      );
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filterRole, allUsers]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'lender':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'load_owner':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'load_agent':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'transporter':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'super_admin':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'lender':
        return 'Investor';
      case 'load_owner':
        return 'Borrower (Load Owner)';
      case 'load_agent':
        return 'Borrower (Load Agent)';
      case 'transporter':
        return 'Transporter';
      case 'admin':
        return 'Admin';
      case 'super_admin':
        return 'Super Admin';
      default:
        return role?.replace('_', ' ') || 'N/A';
    }
  };

  const getKYCStatus = (userId: string) => {
    // This is a placeholder - would need actual KYC service integration
    return { status: 'pending', icon: Clock, color: 'text-yellow-600' };
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Created At'];
    const csvData = filteredUsers.map(u => [
      u.name || '',
      u.email || '',
      u.phone || '',
      getRoleDisplayName(u.role),
      u.createdAt || 'N/A',
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: 'Export Successful',
      description: `Exported ${filteredUsers.length} users to CSV`,
    });
  };

  const stats = {
    total: allUsers.length,
    borrowers: allUsers.filter(u => u.role === 'load_agent' || u.role === 'load_owner').length,
    investors: allUsers.filter(u => u.role === 'lender').length,
    transporters: allUsers.filter(u => u.role === 'transporter').length,
  };

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              User Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              View and manage all platform users
            </p>
          </div>
          <Button onClick={exportToCSV} className="gap-2 bg-gradient-primary">
            <Download className="h-4 w-4" />
            Export to CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.borrowers}</p>
                <p className="text-sm text-muted-foreground mt-1">Borrowers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.investors}</p>
                <p className="text-sm text-muted-foreground mt-1">Investors</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.transporters}</p>
                <p className="text-sm text-muted-foreground mt-1">Transporters</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterRole === "all" ? "default" : "outline"}
                  onClick={() => setFilterRole("all")}
                  size="sm"
                >
                  All ({allUsers.length})
                </Button>
                <Button
                  variant={filterRole === "load_agent" ? "default" : "outline"}
                  onClick={() => setFilterRole("load_agent")}
                  size="sm"
                >
                  Borrowers ({stats.borrowers})
                </Button>
                <Button
                  variant={filterRole === "lender" ? "default" : "outline"}
                  onClick={() => setFilterRole("lender")}
                  size="sm"
                >
                  Investors ({stats.investors})
                </Button>
                <Button
                  variant={filterRole === "transporter" ? "default" : "outline"}
                  onClick={() => setFilterRole("transporter")}
                  size="sm"
                >
                  Transporters ({stats.transporters})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Complete list of platform users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            {user.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {user.email || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {user.phone || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getRoleBadgeColor(user.role)} border`}>
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {user.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Users;
