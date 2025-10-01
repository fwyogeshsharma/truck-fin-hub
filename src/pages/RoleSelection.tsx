import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruckIcon, Package, Wallet, Shield } from "lucide-react";
import { auth, User } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const roles = [
  {
    id: "load_owner" as const,
    title: "Load Provider",
    description: "Create trips and request invoice financing for your logistics operations",
    icon: Package,
    color: "primary",
  },
  {
    id: "transporter" as const,
    title: "Vehicle Provider",
    description: "Execute trips efficiently and receive faster payments for deliveries",
    icon: TruckIcon,
    color: "secondary",
  },
  {
    id: "lender" as const,
    title: "Lender",
    description: "Invest in trips and earn competitive returns on short-term lending",
    icon: Wallet,
    color: "accent",
  },
  {
    id: "admin" as const,
    title: "Admin",
    description: "Manage system operations, compliance, and ensure platform security",
    icon: Shield,
    color: "primary",
  },
];

const RoleSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<User['role'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = () => {
    if (!selectedRole) return;

    setIsLoading(true);
    const updatedUser = auth.updateUserRole(selectedRole);

    if (updatedUser) {
      toast({
        title: "Role selected!",
        description: `Welcome, ${roles.find(r => r.id === selectedRole)?.title}`,
      });
      navigate(`/dashboard/${selectedRole}`);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="absolute inset-0 bg-background/95" />
      
      <div className="w-full max-w-5xl relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Choose Your Role</h1>
          <p className="text-muted-foreground">Select how you'll use TruckFin (this can't be changed later)</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-${role.color}/10 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-6 w-6 text-${role.color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{role.title}</CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            className="bg-gradient-primary px-12"
            disabled={!selectedRole || isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? "Confirming..." : "Confirm Role"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
