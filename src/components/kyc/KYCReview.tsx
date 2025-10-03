import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KYCData } from '@/lib/kyc-types';
import { CheckCircle2, User, Home, FileText, CreditCard, Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface KYCReviewProps {
  kycData: KYCData;
  onSubmit: () => void;
  onBack: () => void;
}

const KYCReview = ({ kycData, onSubmit, onBack }: KYCReviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & Submit</CardTitle>
        <CardDescription>Please review all information before submitting your KYC application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Info */}
        {kycData.personalInfo && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Personal Information</h3>
              <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm ml-7">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{kycData.personalInfo.fullName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">DOB:</span>
                <p className="font-medium">{new Date(kycData.personalInfo.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{kycData.personalInfo.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium">{kycData.personalInfo.phone}</p>
              </div>
            </div>
            <Separator />
          </div>
        )}

        {/* Address */}
        {kycData.addressInfo && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Address Information</h3>
              <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
            </div>
            <div className="text-sm ml-7">
              <span className="text-muted-foreground">Current Address:</span>
              <p className="font-medium">
                {kycData.addressInfo.currentAddress.line1}, {kycData.addressInfo.currentAddress.city},{' '}
                {kycData.addressInfo.currentAddress.state} - {kycData.addressInfo.currentAddress.pincode}
              </p>
            </div>
            <Separator />
          </div>
        )}

        {/* Identity Documents */}
        {kycData.identityDocuments && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Identity Documents</h3>
              <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm ml-7">
              <div>
                <span className="text-muted-foreground">PAN:</span>
                <p className="font-medium">{kycData.identityDocuments.pan.documentNumber}</p>
                <span className="text-xs text-green-600">✓ Verified</span>
              </div>
              <div>
                <span className="text-muted-foreground">Aadhaar:</span>
                <p className="font-medium">{kycData.identityDocuments.aadhaar.documentNumber}</p>
                <span className="text-xs text-green-600">✓ Verified</span>
              </div>
            </div>
            <Separator />
          </div>
        )}

        {/* Bank Account */}
        {kycData.bankAccount && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Bank Account</h3>
              <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm ml-7">
              <div>
                <span className="text-muted-foreground">Bank:</span>
                <p className="font-medium">{kycData.bankAccount.bankName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Account:</span>
                <p className="font-medium">
                  {kycData.bankAccount.accountNumber.replace(/\d(?=\d{4})/g, 'X')}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">IFSC:</span>
                <p className="font-medium">{kycData.bankAccount.ifscCode}</p>
              </div>
            </div>
            <Separator />
          </div>
        )}

        {/* Compliance */}
        {kycData.complianceChecks && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Compliance Checks</h3>
              <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm ml-7">
              <div>
                <span className="text-muted-foreground">PEP Screening:</span>
                <p className="font-medium text-green-600">✓ Passed</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sanction Check:</span>
                <p className="font-medium text-green-600">✓ Passed</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fraud Check:</span>
                <p className="font-medium text-green-600">✓ Passed</p>
              </div>
              <div>
                <span className="text-muted-foreground">AML Score:</span>
                <p className="font-medium">{kycData.complianceChecks.amlScore}/100</p>
              </div>
            </div>
            <Separator />
          </div>
        )}

        {/* Declaration */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">Declaration</h4>
          <p className="text-sm text-muted-foreground">
            I hereby declare that all the information provided by me is true, correct, and complete to the best of my
            knowledge. I understand that any false information may lead to rejection of my application and legal action.
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onSubmit} className="bg-green-600 hover:bg-green-700">
            Submit KYC Application
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCReview;
