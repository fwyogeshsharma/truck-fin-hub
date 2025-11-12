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
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const validateEmail = (email: string) => {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePhone = (phone: string) => {
    if (!phone) {
      return 'Phone number is required';
    }
    // Indian phone number: 10 digits, optionally starting with +91 or 0
    const phoneRegex = /^(\+91|0)?[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/[\s-]/g, ''); // Remove spaces and dashes
    if (!phoneRegex.test(cleanPhone)) {
      return 'Please enter a valid 10-digit Indian phone number';
    }
    return '';
  };

  const handleEditProfile = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      location: user?.location || '',
      company: user?.company || '',
    });
    setValidationErrors({ email: '', phone: '' });
    setEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    // Validate fields before saving
    const emailError = validateEmail(formData.email);
    const phoneError = validatePhone(formData.phone);

    setValidationErrors({
      email: emailError,
      phone: phoneError,
    });

    // Stop if there are validation errors
    if (emailError || phoneError) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors before saving.',
      });
      return;
    }

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
                      <p className="font-medium">{user.phone || 'Not specified'}</p>
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
                          ? new Date(user.createdAt).getFullYear()
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
                  onChange={(e) => {
                    const newEmail = e.target.value;
                    setFormData({ ...formData, email: newEmail });
                    setValidationErrors({ ...validationErrors, email: validateEmail(newEmail) });
                  }}
                  placeholder="Enter your email"
                  className={validationErrors.email ? 'border-red-500' : ''}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const newPhone = e.target.value;
                    setFormData({ ...formData, phone: newPhone });
                    setValidationErrors({ ...validationErrors, phone: validatePhone(newPhone) });
                  }}
                  placeholder="Enter your phone number (e.g., 9876543210)"
                  className={validationErrors.phone ? 'border-red-500' : ''}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-500">{validationErrors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter your location (City, State)"
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
              <Button
                onClick={handleSaveProfile}
                disabled={saving || !!validationErrors.email || !!validationErrors.phone}
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
