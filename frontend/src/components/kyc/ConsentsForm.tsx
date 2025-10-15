import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { KYCData, ConsentDeclarations } from '@/lib/kyc-types';
import { useToast } from '@/hooks/use-toast';
import { FileCheck } from 'lucide-react';

interface ConsentsFormProps {
  kycData: KYCData;
  onComplete: (data: Partial<KYCData>) => void;
  onBack: () => void;
}

const ConsentsForm = ({ kycData, onComplete, onBack }: ConsentsFormProps) => {
  const { toast } = useToast();
  const [consents, setConsents] = useState<ConsentDeclarations>(
    kycData.consents || {
      kycConsent: false,
      dataStorageConsent: false,
      fatcaDeclaration: false,
      crsDeclaration: false,
      beneficialOwnershipDeclaration: false,
      consentTimestamp: '',
    }
  );

  const handleConsentChange = (field: keyof ConsentDeclarations, checked: boolean) => {
    setConsents((prev) => ({ ...prev, [field]: checked }));
  };

  const handleSubmit = () => {
    if (!consents.kycConsent || !consents.dataStorageConsent) {
      toast({
        variant: 'destructive',
        title: 'Required Consents',
        description: 'Please provide all mandatory consents to proceed',
      });
      return;
    }

    const finalConsents = {
      ...consents,
      consentTimestamp: new Date().toISOString(),
    };

    onComplete({ consents: finalConsents });
    toast({
      title: 'Consents Recorded',
      description: 'All consents have been recorded',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consents & Declarations</CardTitle>
        <CardDescription>Please review and accept the following consents and declarations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KYC Consent */}
        <div className="flex items-start space-x-3 p-4 border rounded-lg">
          <Checkbox
            id="kyc-consent"
            checked={consents.kycConsent}
            onCheckedChange={(checked) => handleConsentChange('kycConsent', checked as boolean)}
          />
          <div className="flex-1">
            <label
              htmlFor="kyc-consent"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
            >
              KYC Data Collection Consent <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              I hereby consent to the collection, verification, and processing of my KYC information for the purpose of
              investment in truck trip financing. I understand that this information will be used in accordance with RBI
              and SEBI guidelines.
            </p>
          </div>
        </div>

        {/* Data Storage Consent */}
        <div className="flex items-start space-x-3 p-4 border rounded-lg">
          <Checkbox
            id="data-storage"
            checked={consents.dataStorageConsent}
            onCheckedChange={(checked) => handleConsentChange('dataStorageConsent', checked as boolean)}
          />
          <div className="flex-1">
            <label
              htmlFor="data-storage"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
            >
              Data Storage & Privacy Consent <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              I consent to the secure storage of my personal and financial information as per the Digital Personal Data
              Protection Act (DPDP) 2023 and IT Act 2000. I understand my data will be encrypted and stored securely.
            </p>
          </div>
        </div>

        {/* FATCA Declaration */}
        <div className="flex items-start space-x-3 p-4 border rounded-lg">
          <Checkbox
            id="fatca"
            checked={consents.fatcaDeclaration}
            onCheckedChange={(checked) => handleConsentChange('fatcaDeclaration', checked as boolean)}
          />
          <div className="flex-1">
            <label
              htmlFor="fatca"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              FATCA Declaration
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              I declare that I am not a US person for tax purposes and do not have any US tax obligations under the
              Foreign Account Tax Compliance Act (FATCA).
            </p>
          </div>
        </div>

        {/* CRS Declaration */}
        <div className="flex items-start space-x-3 p-4 border rounded-lg">
          <Checkbox
            id="crs"
            checked={consents.crsDeclaration}
            onCheckedChange={(checked) => handleConsentChange('crsDeclaration', checked as boolean)}
          />
          <div className="flex-1">
            <label
              htmlFor="crs"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              CRS Declaration
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              I declare my tax residency status under Common Reporting Standard (CRS) for automatic exchange of
              financial account information.
            </p>
          </div>
        </div>

        {/* Beneficial Ownership */}
        {kycData.entityType !== 'individual' && (
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="beneficial-ownership"
              checked={consents.beneficialOwnershipDeclaration}
              onCheckedChange={(checked) => handleConsentChange('beneficialOwnershipDeclaration', checked as boolean)}
            />
            <div className="flex-1">
              <label
                htmlFor="beneficial-ownership"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Beneficial Ownership Declaration
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                I declare that the beneficial ownership information provided is true and accurate. I understand that any
                changes must be reported within 30 days.
              </p>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FileCheck className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900">Important Information</h4>
            <p className="text-sm text-blue-700 mt-1">
              By providing these consents, you acknowledge that you have read and understood our Privacy Policy and Terms
              of Service. Your data will be processed in compliance with Indian data protection laws.
            </p>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleSubmit}>Save & Continue</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsentsForm;
