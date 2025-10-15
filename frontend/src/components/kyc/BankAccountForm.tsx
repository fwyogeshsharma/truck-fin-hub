import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KYCData, BankAccountInfo } from '@/lib/kyc-types';
import { useToast } from '@/hooks/use-toast';
import { kycService } from '@/lib/kyc-service';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface BankAccountFormProps {
  kycData: KYCData;
  onComplete: (data: Partial<KYCData>) => void;
  onBack: () => void;
}

const BankAccountForm = ({ kycData, onComplete, onBack }: BankAccountFormProps) => {
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(false);
  const [formData, setFormData] = useState<BankAccountInfo>(
    kycData.bankAccount || {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      accountType: 'savings',
      verificationStatus: 'pending',
    }
  );

  const handleChange = (field: keyof BankAccountInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const verifyBankAccount = async () => {
    if (!formData.accountNumber || !formData.ifscCode) {
      toast({
        variant: 'destructive',
        title: 'Required Fields',
        description: 'Please enter account number and IFSC code',
      });
      return;
    }

    setVerifying(true);
    try {
      const result = await kycService.verifyBankAccount(formData.accountNumber, formData.ifscCode);
      setFormData((prev) => ({
        ...prev,
        verificationStatus: result.valid ? 'verified' : 'failed',
      }));
      toast({
        title: result.valid ? 'Account Verified' : 'Verification Failed',
        description: result.message,
        variant: result.valid ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Could not verify bank account',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.verificationStatus !== 'verified') {
      toast({
        variant: 'destructive',
        title: 'Account Not Verified',
        description: 'Please verify your bank account before proceeding',
      });
      return;
    }

    onComplete({ bankAccount: formData });
    toast({
      title: 'Bank Details Saved',
      description: 'Bank account verified and saved',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Account Details</CardTitle>
        <CardDescription>Provide bank account details for transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="accountHolderName">
                Account Holder Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountHolderName"
                placeholder="As per bank records"
                value={formData.accountHolderName}
                onChange={(e) => handleChange('accountHolderName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">
                Account Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountNumber"
                placeholder="Enter account number"
                value={formData.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifscCode">
                IFSC Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ifscCode"
                placeholder="ABCD0123456"
                value={formData.ifscCode}
                onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                maxLength={11}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">
                Bank Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bankName"
                placeholder="Bank name"
                value={formData.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branchName">
                Branch Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="branchName"
                placeholder="Branch name"
                value={formData.branchName}
                onChange={(e) => handleChange('branchName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select value={formData.accountType} onValueChange={(value) => handleChange('accountType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings Account</SelectItem>
                  <SelectItem value="current">Current Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID (Optional)</Label>
              <Input
                id="upiId"
                placeholder="yourname@upi"
                value={formData.upiId || ''}
                onChange={(e) => handleChange('upiId', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <Button type="button" onClick={verifyBankAccount} disabled={verifying || formData.verificationStatus === 'verified'}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify Bank Account
            </Button>
            {formData.verificationStatus === 'verified' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Account Verified</span>
              </div>
            )}
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

export default BankAccountForm;
