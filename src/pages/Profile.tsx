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
import { UserIcon, Mail, Phone, MapPin, Briefcase, Calendar, Shield, Wallet, ArrowRight, Edit } from 'lucide-react';
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account and wallet</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{user.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">
                          {getRoleDisplayName(user.role)}
                        </Badge>
                        <Badge variant="outline" className="capitalize flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          KYC Pending
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditProfile}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{user.phone || '+91 XXXXX XXXXX'}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{user.location || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Account Type</p>
                      <p className="font-medium">{getRoleDisplayName(user.role)}</p>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* User ID */}
                  <div className="flex items-start gap-3">
                    <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="font-medium font-mono text-xs">{user.id}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Wallet */}
          <div className="space-y-4">
            <WalletCard userId={user.id} showDetails={true} />

            {/* Wallet Details Button */}
            <Button
              onClick={() => navigate('/wallet')}
              className="w-full bg-gradient-primary"
              size="lg"
            >
              <Wallet className="h-4 w-4 mr-2" />
              View Wallet Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Enter your company name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving}>
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
