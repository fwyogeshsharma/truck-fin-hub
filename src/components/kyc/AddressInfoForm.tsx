import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { KYCData, AddressInfo, Address } from '@/lib/kyc-types';
import { useToast } from '@/hooks/use-toast';

interface AddressInfoFormProps {
  kycData: KYCData;
  onComplete: (data: Partial<KYCData>) => void;
  onBack: () => void;
}

const emptyAddress: Address = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
};

const AddressInfoForm = ({ kycData, onComplete, onBack }: AddressInfoFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<AddressInfo>(
    kycData.addressInfo || {
      currentAddress: { ...emptyAddress },
      permanentAddress: { ...emptyAddress },
      isSameAddress: false,
    }
  );

  const handleCurrentAddressChange = (field: keyof Address, value: string) => {
    setFormData((prev) => ({
      ...prev,
      currentAddress: { ...prev.currentAddress, [field]: value },
    }));
  };

  const handlePermanentAddressChange = (field: keyof Address, value: string) => {
    setFormData((prev) => ({
      ...prev,
      permanentAddress: { ...prev.permanentAddress, [field]: value },
    }));
  };

  const handleSameAddressToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isSameAddress: checked,
      permanentAddress: checked ? { ...prev.currentAddress } : { ...emptyAddress },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const { currentAddress, permanentAddress } = formData;
    if (
      !currentAddress.line1 ||
      !currentAddress.city ||
      !currentAddress.state ||
      !currentAddress.pincode
    ) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Information',
        description: 'Please fill all required fields for current address',
      });
      return;
    }

    if (!formData.isSameAddress) {
      if (
        !permanentAddress.line1 ||
        !permanentAddress.city ||
        !permanentAddress.state ||
        !permanentAddress.pincode
      ) {
        toast({
          variant: 'destructive',
          title: 'Incomplete Information',
          description: 'Please fill all required fields for permanent address',
        });
        return;
      }
    }

    onComplete({ addressInfo: formData });
    toast({
      title: 'Address Information Saved',
      description: 'Proceeding to next step',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address Information</CardTitle>
        <CardDescription>Provide your current and permanent address details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="current-line1">
                  Address Line 1 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="current-line1"
                  placeholder="House/Flat No., Building Name"
                  value={formData.currentAddress.line1}
                  onChange={(e) => handleCurrentAddressChange('line1', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="current-line2">Address Line 2</Label>
                <Input
                  id="current-line2"
                  placeholder="Street, Locality"
                  value={formData.currentAddress.line2}
                  onChange={(e) => handleCurrentAddressChange('line2', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-city">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="current-city"
                  placeholder="City"
                  value={formData.currentAddress.city}
                  onChange={(e) => handleCurrentAddressChange('city', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-state">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="current-state"
                  placeholder="State"
                  value={formData.currentAddress.state}
                  onChange={(e) => handleCurrentAddressChange('state', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-pincode">
                  Pincode <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="current-pincode"
                  placeholder="6-digit pincode"
                  value={formData.currentAddress.pincode}
                  onChange={(e) => handleCurrentAddressChange('pincode', e.target.value)}
                  pattern="[0-9]{6}"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-country">Country</Label>
                <Input
                  id="current-country"
                  value={formData.currentAddress.country}
                  onChange={(e) => handleCurrentAddressChange('country', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Same Address Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same-address"
              checked={formData.isSameAddress}
              onCheckedChange={handleSameAddressToggle}
            />
            <label
              htmlFor="same-address"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Permanent address is same as current address
            </label>
          </div>

          {/* Permanent Address */}
          {!formData.isSameAddress && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Permanent Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="permanent-line1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="permanent-line1"
                    placeholder="House/Flat No., Building Name"
                    value={formData.permanentAddress.line1}
                    onChange={(e) => handlePermanentAddressChange('line1', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="permanent-line2">Address Line 2</Label>
                  <Input
                    id="permanent-line2"
                    placeholder="Street, Locality"
                    value={formData.permanentAddress.line2}
                    onChange={(e) => handlePermanentAddressChange('line2', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permanent-city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="permanent-city"
                    placeholder="City"
                    value={formData.permanentAddress.city}
                    onChange={(e) => handlePermanentAddressChange('city', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permanent-state">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="permanent-state"
                    placeholder="State"
                    value={formData.permanentAddress.state}
                    onChange={(e) => handlePermanentAddressChange('state', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permanent-pincode">
                    Pincode <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="permanent-pincode"
                    placeholder="6-digit pincode"
                    value={formData.permanentAddress.pincode}
                    onChange={(e) => handlePermanentAddressChange('pincode', e.target.value)}
                    pattern="[0-9]{6}"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permanent-country">Country</Label>
                  <Input
                    id="permanent-country"
                    value={formData.permanentAddress.country}
                    onChange={(e) => handlePermanentAddressChange('country', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

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

export default AddressInfoForm;
