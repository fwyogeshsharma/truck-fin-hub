import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import WalletCard from '@/components/WalletCard';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UserIcon, Mail, Phone, Briefcase, Calendar, Shield, Wallet, ArrowRight, Edit } from 'lucide-react';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const navigate = useNavigate();
  const user = auth.getCurrentUser();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    location: user?.location || '',
    company: user?.company || '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleEditProfile = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      location: user?.location || '',
      company: user?.company || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const updatedUser = await apiClient.put(`/users/${user.id}`, formData);

      // Update local auth state in sessionStorage
      sessionStorage.setItem('auth_user', JSON.stringify(updatedUser));

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });

      setEditDialogOpen(false);
      // Force page refresh to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'lender':
        return 'Lender';
      case 'load_owner':
        return 'Load Owner';
      case 'load_agent':
        return 'Transporter';
      case 'transporter':
        return 'Vehicle Owner';
      case 'admin':
        return 'Admin';
      case 'super_admin':
        return 'Super Admin';
      default:
        return role?.replace('_', ' ') || 'N/A';
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout role={user.role}>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your account and wallet</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Profile Info */}
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                      <Avatar className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 shrink-0">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg sm:text-xl md:text-2xl">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl md:text-2xl truncate">{user.name}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs sm:text-sm">
                            {getRoleDisplayName(user.role)}
                          </Badge>
                          <Badge variant="outline" className="capitalize flex items-center gap-1 text-xs sm:text-sm">
                            <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            KYC Pending
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditProfile}
                      className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm shrink-0 touch-target"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Edit Profile</span>
                      <span className="sm:hidden">Edit</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                  {/* Email */}
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-sm sm:text-base truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium text-sm sm:text-base truncate">{user.phone || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Account Type</p>
                      <p className="font-medium text-sm sm:text-base truncate">{getRoleDisplayName(user.role)}</p>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium text-sm sm:text-base">
                        {user.createdAt
                          ? new Date(user.createdAt).getFullYear()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* User ID */}
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                    <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">User ID</p>
                      <p className="font-medium font-mono text-[10px] sm:text-xs truncate">{user.id}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Wallet */}
          <div className="space-y-3 sm:space-y-4">
            <WalletCard userId={user.id} showDetails={true} />

            {/* Wallet Details Button */}
            <Button
              onClick={() => navigate('/wallet')}
              className="w-full bg-gradient-primary h-10 sm:h-11 text-sm sm:text-base touch-target"
            >
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              View Wallet Details
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[92vw] sm:w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="pb-3 sm:pb-4">
              <DialogTitle className="text-base sm:text-lg">Edit Profile</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Update your profile information. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your name"
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="location" className="text-xs sm:text-sm">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter your location (City, State)"
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="company" className="text-xs sm:text-sm">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Enter your company name"
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={saving}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm touch-target"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm touch-target"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
