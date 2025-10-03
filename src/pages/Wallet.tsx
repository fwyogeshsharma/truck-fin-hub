import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { data } from '@/lib/data';
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

  const [walletData, setWalletData] = useState(data.getWallet(user?.id || 'l1'));
  const [transactions, setTransactions] = useState(data.getTransactions(user?.id || 'l1'));
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Dialogs
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [addBankDialogOpen, setAddBankDialogOpen] = useState(false);

  // Form states
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
    if (!user) {
      navigate('/auth');
      return;
    }
    loadBankAccounts();
  }, [user, navigate]);

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

  const refreshData = () => {
    setWalletData(data.getWallet(user?.id || 'l1'));
    setTransactions(data.getTransactions(user?.id || 'l1'));
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

    setIsProcessing(true);

    setTimeout(() => {
      data.updateWallet(user?.id || 'l1', {
        balance: walletData.balance + amount,
      });

      data.createTransaction({
        userId: user?.id || 'l1',
        type: 'credit',
        amount,
        category: 'payment',
        description: 'Wallet top-up via payment gateway',
        balanceAfter: walletData.balance + amount,
      });

      toast({
        title: 'Payment Successful!',
        description: `₹${(amount / 1000).toFixed(0)}K added to your wallet`,
      });

      setIsProcessing(false);
      setTopUpDialogOpen(false);
      setTopUpAmount('');
      refreshData();
    }, 2000);
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

    const selectedBank = bankAccounts.find((b) => b.id === selectedBankId);

    setIsProcessing(true);

    setTimeout(() => {
      data.updateWallet(user?.id || 'l1', {
        balance: walletData.balance - amount,
      });

      data.createTransaction({
        userId: user?.id || 'l1',
        type: 'debit',
        amount,
        category: 'payment',
        description: `Withdrawal to ${selectedBank?.bankName} A/C ${selectedBank?.accountNumber.slice(-4)}`,
        balanceAfter: walletData.balance - amount,
      });

      toast({
        title: 'Withdrawal Successful!',
        description: `₹${(amount / 1000).toFixed(0)}K withdrawn to your bank account`,
      });

      setIsProcessing(false);
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      setSelectedBankId('');
      refreshData();
    }, 2000);
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

  return (
    <DashboardLayout role={user.role}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallet</h1>
            <p className="text-muted-foreground mt-1">Manage your funds and transactions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setTopUpDialogOpen(true)} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Money
            </Button>
            <Button
              variant="outline"
              onClick={() => setWithdrawDialogOpen(true)}
              disabled={walletData.balance === 0}
            >
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </div>

        {/* Wallet Balance Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">₹{(walletData.balance / 100000).toFixed(2)}L</p>
              <p className="text-xs text-muted-foreground mt-1">
                ₹{walletData.balance.toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">In Escrow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{((walletData.escrowedAmount || 0) / 1000).toFixed(0)}K</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{(walletData.totalInvested / 100000).toFixed(1)}L</p>
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
          <TabsContent value="ledger" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>All your wallet transactions</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-transparent border-none outline-none"
                      >
                        <option value="all">All</option>
                        <option value="credit">Credit</option>
                        <option value="debit">Debit</option>
                      </select>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((txn) => (
                          <TableRow key={txn.id}>
                            <TableCell>
                              {new Date(txn.timestamp).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                              <br />
                              <span className="text-xs text-muted-foreground">
                                {new Date(txn.timestamp).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{txn.description}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {txn.category}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {txn.type === 'credit' ? (
                                <Badge className="bg-green-600">
                                  <ArrowUpCircle className="h-3 w-3 mr-1" />
                                  Credit
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <ArrowDownCircle className="h-3 w-3 mr-1" />
                                  Debit
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`font-semibold ${
                                  txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {txn.type === 'credit' ? '+' : '-'}₹
                                {(txn.amount / 1000).toFixed(txn.amount >= 100000 ? 0 : 1)}
                                {txn.amount >= 100000 ? 'L' : 'K'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{(txn.balanceAfter / 1000).toFixed(0)}K
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Accounts Tab */}
          <TabsContent value="banks" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Saved Bank Accounts</CardTitle>
                    <CardDescription>Manage your bank accounts for withdrawals</CardDescription>
                  </div>
                  <Button onClick={() => setAddBankDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{bank.bankName}</h4>
                                {bank.isPrimary && (
                                  <Badge className="bg-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Primary
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{bank.branchName}</p>
                              <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Account Holder:</span>
                                  <p className="font-medium">{bank.accountHolderName}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Account Number:</span>
                                  <p className="font-medium font-mono">
                                    XXXX XXXX {bank.accountNumber.slice(-4)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">IFSC Code:</span>
                                  <p className="font-medium font-mono">{bank.ifscCode}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Account Type:</span>
                                  <p className="font-medium capitalize">{bank.accountType}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!bank.isPrimary && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetPrimary(bank.id)}
                              >
                                Set as Primary
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBank(bank.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-primary" />
                Add Money to Wallet
              </DialogTitle>
              <DialogDescription>Top up your wallet to invest in opportunities</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm mb-2 block">Quick Select</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[10000, 25000, 50000, 100000, 250000, 500000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setTopUpAmount(amount.toString())}
                      className={topUpAmount === amount.toString() ? 'border-primary bg-primary/10' : ''}
                    >
                      ₹{(amount / 1000).toFixed(0)}K
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="topUpAmount">Enter Amount (₹)</Label>
                <Input
                  id="topUpAmount"
                  type="number"
                  placeholder="Enter amount (min ₹1,000)"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  min="1000"
                  max="10000000"
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTopUpDialogOpen(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleTopUp} disabled={isProcessing} className="bg-gradient-primary">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add ₹{topUpAmount ? (parseFloat(topUpAmount) / 1000).toFixed(0) + 'K' : '0'}
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
                Withdraw Money
              </DialogTitle>
              <DialogDescription>Transfer money from wallet to your bank account</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">₹{(walletData.balance / 1000).toFixed(0)}K</p>
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
                      Min: ₹100 | Max: ₹{(walletData.balance / 1000).toFixed(0)}K
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
                variant="destructive"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="h-4 w-4 mr-2" />
                    Withdraw ₹{withdrawAmount ? (parseFloat(withdrawAmount) / 1000).toFixed(0) + 'K' : '0'}
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
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                  placeholder="As per bank records"
                />
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={bankForm.ifscCode}
                  onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="e.g., SBIN0001234"
                  maxLength={11}
                />
              </div>

              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="e.g., State Bank of India"
                />
              </div>

              <div>
                <Label htmlFor="branchName">Branch Name</Label>
                <Input
                  id="branchName"
                  value={bankForm.branchName}
                  onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                  placeholder="e.g., Connaught Place, New Delhi"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="accountType">Account Type</Label>
                <select
                  id="accountType"
                  value={bankForm.accountType}
                  onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value as 'savings' | 'current' })}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
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
