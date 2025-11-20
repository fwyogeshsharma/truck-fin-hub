import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/currency';
import {
  FileText,
  Wallet as WalletIcon,
  Upload,
  Download,
  Eye,
  Trash2,
  Edit,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Building2,
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  Info,
  RefreshCw,
  Save,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BankAccount {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: 'savings' | 'current';
  isPrimary: boolean;
  addedAt: string;
}

interface UploadedContract {
  id: string;
  file: File;
  previewUrl: string;
  loanPercentage: string;
  ltv: string;
  contractType: '2-party' | '3-party' | '';
  party1Name: string;
  party1UserId: string;
  party2Name: string;
  party2UserId: string;
  party3Name: string;
  party3UserId: string;
  party4Name: string;
  party4UserId: string;
  validityDate: string;
  tripStage: string;
  penaltyAfterDueDate: string;
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

const BANK_ACCOUNTS_KEY = 'logistics_bank_accounts';

const TrustAccountPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  // Agreement states
  const [contracts, setContracts] = useState<UploadedContract[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savedContracts, setSavedContracts] = useState<any[]>([]);
  const [loadingSavedContracts, setLoadingSavedContracts] = useState(false);
  const [viewingContract, setViewingContract] = useState<UploadedContract | null>(null);
  const [viewingContractDetails, setViewingContractDetails] = useState<any | null>(null);
  const [editingContract, setEditingContract] = useState<any | null>(null);
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Wallet states
  const [walletData, setWalletData] = useState<any>({
    balance: 0,
    escrowedAmount: 0,
    totalInvested: 0,
    totalReturns: 0,
    lockedAmount: 0,
    userId: user?.id || ''
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Wallet dialogs
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [addBankDialogOpen, setAddBankDialogOpen] = useState(false);

  // Wallet form states
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionImage, setTransactionImage] = useState<string>('');
  const [transactionImageFile, setTransactionImageFile] = useState<File | null>(null);

  // Bank form states
  const [bankForm, setBankForm] = useState({
    accountHolderName: user?.name || '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    accountType: 'savings' as 'savings' | 'current',
  });

  // Transaction filters
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'credit' | 'debit'>('all');

  // Check if user has trust_account role
  useEffect(() => {
    if (user?.role !== 'trust_account') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      fetchRegisteredUsers();
      fetchSavedContracts();
      fetchWalletData();
      fetchTransactions();
      loadBankAccounts();
    }
  }, [user?.id]);

  // Fetch registered users
  const fetchRegisteredUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await apiClient.get('/users');
      setRegisteredUsers(users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load registered users',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch saved contracts
  const fetchSavedContracts = async () => {
    setLoadingSavedContracts(true);
    try {
      const userContracts = await apiClient.get(`/contracts?party=${user?.id}`);
      setSavedContracts(userContracts || []);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load saved contracts',
      });
    } finally {
      setLoadingSavedContracts(false);
    }
  };

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      setDataLoading(true);
      const wallet = await apiClient.get(`/wallets/${user?.id}`);
      if (wallet) {
        setWalletData(wallet);
      }
    } catch (error: any) {
      console.error('Error fetching wallet:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load wallet data',
      });
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const transactionData = await apiClient.get(`/transactions?userId=${user?.id}`);
      setTransactions(transactionData || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Load bank accounts from local storage
  const loadBankAccounts = () => {
    const stored = localStorage.getItem(`${BANK_ACCOUNTS_KEY}_${user?.id}`);
    if (stored) {
      setBankAccounts(JSON.parse(stored));
    }
  };

  // Save bank accounts to local storage
  const saveBankAccounts = (accounts: BankAccount[]) => {
    localStorage.setItem(`${BANK_ACCOUNTS_KEY}_${user?.id}`, JSON.stringify(accounts));
    setBankAccounts(accounts);
  };

  // Format user display name
  const formatUserDisplay = (user: RegisteredUser): string => {
    if (user.company) {
      return `${user.name} - ${user.company}`;
    }

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

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newContracts: UploadedContract[] = [];

    Array.from(files).forEach((file) => {
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
        party4Name: 'LogiFin Hub Private Limited - Platform Facilitator',
        party4UserId: 'logifin-platform',
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

  // Handle contract update
  const handleContractUpdate = (id: string, field: keyof UploadedContract, value: string) => {
    setContracts(contracts.map((contract) =>
      contract.id === id ? { ...contract, [field]: value } : contract
    ));
  };

  // Handle party select
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

  // Handle delete contract
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

  // Save all contracts
  const handleSaveContracts = async () => {
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
      const uploadPromises = contracts.map(async (contract) => {
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
          file_url: fileData,
          file_data: fileData,
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

      setContracts([]);
      await fetchSavedContracts();

      toast({
        title: 'Contracts saved!',
        description: `${contracts.length} contract(s) saved successfully to the database.`,
      });
    } catch (error: any) {
      console.error('Error saving contracts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to save contracts.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete saved contract
  const handleDeleteSavedContract = async (contractId: string) => {
    setIsSaving(true);
    try {
      await apiClient.delete(`/contracts/${contractId}`);
      await fetchSavedContracts();
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

  // Update contract
  const handleUpdateContract = async () => {
    if (!editingContract) return;

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
      await apiClient.patch(`/contracts/${editingContract.id}`, {
        loan_percentage: parseFloat(editingContract.loanPercentage),
        ltv: parseFloat(editingContract.ltv),
        penalty_after_due_date: parseFloat(editingContract.penaltyAfterDueDate),
        validity_date: editingContract.validityDate,
        trip_stage: editingContract.tripStage || null,
      });

      await fetchSavedContracts();
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

  // Download sample agreement
  const downloadSampleAgreement = () => {
    const sampleText = `MULTI-PARTY LOAN AGREEMENT

This Multi-Party Loan Agreement is entered into between registered parties and LogiFin Hub Private Limited as the platform facilitator.

Visit the Settings page to download the complete sample agreement template.`;

    const blob = new Blob([sampleText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LogiFin_Sample_Agreement.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle top-up
  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) < 1000) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Minimum top-up amount is ₹1,000',
      });
      return;
    }

    if (!transactionImageFile) {
      toast({
        variant: 'destructive',
        title: 'Missing Screenshot',
        description: 'Please upload transaction screenshot',
      });
      return;
    }

    try {
      setIsProcessing(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const requestData = {
          user_id: user?.id || '',
          request_type: 'add_money',
          amount: parseFloat(topUpAmount),
          transaction_image_url: base64Image,
        };

        await apiClient.post('/transaction-requests', requestData);

        toast({
          title: 'Success',
          description: 'Top-up request submitted. Processing time: 24-48 hours',
        });

        setTopUpDialogOpen(false);
        setTopUpAmount('');
        setTransactionImage('');
        setTransactionImageFile(null);
        setIsProcessing(false);

        fetchTransactions();
      };

      reader.readAsDataURL(transactionImageFile);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to submit top-up request',
      });
      setIsProcessing(false);
    }
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) < 100) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Minimum withdrawal amount is ₹100',
      });
      return;
    }

    if (parseFloat(withdrawAmount) > (walletData?.balance || 0)) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: 'Withdrawal amount exceeds available balance',
      });
      return;
    }

    if (!selectedBankId) {
      toast({
        variant: 'destructive',
        title: 'Select Bank',
        description: 'Please select a bank account',
      });
      return;
    }

    try {
      setIsProcessing(true);

      const selectedBank = bankAccounts.find(b => b.id === selectedBankId);
      if (!selectedBank) {
        throw new Error('Bank account not found');
      }

      const requestData = {
        user_id: user?.id || '',
        request_type: 'withdrawal',
        amount: parseFloat(withdrawAmount),
        bank_account_id: selectedBankId,
        bank_account_number: selectedBank.accountNumber,
        bank_ifsc_code: selectedBank.ifscCode,
        bank_name: selectedBank.bankName,
      };

      await apiClient.post('/transaction-requests', requestData);

      toast({
        title: 'Success',
        description: 'Withdrawal request submitted successfully',
      });

      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      setSelectedBankId('');

      fetchWalletData();
      fetchTransactions();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to submit withdrawal request',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Add bank account
  const handleAddBank = () => {
    if (!bankForm.accountHolderName || !bankForm.accountNumber || !bankForm.ifscCode) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
      });
      return;
    }

    const newAccount: BankAccount = {
      id: Date.now().toString(),
      ...bankForm,
      isPrimary: bankAccounts.length === 0,
      addedAt: new Date().toISOString(),
    };

    const updatedAccounts = [...bankAccounts, newAccount];
    saveBankAccounts(updatedAccounts);

    toast({
      title: 'Success',
      description: 'Bank account added successfully',
    });

    setAddBankDialogOpen(false);
    setBankForm({
      accountHolderName: user?.name || '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      accountType: 'savings',
    });
  };

  // Delete bank account
  const handleDeleteBank = (bankId: string) => {
    const updatedAccounts = bankAccounts.filter(b => b.id !== bankId);
    saveBankAccounts(updatedAccounts);
    toast({
      title: 'Success',
      description: 'Bank account removed',
    });
  };

  // Set primary bank
  const handleSetPrimaryBank = (bankId: string) => {
    const updatedAccounts = bankAccounts.map(b => ({
      ...b,
      isPrimary: b.id === bankId,
    }));
    saveBankAccounts(updatedAccounts);
    toast({
      title: 'Success',
      description: 'Primary bank account updated',
    });
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (transactionFilter === 'all') return true;
    if (transactionFilter === 'credit') return t.type === 'credit' || t.type === 'topup';
    if (transactionFilter === 'debit') return t.type === 'debit' || t.type === 'withdrawal';
    return true;
  });

  // Handle transaction image upload
  const handleTransactionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: 'Please upload an image file',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setTransactionImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setTransactionImageFile(file);
    }
  };

  return (
    <DashboardLayout role={user?.role || 'trust_account'}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Trust Account</h1>
          <p className="text-muted-foreground mt-1">
            Manage trust account agreements and wallet
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="agreements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="agreements" className="gap-2">
              <FileText className="h-4 w-4" />
              <span>Agreements</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-2">
              <WalletIcon className="h-4 w-4" />
              <span>Wallet</span>
            </TabsTrigger>
          </TabsList>

          {/* Agreements Tab */}
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
                  <strong>LogiFin as Party 4:</strong> LogiFin Hub Private Limited is automatically included as Party 4 (Platform Facilitator) in all contracts to ensure transparency, proper record-keeping, and compliance.
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
                        LogiFin is automatically added as Party 4 (facilitator)
                      </p>
                    </div>
                  </div>

                  {/* Contract Info Alerts */}
                  {contract.contractType === '2-party' && (
                    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800 dark:text-blue-200">
                        2-Party Contract + LogiFin as Facilitator
                      </AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-300 space-y-3">
                        <p>
                          This is a <strong>2-party contract</strong> between Party 1 and Party 2, with LogiFin automatically included as Party 4 (Platform Facilitator).
                        </p>
                        <div className="pt-2">
                          <Button
                            onClick={downloadSampleAgreement}
                            variant="outline"
                            size="sm"
                            className="gap-2 border-blue-600 text-blue-700 hover:bg-blue-100"
                          >
                            <Download className="h-4 w-4" />
                            Download Sample Agreement Template
                          </Button>
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
                          This is a <strong>3-party contract</strong> between Party 1, Party 2, and Party 3, with LogiFin automatically included as Party 4 (Platform Facilitator).
                        </p>
                        <div className="pt-2">
                          <Button
                            onClick={downloadSampleAgreement}
                            variant="outline"
                            size="sm"
                            className="gap-2 border-blue-600 text-blue-700 hover:bg-blue-100"
                          >
                            <Download className="h-4 w-4" />
                            Download Sample Agreement Template
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Party 1 */}
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
                          {registeredUsers
                            .filter(u => u.role !== 'trust_account' && u.role !== 'admin' && u.role !== 'super_admin')
                            .map((user) => (
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

                    {/* Party 2 */}
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
                          {registeredUsers
                            .filter(u => u.role !== 'trust_account' && u.role !== 'admin' && u.role !== 'super_admin')
                            .map((user) => (
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

                    {/* Party 3 (conditional) */}
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
                            {registeredUsers
                              .filter(u => u.role !== 'trust_account' && u.role !== 'admin' && u.role !== 'super_admin')
                              .map((user) => (
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

                    {/* Party 4 - LogiFin (Static/Readonly) */}
                    <div className="space-y-2">
                      <Label htmlFor={`party4-${contract.id}`}>
                        Party 4 (Platform Facilitator)
                      </Label>
                      <Input
                        id={`party4-${contract.id}`}
                        value={contract.party4Name}
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
                                  <span className="font-medium">Party 4:</span>
                                  <span className="text-muted-foreground">{contract.party4_name}</span>
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
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                              contract.status === 'active' ? 'bg-green-100 text-green-700' :
                              contract.status === 'expired' ? 'bg-red-100 text-red-700' :
                              contract.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                              'bg-blue-100 text-blue-700'
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

          {/* Wallet Tab - keeping your existing wallet implementation */}
          <TabsContent value="wallet" className="space-y-6 mt-6">
            {/* Wallet Balance Cards */}
            {dataLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading wallet data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                    <WalletIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(walletData?.balance || 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">In Escrow</CardTitle>
                    <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(walletData?.escrowedAmount || walletData?.escrowed_amount || 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                    <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(walletData?.totalInvested || walletData?.total_invested || 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(walletData?.totalReturns || walletData?.total_returns || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            {!dataLoading && (
              <div className="flex gap-4">
                <Button onClick={() => setTopUpDialogOpen(true)} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Money
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setWithdrawDialogOpen(true)}
                  className="flex-1"
                >
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            )}

            {/* Wallet Tabs */}
            {!dataLoading && (
              <Tabs defaultValue="ledger" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ledger">Transaction Ledger</TabsTrigger>
                  <TabsTrigger value="banks">Bank Accounts</TabsTrigger>
                </TabsList>

              {/* Transaction Ledger */}
              <TabsContent value="ledger" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      variant={transactionFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTransactionFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={transactionFilter === 'credit' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTransactionFilter('credit')}
                    >
                      Credit
                    </Button>
                    <Button
                      variant={transactionFilter === 'debit' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTransactionFilter('debit')}
                    >
                      Debit
                    </Button>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {filteredTransactions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No transactions yet
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Balance After</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                {new Date(transaction.timestamp).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    transaction.type === 'credit' || transaction.type === 'topup'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {transaction.type}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className={`text-right font-medium ${
                                  transaction.type === 'credit' || transaction.type === 'topup'
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {transaction.type === 'credit' || transaction.type === 'topup'
                                  ? '+'
                                  : '-'}
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(transaction.balanceAfter)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bank Accounts */}
              <TabsContent value="banks" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setAddBankDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Account
                  </Button>
                </div>

                {bankAccounts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      No bank accounts added yet
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {bankAccounts.map((bank) => (
                      <Card key={bank.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                <span className="font-semibold">{bank.bankName}</span>
                                {bank.isPrimary && (
                                  <Badge variant="default">Primary</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>Account Holder: {bank.accountHolderName}</div>
                                <div>Account Number: ****{bank.accountNumber.slice(-4)}</div>
                                <div>IFSC: {bank.ifscCode}</div>
                                <div>Type: {bank.accountType}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {!bank.isPrimary && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetPrimaryBank(bank.id)}
                                >
                                  Set Primary
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteBank(bank.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              </Tabs>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* View Contract Preview Dialog */}
      <Dialog open={!!viewingContract} onOpenChange={() => setViewingContract(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Contract Preview</DialogTitle>
            <DialogDescription>
              {viewingContract?.file.name}
            </DialogDescription>
          </DialogHeader>
          {viewingContract && (
            <div className="space-y-4">
              {viewingContract.file.type === 'application/pdf' ? (
                <iframe
                  src={viewingContract.previewUrl}
                  className="w-full h-96 border rounded"
                  title="Contract Preview"
                />
              ) : (
                <img
                  src={viewingContract.previewUrl}
                  alt="Contract"
                  className="w-full rounded border"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Saved Contract Details Dialog */}
      <Dialog open={!!viewingContractDetails} onOpenChange={() => setViewingContractDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>
          {viewingContractDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Contract Type:</span> {viewingContractDetails.contract_type}
                </div>
                <div>
                  <span className="font-medium">Loan %:</span> {viewingContractDetails.loan_percentage}%
                </div>
                <div>
                  <span className="font-medium">LTV:</span> {viewingContractDetails.ltv}%
                </div>
                <div>
                  <span className="font-medium">Penalty:</span> {viewingContractDetails.penalty_after_due_date}%
                </div>
                <div>
                  <span className="font-medium">Validity:</span>{' '}
                  {new Date(viewingContractDetails.validity_date).toLocaleDateString('en-IN')}
                </div>
                <div>
                  <span className="font-medium">Trip Stage:</span> {viewingContractDetails.trip_stage || 'None'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Parties:</div>
                <div className="text-sm">
                  <div>Party 1: {viewingContractDetails.party1_name}</div>
                  <div>Party 2: {viewingContractDetails.party2_name}</div>
                  {viewingContractDetails.contract_type === '3-party' && (
                    <div>Party 3: {viewingContractDetails.party3_name}</div>
                  )}
                  <div>Party 4: {viewingContractDetails.party4_name}</div>
                </div>
              </div>
              {viewingContractDetails.file_url && (
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={viewingContractDetails.file_data || viewingContractDetails.file_url}
                    download={viewingContractDetails.file_name}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Contract
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={!!editingContract} onOpenChange={() => setEditingContract(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Update contract financial details
            </DialogDescription>
          </DialogHeader>
          {editingContract && (
            <div className="space-y-4">
              <div>
                <Label>Loan Percentage (%)</Label>
                <Input
                  type="number"
                  value={editingContract.loanPercentage}
                  onChange={(e) =>
                    setEditingContract({ ...editingContract, loanPercentage: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>LTV (%)</Label>
                <Input
                  type="number"
                  value={editingContract.ltv}
                  onChange={(e) =>
                    setEditingContract({ ...editingContract, ltv: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Penalty After Due Date (%)</Label>
                <Input
                  type="number"
                  value={editingContract.penaltyAfterDueDate}
                  onChange={(e) =>
                    setEditingContract({ ...editingContract, penaltyAfterDueDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Validity Date</Label>
                <Input
                  type="date"
                  value={editingContract.validityDate}
                  onChange={(e) =>
                    setEditingContract({ ...editingContract, validityDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Trip Stage</Label>
                <Select
                  value={editingContract.tripStage}
                  onValueChange={(value) =>
                    setEditingContract({ ...editingContract, tripStage: value })
                  }
                >
                  <SelectTrigger>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContract(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateContract} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contract Confirmation Dialog */}
      <Dialog open={!!deletingContractId} onOpenChange={() => setDeletingContractId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contract</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contract? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingContractId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingContractId && handleDeleteSavedContract(deletingContractId)}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top-Up Dialog */}
      <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Money to Wallet</DialogTitle>
            <DialogDescription>
              Transfer money to LogiFin bank account and upload transaction screenshot
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Bank Details</AlertTitle>
              <AlertDescription className="text-sm space-y-1">
                <div>Account Name: LogiFin Pvt Ltd</div>
                <div>Account Number: 1234567890</div>
                <div>IFSC Code: HDFC0001234</div>
                <div>Bank: HDFC Bank</div>
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="topup-amount">Amount (Minimum ₹1,000)</Label>
              <Input
                id="topup-amount"
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="transaction-screenshot">Transaction Screenshot</Label>
              <Input
                id="transaction-screenshot"
                type="file"
                accept="image/*"
                onChange={handleTransactionImageChange}
              />
              {transactionImage && (
                <img
                  src={transactionImage}
                  alt="Transaction"
                  className="mt-2 max-h-40 rounded border"
                />
              )}
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Processing time: 24-48 hours. You'll receive a notification once funds are credited.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopUpDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTopUp} disabled={isProcessing}>
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw from Wallet</DialogTitle>
            <DialogDescription>
              Withdraw funds to your registered bank account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Available Balance</Label>
              <div className="text-2xl font-bold">{formatCurrency(walletData?.balance || 0)}</div>
            </div>
            <div>
              <Label htmlFor="withdraw-amount">Amount (Minimum ₹100)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="bank-select">Select Bank Account</Label>
              <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                <SelectTrigger id="bank-select">
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.bankName} - ****{bank.accountNumber.slice(-4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={isProcessing}>
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bank Dialog */}
      <Dialog open={addBankDialogOpen} onOpenChange={setAddBankDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Add a new bank account for withdrawals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="account-holder">Account Holder Name</Label>
              <Input
                id="account-holder"
                value={bankForm.accountHolderName}
                onChange={(e) =>
                  setBankForm({ ...bankForm, accountHolderName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                value={bankForm.accountNumber}
                onChange={(e) =>
                  setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })
                }
                maxLength={18}
              />
            </div>
            <div>
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input
                id="ifsc"
                value={bankForm.ifscCode}
                onChange={(e) =>
                  setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })
                }
                maxLength={11}
              />
            </div>
            <div>
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input
                id="bank-name"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="branch">Branch Name</Label>
              <Input
                id="branch"
                value={bankForm.branchName}
                onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="account-type">Account Type</Label>
              <Select
                value={bankForm.accountType}
                onValueChange={(value: 'savings' | 'current') =>
                  setBankForm({ ...bankForm, accountType: value })
                }
              >
                <SelectTrigger id="account-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBankDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBank}>Add Bank Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TrustAccountPage;
