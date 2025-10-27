import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Wallet, Target, Clock, Briefcase, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/api/client';

interface LenderFinancialQuestionnaireProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
}

export interface FinancialProfile {
  annualIncome: string;
  investableSurplus: string;
  investmentExperience: string;
  riskAppetite: string;
  investmentHorizon: string;
  maxInvestmentPerDeal: string;
}

const LenderFinancialQuestionnaire = ({ open, onClose, userId, userName }: LenderFinancialQuestionnaireProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FinancialProfile>({
    annualIncome: '',
    investableSurplus: '',
    investmentExperience: '',
    riskAppetite: '',
    investmentHorizon: '',
    maxInvestmentPerDeal: '',
  });

  const questions = [
    {
      id: 'annualIncome',
      icon: Briefcase,
      title: 'Annual Income',
      description: 'What is your approximate annual income?',
      options: [
        { value: 'below_5L', label: 'Below ₹5 Lakhs' },
        { value: '5L_10L', label: '₹5 - ₹10 Lakhs' },
        { value: '10L_25L', label: '₹10 - ₹25 Lakhs' },
        { value: '25L_50L', label: '₹25 - ₹50 Lakhs' },
        { value: 'above_50L', label: 'Above ₹50 Lakhs' },
      ],
    },
    {
      id: 'investableSurplus',
      icon: Wallet,
      title: 'Investable Surplus',
      description: 'How much surplus funds do you have available for investments?',
      options: [
        { value: 'below_1L', label: 'Below ₹1 Lakh' },
        { value: '1L_5L', label: '₹1 - ₹5 Lakhs' },
        { value: '5L_10L', label: '₹5 - ₹10 Lakhs' },
        { value: '10L_25L', label: '₹10 - ₹25 Lakhs' },
        { value: 'above_25L', label: 'Above ₹25 Lakhs' },
      ],
    },
    {
      id: 'investmentExperience',
      icon: TrendingUp,
      title: 'Investment Experience',
      description: 'What is your experience with investments?',
      options: [
        { value: 'beginner', label: 'New to investing' },
        { value: 'intermediate', label: '1-3 years experience' },
        { value: 'experienced', label: '3-5 years experience' },
        { value: 'expert', label: 'More than 5 years' },
      ],
    },
    {
      id: 'riskAppetite',
      icon: Shield,
      title: 'Risk Appetite',
      description: 'What is your comfort level with investment risk?',
      options: [
        { value: 'conservative', label: 'Conservative - Low risk, stable returns' },
        { value: 'moderate', label: 'Moderate - Balanced risk and returns' },
        { value: 'aggressive', label: 'Aggressive - Higher risk for better returns' },
      ],
    },
    {
      id: 'investmentHorizon',
      icon: Clock,
      title: 'Investment Horizon',
      description: 'How long do you prefer to lock your funds?',
      options: [
        { value: 'short', label: 'Short-term (7-30 days)' },
        { value: 'medium', label: 'Medium-term (1-3 months)' },
        { value: 'long', label: 'Long-term (3+ months)' },
        { value: 'flexible', label: 'Flexible - depends on returns' },
      ],
    },
    {
      id: 'maxInvestmentPerDeal',
      icon: Target,
      title: 'Maximum Investment Per Deal',
      description: 'What is the maximum you would invest in a single trip?',
      options: [
        { value: 'below_25K', label: 'Below ₹25,000' },
        { value: '25K_50K', label: '₹25,000 - ₹50,000' },
        { value: '50K_1L', label: '₹50,000 - ₹1 Lakh' },
        { value: '1L_2L', label: '₹1 - ₹2 Lakhs' },
        { value: 'above_2L', label: 'Above ₹2 Lakhs' },
      ],
    },
  ];

  const currentQuestion = questions[currentStep];
  const Icon = currentQuestion.icon;

  const handleSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    toast({
      title: 'Questionnaire Skipped',
      description: 'You can complete this later from your profile settings.',
    });
    onClose();
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Save the financial profile to the backend
      await apiClient.put(`/users/${userId}/financial-profile`, formData);

      toast({
        title: 'Profile Updated!',
        description: 'Your financial profile has been saved successfully. This will help us recommend suitable investment opportunities.',
      });

      onClose();
    } catch (error) {
      console.error('Failed to save financial profile:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save your profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => !saving && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Icon className="h-6 w-6 text-primary" />
            {currentQuestion.title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {currentQuestion.description}
            <div className="mt-4">
              <Badge variant="outline" className="text-xs">
                Question {currentStep + 1} of {questions.length} • Optional
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <RadioGroup
            value={formData[currentQuestion.id as keyof FinancialProfile]}
            onValueChange={handleSelect}
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <Card
                  className={`flex-1 p-4 transition-all cursor-pointer hover:border-primary hover:bg-primary/5 ${
                    formData[currentQuestion.id as keyof FinancialProfile] === option.value
                      ? 'border-primary bg-primary/10'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {option.label}
                    </Label>
                  </div>
                </Card>
              </label>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} disabled={saving}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip} disabled={saving}>
              Skip for now
            </Button>
            <Button
              onClick={handleNext}
              disabled={!formData[currentQuestion.id as keyof FinancialProfile] || saving}
              className="bg-gradient-primary"
            >
              {saving ? 'Saving...' : currentStep === questions.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </DialogFooter>

        {/* Progress indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 w-8 rounded-full transition-all ${
                idx === currentStep
                  ? 'bg-primary'
                  : idx < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LenderFinancialQuestionnaire;
