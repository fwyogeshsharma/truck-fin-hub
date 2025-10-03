import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TruckIcon, LogOut, Home, Package, Wallet, Shield, Users, User as UserIcon, Settings, FileCheck } from "lucide-react";
import { auth, User } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: ReactNode;
  role: User['role'];
}

const roleConfig = {
  load_owner: {
    title: "Load Provider",
    icon: Package,
    nav: [
      { label: "Dashboard", path: "/dashboard/load_owner", icon: Home },
      { label: "Create Trip", path: "/create-trip", icon: Package },
      { label: "Wallet", path: "/wallet", icon: Wallet },
    ],
  },
  load_agent: {
    title: "Load Agent",
    icon: Users,
    nav: [
      { label: "Dashboard", path: "/dashboard/load_agent", icon: Home },
      { label: "All Trips", path: "/dashboard/load_agent", icon: Package },
      { label: "Wallet", path: "/wallet", icon: Wallet },
    ],
  },
  transporter: {
    title: "Vehicle Provider",
    icon: TruckIcon,
    nav: [
      { label: "Dashboard", path: "/dashboard/transporter", icon: Home },
      { label: "My Trips", path: "/trips", icon: TruckIcon },
      { label: "Wallet", path: "/wallet", icon: Wallet },
    ],
  },
  lender: {
    title: "Lender",
    icon: Wallet,
    nav: [
      { label: "Dashboard", path: "/dashboard/lender", icon: Home },
      { label: "Investment Opportunities", path: "/opportunities", icon: Package },
      { label: "My Investments", path: "/investments", icon: Wallet },
    ],
  },
  admin: {
    title: "Admin",
    icon: Shield,
    nav: [
      { label: "Dashboard", path: "/dashboard/admin", icon: Home },
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "System", path: "/admin/system", icon: Shield },
    ],
  },
};

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();
  const config = roleConfig[role || 'load_owner'];
  const RoleIcon = config.icon;

  const handleLogout = () => {
    auth.logout();
    toast({
      title: "Logged out",
      description: "See you soon!",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <TruckIcon className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">TruckFin</span>
            </div>
            
            <div className="hidden md:flex items-center gap-1">
              {config.nav.map((item) => {
                const NavIcon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="gap-2"
                    onClick={() => navigate(item.path)}
                  >
                    <NavIcon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
              <RoleIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{config.title}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/kyc')}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  <span>KYC</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
