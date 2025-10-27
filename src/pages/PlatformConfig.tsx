import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  DollarSign,
  Percent,
  TrendingUp,
  Wallet,
  Calendar,
  Shield,
  AlertTriangle,
  RotateCcw,
  Save,
  Lock
} from "lucide-react";
import { auth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  getPlatformConfig,
  savePlatformConfig,
  resetPlatformConfig,
  DEFAULT_PLATFORM_CONFIG,
  type PlatformConfig,
} from "@/config/platform.config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * PlatformConfiguration Component
 *
 * Super Admin only page for configuring all platform-wide settings
 * including fees, rates, limits, and business rules.
 */
const PlatformConfiguration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const user = auth.getCurrentUser();
  const [config, setConfig] = useState<PlatformConfig>(getPlatformConfig());
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Security check - only super admin can access
  useEffect(() => {
    if (user?.role !== 'super_admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'This page is only accessible to Super Admins',
      });
      navigate('/');
    }
  }, [user, navigate, toast]);

  const handleInputChange = (section: keyof PlatformConfig, field: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      savePlatformConfig(config);
      setHasChanges(false);
      toast({
        title: 'Configuration Saved',
        description: 'Platform configuration has been updated successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save configuration. Please try again.',
      });
    }
  };

  const handleReset = () => {
    resetPlatformConfig();
    setConfig(DEFAULT_PLATFORM_CONFIG);
    setHasChanges(false);
    setShowResetDialog(false);
    toast({
      title: 'Configuration Reset',
      description: 'All settings have been reset to default values',
    });
  };

  const ConfigSection = ({
    title,
    description,
    icon: Icon,
    children,
  }: {
    title: string;
    description: string;
    icon: any;
    children: React.ReactNode;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">{children}</div>
      </CardContent>
    </Card>
  );

  const ConfigInput = ({
    label,
    value,
    onChange,
    prefix = '',
    suffix = '',
    min = 0,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    prefix?: string;
    suffix?: string;
    min?: number;
  }) => (
    <div>
      <Label htmlFor={label.replace(/\s/g, '_')}>{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <Input
          id={label.replace(/\s/g, '_')}
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          step={label.includes('%') ? '0.1' : '100'}
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              Platform Configuration
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure platform-wide settings, fees, and business rules
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(true)}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="bg-gradient-primary gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Warning Banner */}
        <Card className="border-2 border-orange-500/50 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-orange-900">Important Notice</h4>
                <p className="text-sm text-orange-800">
                  Changes to these settings affect the entire platform immediately. Exercise caution when
                  modifying values, especially fees and rates, as they impact all users and transactions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Fees */}
        <ConfigSection
          title="Platform Fees"
          description="Configure transaction fee (0.5% default, deducted on loan disbursement). Interest rates are set by transporter and lender bids - no markup applied."
          icon={Percent}
        >
          <ConfigInput
            label="Transaction Fee (Active)"
            value={config.fees.transactionFee}
            onChange={(v) => handleInputChange('fees', 'transactionFee', v)}
            suffix="%"
          />
          <ConfigInput
            label="Platform Fee (Deprecated)"
            value={config.fees.platformFee}
            onChange={(v) => handleInputChange('fees', 'platformFee', v)}
            suffix="%"
          />
          <ConfigInput
            label="Borrower Commission (Deprecated)"
            value={config.fees.loadAgentCommission}
            onChange={(v) => handleInputChange('fees', 'loadAgentCommission', v)}
            suffix="%"
          />
          <ConfigInput
            label="Vehicle Agent Commission (Deprecated)"
            value={config.fees.vehicleAgentCommission}
            onChange={(v) => handleInputChange('fees', 'vehicleAgentCommission', v)}
            suffix="%"
          />
          <ConfigInput
            label="Early Payment Discount"
            value={config.fees.earlyPaymentDiscount}
            onChange={(v) => handleInputChange('fees', 'earlyPaymentDiscount', v)}
            suffix="%"
          />
        </ConfigSection>

        {/* Interest Rates */}
        <ConfigSection
          title="Interest Rate Limits"
          description="Set minimum and maximum interest rates allowed on the platform"
          icon={TrendingUp}
        >
          <ConfigInput
            label="Minimum Rate"
            value={config.interestRates.minRate}
            onChange={(v) => handleInputChange('interestRates', 'minRate', v)}
            suffix="%"
          />
          <ConfigInput
            label="Maximum Rate"
            value={config.interestRates.maxRate}
            onChange={(v) => handleInputChange('interestRates', 'maxRate', v)}
            suffix="%"
          />
          <ConfigInput
            label="Default Recommended Rate"
            value={config.interestRates.defaultRate}
            onChange={(v) => handleInputChange('interestRates', 'defaultRate', v)}
            suffix="%"
          />
        </ConfigSection>

        {/* Investment Limits */}
        <ConfigSection
          title="Investment & Trip Limits"
          description="Configure minimum and maximum investment amounts"
          icon={DollarSign}
        >
          <ConfigInput
            label="Minimum Investment"
            value={config.investmentLimits.minInvestment}
            onChange={(v) => handleInputChange('investmentLimits', 'minInvestment', v)}
            prefix="₹"
          />
          <ConfigInput
            label="Maximum Investment"
            value={config.investmentLimits.maxInvestment}
            onChange={(v) => handleInputChange('investmentLimits', 'maxInvestment', v)}
            prefix="₹"
          />
          <ConfigInput
            label="Minimum Trip Value"
            value={config.investmentLimits.minTripValue}
            onChange={(v) => handleInputChange('investmentLimits', 'minTripValue', v)}
            prefix="₹"
          />
          <ConfigInput
            label="Maximum Trip Value"
            value={config.investmentLimits.maxTripValue}
            onChange={(v) => handleInputChange('investmentLimits', 'maxTripValue', v)}
            prefix="₹"
          />
        </ConfigSection>

        {/* Wallet Settings */}
        <ConfigSection
          title="Wallet & Transaction Settings"
          description="Configure wallet top-up and withdrawal limits"
          icon={Wallet}
        >
          <ConfigInput
            label="Minimum Top-Up"
            value={config.wallet.minTopUp}
            onChange={(v) => handleInputChange('wallet', 'minTopUp', v)}
            prefix="₹"
          />
          <ConfigInput
            label="Maximum Top-Up"
            value={config.wallet.maxTopUp}
            onChange={(v) => handleInputChange('wallet', 'maxTopUp', v)}
            prefix="₹"
          />
          <ConfigInput
            label="Minimum Withdrawal"
            value={config.wallet.minWithdrawal}
            onChange={(v) => handleInputChange('wallet', 'minWithdrawal', v)}
            prefix="₹"
          />
          <ConfigInput
            label="Maximum Withdrawal per Transaction"
            value={config.wallet.maxWithdrawal}
            onChange={(v) => handleInputChange('wallet', 'maxWithdrawal', v)}
            prefix="₹"
          />
          <ConfigInput
            label="Daily Withdrawal Limit"
            value={config.wallet.dailyWithdrawalLimit}
            onChange={(v) => handleInputChange('wallet', 'dailyWithdrawalLimit', v)}
            prefix="₹"
          />
        </ConfigSection>

        {/* Payment Terms */}
        <ConfigSection
          title="Maturity & Payment Terms"
          description="Configure default maturity periods and payment terms"
          icon={Calendar}
        >
          <ConfigInput
            label="Default Maturity Days"
            value={config.terms.defaultMaturityDays}
            onChange={(v) => handleInputChange('terms', 'defaultMaturityDays', v)}
            suffix="days"
          />
          <ConfigInput
            label="Minimum Maturity Days"
            value={config.terms.minMaturityDays}
            onChange={(v) => handleInputChange('terms', 'minMaturityDays', v)}
            suffix="days"
            min={1}
          />
          <ConfigInput
            label="Maximum Maturity Days"
            value={config.terms.maxMaturityDays}
            onChange={(v) => handleInputChange('terms', 'maxMaturityDays', v)}
            suffix="days"
          />
          <ConfigInput
            label="Grace Period Days"
            value={config.terms.gracePeriodDays}
            onChange={(v) => handleInputChange('terms', 'gracePeriodDays', v)}
            suffix="days"
          />
          <ConfigInput
            label="Late Payment Penalty Rate"
            value={config.terms.penaltyRate}
            onChange={(v) => handleInputChange('terms', 'penaltyRate', v)}
            suffix="% per month"
          />
        </ConfigSection>

        {/* KYC Settings */}
        <ConfigSection
          title="KYC & Verification"
          description="Configure KYC requirements and verification limits"
          icon={Shield}
        >
          <ConfigInput
            label="KYC Required Above Amount"
            value={config.kyc.requiredForAmount}
            onChange={(v) => handleInputChange('kyc', 'requiredForAmount', v)}
            prefix="₹"
          />
          <ConfigInput
            label="Document Expiry Days"
            value={config.kyc.documentExpiryDays}
            onChange={(v) => handleInputChange('kyc', 'documentExpiryDays', v)}
            suffix="days"
          />
          <ConfigInput
            label="Max Pending Investments (No KYC)"
            value={config.kyc.maxPendingInvestments}
            onChange={(v) => handleInputChange('kyc', 'maxPendingInvestments', v)}
          />
        </ConfigSection>

        {/* Risk Assessment */}
        <ConfigSection
          title="Risk Assessment"
          description="Configure loan-to-value (LTV) ratios for different risk levels"
          icon={Lock}
        >
          <ConfigInput
            label="Low Risk Max LTV"
            value={config.risk.lowRiskMaxLTV}
            onChange={(v) => handleInputChange('risk', 'lowRiskMaxLTV', v)}
            suffix="%"
          />
          <ConfigInput
            label="Medium Risk Max LTV"
            value={config.risk.mediumRiskMaxLTV}
            onChange={(v) => handleInputChange('risk', 'mediumRiskMaxLTV', v)}
            suffix="%"
          />
          <ConfigInput
            label="High Risk Max LTV"
            value={config.risk.highRiskMaxLTV}
            onChange={(v) => handleInputChange('risk', 'highRiskMaxLTV', v)}
            suffix="%"
          />
          <ConfigInput
            label="Insurance Multiplier"
            value={config.risk.insuranceMultiplier}
            onChange={(v) => handleInputChange('risk', 'insuranceMultiplier', v)}
            suffix="x"
          />
        </ConfigSection>

        {/* Save Changes Footer */}
        {hasChanges && (
          <Card className="border-2 border-primary bg-primary/5 sticky bottom-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-1">Unsaved Changes</h4>
                  <p className="text-sm text-muted-foreground">
                    You have unsaved changes. Click "Save Changes" to apply them to the platform.
                  </p>
                </div>
                <Button onClick={handleSave} className="bg-gradient-primary gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all platform settings to their default values. Any custom configurations
              will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground">
              Reset All Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default PlatformConfiguration;
