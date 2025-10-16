import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TruckIcon, LogOut, Home, Package, Wallet, Shield, Users, User as UserIcon, Settings, FileCheck, Bell as BellIcon, FileText, Menu, X, ArrowLeftRight } from "lucide-react";
import { auth, User } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/api/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import NotificationBell from "@/components/NotificationBell";

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
    title: "Shipper",
    icon: Users,
    nav: [
      { label: "Dashboard", path: "/dashboard/load_agent", icon: Home },
      { label: "Wallet", path: "/wallet", icon: Wallet },
    ],
  },
  transporter: {
    title: "Transporter",
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
      { label: "Lender Opportunities", path: "/opportunities", icon: Package },
      { label: "My Lendings", path: "/investments", icon: Wallet },
    ],
  },
  admin: {
    title: "Admin",
    icon: Shield,
    nav: [
      { label: "Dashboard", path: "/dashboard/admin", icon: Home },
      { label: "Admin Panel", path: "/admin-panel", icon: Shield },
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "System", path: "/admin/system", icon: Shield },
    ],
  },
  super_admin: {
    title: "Super Admin",
    icon: Shield,
    nav: [
      { label: "Dashboard", path: "/dashboard/super_admin", icon: Home },
      { label: "Platform Config", path: "/platform-config", icon: Settings },
      { label: "Transaction Requests", path: "/transaction-requests", icon: ArrowLeftRight },
      { label: "Admin Panel", path: "/dashboard/admin", icon: Shield },
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "System", path: "/admin/system", icon: Shield },
    ],
  },
};

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(auth.getCurrentUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const config = roleConfig[role || 'load_owner'];
  const RoleIcon = config.icon;

  // Add Admin Panel tab to navigation if user is an admin (based on is_admin flag)
  const navigationItems = [...config.nav];
  if (user?.is_admin && role !== 'admin' && role !== 'super_admin') {
    navigationItems.push({ label: "Admin Panel", path: "/admin-panel", icon: Shield });
  }

  // Sync user data from API on mount and when role changes
  useEffect(() => {
    const syncUserData = async () => {
      try {
        // Skip API sync for admin roles (they don't exist in database)
        const currentUser = auth.getCurrentUser();
        if (currentUser?.role === 'super_admin' || currentUser?.role === 'admin') {
          setUser(currentUser);
          return;
        }

        const response = await authAPI.getMe();
        if (response.user) {
          // Update sessionStorage with fresh data (tab-specific)
          sessionStorage.setItem('current_user', JSON.stringify(response.user));
          sessionStorage.setItem('current_wallet', JSON.stringify(response.wallet));
          setUser(response.user);

          // If user's role doesn't match current route, redirect to correct dashboard
          if (response.user.role && response.user.role !== role) {
            navigate(`/dashboard/${response.user.role}`, { replace: true });
          }
        }
      } catch (error) {
        console.error('Failed to sync user data:', error);
        // If token is invalid, logout (but not for admin roles)
        const currentUser = auth.getCurrentUser();
        if (currentUser?.role !== 'super_admin' && currentUser?.role !== 'admin') {
          auth.logout();
          navigate('/auth');
        }
      }
    };

    syncUserData();
  }, [role, navigate]);

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
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/logiFin.png" alt="LogiFin" className="h-8 w-auto md:h-10 object-contain" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => {
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

          <div className="flex items-center gap-2 md:gap-4">
            {/* Role Badge - Hidden on small screens */}
            <div className="hidden sm:flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-primary/10 rounded-full">
              <RoleIcon className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              <span className="text-xs md:text-sm font-medium">{config.title}</span>
            </div>

            {/* Notification Bell */}
            {user?.id && <NotificationBell userId={user.id} />}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full">
                  <Avatar className="h-8 w-8 md:h-10 md:w-10">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm md:text-base">
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
                <DropdownMenuItem onClick={() => navigate('/settings/notifications')}>
                  <BellIcon className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/reports')}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Reports</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(role === 'load_owner' || role === 'load_agent' ? '/shipper-kyc' : '/kyc')}>
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

            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <RoleIcon className="h-5 w-5 text-primary" />
                    {config.title}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-2">
                  {navigationItems.map((item) => {
                    const NavIcon = item.icon;
                    return (
                      <Button
                        key={item.path}
                        variant="ghost"
                        className="justify-start gap-3 h-12"
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <NavIcon className="h-5 w-5" />
                        <span className="text-base">{item.label}</span>
                      </Button>
                    );
                  })}
                  <div className="my-4 border-t" />
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 h-12"
                    onClick={() => {
                      navigate('/profile');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <UserIcon className="h-5 w-5" />
                    <span className="text-base">Profile</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 h-12"
                    onClick={() => {
                      navigate('/reports');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-base">Reports</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 h-12"
                    onClick={() => {
                      navigate('/settings');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Settings className="h-5 w-5" />
                    <span className="text-base">Settings</span>
                  </Button>
                  <div className="my-4 border-t" />
                  <Button
                    variant="destructive"
                    className="justify-start gap-3 h-12"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-base">Log out</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
