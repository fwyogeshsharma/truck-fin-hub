import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { kycService } from '@/lib/kyc-service';
import { KYCData, EntityType } from '@/lib/kyc-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  FileText,
  Building2,
  User,
  Home,
  CreditCard,
  Camera,
  Shield,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EntitySelection from '@/components/kyc/EntitySelection';
import PersonalInfoForm from '@/components/kyc/PersonalInfoForm';
import AddressInfoForm from '@/components/kyc/AddressInfoForm';
import IdentityDocumentsForm from '@/components/kyc/IdentityDocumentsForm';
import BankAccountForm from '@/components/kyc/BankAccountForm';
import BiometricVerificationForm from '@/components/kyc/BiometricVerificationForm';
import ComplianceChecks from '@/components/kyc/ComplianceChecks';
import ConsentsForm from '@/components/kyc/ConsentsForm';
import KYCReview from '@/components/kyc/KYCReview';
import BusinessEntityForm from '@/components/kyc/BusinessEntityForm';

type Step = {
  id: number;
  name: string;
  icon: any;
  component: string;
  required: boolean;
  forIndividual: boolean;
  forBusiness: boolean;
};

const steps: Step[] = [
  { id: 1, name: 'Entity Type', icon: Building2, component: 'entity', required: true, forIndividual: true, forBusiness: true },
  { id: 2, name: 'Personal Info', icon: User, component: 'personal', required: true, forIndividual: true, forBusiness: false },
  { id: 3, name: 'Business Info', icon: Building2, component: 'business', required: true, forIndividual: false, forBusiness: true },
  { id: 4, name: 'Address', icon: Home, component: 'address', required: true, forIndividual: true, forBusiness: true },
  { id: 5, name: 'Identity Docs', icon: FileText, component: 'identity', required: true, forIndividual: true, forBusiness: true },
  { id: 6, name: 'Bank Account', icon: CreditCard, component: 'bank', required: true, forIndividual: true, forBusiness: true },
  { id: 7, name: 'Biometric/Video KYC', icon: Camera, component: 'biometric', required: false, forIndividual: true, forBusiness: false },
  { id: 8, name: 'Compliance', icon: Shield, component: 'compliance', required: true, forIndividual: true, forBusiness: true },
  { id: 9, name: 'Consents', icon: FileCheck, component: 'consents', required: true, forIndividual: true, forBusiness: true },
  { id: 10, name: 'Review & Submit', icon: CheckCircle2, component: 'review', required: true, forIndividual: true, forBusiness: true },
];

const KYC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [kycData, setKYCData] = useState<KYCData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [entityType, setEntityType] = useState<EntityType>('individual');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Load existing KYC data
    const existingKYC = kycService.getCurrentUserKYC();
    if (existingKYC) {
      setKYCData(existingKYC);
      setEntityType(existingKYC.entityType);
      // Resume from last incomplete step if in progress
      if (existingKYC.status === 'in_progress') {
        const lastStep = calculateCurrentStep(existingKYC);
        setCurrentStep(lastStep);
      }
    }
    setLoading(false);
  }, [user, navigate]);

  const calculateCurrentStep = (kyc: KYCData): number => {
    if (!kyc.entityType) return 1;
    if (kyc.entityType === 'individual' && !kyc.personalInfo) return 2;
    if (kyc.entityType !== 'individual' && !kyc.businessInfo) return 3;
    if (!kyc.addressInfo) return 4;
    if (!kyc.identityDocuments) return 5;
    if (!kyc.bankAccount) return 6;
    if (kyc.entityType === 'individual' && !kyc.biometricVerification) return 7;
    if (!kyc.complianceChecks) return 8;
    if (!kyc.consents) return 9;
    return 10;
  };

  const handleEntityTypeSelection = (type: EntityType) => {
    setEntityType(type);
    const newKYC = kycService.initializeKYC(type);
    setKYCData(newKYC);
    setCurrentStep(type === 'individual' ? 2 : 3);
    toast({
      title: 'KYC Started',
      description: `Selected entity type: ${type}`,
    });
  };

  const handleStepComplete = (updatedData: Partial<KYCData>) => {
    if (!kycData) return;

    const updated: KYCData = {
      ...kycData,
      ...updatedData,
    };

    kycService.saveKYC(updated);
    setKYCData(updated);

    // Move to next applicable step
    const nextStep = getNextStep(currentStep);
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  const getNextStep = (current: number): number | null => {
    const applicableSteps = steps.filter((step) =>
      entityType === 'individual' ? step.forIndividual : step.forBusiness
    );
    const currentIndex = applicableSteps.findIndex((s) => s.id === current);
    if (currentIndex < applicableSteps.length - 1) {
      return applicableSteps[currentIndex + 1].id;
    }
    return null;
  };

  const getPreviousStep = (current: number): number | null => {
    const applicableSteps = steps.filter((step) =>
      entityType === 'individual' ? step.forIndividual : step.forBusiness
    );
    const currentIndex = applicableSteps.findIndex((s) => s.id === current);
    if (currentIndex > 0) {
      return applicableSteps[currentIndex - 1].id;
    }
    return null;
  };

  const handleBack = () => {
    const prevStep = getPreviousStep(currentStep);
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  };

  const handleSubmit = async () => {
    if (!kycData) return;

    try {
      kycService.submitForReview(kycData.id);
      toast({
        title: 'KYC Submitted',
        description: 'Your KYC application has been submitted for review.',
      });
      navigate(`/dashboard/${user?.role}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message,
      });
    }
  };

  const getStepStatus = (stepId: number): 'completed' | 'current' | 'upcoming' => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  const calculateProgress = (): number => {
    const applicableSteps = steps.filter((step) =>
      entityType === 'individual' ? step.forIndividual : step.forBusiness
    );
    const currentIndex = applicableSteps.findIndex((s) => s.id === currentStep);
    return ((currentIndex + 1) / applicableSteps.length) * 100;
  };

  const renderStepComponent = () => {
    const step = steps.find((s) => s.id === currentStep);
    if (!step) return null;

    switch (step.component) {
      case 'entity':
        return <EntitySelection onSelect={handleEntityTypeSelection} currentType={entityType} />;
      case 'personal':
        return <PersonalInfoForm kycData={kycData!} onComplete={handleStepComplete} onBack={handleBack} />;
      case 'business':
        return <BusinessEntityForm kycData={kycData!} onComplete={handleStepComplete} onBack={handleBack} />;
      case 'address':
        return <AddressInfoForm kycData={kycData!} onComplete={handleStepComplete} onBack={handleBack} />;
      case 'identity':
        return <IdentityDocumentsForm kycData={kycData!} onComplete={handleStepComplete} onBack={handleBack} />;
      case 'bank':
        return <BankAccountForm kycData={kycData!} onComplete={handleStepComplete} onBack={handleBack} />;
      case 'biometric':
        return <BiometricVerificationForm kycData={kycData!} onComplete={handleStepComplete} onBack={handleBack} />;
      case 'compliance':
        return <ComplianceChecks kycData={kycData!} onComplete={handleStepComplete} onBack={handleBack} />;
      case 'consents':
        return <ConsentsForm kycData={kycData!} onComplete={handleStepComplete} onBack={handleBack} />;
      case 'review':
        return <KYCReview kycData={kycData!} onSubmit={handleSubmit} onBack={handleBack} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={user?.role}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">Loading KYC...</div>
        </div>
      </DashboardLayout>
    );
  }

  const applicableSteps = steps.filter((step) =>
    entityType === 'individual' ? step.forIndividual : step.forBusiness
  );

  return (
    <DashboardLayout role={user?.role}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">KYC Verification</h1>
            <p className="text-muted-foreground mt-1">Complete your Know Your Customer verification</p>
          </div>
          {kycData && (
            <Badge variant={kycData.status === 'approved' ? 'default' : 'secondary'} className="text-sm">
              {kycData.status.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
        </div>

        {/* KYC Status Alert */}
        {kycData?.status === 'approved' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-3 pt-6">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">KYC Verified</p>
                <p className="text-sm text-green-700">
                  Your KYC was approved on {new Date(kycData.approvalDate!).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {kycData?.status === 'rejected' && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">KYC Rejected</p>
                <p className="text-sm text-red-700">{kycData.rejectionReason}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {kycData?.status === 'pending_review' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex items-center gap-3 pt-6">
              <FileCheck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Under Review</p>
                <p className="text-sm text-blue-700">
                  Your KYC application is being reviewed by our compliance team
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Bar */}
        {kycData && kycData.status === 'in_progress' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        )}

        {/* Steps Navigation */}
        {kycData && kycData.status === 'in_progress' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between overflow-x-auto pb-4">
                {applicableSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const status = getStepStatus(step.id);

                  return (
                    <div key={step.id} className="flex items-center flex-shrink-0">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => status === 'completed' && setCurrentStep(step.id)}
                          disabled={status === 'upcoming'}
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                            status === 'completed'
                              ? 'bg-primary border-primary text-primary-foreground cursor-pointer hover:bg-primary/90'
                              : status === 'current'
                              ? 'bg-background border-primary text-primary'
                              : 'bg-background border-border text-muted-foreground cursor-not-allowed'
                          }`}
                        >
                          {status === 'completed' ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            <StepIcon className="h-5 w-5" />
                          )}
                        </button>
                        <span
                          className={`text-xs text-center max-w-[80px] ${
                            status === 'current' ? 'font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          {step.name}
                        </span>
                      </div>
                      {index < applicableSteps.length - 1 && (
                        <div
                          className={`w-12 h-0.5 mb-8 mx-2 ${
                            status === 'completed' ? 'bg-primary' : 'bg-border'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step Content */}
        <div className="min-h-[500px]">{renderStepComponent()}</div>
      </div>
    </DashboardLayout>
  );
};

export default KYC;
