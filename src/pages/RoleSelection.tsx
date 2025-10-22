import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TruckIcon, Package, Wallet, UserCircle } from "lucide-react";
import { auth, User } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/api/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Regular user roles (admin and super_admin are hidden from regular users)
const roles = [
  // {
  //   id: "load_owner" as const,
  //   title: "Load Owner",
  //   description: "Create trips and request invoice financing for your logistics operations",
  //   icon: Package,
  //   color: "primary",
  // },
  {
    id: "load_agent" as const,
    title: "Shipper",
    description: "Manage and facilitate trip financing for multiple load owners",
    icon: UserCircle,
    color: "primary",
  },
  {
    id: "transporter" as const,
    title: "Vehicle Owner",
    description: "Execute trips efficiently and receive faster payments for deliveries",
    icon: TruckIcon,
    color: "secondary",
  },
  {
    id: "vehicle_agent" as const,
    title: "Transporter",
    description: "Coordinate and manage trips for multiple vehicle owners",
    icon: UserCircle,
    color: "secondary",
  },
  {
    id: "lender" as const,
    title: "Lender",
    description: "Invest in trips and earn competitive returns on short-term lending",
    icon: Wallet,
    color: "accent",
  },
  // Note: admin and super_admin roles are not shown here
  // They are accessible only through direct login with specific credentials
];

interface Company {
  id: string;
  name: string;
  display_name: string;
  logo?: string;
  is_active: boolean;
}

type LenderType = 'individual' | 'company';
type ShipperAction = 'select' | 'create';

const RoleSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<User['role'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showLenderTypeDialog, setShowLenderTypeDialog] = useState(false);
  const [showShipperActionDialog, setShowShipperActionDialog] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [lenderType, setLenderType] = useState<LenderType | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    display_name: '',
    email: '',
    phone: '',
    address: '',
    gst_number: '',
  });

  // Check if user has accepted terms on component mount
  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user) {
      // Not logged in, redirect to auth
      navigate("/auth");
      return;
    }

    if (!user.termsAccepted) {
      // Terms not accepted, redirect to terms page
      toast({
        variant: "destructive",
        title: "Terms Required",
        description: "You must accept the terms and conditions before selecting a role",
      });
      navigate("/terms");
    }
  }, [navigate, toast]);

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const data = await apiClient.get('/companies?active=true');
        setCompanies(data);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
        toast({
          variant: "destructive",
          title: "Failed to load companies",
          description: "Could not load companies list. Please try again.",
        });
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [toast]);

  const handleConfirm = () => {
    if (!selectedRole) return;

    const user = auth.getCurrentUser();

    // For lenders, show individual/company choice first
    if (selectedRole === 'lender' && !user?.company) {
      setShowLenderTypeDialog(true);
      return;
    }

    // For shippers (load_agent), show select/create company dialog
    if (selectedRole === 'load_agent' && !user?.company) {
      setShowShipperActionDialog(true);
      return;
    }

    // For other roles or if already configured, proceed directly
    proceedWithRoleSelection();
  };

  const handleLenderTypeSelect = (type: LenderType) => {
    setLenderType(type);
    setShowLenderTypeDialog(false);

    if (type === 'individual') {
      // Individual lender - go directly to dashboard
      proceedWithRoleSelection();
    } else {
      // Company lender - show create/select company dialog (same as shipper)
      setShowShipperActionDialog(true);
    }
  };

  const handleShipperActionSelect = (action: ShipperAction) => {
    setShowShipperActionDialog(false);

    if (action === 'select') {
      // Select existing company
      setShowCompanyDialog(true);
    } else {
      // Create new company
      setShowCompanyForm(true);
    }
  };

  const handleCompanyFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create company via API
      const newCompany = await apiClient.post('/companies', companyFormData);

      toast({
        title: "Company Created",
        description: `${newCompany.display_name || newCompany.name} has been created successfully.`,
      });

      // Set the new company and proceed
      setSelectedCompany(newCompany);
      setShowCompanyForm(false);
      await handleCompanySelect(newCompany);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create company",
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const proceedWithRoleSelection = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      // Determine user type based on role and selection
      const userType = selectedRole === 'lender' ? lenderType || 'individual' :
                       (selectedCompany || selectedRole === 'load_agent') ? 'company' : 'individual';

      const updatedUser = await auth.updateUserRole(
        selectedRole,
        selectedCompany?.display_name || selectedCompany?.name,
        selectedCompany?.logo,
        selectedCompany?.id,
        undefined, // approvalStatus
        userType
      );

      if (updatedUser) {
        toast({
          title: "Role selected!",
          description: `Welcome, ${roles.find(r => r.id === selectedRole)?.title}`,
        });
        navigate(`/dashboard/${selectedRole}`);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySelect = async (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyDialog(false);

    // For shipper and lender roles, set status to pending and show approval message
    if (selectedRole === 'load_agent' || selectedRole === 'lender') {
      setIsLoading(true);
      try {
        // Update user with company and pending status
        await auth.updateUserRole(
          selectedRole,
          company.display_name || company.name,
          company.logo,
          company.id,
          'pending', // Set approval status to pending
          'company' // Company lender/shipper
        );

        const roleTitle = selectedRole === 'load_agent' ? 'shipper' : 'lender';

        toast({
          title: "Request Submitted",
          description: "Your request has been sent to the company admin for approval.",
        });

        // Logout user and redirect to auth page with message
        auth.logout();
        navigate('/auth', {
          state: {
            message: `Your ${roleTitle} request for ${company.display_name || company.name} has been submitted. Please wait for admin approval before logging in again.`
          }
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to submit request",
          description: error.message || "Something went wrong",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      proceedWithRoleSelection();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-background/95" />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] opacity-10 animate-float-slow">
          <Package className="h-20 w-20 text-primary" />
        </div>
        <div className="absolute top-[20%] right-[10%] opacity-10 animate-float-medium">
          <TruckIcon className="h-24 w-24 text-secondary" />
        </div>
        <div className="absolute bottom-[15%] left-[15%] opacity-10 animate-float-fast">
          <Wallet className="h-16 w-16 text-accent" />
        </div>
        <div className="absolute top-[60%] right-[5%] opacity-10 animate-float-slow">
          <UserCircle className="h-20 w-20 text-primary" />
        </div>
        <div className="absolute bottom-[25%] right-[20%] opacity-10 animate-float-medium">
          <Package className="h-18 w-18 text-secondary" />
        </div>
        <div className="absolute top-[40%] left-[8%] opacity-10 animate-float-fast">
          <TruckIcon className="h-22 w-22 text-accent" />
        </div>
        <div className="absolute bottom-[40%] right-[15%] opacity-10 animate-float-slow">
          <Wallet className="h-20 w-20 text-primary" />
        </div>
        <div className="absolute top-[70%] left-[25%] opacity-10 animate-float-medium">
          <UserCircle className="h-16 w-16 text-secondary" />
        </div>
      </div>

      <div className="w-full max-w-7xl relative">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">Choose Your Role</h1>
          <p className="text-lg text-muted-foreground">Select how you'll use LogiFin (<span className="font-bold text-foreground">this can't be changed later</span>)</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 ${
                  isSelected ? 'ring-4 ring-primary shadow-2xl scale-105 border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader className="text-center space-y-4 p-6">
                  <div className="flex justify-center">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${
                      role.color === 'primary' ? 'from-primary/20 to-primary/10' :
                      role.color === 'secondary' ? 'from-secondary/20 to-secondary/10' :
                      'from-accent/20 to-accent/10'
                    } flex items-center justify-center shadow-lg`}>
                      <Icon className={`h-8 w-8 text-${role.color}`} />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-3 font-bold">{role.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">{role.description}</CardDescription>
                  </div>
                  {isSelected && (
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">✓ Selected</span>
                    </div>
                  )}
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            className="bg-gradient-primary px-16 py-6 text-lg shadow-xl hover:shadow-2xl transition-all"
            disabled={!selectedRole || isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? "Confirming..." : "Confirm Role & Continue"}
          </Button>
        </div>
      </div>

      {/* Lender Type Selection Dialog */}
      <Dialog open={showLenderTypeDialog} onOpenChange={setShowLenderTypeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Lender Type</DialogTitle>
            <DialogDescription>
              Are you lending as an individual or representing a company?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Card
              className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary"
              onClick={() => handleLenderTypeSelect('individual')}
            >
              <CardContent className="p-6 text-center">
                <UserCircle className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold text-lg mb-2">Individual Lender</h3>
                <p className="text-sm text-muted-foreground">
                  Invest personally and manage your own portfolio
                </p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary"
              onClick={() => handleLenderTypeSelect('company')}
            >
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold text-lg mb-2">Company Lender</h3>
                <p className="text-sm text-muted-foreground">
                  Represent a lending company or financial institution
                </p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Company Action Selection Dialog (for both Shipper and Company Lender) */}
      <Dialog open={showShipperActionDialog} onOpenChange={setShowShipperActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Company Setup</DialogTitle>
            <DialogDescription>
              {selectedRole === 'lender'
                ? 'Select an existing lending company or create a new one'
                : 'Select an existing company or create a new one'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Card
              className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary"
              onClick={() => handleShipperActionSelect('select')}
            >
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold text-lg mb-2">Select Existing Company</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedRole === 'lender'
                    ? 'Choose from registered lending companies'
                    : 'Choose from registered logistics companies'}
                </p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary"
              onClick={() => handleShipperActionSelect('create')}
            >
              <CardContent className="p-6 text-center">
                <Wallet className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold text-lg mb-2">Create New Company</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedRole === 'lender'
                    ? 'Register your own lending company'
                    : 'Register your own logistics company'}
                </p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Company Form Dialog */}
      <Dialog open={showCompanyForm} onOpenChange={setShowCompanyForm}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              {selectedRole === 'lender'
                ? 'Fill in your lending company details to get started'
                : 'Fill in your company details to get started'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCompanyFormSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  placeholder="ABC Logistics Pvt Ltd"
                  value={companyFormData.name}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name *</Label>
                <Input
                  id="display-name"
                  placeholder="ABC Logistics"
                  value={companyFormData.display_name}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, display_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-email">Email *</Label>
                <Input
                  id="company-email"
                  type="email"
                  placeholder="contact@abclogistics.com"
                  value={companyFormData.email}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-phone">Phone *</Label>
                <Input
                  id="company-phone"
                  type="tel"
                  placeholder="9876543210"
                  value={companyFormData.phone}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
                  required
                  pattern="[0-9]{10}"
                  minLength={10}
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Address *</Label>
              <Input
                id="company-address"
                placeholder="123 Business Park, City, State - 400001"
                value={companyFormData.address}
                onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst-number">GST Number (Optional)</Label>
              <Input
                id="gst-number"
                placeholder="22AAAAA0000A1Z5"
                value={companyFormData.gst_number}
                onChange={(e) => setCompanyFormData({ ...companyFormData, gst_number: e.target.value.toUpperCase() })}
                pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground">Format: 22AAAAA0000A1Z5</p>
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCompanyForm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-primary"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Company"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Company Selection Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Your Company</DialogTitle>
            <DialogDescription>
              {selectedRole === 'load_agent'
                ? 'Choose the logistics company you represent as a Shipper'
                : selectedRole === 'lender'
                ? 'Choose the lending company you want to represent'
                : 'Choose the company you want to work for'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {loadingCompanies ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading companies...</p>
              </div>
            ) : companies.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No companies available</p>
              </div>
            ) : (
              companies.map((company) => (
                <Card
                  key={company.id}
                  className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary"
                  onClick={() => handleCompanySelect(company)}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    {company.logo && (
                      <div className="w-24 h-24 flex items-center justify-center bg-white rounded-lg p-2">
                        <img
                          src={company.logo}
                          alt={company.display_name || company.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{company.display_name || company.name}</h3>
                      <p className="text-sm text-muted-foreground">Click to select</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleSelection;
