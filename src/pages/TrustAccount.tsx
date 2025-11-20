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
import { formatCurrency, formatCurrencyCompact } from '@/lib/currency';
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
  CreditCard,
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  Info,
  Filter,
  RefreshCw,
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

  // Check if user has trust_account role
  useEffect(() => {
    if (user?.role !== 'trust_account') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // Agreement states
  const [contracts, setContracts] = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [uploadedContract, setUploadedContract] = useState<UploadedContract | null>(null);
  const [contractPreview, setContractPreview] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      fetchContracts();
      fetchRegisteredUsers();
      fetchWalletData();
      fetchTransactions();
      loadBankAccounts();
    }
  }, [user?.id]);

  // Fetch contracts
  const fetchContracts = async () => {
    try {
      const response = await apiClient.get(`/contracts?party=${user?.id}`);
      setContracts(response.data || []);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
    }
  };

  // Fetch registered users
  const fetchRegisteredUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      setRegisteredUsers(response.data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      setDataLoading(true);
      const response = await apiClient.get(`/wallet/${user?.id}`);
      if (response.data) {
        setWalletData(response.data);
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
      const response = await apiClient.get(`/transactions/${user?.id}`);
      setTransactions(response.data || []);
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

  // Handle contract file upload
  const handleContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Invalid file',
          description: 'Please upload a PDF file',
        });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setUploadedContract({
        id: Date.now().toString(),
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
        party4Name: 'LogiFin',
        party4UserId: 'logifin_platform',
        validityDate: '',
        tripStage: 'none',
        penaltyAfterDueDate: '',
      });
    }
  };

  // Save contract
  const saveContract = async () => {
    if (!uploadedContract) return;

    try {
      const formData = new FormData();
      formData.append('file', uploadedContract.file);
      formData.append('uploadedBy', user?.id || '');
      formData.append('loanPercentage', uploadedContract.loanPercentage);
      formData.append('ltv', uploadedContract.ltv);
      formData.append('contractType', uploadedContract.contractType);
      formData.append('party1UserId', uploadedContract.party1UserId);
      formData.append('party2UserId', uploadedContract.party2UserId);
      formData.append('party3UserId', uploadedContract.party3UserId);
      formData.append('party4UserId', uploadedContract.party4UserId);
      formData.append('validityDate', uploadedContract.validityDate);
      formData.append('tripStage', uploadedContract.tripStage);
      formData.append('penaltyAfterDueDate', uploadedContract.penaltyAfterDueDate);

      await apiClient.post('/contracts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: 'Success',
        description: 'Contract saved successfully',
      });

      setUploadedContract(null);
      fetchContracts();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save contract',
      });
    }
  };

  // Delete contract
  const deleteContract = async (contractId: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) return;

    try {
      await apiClient.delete(`/contracts/${contractId}`);
      toast({
        title: 'Success',
        description: 'Contract deleted successfully',
      });
      fetchContracts();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete contract',
      });
    }
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
      const formData = new FormData();
      formData.append('userId', user?.id || '');
      formData.append('amount', topUpAmount);
      formData.append('type', 'topup');
      formData.append('screenshot', transactionImageFile);

      await apiClient.post('/transaction-requests', formData);

      toast({
        title: 'Success',
        description: 'Top-up request submitted. Processing time: 24-48 hours',
      });

      setTopUpDialogOpen(false);
      setTopUpAmount('');
      setTransactionImage('');
      setTransactionImageFile(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit top-up request',
      });
    } finally {
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

    if (parseFloat(withdrawAmount) > walletData.balance) {
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
      await apiClient.post('/transaction-requests', {
        userId: user?.id,
        amount: withdrawAmount,
        type: 'withdrawal',
        bankAccountId: selectedBankId,
      });

      toast({
        title: 'Success',
        description: 'Withdrawal request submitted successfully',
      });

      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      setSelectedBankId('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit withdrawal request',
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
            {/* Upload Contract Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Agreement
                </CardTitle>
                <CardDescription>
                  Upload a new contract agreement for parties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleContractFileChange}
                    className="hidden"
                    id="contract-upload"
                  />
                  <label
                    htmlFor="contract-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-12 w-12 text-gray-400" />
                    <span className="text-sm font-medium">Click to upload PDF contract</span>
                    <span className="text-xs text-muted-foreground">Maximum file size: 10MB</span>
                  </label>
                </div>

                {uploadedContract && (
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Contract Details</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadedContract(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Loan Percentage (%)</Label>
                        <Input
                          type="number"
                          value={uploadedContract.loanPercentage}
                          onChange={(e) =>
                            setUploadedContract({ ...uploadedContract, loanPercentage: e.target.value })
                          }
                          placeholder="e.g., 80"
                        />
                      </div>
                      <div>
                        <Label>LTV (Loan to Value %)</Label>
                        <Input
                          type="number"
                          value={uploadedContract.ltv}
                          onChange={(e) =>
                            setUploadedContract({ ...uploadedContract, ltv: e.target.value })
                          }
                          placeholder="e.g., 75"
                        />
                      </div>
                      <div>
                        <Label>Penalty After Due Date (%)</Label>
                        <Input
                          type="number"
                          value={uploadedContract.penaltyAfterDueDate}
                          onChange={(e) =>
                            setUploadedContract({ ...uploadedContract, penaltyAfterDueDate: e.target.value })
                          }
                          placeholder="e.g., 2"
                        />
                      </div>
                      <div>
                        <Label>Contract Type</Label>
                        <Select
                          value={uploadedContract.contractType}
                          onValueChange={(value: any) =>
                            setUploadedContract({ ...uploadedContract, contractType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2-party">2-Party</SelectItem>
                            <SelectItem value="3-party">3-Party + LogiFin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Party 1</Label>
                        <Select
                          value={uploadedContract.party1UserId}
                          onValueChange={(value) => {
                            const selectedUser = registeredUsers.find(u => u.id === value);
                            setUploadedContract({
                              ...uploadedContract,
                              party1UserId: value,
                              party1Name: selectedUser?.name || '',
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select party 1" />
                          </SelectTrigger>
                          <SelectContent>
                            {registeredUsers
                              .filter(u => u.role !== 'trust_account' && u.role !== 'admin' && u.role !== 'super_admin')
                              .map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} ({user.role})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Party 2</Label>
                        <Select
                          value={uploadedContract.party2UserId}
                          onValueChange={(value) => {
                            const selectedUser = registeredUsers.find(u => u.id === value);
                            setUploadedContract({
                              ...uploadedContract,
                              party2UserId: value,
                              party2Name: selectedUser?.name || '',
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select party 2" />
                          </SelectTrigger>
                          <SelectContent>
                            {registeredUsers
                              .filter(u => u.role !== 'trust_account' && u.role !== 'admin' && u.role !== 'super_admin')
                              .map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} ({user.role})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {uploadedContract.contractType === '3-party' && (
                        <div>
                          <Label>Party 3</Label>
                          <Select
                            value={uploadedContract.party3UserId}
                            onValueChange={(value) => {
                              const selectedUser = registeredUsers.find(u => u.id === value);
                              setUploadedContract({
                                ...uploadedContract,
                                party3UserId: value,
                                party3Name: selectedUser?.name || '',
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select party 3" />
                            </SelectTrigger>
                            <SelectContent>
                              {registeredUsers
                                .filter(u => u.role !== 'trust_account' && u.role !== 'admin' && u.role !== 'super_admin')
                                .map(user => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name} ({user.role})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label>Validity Date</Label>
                        <Input
                          type="date"
                          value={uploadedContract.validityDate}
                          onChange={(e) =>
                            setUploadedContract({ ...uploadedContract, validityDate: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Preferred Trip Stage</Label>
                        <Select
                          value={uploadedContract.tripStage}
                          onValueChange={(value) =>
                            setUploadedContract({ ...uploadedContract, tripStage: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tripStages.map(stage => (
                              <SelectItem key={stage.value} value={stage.value}>
                                {stage.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button onClick={saveContract} className="w-full">
                      Save Contract
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Contracts Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Saved Agreements
                </CardTitle>
                <CardDescription>
                  View and manage all saved contract agreements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contracts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No contracts uploaded yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contract Type</TableHead>
                        <TableHead>Parties</TableHead>
                        <TableHead>Loan %</TableHead>
                        <TableHead>LTV %</TableHead>
                        <TableHead>Validity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell>
                            <Badge variant="outline">{contract.contractType}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {contract.party1Name}, {contract.party2Name}
                            {contract.contractType === '3-party' && `, ${contract.party3Name}`}
                          </TableCell>
                          <TableCell>{contract.loanPercentage}%</TableCell>
                          <TableCell>{contract.ltv}%</TableCell>
                          <TableCell>
                            {new Date(contract.validityDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {contract.uploadedBy === user?.id && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteContract(contract.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6 mt-6">
            {/* Wallet Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                  <WalletIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(walletData.balance)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">In Escrow</CardTitle>
                  <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(walletData.escrowedAmount)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                  <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(walletData.totalInvested)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(walletData.totalReturns)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
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

            {/* Wallet Tabs */}
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
          </TabsContent>
        </Tabs>
      </div>

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
              <div className="text-2xl font-bold">{formatCurrency(walletData.balance)}</div>
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

      {/* View Contract Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Contract Type:</span> {selectedContract.contractType}
                </div>
                <div>
                  <span className="font-medium">Loan %:</span> {selectedContract.loanPercentage}%
                </div>
                <div>
                  <span className="font-medium">LTV:</span> {selectedContract.ltv}%
                </div>
                <div>
                  <span className="font-medium">Penalty:</span> {selectedContract.penaltyAfterDueDate}%
                </div>
                <div>
                  <span className="font-medium">Validity:</span>{' '}
                  {new Date(selectedContract.validityDate).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Trip Stage:</span> {selectedContract.tripStage}
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Parties:</div>
                <div className="text-sm">
                  <div>Party 1: {selectedContract.party1Name}</div>
                  <div>Party 2: {selectedContract.party2Name}</div>
                  {selectedContract.contractType === '3-party' && (
                    <div>Party 3: {selectedContract.party3Name}</div>
                  )}
                  <div>Party 4: LogiFin (Facilitator)</div>
                </div>
              </div>
              {selectedContract.fileUrl && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={selectedContract.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download Contract
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TrustAccountPage;
