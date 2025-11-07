import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sun,
  Moon,
  Monitor,
  Sparkles,
  RotateCcw,
  Save,
  Palette,
  FileText,
  Upload,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  Download,
  Info,
  ExternalLink
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiClient } from '@/api/client';

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface UploadedContract {
  id: string;
  file?: File; // Optional - only for new uploads
  file_name: string;
  file_size: number;
  file_type: string;
  previewUrl?: string; // Optional - only for new uploads
  loanPercentage: string;
  ltv: string; // Loan to Value ratio
  contractType: '2-party' | '3-party' | '';
  party1Name: string;
  party2Name: string;
  party3Name: string;
  validityDate: string;
  tripStage: string; // Optional
  penaltyAfterDueDate: string; // Penalty percentage after due date
  uploaded_at?: Date;
  isNew?: boolean; // Flag to indicate if this is a new upload not yet saved to DB
}

const tripStages = [
  { value: 'none', label: 'None (Optional)' },
  { value: 'pending', label: 'Pending' },
  { value: 'bilty', label: 'Bilty Uploaded' },
  { value: 'advance_invoice', label: 'Advance Invoice' },
  { value: 'pod', label: 'POD (Proof of Delivery)' },
  { value: 'final_invoice', label: 'Final Invoice' },
  { value: 'funded', label: 'Funded/Escrowed' },
  { value: 'completed', label: 'Completed' },
];

const defaultTheme: ThemeSettings = {
  mode: 'light',
  primaryColor: '#084570', // LogiFin Primary
  secondaryColor: '#1D923C', // LogiFin Secondary
  accentColor: '#1D923C', // Same as secondary
};

const presetThemes = [
  {
    name: 'Default (LogiFin)',
    primaryColor: '#084570',
    secondaryColor: '#1D923C',
    accentColor: '#1D923C',
  },
  {
    name: 'Ocean Blue',
    primaryColor: '#0077BE',
    secondaryColor: '#00C9A7',
    accentColor: '#00C9A7',
  },
  {
    name: 'Sunset Orange',
    primaryColor: '#FF6B35',
    secondaryColor: '#F7931E',
    accentColor: '#FFD23F',
  },
  {
    name: 'Forest Green',
    primaryColor: '#2D6A4F',
    secondaryColor: '#52B788',
    accentColor: '#95D5B2',
  },
  {
    name: 'Royal Purple',
    primaryColor: '#6A4C93',
    secondaryColor: '#8B5FBF',
    accentColor: '#C084FC',
  },
  {
    name: 'Crimson Red',
    primaryColor: '#C1121F',
    secondaryColor: '#E63946',
    accentColor: '#F4A261',
  },
];

/**
 * Convert hex color to HSL format for CSS variables
 */
function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

/**
 * Apply theme colors to CSS variables
 */
function applyThemeColors(colors: Omit<ThemeSettings, 'mode'>) {
  const root = document.documentElement;
  const primaryHSL = hexToHSL(colors.primaryColor);
  const secondaryHSL = hexToHSL(colors.secondaryColor);
  const accentHSL = hexToHSL(colors.accentColor);

  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--secondary', secondaryHSL);
  root.style.setProperty('--accent', accentHSL);

  // Update primary variations
  const [h, s, l] = primaryHSL.split(' ');
  const lightness = parseInt(l);
  root.style.setProperty('--primary-light', `${h} ${s} ${Math.min(lightness + 15, 95)}%`);
  root.style.setProperty('--primary-dark', `${h} ${s} ${Math.max(lightness - 6, 5)}%`);

  // Update ring and sidebar colors
  root.style.setProperty('--ring', primaryHSL);
  root.style.setProperty('--sidebar-primary', primaryHSL);
  root.style.setProperty('--sidebar-ring', primaryHSL);

  // Update gradients
  const primaryHue = h;
  root.style.setProperty(
    '--gradient-primary',
    `linear-gradient(135deg, hsl(${primaryHSL}) 0%, hsl(${Number(primaryHue) - 20} 70% 55%) 100%)`
  );
  root.style.setProperty(
    '--gradient-hero',
    `linear-gradient(135deg, hsl(${primaryHSL}) 0%, hsl(${secondaryHSL}) 100%)`
  );
}

/**
 * Apply dark/light mode
 */
function applyThemeMode(mode: 'light' | 'dark' | 'system') {
  const root = document.documentElement;

  if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', mode === 'dark');
  }
}

const Settings = () => {
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [isSaving, setIsSaving] = useState(false);

  // Contract management state
  const [contracts, setContracts] = useState<UploadedContract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [viewingContract, setViewingContract] = useState<UploadedContract | null>(null);

  // Load saved theme from API
  useEffect(() => {
    const loadThemeSettings = async () => {
      if (!user) return;

      try {
        const settings = await apiClient.get(`/user-theme-settings/${user.id}`);

        const loadedTheme: ThemeSettings = {
          mode: settings.mode || 'light',
          primaryColor: settings.primary_color || defaultTheme.primaryColor,
          secondaryColor: settings.secondary_color || defaultTheme.secondaryColor,
          accentColor: settings.accent_color || defaultTheme.accentColor,
        };

        setTheme(loadedTheme);
        applyThemeColors(loadedTheme);
        applyThemeMode(loadedTheme.mode);
      } catch (error) {
        console.error('Failed to load theme settings:', error);
        // Use default theme if loading fails
        setTheme(defaultTheme);
        applyThemeColors(defaultTheme);
        applyThemeMode(defaultTheme.mode);
      }
    };

    loadThemeSettings();
  }, [user]);

  // Load uploaded contracts from API
  useEffect(() => {
    const loadContracts = async () => {
      if (!user) return;

      try {
        const contracts = await apiClient.get(`/uploaded-contracts/metadata/${user.id}`);
        const loadedContracts = contracts.map((contract: any) => ({
          id: contract.id,
          file_name: contract.file_name,
          file_size: contract.file_size,
          file_type: contract.file_type,
          loanPercentage: contract.loan_percentage?.toString() || '',
          ltv: contract.ltv?.toString() || '',
          penaltyAfterDueDate: contract.penalty_after_due_date?.toString() || '',
          contractType: contract.contract_type,
          party1Name: contract.party1_name,
          party2Name: contract.party2_name,
          party3Name: contract.party3_name || '',
          validityDate: contract.validity_date ? new Date(contract.validity_date).toISOString().split('T')[0] : '',
          tripStage: contract.trip_stage || 'none',
          uploaded_at: new Date(contract.uploaded_at),
          isNew: false,
        }));

        setContracts(loadedContracts);
      } catch (error) {
        console.error('Failed to load contracts:', error);
      }
    };

    loadContracts();
  }, [user]);

  const handleThemeChange = (updates: Partial<ThemeSettings>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);

    // Apply immediately for preview
    if ('mode' in updates) {
      applyThemeMode(newTheme.mode);
    } else {
      applyThemeColors(newTheme);
    }
  };

  const handlePresetSelect = (preset: typeof presetThemes[0]) => {
    handleThemeChange({
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
    });
  };

  const handleReset = async () => {
    if (!user) return;

    setTheme(defaultTheme);
    applyThemeColors(defaultTheme);
    applyThemeMode(defaultTheme.mode);

    try {
      // Reset theme in database
      await apiClient.post(`/user-theme-settings/${user.id}/reset`);

      toast({
        title: 'Theme reset',
        description: 'Theme has been reset to default settings.',
      });
    } catch (error) {
      console.error('Error resetting theme:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reset theme settings.',
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      // Save to database
      await apiClient.post('/user-theme-settings', {
        user_id: user.id,
        mode: theme.mode,
        primary_color: theme.primaryColor,
        secondary_color: theme.secondaryColor,
        accent_color: theme.accentColor,
      });

      toast({
        title: 'Theme saved!',
        description: 'Your theme preferences have been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save theme settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Contract handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newContracts: UploadedContract[] = [];

    Array.from(files).forEach((file) => {
      // Only accept PDF, images, and documents
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: `${file.name} is not a supported format. Please upload PDF or image files.`,
        });
        return;
      }

      const id = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);

      newContracts.push({
        id,
        file,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        previewUrl,
        loanPercentage: '',
        ltv: '',
        contractType: '',
        party1Name: '',
        party2Name: '',
        party3Name: '',
        validityDate: '',
        tripStage: 'none',
        penaltyAfterDueDate: '',
        isNew: true,
      });
    });

    setContracts([...contracts, ...newContracts]);

    toast({
      title: 'Contracts selected',
      description: `${newContracts.length} contract(s) added. Fill in the details and click "Save All Contracts" to upload.`,
    });
  };

  const handleContractUpdate = (id: string, field: keyof UploadedContract, value: string) => {
    setContracts(contracts.map((contract) =>
      contract.id === id ? { ...contract, [field]: value } : contract
    ));
  };

  const handleDeleteContract = async (id: string) => {
    const contract = contracts.find((c) => c.id === id);
    if (!contract) return;

    // If it's a new contract not yet saved to DB, just remove from state
    if (contract.isNew) {
      if (contract.previewUrl) {
        URL.revokeObjectURL(contract.previewUrl);
      }
      setContracts(contracts.filter((c) => c.id !== id));

      toast({
        title: 'Contract removed',
        description: 'Contract has been removed.',
      });
      return;
    }

    // If it's an existing contract in DB, delete via API
    try {
      await apiClient.delete(`/uploaded-contracts/${id}`);

      setContracts(contracts.filter((c) => c.id !== id));

      toast({
        title: 'Contract deleted',
        description: 'Contract has been deleted from the database.',
      });
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete contract.',
      });
    }
  };

  const handleSaveContracts = async () => {
    if (!user) return;

    // Filter only new contracts that need to be uploaded
    const newContracts = contracts.filter(c => c.isNew);

    if (newContracts.length === 0) {
      toast({
        title: 'No new contracts',
        description: 'All contracts are already saved.',
      });
      return;
    }

    // Validate contracts
    const invalidContracts = newContracts.filter(
      (c) => !c.loanPercentage || !c.ltv || !c.contractType || !c.party1Name || !c.party2Name || !c.validityDate ||
      !c.penaltyAfterDueDate || (c.contractType === '3-party' && !c.party3Name) || !c.file
    );

    if (invalidContracts.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Incomplete information',
        description: 'Please fill in all required fields for all contracts.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const uploadedContractIds: string[] = [];

      // Upload each contract
      for (const contract of newContracts) {
        const formData = new FormData();
        formData.append('file', contract.file!);
        formData.append('user_id', user.id);
        formData.append('loan_percentage', contract.loanPercentage);
        formData.append('ltv', contract.ltv);
        formData.append('penalty_after_due_date', contract.penaltyAfterDueDate);
        formData.append('contract_type', contract.contractType);
        formData.append('party1_name', contract.party1Name);
        formData.append('party2_name', contract.party2Name);
        if (contract.party3Name) {
          formData.append('party3_name', contract.party3Name);
        }
        formData.append('validity_date', contract.validityDate);
        if (contract.tripStage && contract.tripStage !== 'none') {
          formData.append('trip_stage', contract.tripStage);
        }

        const response = await apiClient.post('/uploaded-contracts', formData);

        uploadedContractIds.push(contract.id);

        // Revoke blob URL
        if (contract.previewUrl) {
          URL.revokeObjectURL(contract.previewUrl);
        }
      }

      // Remove uploaded contracts from state and reload from API
      setContracts(contracts.filter(c => !uploadedContractIds.includes(c.id)));

      // Reload all contracts from API
      const reloadedContracts = await apiClient.get(`/uploaded-contracts/metadata/${user.id}`);
      const loadedContracts = reloadedContracts.map((contract: any) => ({
        id: contract.id,
        file_name: contract.file_name,
        file_size: contract.file_size,
        file_type: contract.file_type,
        loanPercentage: contract.loan_percentage?.toString() || '',
        ltv: contract.ltv?.toString() || '',
        penaltyAfterDueDate: contract.penalty_after_due_date?.toString() || '',
        contractType: contract.contract_type,
        party1Name: contract.party1_name,
        party2Name: contract.party2_name,
        party3Name: contract.party3_name || '',
        validityDate: contract.validity_date ? new Date(contract.validity_date).toISOString().split('T')[0] : '',
        tripStage: contract.trip_stage || 'none',
        uploaded_at: new Date(contract.uploaded_at),
        isNew: false,
      }));

      setContracts(loadedContracts);

      toast({
        title: 'Contracts saved!',
        description: `${newContracts.length} contract(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error('Error saving contracts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save contracts.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadSampleAgreement = () => {
    const sampleAgreement = `
TRIPARTITE LOAN AGREEMENT

This Tripartite Loan Agreement ("Agreement") is entered into on this ____ day of ________, 20__ at ____________.

BETWEEN:

PARTY 1 (BORROWER):
Name: [Borrower/Transporter Name]
Address: _______________________________________
PAN: ___________________
Contact: _______________

AND

PARTY 2 (LENDER):
Name: [Lender Name]
Address: _______________________________________
PAN: ___________________
Contact: _______________

AND

PARTY 3 (FACILITATOR):
LogiFin Hub Private Limited
Registered Office: [LogiFin Address]
CIN: [Company Identification Number]
Email: support@logifin.com
Contact: [LogiFin Contact Number]

(Hereinafter collectively referred to as "Parties" and individually as "Party")

WHEREAS:
A. The Borrower requires financial assistance for completing transportation/logistics services.
B. The Lender agrees to provide a loan to the Borrower on the terms and conditions set forth in this Agreement.
C. LogiFin Hub facilitates this transaction through its digital platform and acts as an intermediary to ensure smooth execution and compliance.

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the Parties agree as follows:

1. LOAN DETAILS
   1.1 Principal Amount: Rs. _____________ (Rupees _________________ only)
   1.2 Interest Rate: ___% per annum
   1.3 Loan Tenure: ___ days from the date of disbursement
   1.4 Loan Purpose: Working capital for trip/transportation services
   1.5 Disbursement Stage: [Specify trip stage: Bilty/POD/Final Invoice/etc.]

2. DISBURSEMENT
   2.1 The Lender shall disburse the loan amount to the Borrower through LogiFin's platform wallet system.
   2.2 LogiFin shall facilitate the transfer and maintain records of all transactions.
   2.3 The loan shall be disbursed upon reaching the agreed trip stage/milestone as specified in clause 1.5.
   2.4 Loan Percentage: The loan amount represents ___% of the total trip value.

3. REPAYMENT
   3.1 The Borrower shall repay the Principal Amount plus Interest within ___ days.
   3.2 Repayment shall be made through LogiFin's platform.
   3.3 Early repayment is permitted without penalty.
   3.4 In case of default, penal interest of ___% per month shall apply on overdue amounts.

4. ROLE OF LOGIFIN (PARTY 3)
   4.1 LogiFin acts as a facilitating platform for loan transactions between Party 1 and Party 2.
   4.2 LogiFin shall:
       a) Maintain digital records of all transactions
       b) Provide a secure platform for fund transfers
       c) Generate necessary documentation and reports
       d) Facilitate communication between parties
       e) Monitor trip progress and milestone completion
   4.3 LogiFin charges a platform fee of ___% which shall be borne by [Borrower/Lender/Split].
   4.4 LogiFin does not guarantee loan repayment and acts solely as a facilitator.

5. SECURITY AND COLLATERAL
   5.1 [Specify if any collateral/security is provided]
   5.2 Documents related to the trip (Bilty, POD, Invoices) shall serve as supporting evidence.
   5.3 LogiFin shall maintain custody of relevant trip documents on its platform.

6. REPRESENTATIONS AND WARRANTIES
   6.1 Each Party represents and warrants that:
       a) They have full authority to enter into this Agreement
       b) All information provided is true and accurate
       c) They shall comply with all applicable laws and regulations
   6.2 The Borrower specifically warrants the authenticity of trip documents uploaded.

7. DEFAULT AND REMEDIES
   7.1 Events of Default include:
       a) Non-payment of dues on maturity date
       b) Breach of any material term of this Agreement
       c) Insolvency or bankruptcy proceedings
   7.2 Upon default, the Lender may:
       a) Demand immediate repayment of outstanding dues
       b) Report to credit bureaus
       c) Initiate legal proceedings
   7.3 LogiFin may suspend/terminate platform access in case of defaults.

8. CONFIDENTIALITY
   8.1 All Parties agree to maintain confidentiality of transaction details.
   8.2 LogiFin shall handle data as per its Privacy Policy and applicable data protection laws.

9. DISPUTE RESOLUTION
   9.1 Any disputes shall first be resolved through mutual discussion.
   9.2 If unresolved, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996.
   9.3 The seat of arbitration shall be [City].
   9.4 This Agreement shall be governed by the laws of India.

10. PLATFORM FEES AND CHARGES
    10.1 LogiFin's platform fee: ___% of loan amount or Rs. ______
    10.2 Payment processing charges: As applicable
    10.3 Late payment charges: ___% per month on overdue amount

11. TERMINATION
    11.1 This Agreement shall terminate upon full repayment of loan and settlement of all dues.
    11.2 Early termination requires written consent of all Parties.

12. MISCELLANEOUS
    12.1 Amendments to this Agreement must be in writing and signed by all Parties.
    12.2 This Agreement may be executed in counterparts, including electronic signatures.
    12.3 Notices shall be sent to registered addresses or through LogiFin's platform.
    12.4 If any provision is invalid, the remaining provisions shall continue in force.

13. ACCEPTANCE AND CONSENT
    13.1 All Parties confirm having read and understood this Agreement.
    13.2 Electronic acceptance through LogiFin's platform shall be deemed valid.
    13.3 This Agreement supersedes all prior discussions and agreements.

IN WITNESS WHEREOF, the Parties have executed this Agreement on the date first written above.


PARTY 1 (BORROWER)                    PARTY 2 (LENDER)                    PARTY 3 (LOGIFIN)

_____________________                 _____________________                _____________________
Signature                             Signature                            Authorized Signatory
Name: _______________                 Name: _______________                Name: _______________
Date: _______________                 Date: _______________                Date: _______________


WITNESSES:

1. _____________________              2. _____________________
   Name: _______________                  Name: _______________
   Address: ____________                  Address: ____________
   Signature: __________                  Signature: __________


---
NOTES FOR USER:
1. This is a SAMPLE template. Please consult with a legal advisor before using.
2. Fill in all blank fields with appropriate information.
3. Customize clauses based on your specific requirements.
4. Ensure all parties sign in presence of witnesses.
5. Keep original copies with all parties.
6. LogiFin's role as Party 3 ensures transparency and proper record-keeping.
7. Platform fees and terms should be agreed upon before signing.

For questions, contact: support@logifin.com
---
`;

    // Create a blob and download
    const blob = new Blob([sampleAgreement], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LogiFin_3Party_Agreement_Sample.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Sample downloaded!',
      description: 'The 3-party agreement template has been downloaded successfully.',
    });
  };

  return (
    <DashboardLayout role={user?.role || 'lender'}>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your application preferences and configurations
          </p>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="agreements" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Agreements</span>
            </TabsTrigger>
            <TabsTrigger value="other" className="gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Other</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6 mt-6">
            {/* Theme Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Display Mode
                </CardTitle>
                <CardDescription>
                  Choose how the application should appear
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange({ mode: 'light' })}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all hover:border-primary ${
                      theme.mode === 'light' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Sun className="h-6 w-6" />
                    <span className="font-medium">Light</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange({ mode: 'dark' })}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all hover:border-primary ${
                      theme.mode === 'dark' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Moon className="h-6 w-6" />
                    <span className="font-medium">Dark</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange({ mode: 'system' })}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all hover:border-primary ${
                      theme.mode === 'system' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Monitor className="h-6 w-6" />
                    <span className="font-medium">System</span>
                  </button>
                </div>

                {theme.mode === 'system' && (
                  <p className="text-sm text-muted-foreground">
                    The theme will automatically switch based on your device settings
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Theme Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Theme Presets
                </CardTitle>
                <CardDescription>
                  Quick theme presets to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {presetThemes.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary transition-all text-left"
                    >
                      <div className="flex gap-1">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: preset.secondaryColor }}
                        />
                      </div>
                      <span className="text-sm font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Theme'}
              </Button>
              <Button onClick={handleReset} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </TabsContent>

          {/* Upload Agreement Tab */}
          <TabsContent value="agreements" className="space-y-6 mt-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Contracts
                </CardTitle>
                <CardDescription>
                  Upload multiple contract documents and fill in the required details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* File Upload Area */}
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <Input
                      type="file"
                      id="contract-upload"
                      multiple
                      accept=".pdf,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="contract-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, PNG, JPG (Multiple files supported)
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="mt-2">
                        Select Files
                      </Button>
                    </label>
                  </div>

                  {/* Uploaded Contracts Count */}
                  {contracts.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {contracts.length} contract(s) uploaded
                        </span>
                      </div>
                      <Button
                        onClick={handleSaveContracts}
                        disabled={isSaving || contracts.length === 0}
                        size="sm"
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save All Contracts'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contracts List */}
            {contracts.map((contract, index) => (
              <Card key={contract.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Contract {index + 1}: {contract.file_name}
                      </CardTitle>
                      <CardDescription>
                        {(contract.file_size / 1024).toFixed(2)} KB • {contract.file_type}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingContract(contract)}
                        title="View Document"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteContract(contract.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Loan Percentage */}
                    <div className="space-y-2">
                      <Label htmlFor={`loan-${contract.id}`}>
                        Loan Percentage <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id={`loan-${contract.id}`}
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={contract.loanPercentage}
                          onChange={(e) =>
                            handleContractUpdate(contract.id, 'loanPercentage', e.target.value)
                          }
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Percentage of loan as per agreement terms
                      </p>
                    </div>

                    {/* LTV (Loan to Value) */}
                    <div className="space-y-2">
                      <Label htmlFor={`ltv-${contract.id}`}>
                        LTV (Loan to Value) <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id={`ltv-${contract.id}`}
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={contract.ltv}
                          onChange={(e) =>
                            handleContractUpdate(contract.id, 'ltv', e.target.value)
                          }
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Loan to Value ratio as specified in contract
                      </p>
                    </div>

                    {/* Penalty After Due Date */}
                    <div className="space-y-2">
                      <Label htmlFor={`penalty-${contract.id}`}>
                        Penalty After Due Date <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id={`penalty-${contract.id}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="0"
                          value={contract.penaltyAfterDueDate}
                          onChange={(e) =>
                            handleContractUpdate(contract.id, 'penaltyAfterDueDate', e.target.value)
                          }
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Penalty percentage per month/week after due date
                      </p>
                    </div>

                    {/* Contract Type */}
                    <div className="space-y-2">
                      <Label htmlFor={`type-${contract.id}`}>
                        Contract Type <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={contract.contractType}
                        onValueChange={(value: '2-party' | '3-party') =>
                          handleContractUpdate(contract.id, 'contractType', value)
                        }
                      >
                        <SelectTrigger id={`type-${contract.id}`}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2-party">2-Party Contract</SelectItem>
                          <SelectItem value="3-party">3-Party Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 2-Party Warning Alert */}
                  {contract.contractType === '2-party' && (
                    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertTitle className="text-orange-800 dark:text-orange-200">
                        3-Party Agreement Recommended
                      </AlertTitle>
                      <AlertDescription className="text-orange-700 dark:text-orange-300 space-y-3">
                        <p>
                          For better transparency and legal compliance, we recommend creating a <strong>3-Party Agreement</strong> that includes LogiFin as the third party.
                        </p>
                        <div className="space-y-2">
                          <p className="font-medium">Why 3-Party Agreement?</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>LogiFin acts as a facilitator and maintains transaction records</li>
                            <li>Provides additional security and transparency</li>
                            <li>Ensures proper documentation and compliance</li>
                            <li>Protects all parties through platform oversight</li>
                          </ul>
                        </div>
                        <div className="pt-2">
                          <Button
                            onClick={downloadSampleAgreement}
                            variant="outline"
                            size="sm"
                            className="gap-2 border-orange-600 text-orange-700 hover:bg-orange-100 dark:border-orange-400 dark:text-orange-300"
                          >
                            <Download className="h-4 w-4" />
                            Download Sample 3-Party Agreement
                          </Button>
                          <p className="text-xs mt-2 text-muted-foreground">
                            Download our template to see how LogiFin should be included in your agreement
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Party 1 Name */}
                    <div className="space-y-2">
                      <Label htmlFor={`party1-${contract.id}`}>
                        Party 1 Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`party1-${contract.id}`}
                        placeholder="Enter party 1 name"
                        value={contract.party1Name}
                        onChange={(e) =>
                          handleContractUpdate(contract.id, 'party1Name', e.target.value)
                        }
                      />
                    </div>

                    {/* Party 2 Name */}
                    <div className="space-y-2">
                      <Label htmlFor={`party2-${contract.id}`}>
                        Party 2 Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`party2-${contract.id}`}
                        placeholder="Enter party 2 name"
                        value={contract.party2Name}
                        onChange={(e) =>
                          handleContractUpdate(contract.id, 'party2Name', e.target.value)
                        }
                      />
                    </div>

                    {/* Party 3 Name (conditional) */}
                    {contract.contractType === '3-party' && (
                      <div className="space-y-2">
                        <Label htmlFor={`party3-${contract.id}`}>
                          Party 3 Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`party3-${contract.id}`}
                          placeholder="Enter party 3 name"
                          value={contract.party3Name}
                          onChange={(e) =>
                            handleContractUpdate(contract.id, 'party3Name', e.target.value)
                          }
                        />
                      </div>
                    )}

                    {/* Validity Date */}
                    <div className="space-y-2">
                      <Label htmlFor={`validity-${contract.id}`}>
                        Contract Validity Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`validity-${contract.id}`}
                        type="date"
                        value={contract.validityDate}
                        onChange={(e) =>
                          handleContractUpdate(contract.id, 'validityDate', e.target.value)
                        }
                      />
                    </div>

                    {/* Trip Stage (Optional) */}
                    <div className="space-y-2">
                      <Label htmlFor={`stage-${contract.id}`}>
                        Preferred Loan Stage <span className="text-muted-foreground">(Optional)</span>
                      </Label>
                      <Select
                        value={contract.tripStage}
                        onValueChange={(value) =>
                          handleContractUpdate(contract.id, 'tripStage', value)
                        }
                      >
                        <SelectTrigger id={`stage-${contract.id}`}>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {tripStages.map((stage) => (
                            <SelectItem key={stage.value} value={stage.value}>
                              {stage.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Select the trip stage at which the loan should be disbursed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State */}
            {contracts.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-2">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      No contracts uploaded yet. Upload your first contract to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Other Settings Tab */}
          <TabsContent value="other" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Other Settings</CardTitle>
                <CardDescription>
                  Additional application settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Additional settings will be added here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Viewer Dialog */}
      <Dialog open={!!viewingContract} onOpenChange={() => setViewingContract(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewingContract?.file_name}
            </DialogTitle>
            <DialogDescription>
              {viewingContract && `${(viewingContract.file_size / 1024).toFixed(2)} KB • ${viewingContract.file_type}`}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {viewingContract && (
              <>
                {/* For new contracts with blob URLs */}
                {viewingContract.isNew && viewingContract.previewUrl && (
                  <>
                    {viewingContract.file_type === 'application/pdf' ? (
                      <iframe
                        src={viewingContract.previewUrl}
                        className="w-full h-[70vh] border rounded"
                        title="Document Preview"
                      />
                    ) : (
                      <img
                        src={viewingContract.previewUrl}
                        alt={viewingContract.file_name}
                        className="w-full h-auto border rounded"
                      />
                    )}
                  </>
                )}

                {/* For existing contracts from API */}
                {!viewingContract.isNew && (
                  <>
                    {viewingContract.file_type === 'application/pdf' ? (
                      <iframe
                        src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/uploaded-contracts/${viewingContract.id}/view`}
                        className="w-full h-[70vh] border rounded"
                        title="Document Preview"
                      />
                    ) : (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/uploaded-contracts/${viewingContract.id}/view`}
                        alt={viewingContract.file_name}
                        className="w-full h-auto border rounded"
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (viewingContract) {
                  if (viewingContract.isNew && viewingContract.previewUrl) {
                    // For new contracts with blob URLs
                    const link = document.createElement('a');
                    link.href = viewingContract.previewUrl;
                    link.download = viewingContract.file_name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } else {
                    // For existing contracts from API
                    const link = document.createElement('a');
                    link.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/uploaded-contracts/${viewingContract.id}/download`;
                    link.download = viewingContract.file_name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }
              }}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={() => setViewingContract(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Settings;
