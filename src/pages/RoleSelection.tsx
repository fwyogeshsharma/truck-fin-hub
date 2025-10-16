import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruckIcon, Package, Wallet, UserCircle } from "lucide-react";
import { auth, User } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
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

const RoleSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<User['role'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

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
        const response = await fetch('/api/companies?active=true');
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        } else {
          throw new Error('Failed to fetch companies');
        }
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

    // If load_agent is selected and user doesn't have a company yet (first time role selection)
    if (selectedRole === 'load_agent' && !user?.company) {
      setShowCompanyDialog(true);
      return;
    }

    // For other roles or if company already selected, proceed directly
    proceedWithRoleSelection();
  };

  const proceedWithRoleSelection = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      const updatedUser = await auth.updateUserRole(
        selectedRole,
        selectedCompany?.display_name || selectedCompany?.name,
        selectedCompany?.logo,
        selectedCompany?.id
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

    // For shipper role, set status to pending and show approval message
    if (selectedRole === 'load_agent') {
      setIsLoading(true);
      try {
        // Update user with company and pending status
        await auth.updateUserRole(
          selectedRole,
          company.display_name || company.name,
          company.logo,
          company.id,
          'pending' // Set approval status to pending
        );

        toast({
          title: "Request Submitted",
          description: "Your request has been sent to the company admin for approval.",
        });

        // Logout user and redirect to auth page with message
        auth.logout();
        navigate('/auth', {
          state: {
            message: `Your shipper request for ${company.display_name || company.name} has been submitted. Please wait for admin approval before logging in again.`
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

      {/* Company Selection Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Your Company</DialogTitle>
            <DialogDescription>
              Choose the logistics company you represent as a Shipper
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
