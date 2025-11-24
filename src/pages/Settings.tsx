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
  ExternalLink,
  Edit,
  RefreshCw,
  Wallet as WalletIcon,
  Loader2
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
import { formatCurrency } from '@/lib/currency';

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface UploadedContract {
  id: string;
  file: File;
  previewUrl: string;
  loanPercentage: string;
  ltv: string; // Loan to Value ratio
  contractType: '2-party' | '3-party' | '';
  party1Name: string;
  party1UserId: string;
  party2Name: string;
  party2UserId: string;
  party3Name: string;
  party3UserId: string;
  validityDate: string;
  tripStage: string; // Optional
  penaltyAfterDueDate: string; // Penalty percentage after due date
}

interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: string;
  user_type?: 'individual' | 'company';
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

  // Registered users state
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Saved contracts state
  const [savedContracts, setSavedContracts] = useState<any[]>([]);
  const [loadingSavedContracts, setLoadingSavedContracts] = useState(false);
  const [viewingContractDetails, setViewingContractDetails] = useState<any | null>(null);
  const [editingContract, setEditingContract] = useState<any | null>(null);
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null);
  const [viewingTrustBalance, setViewingTrustBalance] = useState<any | null>(null);
  const [trustBalanceLoading, setTrustBalanceLoading] = useState(false);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-settings');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setTheme(parsed);
        applyThemeColors(parsed);
        applyThemeMode(parsed.mode);
      } catch (error) {
        console.error('Failed to load saved theme:', error);
      }
    }
  }, []);

  // Fetch all registered users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const users = await apiClient.get('/users');
        setRegisteredUsers(users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load registered users',
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [toast]);

  // Fetch saved contracts where user is involved
  useEffect(() => {
    const fetchSavedContracts = async () => {
      if (!user?.id) return;

      setLoadingSavedContracts(true);
      try {
        // Fetch contracts where user is any party (party1, party2, party3, or uploader)
        const userContracts = await apiClient.get(`/contracts?party=${user.id}`);
        setSavedContracts(userContracts);
      } catch (error) {
        console.error('Failed to fetch saved contracts:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load saved contracts',
        });
      } finally {
        setLoadingSavedContracts(false);
      }
    };

    fetchSavedContracts();
  }, [user?.id, toast]);

  // Format user display name with company info
  const formatUserDisplay = (user: RegisteredUser): string => {
    if (user.company) {
      return `${user.name} - ${user.company}`;
    }

    // For individual users, show their role type
    const roleMap: { [key: string]: string } = {
      'lender': 'Individual Lender',
      'load_owner': 'Individual Shipper',
      'load_agent': 'Individual Transporter',
      'vehicle_owner': 'Individual Vehicle Owner',
      'transporter': 'Individual Transporter',
    };

    const roleLabel = roleMap[user.role] || `Individual ${user.role}`;
    return `${user.name} - ${roleLabel}`;
  };

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

  const handleReset = () => {
    setTheme(defaultTheme);
    applyThemeColors(defaultTheme);
    applyThemeMode(defaultTheme.mode);
    localStorage.removeItem('theme-settings');

    toast({
      title: 'Theme reset',
      description: 'Theme has been reset to default settings.',
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Save to localStorage
      localStorage.setItem('theme-settings', JSON.stringify(theme));

      // Save to database (if API exists)
      try {
        await apiClient.post('/theme', {
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          accent_color: theme.accentColor,
          mode: theme.mode,
        });
      } catch (apiError) {
        console.log('API save failed, using localStorage only:', apiError);
      }

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

      const id = `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);

      newContracts.push({
        id,
        file,
        previewUrl,
        loanPercentage: '',
        ltv: '',
        contractType: '',
        party1Name: '',
        party1UserId: '',
        party2Name: '',
        party2UserId: '',
        party3Name: '',
        party3UserId: '',
        validityDate: '',
        tripStage: 'none',
        penaltyAfterDueDate: '',
      });
    });

    setContracts([...contracts, ...newContracts]);

    toast({
      title: 'Contracts uploaded',
      description: `${newContracts.length} contract(s) added successfully.`,
    });
  };

  const handleContractUpdate = (id: string, field: keyof UploadedContract, value: string) => {
    setContracts(contracts.map((contract) =>
      contract.id === id ? { ...contract, [field]: value } : contract
    ));
  };

  const handlePartySelect = (contractId: string, partyField: 'party1' | 'party2' | 'party3', userId: string) => {
    const selectedUser = registeredUsers.find(u => u.id === userId);
    if (!selectedUser) return;

    setContracts(contracts.map((contract) => {
      if (contract.id === contractId) {
        return {
          ...contract,
          [`${partyField}Name`]: formatUserDisplay(selectedUser),
          [`${partyField}UserId`]: userId,
        };
      }
      return contract;
    }));
  };

  const handleDeleteContract = (id: string) => {
    const contract = contracts.find((c) => c.id === id);
    if (contract) {
      URL.revokeObjectURL(contract.previewUrl);
    }
    setContracts(contracts.filter((c) => c.id !== id));

    toast({
      title: 'Contract deleted',
      description: 'Contract has been removed.',
    });
  };

  const handleSaveContracts = async () => {
    // Validate contracts
    const invalidContracts = contracts.filter(
      (c) => !c.loanPercentage || !c.ltv || !c.contractType || !c.party1UserId || !c.party2UserId || !c.validityDate ||
      !c.penaltyAfterDueDate || (c.contractType === '3-party' && !c.party3UserId)
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
      // Upload contracts to API
      const uploadPromises = contracts.map(async (contract) => {
        // Convert file to base64 for storage
        const reader = new FileReader();
        const fileDataPromise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(contract.file);
        });
        const fileData = await fileDataPromise;

        const contractData = {
          id: contract.id,
          file_name: contract.file.name,
          file_type: contract.file.type,
          file_size: contract.file.size,
          file_url: fileData, // Using base64 data as URL for now
          file_data: fileData, // Store base64 data
          loan_percentage: parseFloat(contract.loanPercentage),
          ltv: parseFloat(contract.ltv),
          penalty_after_due_date: parseFloat(contract.penaltyAfterDueDate),
          contract_type: contract.contractType,
          validity_date: contract.validityDate,
          trip_stage: contract.tripStage || null,
          party1_user_id: contract.party1UserId,
          party1_name: contract.party1Name,
          party2_user_id: contract.party2UserId,
          party2_name: contract.party2Name,
          party3_user_id: contract.party3UserId || null,
          party3_name: contract.party3Name || null,
          uploaded_by: user?.id,
        };

        return apiClient.post('/contracts', contractData);
      });

      await Promise.all(uploadPromises);

      // Clear the contracts list after successful upload
      setContracts([]);

      // Refresh saved contracts list
      const userContracts = await apiClient.get(`/contracts?party=${user?.id}`);
      setSavedContracts(userContracts);

      toast({
        title: 'Contracts saved!',
        description: `${contracts.length} contract(s) saved successfully to the database.`,
      });
    } catch (error: any) {
      console.error('Error saving contracts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save contracts.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavedContract = async (contractId: string) => {
    setIsSaving(true);
    try {
      await apiClient.delete(`/contracts/${contractId}`);

      // Refresh contracts list
      const userContracts = await apiClient.get(`/contracts?party=${user?.id}`);
      setSavedContracts(userContracts);

      setDeletingContractId(null);

      toast({
        title: 'Contract deleted',
        description: 'The contract has been deleted successfully.',
      });
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete contract.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if contract has a trust account party
  const hasTrustAccountParty = (contract: any): boolean => {
    // Check if any party name contains "trust_account" indicator
    const partyNames = [
      contract.party1_name,
      contract.party2_name,
      contract.party3_name,
    ].filter(Boolean);

    // Check by party name pattern (contains "Trust Account" or "trust_account")
    const hasTrustByName = partyNames.some(name =>
      name && (
        name.toLowerCase().includes('trust account') ||
        name.toLowerCase().includes('trust_account')
      )
    );

    if (hasTrustByName) return true;

    // Also check by registered users if available
    const partyIds = [
      contract.party1_user_id,
      contract.party2_user_id,
      contract.party3_user_id,
    ].filter(Boolean);

    return partyIds.some(userId => {
      const user = registeredUsers.find(u => u.id === userId);
      return user?.role === 'trust_account';
    });
  };

  // Fetch wallet balance for any party in the contract
  const handleViewPartyBalance = async (contract: any, partyUserId: string, partyName: string) => {
    setTrustBalanceLoading(true);
    try {
      if (!partyUserId) {
        toast({
          variant: 'destructive',
          title: 'Invalid Party',
          description: 'Party information not found.',
        });
        setTrustBalanceLoading(false);
        return;
      }

      // Fetch wallet data for the party
      const walletResponse = await apiClient.get(`/wallets/${partyUserId}`);

      setViewingTrustBalance({
        contract: contract,
        balance: walletResponse?.balance || 0,
        escrowedAmount: walletResponse?.escrowedAmount || walletResponse?.escrowed_amount || 0,
        partyUserId: partyUserId,
        partyName: partyName || 'Party'
      });
    } catch (error: any) {
      console.error('Error fetching party balance:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch wallet balance.',
      });
    } finally {
      setTrustBalanceLoading(false);
    }
  };

  // Fetch trust account balance for contract
  const handleViewTrustBalance = async (contract: any) => {
    setTrustBalanceLoading(true);
    try {
      // Fetch the trust account user's wallet balance
      // Assuming the trust account is one of the parties in the contract
      const trustAccountUserId = [
        contract.party1_user_id,
        contract.party2_user_id,
        contract.party3_user_id,
      ].find(userId => {
        const user = registeredUsers.find(u => u.id === userId);
        return user?.role === 'trust_account';
      });

      if (!trustAccountUserId) {
        toast({
          variant: 'destructive',
          title: 'No Trust Account',
          description: 'This contract does not have a trust account party.',
        });
        setTrustBalanceLoading(false);
        return;
      }

      const trustAccountName = registeredUsers.find(u => u.id === trustAccountUserId)?.name || 'Trust Account';
      await handleViewPartyBalance(contract, trustAccountUserId, trustAccountName);
    } catch (error: any) {
      console.error('Error fetching trust account balance:', error);
      setTrustBalanceLoading(false);
    }
  };

  const handleUpdateContract = async () => {
    if (!editingContract) return;

    // Validate required fields
    if (!editingContract.loanPercentage || !editingContract.ltv || !editingContract.penaltyAfterDueDate || !editingContract.validityDate) {
      toast({
        variant: 'destructive',
        title: 'Incomplete information',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Update contract via API - we'll need to create an update endpoint
      await apiClient.patch(`/contracts/${editingContract.id}`, {
        loan_percentage: parseFloat(editingContract.loanPercentage),
        ltv: parseFloat(editingContract.ltv),
        penalty_after_due_date: parseFloat(editingContract.penaltyAfterDueDate),
        validity_date: editingContract.validityDate,
        trip_stage: editingContract.tripStage || null,
      });

      // Refresh contracts list
      const userContracts = await apiClient.get(`/contracts?party=${user?.id}`);
      setSavedContracts(userContracts);

      setEditingContract(null);

      toast({
        title: 'Contract updated',
        description: 'The contract has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating contract:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update contract.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadSampleAgreement = () => {
    const sampleAgreement = `
MULTI-PARTY LOAN AGREEMENT

This Multi-Party Loan Agreement ("Agreement") is entered into on this ____ day of ________, 20__ at ____________.

BETWEEN:

PARTY 1 (PRIMARY PARTY):
Name: [Party 1 Name - Borrower/Transporter/Shipper]
Address: _______________________________________
PAN: ___________________
Contact: _______________

AND

PARTY 2 (SECONDARY PARTY):
Name: [Party 2 Name - Lender/Other Party]
Address: _______________________________________
PAN: ___________________
Contact: _______________

AND

PARTY 3 (THIRD PARTY - If Applicable):
Name: [Party 3 Name]
Address: _______________________________________
PAN: ___________________
Contact: _______________

AND

PARTY 4 (PLATFORM FACILITATOR):
LogiFin Private Limited
Registered Office: [LogiFin Address]
CIN: [Company Identification Number]
Email: support@logifin.com
Contact: [LogiFin Contact Number]

(Hereinafter collectively referred to as "Parties" and individually as "Party")

WHEREAS:
A. Party 1 and Party 2 wish to enter into a financial agreement.
B. The parties require platform infrastructure and facilitation services for the execution and monitoring of this agreement.
C. LogiFin (Party 3) provides the digital platform and acts as a facilitator to ensure smooth execution, transparency, and compliance.

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

4. ROLE OF LOGIFIN (PARTY 4 - PLATFORM FACILITATOR)
   4.1 LogiFin acts as the platform facilitator for transactions and agreements between all parties.
   4.2 LogiFin shall:
       a) Maintain digital records of all transactions and agreement milestones
       b) Provide a secure platform for fund transfers and escrow services
       c) Generate necessary documentation, reports, and compliance records
       d) Facilitate communication and coordination between all parties
       e) Monitor agreement progress and milestone completion
       f) Ensure transparency and proper record-keeping
   4.3 LogiFin charges a platform fee of ___% which shall be borne by [Party 1/Party 2/Split between parties].
   4.4 LogiFin does not guarantee loan repayment or performance by any party and acts solely as a facilitator.
   4.5 LogiFin's inclusion as Party 3 is mandatory for all agreements executed through the platform.

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


PARTY 1                              PARTY 2                              PARTY 3 (if applicable)

_____________________                _____________________                _____________________
Signature                            Signature                            Signature
Name: _______________                Name: _______________                Name: _______________
Date: _______________                Date: _______________                Date: _______________


PARTY 4 (LOGIFIN - PLATFORM FACILITATOR)

_____________________
Authorized Signatory
Name: _______________
Date: _______________


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
4. For 2-party contracts, Party 3 (LogiFin) is always included as the platform facilitator.
5. Ensure all parties sign in presence of witnesses.
6. Keep original copies with all parties.
7. LogiFin's role as Party 3 (Platform Facilitator) is mandatory and ensures transparency, proper record-keeping, and compliance.
8. Platform fees and terms should be agreed upon before signing.
9. All parties listed must be registered users on the LogiFin platform.

For questions, contact: support@logifin.com
---
`;

    // Create a blob and download
    const blob = new Blob([sampleAgreement], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LogiFin_Multi_Party_Agreement_Sample.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Sample downloaded!',
      description: 'The multi-party agreement template has been downloaded successfully.',
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
            {/* Info Alert */}
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">
                Contract Parties & LogiFin Facilitator
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300 space-y-2">
                <p>
                  <strong>Party Selection:</strong> You can only create contracts with users who are registered on the platform.
                  When selecting parties, you'll see their name and company (or individual status) from our registered users list.
                </p>
                <p>
                  <strong>LogiFin as Party 3:</strong> LogiFin Private Limited is automatically included as Party 3 (Platform Facilitator) in all contracts to ensure transparency, proper record-keeping, and compliance.
                </p>
              </AlertDescription>
            </Alert>

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
                        Contract {index + 1}: {contract.file.name}
                      </CardTitle>
                      <CardDescription>
                        {(contract.file.size / 1024).toFixed(2)} KB • {contract.file.type}
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
                          <SelectItem value="2-party">2-Party + LogiFin</SelectItem>
                          <SelectItem value="3-party">3-Party + LogiFin</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        LogiFin is automatically added as Party 3 (facilitator)
                      </p>
                    </div>
                  </div>

                  {/* Contract Info Alert */}
                  {contract.contractType === '2-party' && (
                    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800 dark:text-blue-200">
                        2-Party Contract + LogiFin as Facilitator
                      </AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-300 space-y-3">
                        <p>
                          This is a <strong>2-party contract</strong> between Party 1 and Party 2, with LogiFin automatically included as Party 3 (Platform Facilitator).
                        </p>
                        <div className="space-y-2">
                          <p className="font-medium">LogiFin's Role as Party 3:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Acts as a facilitator and maintains transaction records</li>
                            <li>Provides platform infrastructure and security</li>
                            <li>Ensures proper documentation and compliance</li>
                            <li>Monitors and facilitates the agreement execution</li>
                          </ul>
                        </div>
                        <div className="pt-2">
                          <Button
                            onClick={downloadSampleAgreement}
                            variant="outline"
                            size="sm"
                            className="gap-2 border-blue-600 text-blue-700 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-300"
                          >
                            <Download className="h-4 w-4" />
                            Download Sample Agreement Template
                          </Button>
                          <p className="text-xs mt-2 text-muted-foreground">
                            Download our template to see how the agreement should be structured
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {contract.contractType === '3-party' && (
                    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800 dark:text-blue-200">
                        3-Party Contract + LogiFin as Facilitator
                      </AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-300 space-y-3">
                        <p>
                          This is a <strong>3-party contract</strong> between Party 1, Party 2, and Party 3, with LogiFin automatically managing as the facilitator.
                        </p>
                        <div className="pt-2">
                          <Button
                            onClick={downloadSampleAgreement}
                            variant="outline"
                            size="sm"
                            className="gap-2 border-blue-600 text-blue-700 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-300"
                          >
                            <Download className="h-4 w-4" />
                            Download Sample Agreement Template
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Party 1 Name */}
                    <div className="space-y-2">
                      <Label htmlFor={`party1-${contract.id}`}>
                        Party 1 (Registered User) <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={contract.party1UserId}
                        onValueChange={(userId) => handlePartySelect(contract.id, 'party1', userId)}
                        disabled={loadingUsers}
                      >
                        <SelectTrigger id={`party1-${contract.id}`}>
                          <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select registered user"} />
                        </SelectTrigger>
                        <SelectContent>
                          {registeredUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {formatUserDisplay(user)}
                            </SelectItem>
                          ))}
                          {registeredUsers.length === 0 && !loadingUsers && (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No registered users found
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      {contract.party1Name && (
                        <p className="text-xs text-muted-foreground">
                          Selected: {contract.party1Name}
                        </p>
                      )}
                    </div>

                    {/* Party 2 Name */}
                    <div className="space-y-2">
                      <Label htmlFor={`party2-${contract.id}`}>
                        Party 2 (Registered User) <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={contract.party2UserId}
                        onValueChange={(userId) => handlePartySelect(contract.id, 'party2', userId)}
                        disabled={loadingUsers}
                      >
                        <SelectTrigger id={`party2-${contract.id}`}>
                          <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select registered user"} />
                        </SelectTrigger>
                        <SelectContent>
                          {registeredUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {formatUserDisplay(user)}
                            </SelectItem>
                          ))}
                          {registeredUsers.length === 0 && !loadingUsers && (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No registered users found
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      {contract.party2Name && (
                        <p className="text-xs text-muted-foreground">
                          Selected: {contract.party2Name}
                        </p>
                      )}
                    </div>

                    {/* Party 3 Name (conditional) */}
                    {contract.contractType === '3-party' && (
                      <div className="space-y-2">
                        <Label htmlFor={`party3-${contract.id}`}>
                          Party 3 (Registered User) <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={contract.party3UserId}
                          onValueChange={(userId) => handlePartySelect(contract.id, 'party3', userId)}
                          disabled={loadingUsers}
                        >
                          <SelectTrigger id={`party3-${contract.id}`}>
                            <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select registered user"} />
                          </SelectTrigger>
                          <SelectContent>
                            {registeredUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {formatUserDisplay(user)}
                              </SelectItem>
                            ))}
                            {registeredUsers.length === 0 && !loadingUsers && (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                No registered users found
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {contract.party3Name && (
                          <p className="text-xs text-muted-foreground">
                            Selected: {contract.party3Name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Party 3 - LogiFin (Static/Readonly) */}
                    <div className="space-y-2">
                      <Label htmlFor={`party3-logifin-${contract.id}`}>
                        Party 3 (Platform Facilitator)
                      </Label>
                      <Input
                        id={`party3-logifin-${contract.id}`}
                        value="LogiFin Private Limited - Platform Facilitator"
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        LogiFin is automatically included as the facilitating platform
                      </p>
                    </div>

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

            {/* Saved Contracts Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  My Contracts
                </CardTitle>
                <CardDescription>
                  View all contracts where you are involved as a party
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSavedContracts ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-3 text-muted-foreground">Loading contracts...</p>
                  </div>
                ) : savedContracts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No saved contracts found. You'll see contracts here once they are uploaded.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedContracts.map((contract) => (
                      <Card key={contract.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              {/* Contract Header */}
                              <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-primary mt-1" />
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{contract.file_name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {contract.contract_type === '2-party' ? '2-Party + LogiFin' : '3-Party + LogiFin'} •
                                    Uploaded {new Date(contract.created_at).toLocaleDateString('en-IN')}
                                  </p>
                                </div>
                              </div>

                              {/* Financial Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/50 rounded-lg">
                                <div>
                                  <p className="text-xs text-muted-foreground">Loan %</p>
                                  <p className="font-semibold">{contract.loan_percentage}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">LTV</p>
                                  <p className="font-semibold">{contract.ltv}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Penalty</p>
                                  <p className="font-semibold">{contract.penalty_after_due_date}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Valid Until</p>
                                  <p className="font-semibold">{new Date(contract.validity_date).toLocaleDateString('en-IN')}</p>
                                </div>
                              </div>

                              {/* Parties Information */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">Party 1:</span>
                                  <span className="text-muted-foreground">{contract.party1_name}</span>
                                  {contract.party1_user_id === user?.id && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">You</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">Party 2:</span>
                                  <span className="text-muted-foreground">{contract.party2_name}</span>
                                  {contract.party2_user_id === user?.id && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">You</span>
                                  )}
                                </div>
                                {contract.contract_type === '3-party' && contract.party3_name && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">Party 3:</span>
                                    <span className="text-muted-foreground">{contract.party3_name}</span>
                                    {contract.party3_user_id === user?.id && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">You</span>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">Party 3:</span>
                                  <span className="text-muted-foreground">LogiFin Private Limited - Platform Facilitator</span>
                                </div>
                              </div>

                              {/* Uploader Info */}
                              <div className="flex items-center gap-2 pt-2 border-t">
                                <Upload className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Uploaded by {contract.uploaded_by === user?.id ? 'You' : 'Another Party'}
                                </p>
                                {contract.trip_stage && contract.trip_stage !== 'none' && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <p className="text-sm text-muted-foreground">
                                      Stage: {contract.trip_stage}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewingContractDetails(contract)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  // Download contract file
                                  const link = document.createElement('a');
                                  link.href = contract.file_data || contract.file_url;
                                  link.download = contract.file_name;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                title="Download Contract"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {hasTrustAccountParty(contract) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewTrustBalance(contract)}
                                  title="View Trust Account Balance"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <WalletIcon className="h-4 w-4" />
                                </Button>
                              )}
                              {/* Show Edit and Delete only for uploader */}
                              {contract.uploaded_by === user?.id && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingContract({
                                      id: contract.id,
                                      loanPercentage: contract.loan_percentage.toString(),
                                      ltv: contract.ltv.toString(),
                                      penaltyAfterDueDate: contract.penalty_after_due_date.toString(),
                                      validityDate: contract.validity_date,
                                      tripStage: contract.trip_stage || 'none',
                                    })}
                                    title="Edit Contract"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeletingContractId(contract.id)}
                                    title="Delete Contract"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="mt-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                              contract.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                              contract.status === 'expired' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                              contract.status === 'cancelled' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                              {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
              {viewingContract?.file.name}
            </DialogTitle>
            <DialogDescription>
              {viewingContract && `${(viewingContract.file.size / 1024).toFixed(2)} KB • ${viewingContract.file.type}`}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {viewingContract && (
              <>
                {viewingContract.file.type === 'application/pdf' ? (
                  <iframe
                    src={viewingContract.previewUrl}
                    className="w-full h-[70vh] border rounded"
                    title="Document Preview"
                  />
                ) : (
                  <img
                    src={viewingContract.previewUrl}
                    alt={viewingContract.file.name}
                    className="w-full h-auto border rounded"
                  />
                )}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (viewingContract) {
                  const link = document.createElement('a');
                  link.href = viewingContract.previewUrl;
                  link.download = viewingContract.file.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
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

      {/* Saved Contract Details Dialog */}
      <Dialog open={!!viewingContractDetails} onOpenChange={() => setViewingContractDetails(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contract Details
            </DialogTitle>
            <DialogDescription>
              {viewingContractDetails?.file_name}
            </DialogDescription>
          </DialogHeader>

          {viewingContractDetails && (
            <div className="space-y-6">
              {/* Contract Preview */}
              <div className="border rounded-lg overflow-hidden">
                {viewingContractDetails.file_type === 'application/pdf' ? (
                  <iframe
                    src={viewingContractDetails.file_data || viewingContractDetails.file_url}
                    className="w-full h-[400px]"
                    title="Contract Preview"
                  />
                ) : (
                  <img
                    src={viewingContractDetails.file_data || viewingContractDetails.file_url}
                    alt={viewingContractDetails.file_name}
                    className="w-full h-auto"
                  />
                )}
              </div>

              {/* Contract Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Type</Label>
                  <p className="text-sm">
                    {viewingContractDetails.contract_type === '2-party' ? '2-Party + LogiFin' : '3-Party + LogiFin'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    viewingContractDetails.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                    viewingContractDetails.status === 'expired' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                    viewingContractDetails.status === 'cancelled' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {viewingContractDetails.status.charAt(0).toUpperCase() + viewingContractDetails.status.slice(1)}
                  </span>
                </div>
                <div className="space-y-2">
                  <Label>Loan Percentage</Label>
                  <p className="text-sm font-semibold">{viewingContractDetails.loan_percentage}%</p>
                </div>
                <div className="space-y-2">
                  <Label>LTV (Loan to Value)</Label>
                  <p className="text-sm font-semibold">{viewingContractDetails.ltv}%</p>
                </div>
                <div className="space-y-2">
                  <Label>Penalty After Due Date</Label>
                  <p className="text-sm font-semibold">{viewingContractDetails.penalty_after_due_date}%</p>
                </div>
                <div className="space-y-2">
                  <Label>Validity Date</Label>
                  <p className="text-sm">{new Date(viewingContractDetails.validity_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                {viewingContractDetails.trip_stage && viewingContractDetails.trip_stage !== 'none' && (
                  <div className="space-y-2">
                    <Label>Preferred Loan Stage</Label>
                    <p className="text-sm capitalize">{viewingContractDetails.trip_stage.replace('_', ' ')}</p>
                  </div>
                )}
              </div>

              {/* Parties Section */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-semibold">Contract Parties</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Party 1 (Primary Party)</p>
                        <p className="font-medium">{viewingContractDetails.party1_name}</p>
                      </div>
                      {viewingContractDetails.party1_user_id === user?.id && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">You</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Party 2 (Secondary Party)</p>
                        <p className="font-medium">{viewingContractDetails.party2_name}</p>
                      </div>
                      {viewingContractDetails.party2_user_id === user?.id && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">You</span>
                      )}
                    </div>
                  </div>
                  {viewingContractDetails.contract_type === '3-party' && viewingContractDetails.party3_name && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Party 3 (Third Party)</p>
                          <p className="font-medium">{viewingContractDetails.party3_name}</p>
                        </div>
                        {viewingContractDetails.party3_user_id === user?.id && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">You</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Party 3 (Platform Facilitator)</p>
                      <p className="font-medium">LogiFin Private Limited - Platform Facilitator</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  <span>Uploaded by {viewingContractDetails.uploaded_by === user?.id ? 'You' : 'Another Party'}</span>
                  <span>•</span>
                  <span>{new Date(viewingContractDetails.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>File: {viewingContractDetails.file_name} ({(viewingContractDetails.file_size / 1024).toFixed(2)} KB)</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (viewingContractDetails) {
                  const link = document.createElement('a');
                  link.href = viewingContractDetails.file_data || viewingContractDetails.file_url;
                  link.download = viewingContractDetails.file_name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Contract
            </Button>
            <Button onClick={() => setViewingContractDetails(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={!!editingContract} onOpenChange={() => setEditingContract(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Contract Details
            </DialogTitle>
            <DialogDescription>
              Update the financial terms and validity date of the contract
            </DialogDescription>
          </DialogHeader>

          {editingContract && (
            <div className="space-y-4 py-4">
              {/* Financial Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-loan-percentage">Loan Percentage (%)</Label>
                  <Input
                    id="edit-loan-percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editingContract.loanPercentage}
                    onChange={(e) => setEditingContract({
                      ...editingContract,
                      loanPercentage: e.target.value,
                    })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ltv">Loan to Value (LTV) %</Label>
                  <Input
                    id="edit-ltv"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editingContract.ltv}
                    onChange={(e) => setEditingContract({
                      ...editingContract,
                      ltv: e.target.value,
                    })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-penalty">Penalty After Due Date (%)</Label>
                  <Input
                    id="edit-penalty"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingContract.penaltyAfterDueDate}
                    onChange={(e) => setEditingContract({
                      ...editingContract,
                      penaltyAfterDueDate: e.target.value,
                    })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-validity-date">Validity Date</Label>
                  <Input
                    id="edit-validity-date"
                    type="date"
                    value={editingContract.validityDate}
                    onChange={(e) => setEditingContract({
                      ...editingContract,
                      validityDate: e.target.value,
                    })}
                    required
                  />
                </div>
              </div>

              {/* Trip Stage */}
              <div className="space-y-2">
                <Label htmlFor="edit-trip-stage">Trip Stage (Optional)</Label>
                <Select
                  value={editingContract.tripStage}
                  onValueChange={(value) => setEditingContract({
                    ...editingContract,
                    tripStage: value,
                  })}
                >
                  <SelectTrigger id="edit-trip-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tripStages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setEditingContract(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateContract}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Contract Confirmation Dialog */}
      <Dialog open={!!deletingContractId} onOpenChange={() => setDeletingContractId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Contract
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contract? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Deleting this contract will permanently remove it from the database and it will no longer be visible to any parties.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingContractId(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingContractId && handleDeleteSavedContract(deletingContractId)}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Contract
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trust Account Wallet Balance Dialog */}
      <Dialog open={!!viewingTrustBalance} onOpenChange={() => setViewingTrustBalance(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-green-600" />
              Trust Account Wallet Balance
            </DialogTitle>
            <DialogDescription>
              Available balance for the trust account in this contract
            </DialogDescription>
          </DialogHeader>
          {viewingTrustBalance && (
            <div className="space-y-4">
              {/* Contract Info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Contract</p>
                <p className="font-semibold">{viewingTrustBalance.contract.file_name}</p>
              </div>

              {/* Trust Account Info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Trust Account</p>
                <p className="font-semibold">{viewingTrustBalance.partyName || viewingTrustBalance.trustAccountName}</p>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-1 gap-3">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Available Balance</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">
                          {formatCurrency(viewingTrustBalance.balance)}
                        </p>
                      </div>
                      <WalletIcon className="h-8 w-8 text-green-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700">In Escrow</p>
                        <p className="text-2xl font-bold text-orange-900 mt-1">
                          {formatCurrency(viewingTrustBalance.escrowedAmount)}
                        </p>
                      </div>
                      <WalletIcon className="h-8 w-8 text-orange-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-700">
                  This shows the current wallet balance of the trust account associated with this contract.
                </AlertDescription>
              </Alert>
            </div>
          )}
          {trustBalanceLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setViewingTrustBalance(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Settings;
