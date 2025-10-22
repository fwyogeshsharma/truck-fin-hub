import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { auth } from "@/lib/auth";
import { apiClient } from "@/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  UserCog,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserX,
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
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Admin assignment dialog state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>("");

  // Companies state
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // New company form state
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    display_name: "",
    email: "",
    phone: "",
    gst_number: "",
    pan_number: "",
    address_line1: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

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
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const users = await apiClient.get('/users');
        setAllUsers(users);
        setFilteredUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load users from the database. Please try again.',
        });

        // Fallback to local storage users
        const localUsers = auth.getAllUsers();
        setAllUsers(localUsers);
        setFilteredUsers(localUsers);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

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
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, filterRole, allUsers]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

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
        return 'Lender';
      case 'load_owner':
        return 'Borrower';
      case 'load_agent':
        return 'Borrower';
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

  const handleRefreshUsers = async () => {
    try {
      setLoading(true);
      const users = await apiClient.get('/users');
      setAllUsers(users);

      toast({
        title: 'Success',
        description: 'Users list refreshed successfully',
      });
    } catch (error) {
      console.error('Error refreshing users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to refresh users. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const companiesData = await apiClient.get('/companies?active=true');
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load companies. Please try again.',
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleOpenAdminDialog = (userToPromote: any) => {
    setSelectedUser(userToPromote);
    setSelectedCompany(userToPromote.company_id || "");
    setAdminDialogOpen(true);
    fetchCompanies();
  };

  const handleCreateCompany = async () => {
    // Validate required fields
    if (!newCompany.name || !newCompany.display_name || !newCompany.email || !newCompany.phone) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields (Name, Display Name, Email, Phone)',
      });
      return;
    }

    try {
      setLoadingCompanies(true);

      // Generate ID from company name
      const companyId = newCompany.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const createdCompany = await apiClient.post('/companies', {
        ...newCompany,
        id: companyId,
      });

      toast({
        title: 'Success!',
        description: `Company "${createdCompany.display_name}" has been created`,
      });

      // Refresh companies list
      await fetchCompanies();

      // Select the newly created company
      setSelectedCompany(createdCompany.id);
      setShowNewCompanyForm(false);

      // Reset form
      setNewCompany({
        name: "",
        display_name: "",
        email: "",
        phone: "",
        gst_number: "",
        pan_number: "",
        address_line1: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      });
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create company. Please try again.',
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (!selectedUser || !selectedCompany) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a company',
      });
      return;
    }

    try {
      // Call API to update user role
      await apiClient.put(`/users/${selectedUser.id}/make-admin`, {
        company_id: selectedCompany,
      });

      // Refresh users from database
      const users = await apiClient.get('/users');
      setAllUsers(users);

      const selectedCompanyData = companies.find(c => c.id === selectedCompany);

      toast({
        title: 'Success!',
        description: `${selectedUser.name} has been made admin for ${selectedCompanyData?.display_name || selectedCompany}`,
      });

      setAdminDialogOpen(false);
      setSelectedUser(null);
      setSelectedCompany("");
      setShowNewCompanyForm(false);
    } catch (error) {
      console.error('Error making user admin:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
      });
    }
  };

  const handleRemoveAdmin = async (userToRemove: any) => {
    try {
      // Call API to remove admin privileges
      await apiClient.put(`/users/${userToRemove.id}/remove-admin`);

      // Refresh users from database
      const users = await apiClient.get('/users');
      setAllUsers(users);

      toast({
        title: 'Success!',
        description: `Admin privileges removed from ${userToRemove.name}`,
      });
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove admin privileges. Please try again.',
      });
    }
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
    admins: allUsers.filter(u => u.role === 'admin').length,
    superAdmins: allUsers.filter(u => u.role === 'super_admin').length,
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
              View and manage all platform users from database
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefreshUsers}
              variant="outline"
              className="gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportToCSV} className="gap-2 bg-gradient-primary">
              <Download className="h-4 w-4" />
              Export to CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
                <p className="text-sm text-muted-foreground mt-1">Admins</p>
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
                  variant={filterRole === "admin" ? "default" : "outline"}
                  onClick={() => setFilterRole("admin")}
                  size="sm"
                >
                  Admins ({stats.admins})
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-muted-foreground">Loading users from database...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                              {userItem.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            {userItem.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {userItem.email || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {userItem.phone || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getRoleBadgeColor(userItem.role)} border`}>
                            {getRoleDisplayName(userItem.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {userItem.id}
                        </TableCell>
                        <TableCell>
                          {userItem.role !== 'super_admin' && (
                            <>
                              {!userItem.is_admin ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => handleOpenAdminDialog(userItem)}
                                >
                                  <UserCog className="h-4 w-4" />
                                  Make Admin
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleRemoveAdmin(userItem)}
                                >
                                  <UserX className="h-4 w-4" />
                                  Remove Admin
                                </Button>
                              )}
                            </>
                          )}
                          {userItem.role === 'super_admin' && (
                            <Badge variant="outline" className="gap-1 text-pink-600 border-pink-300">
                              <Shield className="h-3 w-3" />
                              Super Admin
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = page === 1 ||
                                      page === totalPages ||
                                      (page >= currentPage - 1 && page <= currentPage + 1);

                      const showEllipsis = (page === currentPage - 2 && currentPage > 3) ||
                                          (page === currentPage + 2 && currentPage < totalPages - 2);

                      if (showEllipsis) {
                        return <span key={page} className="px-2 text-muted-foreground">...</span>;
                      }

                      if (!showPage) {
                        return null;
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[36px]"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Make Admin Dialog */}
        <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                Assign Admin Role
              </DialogTitle>
              <DialogDescription>
                Make this user an admin for a specific company. Admins have elevated permissions to manage company operations.
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4 py-4">
                {/* User Info */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                      {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedUser.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">Current Role:</span>
                    <Badge className={`${getRoleBadgeColor(selectedUser.role)} border`}>
                      {getRoleDisplayName(selectedUser.role)}
                    </Badge>
                  </div>
                </div>

                {/* Company Selection */}
                {!showNewCompanyForm && (
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-semibold">
                      Select Company *
                    </Label>
                    <Select
                      value={selectedCompany}
                      onValueChange={(value) => {
                        if (value === 'add_new') {
                          setShowNewCompanyForm(true);
                          setSelectedCompany("");
                        } else {
                          setSelectedCompany(value);
                        }
                      }}
                    >
                      <SelectTrigger id="company" className="h-11" disabled={loadingCompanies}>
                        <SelectValue placeholder={loadingCompanies ? "Loading companies..." : "Choose a company..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCompanies ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Loading companies...
                          </div>
                        ) : companies.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No companies available
                          </div>
                        ) : (
                          companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.display_name}
                            </SelectItem>
                          ))
                        )}
                        <SelectItem value="add_new" className="text-primary font-semibold">
                          + Add New Company
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The user will become an admin for the selected company
                    </p>
                  </div>
                )}

                {/* New Company Form */}
                {showNewCompanyForm && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border-2 border-dashed">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Add New Company</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowNewCompanyForm(false);
                          setNewCompany({
                            name: "",
                            display_name: "",
                            email: "",
                            phone: "",
                            gst_number: "",
                            pan_number: "",
                            address_line1: "",
                            city: "",
                            state: "",
                            pincode: "",
                            country: "India",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label htmlFor="company_name" className="text-xs">
                          Company Name * <span className="text-muted-foreground">(unique identifier)</span>
                        </Label>
                        <Input
                          id="company_name"
                          placeholder="e.g., acme-logistics"
                          value={newCompany.name}
                          onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label htmlFor="display_name" className="text-xs">
                          Display Name * <span className="text-muted-foreground">(shown to users)</span>
                        </Label>
                        <Input
                          id="display_name"
                          placeholder="e.g., Acme Logistics Pvt Ltd"
                          value={newCompany.display_name}
                          onChange={(e) => setNewCompany({ ...newCompany, display_name: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-xs">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="contact@company.com"
                          value={newCompany.email}
                          onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-xs">Phone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 9876543210"
                          value={newCompany.phone}
                          onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="gst_number" className="text-xs">GST Number</Label>
                        <Input
                          id="gst_number"
                          placeholder="22AAAAA0000A1Z5"
                          value={newCompany.gst_number}
                          onChange={(e) => setNewCompany({ ...newCompany, gst_number: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="pan_number" className="text-xs">PAN Number</Label>
                        <Input
                          id="pan_number"
                          placeholder="AAAAA0000A"
                          value={newCompany.pan_number}
                          onChange={(e) => setNewCompany({ ...newCompany, pan_number: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label htmlFor="address" className="text-xs">Address</Label>
                        <Input
                          id="address"
                          placeholder="Street address"
                          value={newCompany.address_line1}
                          onChange={(e) => setNewCompany({ ...newCompany, address_line1: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="city" className="text-xs">City</Label>
                        <Input
                          id="city"
                          placeholder="Mumbai"
                          value={newCompany.city}
                          onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="state" className="text-xs">State</Label>
                        <Input
                          id="state"
                          placeholder="Maharashtra"
                          value={newCompany.state}
                          onChange={(e) => setNewCompany({ ...newCompany, state: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="pincode" className="text-xs">Pincode</Label>
                        <Input
                          id="pincode"
                          placeholder="400001"
                          value={newCompany.pincode}
                          onChange={(e) => setNewCompany({ ...newCompany, pincode: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="country" className="text-xs">Country</Label>
                        <Input
                          id="country"
                          placeholder="India"
                          value={newCompany.country}
                          onChange={(e) => setNewCompany({ ...newCompany, country: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateCompany}
                      disabled={loadingCompanies}
                      className="w-full h-9 text-sm"
                      variant="default"
                    >
                      {loadingCompanies ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Company'
                      )}
                    </Button>
                  </div>
                )}

                {/* Warning Notice */}
                {!showNewCompanyForm && selectedCompany && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-900 dark:text-amber-200">
                        <p className="font-semibold mb-1">Important:</p>
                        <p>This will grant admin privileges to the user. They will be able to manage trips, users, and settings for {companies.find(c => c.id === selectedCompany)?.display_name || selectedCompany}.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAdminDialogOpen(false);
                  setSelectedUser(null);
                  setSelectedCompany("");
                  setShowNewCompanyForm(false);
                  setNewCompany({
                    name: "",
                    display_name: "",
                    email: "",
                    phone: "",
                    gst_number: "",
                    pan_number: "",
                    address_line1: "",
                    city: "",
                    state: "",
                    pincode: "",
                    country: "India",
                  });
                }}
              >
                Cancel
              </Button>
              {!showNewCompanyForm && (
                <Button
                  onClick={handleMakeAdmin}
                  disabled={!selectedCompany}
                  className="bg-gradient-primary"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Confirm & Make Admin
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Users;
