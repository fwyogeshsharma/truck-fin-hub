import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KYCData, PersonalInfo, ResidentialStatus, IncomeRange, OccupationType } from '@/lib/kyc-types';
import { useToast } from '@/hooks/use-toast';

interface PersonalInfoFormProps {
  kycData: KYCData;
  onComplete: (data: Partial<KYCData>) => void;
  onBack: () => void;
}

const PersonalInfoForm = ({ kycData, onComplete, onBack }: PersonalInfoFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PersonalInfo>(
    kycData.personalInfo || {
      fullName: '',
      dateOfBirth: '',
      nationality: 'Indian',
      residentialStatus: 'resident' as ResidentialStatus,
      occupation: 'salaried' as OccupationType,
      sourceOfFunds: '',
      annualIncome: 'below_1_lakh' as IncomeRange,
      phone: '',
      email: '',
    }
  );

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.dateOfBirth || !formData.phone || !formData.email) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Information',
        description: 'Please fill all required fields',
      });
      return;
    }

    // Calculate age
    const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
    if (age < 18) {
      toast({
        variant: 'destructive',
        title: 'Age Restriction',
        description: 'You must be at least 18 years old to complete KYC',
      });
      return;
    }

    onComplete({ personalInfo: formData });
    toast({
      title: 'Personal Information Saved',
      description: 'Proceeding to next step',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Enter your personal details as per official documents</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="As per PAN/Aadhaar"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatherName">Father's Name</Label>
              <Input
                id="fatherName"
                placeholder="Father's full name"
                value={formData.fatherName || ''}
                onChange={(e) => handleChange('fatherName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motherName">Mother's Name</Label>
              <Input
                id="motherName"
                placeholder="Mother's full name"
                value={formData.motherName || ''}
                onChange={(e) => handleChange('motherName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spouseName">Spouse Name (if applicable)</Label>
              <Input
                id="spouseName"
                placeholder="Spouse's full name"
                value={formData.spouseName || ''}
                onChange={(e) => handleChange('spouseName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="residentialStatus">Residential Status</Label>
              <Select
                value={formData.residentialStatus}
                onValueChange={(value) => handleChange('residentialStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">Resident Indian</SelectItem>
                  <SelectItem value="nri">Non-Resident Indian (NRI)</SelectItem>
                  <SelectItem value="foreign_national">Foreign National</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Select value={formData.occupation} onValueChange={(value) => handleChange('occupation', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salaried">Salaried</SelectItem>
                  <SelectItem value="self_employed">Self Employed</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="homemaker">Homemaker</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceOfFunds">Source of Funds</Label>
              <Input
                id="sourceOfFunds"
                placeholder="e.g., Salary, Business Income, etc."
                value={formData.sourceOfFunds}
                onChange={(e) => handleChange('sourceOfFunds', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualIncome">Annual Income Range</Label>
              <Select
                value={formData.annualIncome}
                onValueChange={(value) => handleChange('annualIncome', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="below_1_lakh">Below ₹1 Lakh</SelectItem>
                  <SelectItem value="1_to_5_lakh">₹1 - 5 Lakh</SelectItem>
                  <SelectItem value="5_to_10_lakh">₹5 - 10 Lakh</SelectItem>
                  <SelectItem value="10_to_25_lakh">₹10 - 25 Lakh</SelectItem>
                  <SelectItem value="25_to_1_crore">₹25 Lakh - 1 Crore</SelectItem>
                  <SelectItem value="above_1_crore">Above ₹1 Crore</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 XXXXXXXXXX"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit">Save & Continue</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
