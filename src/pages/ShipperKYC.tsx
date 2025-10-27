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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Upload,
  TrendingUp,
  Award,
  Star,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

interface CredibilityDocument {
  id: string;
  type: string;
  name: string;
  points: number;
  uploaded: boolean;
  fileUrl?: string;
  allowMultiple?: boolean;
  files?: Array<{ id: string; name: string; url: string }>;
}

interface BankGuarantee {
  uploaded: boolean;
  fileUrl?: string;
  fileName?: string;
}

interface CredibilityScore {
  totalScore: number;
  maxScore: number;
  documents: CredibilityDocument[];
  cibilScore?: number;
  bankGuarantee?: BankGuarantee;
}

const ShipperKYC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [activeTab, setActiveTab] = useState('kyc');
  const [kycData, setKYCData] = useState<KYCData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [entityType, setEntityType] = useState<EntityType>('individual');
  const [cibilInput, setCibilInput] = useState('');
  const [credibilityScore, setCredibilityScore] = useState<CredibilityScore>({
    totalScore: 0,
    maxScore: 1200,
    documents: [
      { id: '1', type: 'gst', name: 'GST Registration Certificate', points: 100, uploaded: false },
      { id: '2', type: 'pan', name: 'PAN Card', points: 80, uploaded: false },
      { id: '3', type: 'incorporation', name: 'Certificate of Incorporation', points: 100, uploaded: false },
      { id: '4', type: 'trade_license', name: 'Trade License', points: 80, uploaded: false },
      { id: '5', type: 'financial_statement', name: 'Financial Statements (Last 2 Years)', points: 150, uploaded: false },
      { id: '6', type: 'bank_statement', name: 'Bank Statements (Last 6 Months)', points: 120, uploaded: false },
      { id: '7', type: 'client_references', name: 'Client References/Testimonials', points: 80, uploaded: false },
      { id: '8', type: 'insurance', name: 'Business Insurance Certificate', points: 40, uploaded: false },
      { id: '9', type: 'ewaybill', name: 'E-Way Bills (Multiple uploads)', points: 150, uploaded: false, allowMultiple: true, files: [] },
    ],
    cibilScore: undefined,
    bankGuarantee: { uploaded: false },
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user is load_owner or load_agent
    if (user.role !== 'load_owner' && user.role !== 'load_agent') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'This page is only accessible to shippers/load owners.',
      });
      navigate(`/dashboard/${user.role}`);
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

    const savedCredibility = localStorage.getItem(`credibility_score_${user.id}`);
    if (savedCredibility) {
      setCredibilityScore(JSON.parse(savedCredibility));
    }
  }, [user, navigate, toast]);

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

  const handleKYCSubmit = async () => {
    if (!kycData) return;

    try {
      kycService.submitForReview(kycData.id);
      toast({
        title: 'KYC Submitted',
        description: 'Your KYC application has been submitted for review. You can now proceed to build your credibility score!',
      });
      setActiveTab('credibility');
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

  const calculateKYCProgress = (): number => {
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
        return <KYCReview kycData={kycData!} onSubmit={handleKYCSubmit} onBack={handleBack} />;
      default:
        return null;
    }
  };

  // Calculate CIBIL score points (300 max points)
  const calculateCibilPoints = (score?: number): number => {
    if (!score) return 0;
    if (score >= 750) return 300; // Excellent
    if (score >= 700) return 250; // Very Good
    if (score >= 650) return 200; // Good
    if (score >= 600) return 150; // Fair
    if (score >= 550) return 100; // Below Average
    return 50; // Poor
  };

  // Calculate total score
  const calculateTotalScore = (documents: CredibilityDocument[], cibil?: number): number => {
    const docScore = documents.reduce((sum, doc) => sum + (doc.uploaded ? doc.points : 0), 0);
    const cibilPoints = calculateCibilPoints(cibil);
    return docScore + cibilPoints;
  };

  const handleFileUpload = (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const updatedDocuments = credibilityScore.documents.map(doc => {
      if (doc.id === docId) {
        if (doc.allowMultiple) {
          // Handle multiple file uploads (E-Way Bills)
          const newFiles = Array.from(files).map(file => ({
            id: `${docId}-file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: URL.createObjectURL(file),
          }));

          const existingFiles = doc.files || [];
          const allFiles = [...existingFiles, ...newFiles];

          return {
            ...doc,
            uploaded: allFiles.length > 0,
            files: allFiles
          };
        } else {
          // Handle single file upload
          if (!doc.uploaded) {
            return { ...doc, uploaded: true, fileUrl: URL.createObjectURL(files[0]) };
          }
        }
      }
      return doc;
    });

    const newTotalScore = calculateTotalScore(updatedDocuments, credibilityScore.cibilScore);

    const updatedScore = {
      ...credibilityScore,
      documents: updatedDocuments,
      totalScore: newTotalScore,
    };

    setCredibilityScore(updatedScore);
    localStorage.setItem(`credibility_score_${user?.id}`, JSON.stringify(updatedScore));

    const doc = updatedDocuments.find(d => d.id === docId);
    toast({
      title: 'Document Uploaded',
      description: doc?.allowMultiple
        ? `${files.length} E-Way Bill(s) uploaded successfully!`
        : `+${doc?.points} points added to your credibility score!`,
    });
  };

  const handleRemoveDocument = (docId: string) => {
    const updatedDocuments = credibilityScore.documents.map(doc => {
      if (doc.id === docId && doc.uploaded) {
        if (doc.allowMultiple) {
          return { ...doc, uploaded: false, files: [] };
        }
        return { ...doc, uploaded: false, fileUrl: undefined };
      }
      return doc;
    });

    const newTotalScore = calculateTotalScore(updatedDocuments, credibilityScore.cibilScore);

    const updatedScore = {
      ...credibilityScore,
      documents: updatedDocuments,
      totalScore: newTotalScore,
    };

    setCredibilityScore(updatedScore);
    localStorage.setItem(`credibility_score_${user?.id}`, JSON.stringify(updatedScore));

    toast({
      title: 'Document Removed',
      description: 'Your credibility score has been updated.',
      variant: 'destructive',
    });
  };

  const handleRemoveEWayBill = (docId: string, fileId: string) => {
    const updatedDocuments = credibilityScore.documents.map(doc => {
      if (doc.id === docId && doc.allowMultiple && doc.files) {
        const updatedFiles = doc.files.filter(f => f.id !== fileId);
        return {
          ...doc,
          files: updatedFiles,
          uploaded: updatedFiles.length > 0,
        };
      }
      return doc;
    });

    const newTotalScore = calculateTotalScore(updatedDocuments, credibilityScore.cibilScore);

    const updatedScore = {
      ...credibilityScore,
      documents: updatedDocuments,
      totalScore: newTotalScore,
    };

    setCredibilityScore(updatedScore);
    localStorage.setItem(`credibility_score_${user?.id}`, JSON.stringify(updatedScore));

    toast({
      title: 'E-Way Bill Removed',
      description: 'Your credibility score has been updated.',
    });
  };

  const handleCibilScoreSubmit = () => {
    const score = parseInt(cibilInput);
    if (isNaN(score) || score < 300 || score > 900) {
      toast({
        variant: 'destructive',
        title: 'Invalid CIBIL Score',
        description: 'Please enter a valid CIBIL score between 300 and 900.',
      });
      return;
    }

    const newTotalScore = calculateTotalScore(credibilityScore.documents, score);

    const updatedScore = {
      ...credibilityScore,
      cibilScore: score,
      totalScore: newTotalScore,
    };

    setCredibilityScore(updatedScore);
    localStorage.setItem(`credibility_score_${user?.id}`, JSON.stringify(updatedScore));

    toast({
      title: 'CIBIL Score Added',
      description: `+${calculateCibilPoints(score)} points added to your credibility score!`,
    });
  };

  const handleBankGuaranteeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const updatedScore = {
      ...credibilityScore,
      bankGuarantee: {
        uploaded: true,
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
      },
    };

    setCredibilityScore(updatedScore);
    localStorage.setItem(`credibility_score_${user?.id}`, JSON.stringify(updatedScore));

    toast({
      title: 'Bank Guarantee Uploaded',
      description: 'Your maximum loan amount has been increased! Lenders can now offer higher financing.',
    });
  };

  const handleRemoveBankGuarantee = () => {
    const updatedScore = {
      ...credibilityScore,
      bankGuarantee: { uploaded: false },
    };

    setCredibilityScore(updatedScore);
    localStorage.setItem(`credibility_score_${user?.id}`, JSON.stringify(updatedScore));

    toast({
      title: 'Bank Guarantee Removed',
      description: 'Your loan amount limits have been adjusted.',
      variant: 'destructive',
    });
  };

  // Calculate max loan amount based on guarantee
  const getMaxLoanAmount = (): { amount: number; description: string } => {
    if (credibilityScore.bankGuarantee?.uploaded) {
      return {
        amount: 5000000, // 50 Lakhs with guarantee
        description: 'With Bank Guarantee',
      };
    }
    return {
      amount: 100000, // 1 Lakh without guarantee
      description: 'Without Bank Guarantee',
    };
  };

  const getScoreLevel = (score: number): { label: string; color: string; description: string } => {
    if (score >= 800) {
      return {
        label: 'Excellent',
        color: 'text-green-600',
        description: 'Highest credibility - Maximum lender interest',
      };
    } else if (score >= 600) {
      return {
        label: 'Very Good',
        color: 'text-blue-600',
        description: 'High credibility - Strong lender interest',
      };
    } else if (score >= 400) {
      return {
        label: 'Good',
        color: 'text-yellow-600',
        description: 'Moderate credibility - Good lender interest',
      };
    } else if (score >= 200) {
      return {
        label: 'Fair',
        color: 'text-orange-600',
        description: 'Basic credibility - Some lender interest',
      };
    } else {
      return {
        label: 'Low',
        color: 'text-red-600',
        description: 'Limited credibility - Upload more documents',
      };
    }
  };

  const scoreLevel = getScoreLevel(credibilityScore.totalScore);
  const scorePercentage = (credibilityScore.totalScore / credibilityScore.maxScore) * 100;

  const handleBasicKYCComplete = () => {
    setKYCCompleted(true);
    localStorage.setItem(`kyc_completed_${user?.id}`, JSON.stringify(true));
    toast({
      title: 'KYC Completed',
      description: 'Your basic KYC verification is complete. Now build your credibility score!',
    });
    setActiveTab('credibility');
  };

  return (
    <DashboardLayout role={user?.role}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transporter Verification</h1>
            <p className="text-muted-foreground mt-1">
              Complete KYC and build your credibility score to attract more lenders
            </p>
          </div>
          {kycData && (
            <Badge variant={kycData.status === 'approved' ? 'default' : 'secondary'} className="text-sm">
              {kycData.status.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="kyc" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              KYC Verification
            </TabsTrigger>
            <TabsTrigger value="credibility" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Company Credibility
            </TabsTrigger>
          </TabsList>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="space-y-6">
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
                      Your KYC application is being reviewed by our compliance team. You can now build your credibility score!
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
                  <span className="font-medium">{Math.round(calculateKYCProgress())}%</span>
                </div>
                <Progress value={calculateKYCProgress()} className="h-2" />
              </div>
            )}

            {/* Steps Navigation */}
            {kycData && kycData.status === 'in_progress' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between overflow-x-auto pb-4">
                    {steps.filter((step) =>
                      entityType === 'individual' ? step.forIndividual : step.forBusiness
                    ).map((step, index, applicableSteps) => {
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
          </TabsContent>

          {/* Company Credibility Tab */}
          <TabsContent value="credibility" className="space-y-6">
            {/* Score Overview Card */}
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Credibility Score
                </CardTitle>
                <CardDescription>
                  Upload documents to increase your score and attract more lenders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-5xl font-bold">{credibilityScore.totalScore}</span>
                      <span className="text-2xl text-muted-foreground">/ {credibilityScore.maxScore}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={scoreLevel.color}>{scoreLevel.label}</Badge>
                      <span className="text-sm text-muted-foreground">{scoreLevel.description}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-muted"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - scorePercentage / 100)}`}
                          className="text-primary transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{Math.round(scorePercentage)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress to Maximum</span>
                    <span className="font-medium">{credibilityScore.totalScore} / {credibilityScore.maxScore} points</span>
                  </div>
                  <Progress value={scorePercentage} className="h-3" />
                </div>

                {/* Benefits Info */}
                <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Better Visibility</p>
                      <p className="text-xs text-muted-foreground">Higher ranking in lender searches</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">More Bids</p>
                      <p className="text-xs text-muted-foreground">Attract competitive offers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Trust Badge</p>
                      <p className="text-xs text-muted-foreground">Display credibility rating</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CIBIL Score Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  CIBIL Score
                </CardTitle>
                <CardDescription>
                  Add your CIBIL score to boost credibility (Worth up to 300 points!)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {credibilityScore.cibilScore ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">CIBIL Score: {credibilityScore.cibilScore}</p>
                        <p className="text-sm text-green-700">
                          +{calculateCibilPoints(credibilityScore.cibilScore)} points added to your score
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updatedScore = {
                          ...credibilityScore,
                          cibilScore: undefined,
                          totalScore: calculateTotalScore(credibilityScore.documents, undefined),
                        };
                        setCredibilityScore(updatedScore);
                        setCibilInput('');
                        localStorage.setItem(`credibility_score_${user?.id}`, JSON.stringify(updatedScore));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">CIBIL Score Points</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-blue-700">750+: <span className="font-semibold">300 points</span></div>
                        <div className="text-blue-700">700-749: <span className="font-semibold">250 points</span></div>
                        <div className="text-blue-700">650-699: <span className="font-semibold">200 points</span></div>
                        <div className="text-blue-700">600-649: <span className="font-semibold">150 points</span></div>
                        <div className="text-blue-700">550-599: <span className="font-semibold">100 points</span></div>
                        <div className="text-blue-700">300-549: <span className="font-semibold">50 points</span></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="cibil-score">Enter CIBIL Score (300-900)</Label>
                        <Input
                          id="cibil-score"
                          type="number"
                          placeholder="Enter your CIBIL score"
                          value={cibilInput}
                          onChange={(e) => setCibilInput(e.target.value)}
                          min="300"
                          max="900"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleCibilScoreSubmit} className="bg-gradient-primary">
                          Add Score
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bank Guarantee Card */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Bank Guarantee (Optional)
                </CardTitle>
                <CardDescription>
                  Upload bank guarantee certificate to increase your maximum loan amount significantly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Loan Amount Impact Display */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border-2 ${
                      !credibilityScore.bankGuarantee?.uploaded
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-muted border-muted'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <h4 className="font-medium text-orange-900">Without Guarantee</h4>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">₹1,00,000</p>
                      <p className="text-xs text-orange-700 mt-1">Maximum loan amount per trip</p>
                    </div>

                    <div className={`p-4 rounded-lg border-2 ${
                      credibilityScore.bankGuarantee?.uploaded
                        ? 'bg-green-50 border-green-200'
                        : 'bg-muted border-muted'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-900">With Guarantee</h4>
                      </div>
                      <p className="text-2xl font-bold text-green-600">₹50,00,000</p>
                      <p className="text-xs text-green-700 mt-1">Maximum loan amount per trip</p>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className={`p-4 rounded-lg ${
                    credibilityScore.bankGuarantee?.uploaded
                      ? 'bg-green-50 border-2 border-green-200'
                      : 'bg-blue-50 border-2 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold ${
                          credibilityScore.bankGuarantee?.uploaded ? 'text-green-900' : 'text-blue-900'
                        }`}>
                          {credibilityScore.bankGuarantee?.uploaded
                            ? 'Bank Guarantee Active'
                            : 'Current Maximum Loan Amount'}
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${
                          credibilityScore.bankGuarantee?.uploaded ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          ₹{(getMaxLoanAmount().amount / 100000).toFixed(0)}L
                        </p>
                        <p className={`text-sm mt-1 ${
                          credibilityScore.bankGuarantee?.uploaded ? 'text-green-700' : 'text-blue-700'
                        }`}>
                          {getMaxLoanAmount().description}
                        </p>
                      </div>
                      <div>
                        {credibilityScore.bankGuarantee?.uploaded ? (
                          <CheckCircle2 className="h-12 w-12 text-green-600" />
                        ) : (
                          <AlertCircle className="h-12 w-12 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upload Section */}
                  {credibilityScore.bankGuarantee?.uploaded ? (
                    <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileCheck className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">{credibilityScore.bankGuarantee.fileName}</p>
                          <p className="text-xs text-green-700">Bank guarantee certificate uploaded</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveBankGuarantee}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-yellow-900 mb-1">Why Upload Bank Guarantee?</p>
                            <ul className="list-disc list-inside text-yellow-800 space-y-1">
                              <li>Increase max loan from ₹1L to ₹50L per trip</li>
                              <li>Access to larger financing opportunities</li>
                              <li>Build stronger trust with lenders</li>
                              <li>Get better interest rates</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Input
                          id="bank-guarantee-upload"
                          type="file"
                          className="hidden"
                          onChange={handleBankGuaranteeUpload}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <Button
                          onClick={() => document.getElementById('bank-guarantee-upload')?.click()}
                          className="w-full bg-gradient-primary"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Bank Guarantee Certificate (Optional)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Document Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Each document increases your credibility score and builds lender confidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {credibilityScore.documents.map((doc) => (
                    <div key={doc.id}>
                      <div
                        className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                          doc.uploaded ? 'bg-green-50 border-green-200' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {doc.uploaded ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{doc.name}</h4>
                              <Badge variant="secondary" className="text-xs">
                                +{doc.points} points
                              </Badge>
                            </div>
                            {doc.uploaded && !doc.allowMultiple && (
                              <p className="text-xs text-green-700 mt-1">Uploaded successfully</p>
                            )}
                            {doc.uploaded && doc.allowMultiple && doc.files && (
                              <p className="text-xs text-green-700 mt-1">
                                {doc.files.length} file(s) uploaded
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.uploaded && !doc.allowMultiple ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDocument(doc.id)}
                            >
                              Remove
                            </Button>
                          ) : doc.allowMultiple && doc.uploaded ? (
                            <>
                              <Input
                                id={`file-${doc.id}`}
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileUpload(doc.id, e)}
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Add More
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDocument(doc.id)}
                              >
                                Remove All
                              </Button>
                            </>
                          ) : (
                            <div>
                              <Input
                                id={`file-${doc.id}`}
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileUpload(doc.id, e)}
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple={doc.allowMultiple}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Show uploaded E-Way Bills */}
                      {doc.allowMultiple && doc.files && doc.files.length > 0 && (
                        <div className="ml-12 mt-2 space-y-2">
                          {doc.files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-2 bg-white border rounded text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{file.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveEWayBill(doc.id, file.id)}
                                className="h-7 text-xs"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ShipperKYC;
