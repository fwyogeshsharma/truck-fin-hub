import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { data } from '@/lib/data';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatCurrencyCompact } from '@/lib/currency';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Building2,
  CreditCard,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
  Download,
  Filter,
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

const BANK_ACCOUNTS_KEY = 'logistics_bank_accounts';

const WalletPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();

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

  // Dialogs
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [addBankDialogOpen, setAddBankDialogOpen] = useState(false);

  // Form states
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

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => {
    if (!user?.id) {
      navigate('/auth');
      return;
    }

    const loadData = async () => {
      try {
        const [wallet, txns] = await Promise.all([
          data.getWallet(user.id),
          data.getTransactions(user.id)
        ]);

        setWalletData(wallet);
        setTransactions(txns);
        loadBankAccounts();
      } catch (error) {
        console.error('Failed to load wallet data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user?.id, navigate]);

  const loadBankAccounts = () => {
    const stored = localStorage.getItem(`${BANK_ACCOUNTS_KEY}_${user?.id}`);
    if (stored) {
      setBankAccounts(JSON.parse(stored));
    }
  };

  const saveBankAccounts = (accounts: BankAccount[]) => {
    localStorage.setItem(`${BANK_ACCOUNTS_KEY}_${user?.id}`, JSON.stringify(accounts));
    setBankAccounts(accounts);
  };

  const refreshData = async () => {
    if (!user?.id) return;

    const [wallet, txns] = await Promise.all([
      data.getWallet(user.id),
      data.getTransactions(user.id)
    ]);
    setWalletData(wallet);
    setTransactions(txns);
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);

    if (!amount || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than ₹0',
      });
      return;
    }

    if (amount < 1000) {
      toast({
        variant: 'destructive',
        title: 'Minimum Amount Required',
        description: 'Minimum top-up amount is ₹1,000',
      });
      return;
    }

    if (!transactionImage) {
      toast({
        variant: 'destructive',
        title: 'Transaction Image Required',
        description: 'Please upload a screenshot of your bank transaction',
      });
      return;
    }

    if (!user?.id) return;

    setIsProcessing(true);

    try {
      // Create transaction request
      await apiClient.post('/transaction-requests', {
        user_id: user.id,
        request_type: 'add_money',
        amount,
        transaction_image_url: transactionImage,
      });

      toast({
        title: 'Request Submitted!',
        description: 'Your add money request has been submitted for verification. You will receive the funds within 24-48 hours.',
      });

      setIsProcessing(false);
      setTopUpDialogOpen(false);
      setTopUpAmount('');
      setTransactionImage('');
      setTransactionImageFile(null);
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: 'Failed to submit add money request. Please try again.',
      });
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than ₹0',
      });
      return;
    }

    if (amount > walletData.balance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: 'Withdrawal amount exceeds available balance',
      });
      return;
    }

    if (amount < 100) {
      toast({
        variant: 'destructive',
        title: 'Minimum Amount Required',
        description: 'Minimum withdrawal amount is ₹100',
      });
      return;
    }

    if (!selectedBankId) {
      toast({
        variant: 'destructive',
        title: 'Select Bank Account',
        description: 'Please select a bank account for withdrawal',
      });
      return;
    }

    if (!user?.id) return;

    const selectedBank = bankAccounts.find((b) => b.id === selectedBankId);

    setIsProcessing(true);

    try {
      // Create withdrawal request
      await apiClient.post('/transaction-requests', {
        user_id: user.id,
        request_type: 'withdrawal',
        amount,
        bank_account_id: selectedBank?.id,
        bank_account_number: selectedBank?.accountNumber,
        bank_ifsc_code: selectedBank?.ifscCode,
        bank_name: selectedBank?.bankName,
      });

      toast({
        title: 'Request Submitted!',
        description: 'Your withdrawal request has been submitted. Funds will be transferred to your bank account within 24-48 hours.',
      });

      setIsProcessing(false);
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      setSelectedBankId('');
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: 'Failed to submit withdrawal request. Please try again.',
      });
      setIsProcessing(false);
    }
  };

  const handleAddBank = () => {
    if (
      !bankForm.accountHolderName ||
      !bankForm.accountNumber ||
      !bankForm.ifscCode ||
      !bankForm.bankName ||
      !bankForm.branchName
    ) {
      toast({
        variant: 'destructive',
        title: 'All Fields Required',
        description: 'Please fill in all bank account details',
      });
      return;
    }

    // Validate IFSC code format (11 characters)
    if (bankForm.ifscCode.length !== 11) {
      toast({
        variant: 'destructive',
        title: 'Invalid IFSC Code',
        description: 'IFSC code must be 11 characters',
      });
      return;
    }

    // Validate account number (9-18 digits)
    if (bankForm.accountNumber.length < 9 || bankForm.accountNumber.length > 18) {
      toast({
        variant: 'destructive',
        title: 'Invalid Account Number',
        description: 'Account number must be between 9-18 digits',
      });
      return;
    }

    const newAccount: BankAccount = {
      id: Date.now().toString(),
      ...bankForm,
      isPrimary: bankAccounts.length === 0,
      addedAt: new Date().toISOString(),
    };

    saveBankAccounts([...bankAccounts, newAccount]);

    toast({
      title: 'Bank Account Added',
      description: 'Your bank account has been added successfully',
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

  const handleDeleteBank = (id: string) => {
    const updatedAccounts = bankAccounts.filter((b) => b.id !== id);
    // Set a new primary if we deleted the primary account
    if (updatedAccounts.length > 0 && !updatedAccounts.some((b) => b.isPrimary)) {
      updatedAccounts[0].isPrimary = true;
    }
    saveBankAccounts(updatedAccounts);
    toast({
      title: 'Bank Account Removed',
      description: 'Bank account has been deleted',
    });
  };

  const handleSetPrimary = (id: string) => {
    const updatedAccounts = bankAccounts.map((b) => ({
      ...b,
      isPrimary: b.id === id,
    }));
    saveBankAccounts(updatedAccounts);
    toast({
      title: 'Primary Account Updated',
      description: 'Default bank account has been changed',
    });
  };

  const filteredTransactions = transactions.filter((txn) => {
    if (filterType === 'all') return true;
    return txn.type === filterType;
  });

  const primaryBank = bankAccounts.find((b) => b.isPrimary);

  if (!user) return null;

  if (dataLoading) {
    return (
      <DashboardLayout role={user.role}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading wallet...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user.role}>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">Wallet</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your funds and transactions</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {/* Add Money button - now available for all roles including transporter */}
            <Button onClick={() => setTopUpDialogOpen(true)} className="bg-gradient-primary h-9 sm:h-10 text-xs sm:text-sm touch-target flex-1 sm:flex-none">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Add Money
            </Button>
            <Button
              variant="outline"
              onClick={() => setWithdrawDialogOpen(true)}
              disabled={walletData.balance === 0}
              className="h-9 sm:h-10 text-xs sm:text-sm touch-target flex-1 sm:flex-none"
            >
              <ArrowDownCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Withdraw
            </Button>
          </div>
        </div>

        {/* Wallet Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="sm:col-span-2">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Available Balance</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <p className="text-2xl sm:text-3xl font-bold truncate">{formatCurrency(walletData.balance)}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                ₹{walletData.balance.toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">In Escrow</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <p className="text-xl sm:text-2xl font-bold truncate">{formatCurrencyCompact(walletData.escrowedAmount || 0, true)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Invested</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <p className="text-xl sm:text-2xl font-bold truncate">{formatCurrencyCompact(walletData.totalInvested, true)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Ledger and Bank Accounts */}
        <Tabs defaultValue="ledger" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="ledger">Transaction Ledger</TabsTrigger>
            <TabsTrigger value="banks">Bank Accounts</TabsTrigger>
          </TabsList>

          {/* Ledger Tab */}
          <TabsContent value="ledger" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-lg md:text-xl truncate">Transaction History</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">All your wallet transactions</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm touch-target">
                      <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-transparent border-none outline-none text-xs sm:text-sm"
                      >
                        <option value="all">All</option>
                        <option value="credit">Credit</option>
                        <option value="debit">Debit</option>
                      </select>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm touch-target">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-t">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                        <TableHead className="min-w-[100px] sm:min-w-[120px] pl-3 sm:pl-4">Date</TableHead>
                        <TableHead className="min-w-[150px] sm:min-w-[200px]">Description</TableHead>
                        <TableHead className="min-w-[90px] sm:min-w-[100px]">Type</TableHead>
                        <TableHead className="text-right min-w-[90px] sm:min-w-[110px]">Amount</TableHead>
                        <TableHead className="text-right min-w-[90px] sm:min-w-[120px] pr-3 sm:pr-4">Balance After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((txn) => (
                            <TableRow key={txn.id}>
                              <TableCell className="min-w-[100px] sm:min-w-[120px] pl-3 sm:pl-4 py-3">
                                <div className="whitespace-nowrap text-xs sm:text-sm">
                                  {new Date(txn.timestamp).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {new Date(txn.timestamp).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </TableCell>
                              <TableCell className="min-w-[150px] sm:min-w-[200px] max-w-[200px] sm:max-w-[300px] py-3">
                                <div className="space-y-1">
                                  <p className="font-medium text-xs sm:text-sm break-words line-clamp-2">{txn.description}</p>
                                  <Badge variant="outline" className="text-xs truncate max-w-full">
                                    <span className="truncate">{txn.category}</span>
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[90px] sm:min-w-[100px] py-3">
                                {txn.type === 'credit' ? (
                                  <Badge className="bg-green-600 text-xs whitespace-nowrap">
                                    <ArrowUpCircle className="h-3 w-3 mr-1 shrink-0" />
                                    Credit
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs whitespace-nowrap">
                                    <ArrowDownCircle className="h-3 w-3 mr-1 shrink-0" />
                                    Debit
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right min-w-[90px] sm:min-w-[110px] py-3">
                                <span
                                  className={`font-semibold text-xs sm:text-sm whitespace-nowrap ${
                                    txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  {txn.type === 'credit' ? '+' : '-'}{formatCurrencyCompact(txn.amount, true)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-medium min-w-[90px] sm:min-w-[120px] pr-3 sm:pr-4 py-3">
                                <span className="text-xs sm:text-sm whitespace-nowrap">
                                  {formatCurrencyCompact(txn.balanceAfter, true)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Accounts Tab */}
          <TabsContent value="banks" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-lg md:text-xl truncate">Saved Bank Accounts</CardTitle>
                    <CardDescription>Manage your bank accounts for withdrawals</CardDescription>
                  </div>
                  <Button onClick={() => setAddBankDialogOpen(true)} className="h-9 sm:h-10 text-xs sm:text-sm touch-target w-full sm:w-auto">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Add Bank Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                {bankAccounts.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bank accounts added yet</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setAddBankDialogOpen(true)}
                    >
                      Add Your First Bank Account
                    </Button>
                  </div>
                ) : (
                  bankAccounts.map((bank) => (
                    <Card key={bank.id} className={bank.isPrimary ? 'border-2 border-primary' : ''}>
                      <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1 w-full">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <h4 className="font-semibold text-sm sm:text-base truncate">{bank.bankName}</h4>
                                {bank.isPrimary && (
                                  <Badge className="bg-green-600 w-fit shrink-0">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Primary
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{bank.branchName}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-xs sm:text-sm">
                                <div className="min-w-0">
                                  <span className="text-muted-foreground">Account Holder:</span>
                                  <p className="font-medium truncate">{bank.accountHolderName}</p>
                                </div>
                                <div className="min-w-0">
                                  <span className="text-muted-foreground">Account Number:</span>
                                  <p className="font-medium font-mono truncate">
                                    XXXX XXXX {bank.accountNumber.slice(-4)}
                                  </p>
                                </div>
                                <div className="min-w-0">
                                  <span className="text-muted-foreground">IFSC Code:</span>
                                  <p className="font-medium font-mono truncate">{bank.ifscCode}</p>
                                </div>
                                <div className="min-w-0">
                                  <span className="text-muted-foreground">Account Type:</span>
                                  <p className="font-medium capitalize truncate">{bank.accountType}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                            {!bank.isPrimary && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetPrimary(bank.id)}
                                className="text-xs sm:text-sm h-8 sm:h-9 flex-1 sm:flex-none whitespace-nowrap"
                              >
                                Set as Primary
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBank(bank.id)}
                              className="h-8 sm:h-9 w-auto px-2 sm:px-3"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Top-Up Dialog */}
        <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-primary" />
                Add Money to Wallet
              </DialogTitle>
              <DialogDescription>Transfer money to LogiFin bank account and submit proof</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* LogiFin Bank Details */}
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    LogiFin Bank Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Account Holder Name</p>
                      <p className="font-semibold">LogiFin Private Limited</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Account Number</p>
                      <p className="font-semibold font-mono">1234567890123456</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">IFSC Code</p>
                      <p className="font-semibold font-mono">SBIN0001234</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bank Name</p>
                      <p className="font-semibold">State Bank of India</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">⏰ Processing Time: 24-48 hours</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Your request will be verified by our team within 24-48 hours</p>
                  </div>
                </CardContent>
              </Card>

              {/* Deposited Amount */}
              <div>
                <Label htmlFor="topUpAmount">Deposited Amount (₹)</Label>
                <Input
                  id="topUpAmount"
                  type="number"
                  placeholder="Enter deposited amount (min ₹1,000)"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  min="1000"
                  max="10000000"
                  className="mt-1"
                />
              </div>

              {/* Transaction Image Upload */}
              <div>
                <Label htmlFor="transactionImage">Upload Transaction Screenshot *</Label>
                <Input
                  id="transactionImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setTransactionImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setTransactionImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a screenshot of your bank transaction as proof
                </p>
                {transactionImage && (
                  <div className="mt-3">
                    <img src={transactionImage} alt="Transaction proof" className="max-w-full h-auto rounded-lg border" />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setTopUpDialogOpen(false);
                setTransactionImage('');
                setTransactionImageFile(null);
              }} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleTopUp} disabled={isProcessing} className="bg-gradient-primary">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdraw Dialog */}
        <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-primary" />
                Request Withdrawal
              </DialogTitle>
              <DialogDescription>Submit a withdrawal request. Funds will be transferred to your bank account within 24-48 hours after verification.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">{formatCurrencyCompact(walletData.balance, true)}</p>
              </div>

              {bankAccounts.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">No Bank Account Added</p>
                    <p className="text-xs text-yellow-800 mt-1">
                      Please add a bank account first to withdraw funds
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => {
                        setWithdrawDialogOpen(false);
                        setAddBankDialogOpen(true);
                      }}
                    >
                      Add Bank Account
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="bankSelect">Select Bank Account</Label>
                    <select
                      id="bankSelect"
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    >
                      <option value="">-- Select Bank --</option>
                      {bankAccounts.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bankName} - {bank.accountNumber.slice(-4)} {bank.isPrimary ? '(Primary)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="withdrawAmount">Withdrawal Amount (₹)</Label>
                    <Input
                      id="withdrawAmount"
                      type="number"
                      placeholder="Enter amount (min ₹100)"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min="100"
                      max={walletData.balance}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: ₹100 | Max: {formatCurrencyCompact(walletData.balance, true)}
                    </p>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setWithdrawDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={isProcessing || bankAccounts.length === 0}
                className="bg-gradient-primary"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Bank Account Dialog */}
        <Dialog open={addBankDialogOpen} onOpenChange={setAddBankDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Add Bank Account
              </DialogTitle>
              <DialogDescription>Add your bank account details for withdrawals</DialogDescription>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="accountHolderName">
                  Account Holder Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountHolderName"
                  value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                  placeholder="As per bank records"
                  required
                />
              </div>

              <div>
                <Label htmlFor="accountNumber">
                  Account Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountNumber"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="ifscCode">
                  IFSC Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ifscCode"
                  value={bankForm.ifscCode}
                  onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="e.g., SBIN0001234"
                  maxLength={11}
                  required
                />
              </div>

              <div>
                <Label htmlFor="bankName">
                  Bank Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bankName"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="e.g., State Bank of India"
                  required
                />
              </div>

              <div>
                <Label htmlFor="branchName">
                  Branch Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="branchName"
                  value={bankForm.branchName}
                  onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                  placeholder="e.g., Connaught Place, New Delhi"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="accountType">
                  Account Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="accountType"
                  value={bankForm.accountType}
                  onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value as 'savings' | 'current' })}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  required
                >
                  <option value="savings">Savings Account</option>
                  <option value="current">Current Account</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddBankDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBank} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Bank Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default WalletPage;
