import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KYCData, BusinessEntityInfo, EntityType } from '@/lib/kyc-types';
import { useToast } from '@/hooks/use-toast';

interface BusinessEntityFormProps {
  kycData: KYCData;
  onComplete: (data: Partial<KYCData>) => void;
  onBack: () => void;
}

const BusinessEntityForm = ({ kycData, onComplete, onBack }: BusinessEntityFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<BusinessEntityInfo>>(
    kycData.businessInfo || {
      entityName: '',
      entityType: kycData.entityType as Exclude<EntityType, 'individual'>,
      dateOfIncorporation: '',
      registrationNumber: '',
      panNumber: '',
      authorizedSignatories: [],
    }
  );

  const handleChange = (field: keyof BusinessEntityInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.entityName || !formData.panNumber || !formData.registrationNumber) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Information',
        description: 'Please fill all required fields',
      });
      return;
    }

    onComplete({ businessInfo: formData as BusinessEntityInfo });
    toast({
      title: 'Business Information Saved',
      description: 'Proceeding to next step',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Entity Information</CardTitle>
        <CardDescription>Provide details about your business entity</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="entityName">
                Entity Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="entityName"
                placeholder="As per registration certificate"
                value={formData.entityName}
                onChange={(e) => handleChange('entityName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNumber">
                Registration Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="registrationNumber"
                placeholder="CIN/Registration No."
                value={formData.registrationNumber}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfIncorporation">
                Date of Incorporation <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfIncorporation"
                type="date"
                value={formData.dateOfIncorporation}
                onChange={(e) => handleChange('dateOfIncorporation', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="panNumber">
                PAN Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="panNumber"
                placeholder="Company PAN"
                value={formData.panNumber}
                onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                maxLength={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number (if applicable)</Label>
              <Input
                id="gstNumber"
                placeholder="GST Registration Number"
                value={formData.gstNumber || ''}
                onChange={(e) => handleChange('gstNumber', e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> You will need to upload incorporation certificate, board resolution, and provide
              authorized signatory details in the next steps.
            </p>
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

export default BusinessEntityForm;
