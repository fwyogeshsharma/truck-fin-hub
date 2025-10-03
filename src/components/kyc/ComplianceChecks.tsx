import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KYCData, ComplianceChecks as ComplianceChecksType } from '@/lib/kyc-types';
import { useToast } from '@/hooks/use-toast';
import { kycService } from '@/lib/kyc-service';
import { Shield, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

interface ComplianceChecksProps {
  kycData: KYCData;
  onComplete: (data: Partial<KYCData>) => void;
  onBack: () => void;
}

const ComplianceChecks = ({ kycData, onComplete, onBack }: ComplianceChecksProps) => {
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [checks, setChecks] = useState<ComplianceChecksType>(
    kycData.complianceChecks || {
      pepScreening: { checked: false, isPEP: false },
      sanctionScreening: { checked: false, onSanctionList: false },
      fraudCheck: { checked: false, duplicateDetected: false },
    }
  );

  const runAllChecks = async () => {
    setChecking(true);

    try {
      // PEP Screening
      const isPEP = await kycService.performPEPScreening(
        kycData.personalInfo?.fullName || '',
        kycData.personalInfo?.dateOfBirth || ''
      );

      setChecks((prev) => ({
        ...prev,
        pepScreening: {
          checked: true,
          isPEP,
          details: isPEP ? 'Person identified as PEP' : 'Not a PEP',
          checkedAt: new Date().toISOString(),
        },
      }));

      // Sanction Screening
      const onSanctionList = await kycService.performSanctionScreening(
        kycData.personalInfo?.fullName || '',
        kycData.personalInfo?.nationality || ''
      );

      setChecks((prev) => ({
        ...prev,
        sanctionScreening: {
          checked: true,
          onSanctionList,
          details: onSanctionList ? 'Found on sanction list' : 'Not on any sanction lists',
          checkedAt: new Date().toISOString(),
        },
      }));

      // Fraud Check
      const duplicateDetected = await kycService.performFraudCheck(
        kycData.identityDocuments?.pan?.documentNumber || '',
        kycData.identityDocuments?.aadhaar?.documentNumber || ''
      );

      setChecks((prev) => ({
        ...prev,
        fraudCheck: {
          checked: true,
          duplicateDetected,
          details: duplicateDetected ? 'Duplicate KYC detected' : 'No duplicates found',
          checkedAt: new Date().toISOString(),
        },
        amlScore: 85,
      }));

      toast({
        title: 'Compliance Checks Complete',
        description: 'All compliance screenings completed successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Check Failed',
        description: 'Could not complete compliance checks',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = () => {
    if (!checks.pepScreening.checked || !checks.sanctionScreening.checked || !checks.fraudCheck.checked) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Checks',
        description: 'Please run all compliance checks before proceeding',
      });
      return;
    }

    if (checks.pepScreening.isPEP || checks.sanctionScreening.onSanctionList || checks.fraudCheck.duplicateDetected) {
      toast({
        variant: 'destructive',
        title: 'Compliance Issues Detected',
        description: 'Your application requires manual review due to compliance flags',
      });
    }

    onComplete({ complianceChecks: checks });
    toast({
      title: 'Compliance Checks Saved',
      description: 'Proceeding to next step',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance & Risk Checks</CardTitle>
        <CardDescription>
          Automated compliance screening as per RBI, SEBI, and PMLA guidelines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* PEP Screening */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">PEP Screening</h3>
                <p className="text-sm text-muted-foreground">Politically Exposed Person check</p>
              </div>
            </div>
            {checks.pepScreening.checked && (
              <div className="text-right">
                {checks.pepScreening.isPEP ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                <p className="text-xs text-muted-foreground mt-1">{checks.pepScreening.details}</p>
              </div>
            )}
          </div>

          {/* Sanction Screening */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Sanction List Screening</h3>
                <p className="text-sm text-muted-foreground">UN, FATF, SEBI watchlist check</p>
              </div>
            </div>
            {checks.sanctionScreening.checked && (
              <div className="text-right">
                {checks.sanctionScreening.onSanctionList ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                <p className="text-xs text-muted-foreground mt-1">{checks.sanctionScreening.details}</p>
              </div>
            )}
          </div>

          {/* Fraud Check */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Fraud & Duplicate Check</h3>
                <p className="text-sm text-muted-foreground">Duplicate KYC detection</p>
              </div>
            </div>
            {checks.fraudCheck.checked && (
              <div className="text-right">
                {checks.fraudCheck.duplicateDetected ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                <p className="text-xs text-muted-foreground mt-1">{checks.fraudCheck.details}</p>
              </div>
            )}
          </div>

          {/* AML Score */}
          {checks.amlScore && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold">AML Risk Score</span>
                <span className="text-2xl font-bold text-primary">{checks.amlScore}/100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {checks.amlScore >= 80 ? 'Low Risk' : checks.amlScore >= 60 ? 'Medium Risk' : 'High Risk'}
              </p>
            </div>
          )}
        </div>

        <Button onClick={runAllChecks} disabled={checking} className="w-full">
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Running Compliance Checks...
            </>
          ) : (
            'Run All Compliance Checks'
          )}
        </Button>

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

export default ComplianceChecks;
