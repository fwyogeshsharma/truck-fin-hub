import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet as WalletIcon, Plus, ArrowUpCircle, ArrowDownCircle, Loader2, Building2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { data, type Wallet, type BankAccount } from '@/lib/data';
import { formatCurrency, formatCurrencyCompact } from '@/lib/currency';
import { apiClient } from '@/api/client';

interface WalletCardProps {
  userId: string;
  showDetails?: boolean;
  onBalanceUpdate?: () => void;
}

const WalletCard = ({ userId, showDetails = true, onBalanceUpdate }: WalletCardProps) => {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<Wallet>({
    userId,
    balance: 0,
    lockedAmount: 0,
    escrowedAmount: 0,
    totalInvested: 0,
    totalReturns: 0,
  });
  const [primaryBankAccount, setPrimaryBankAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [bankAccountDialogOpen, setBankAccountDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionImage, setTransactionImage] = useState<string>('');
  const [transactionImageFile, setTransactionImageFile] = useState<File | null>(null);

  // Bank account states
  const [bankAccountForm, setBankAccountForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountType: 'savings' as 'savings' | 'current',
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [walletData, bankAccountData] = await Promise.all([
          data.getWallet(userId),
          data.getPrimaryBankAccount(userId),
        ]);
        setWallet(walletData);
        setPrimaryBankAccount(bankAccountData);
      } catch (error) {
        console.error('Failed to load wallet data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  const hasBankAccount = primaryBankAccount !== null;

  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

  const handleAddBankAccount = async () => {
    if (!bankAccountForm.accountHolderName || !bankAccountForm.accountNumber ||
        !bankAccountForm.ifscCode || !bankAccountForm.bankName) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill all required fields',
      });
      return;
    }

    try {
      const newAccount = await data.createBankAccount({
        userId,
        ...bankAccountForm,
        isPrimary: true,
      });

      setPrimaryBankAccount(newAccount);

      toast({
        title: 'Bank Account Added!',
        description: 'Your bank account has been linked successfully',
      });

      setBankAccountDialogOpen(false);
      setBankAccountForm({
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountType: 'savings',
      });

      // Refresh component
      if (onBalanceUpdate) {
        onBalanceUpdate();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add bank account',
      });
    }
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

    if (amount > 10000000) {
      toast({
        variant: 'destructive',
        title: 'Maximum Amount Exceeded',
        description: 'Maximum top-up amount is ₹1 Cr',
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

    setIsProcessing(true);

    try {
      // Create transaction request
      await apiClient.post('/transaction-requests', {
        user_id: userId,
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

      // Notify parent component
      if (onBalanceUpdate) {
        onBalanceUpdate();
      }
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

    if (amount < 1000) {
      toast({
        variant: 'destructive',
        title: 'Minimum Amount Required',
        description: 'Minimum withdrawal amount is ₹1,000',
      });
      return;
    }

    if (amount > wallet.balance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: 'You cannot withdraw more than your available balance',
      });
      return;
    }

    // Simulate withdrawal processing
    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const newBalance = wallet.balance - amount;

        // Update wallet balance
        const updatedWallet = await data.updateWallet(userId, {
          balance: newBalance,
        });

        // Create transaction record
        await data.createTransaction({
          userId,
          type: 'debit',
          amount,
          category: 'withdrawal',
          description: 'Wallet withdrawal to bank account',
          balanceAfter: newBalance,
        });

        setWallet(updatedWallet);

        toast({
          title: 'Withdrawal Successful!',
          description: `${formatCurrency(amount)} withdrawn from your wallet`,
        });

        setWithdrawDialogOpen(false);
        setWithdrawAmount('');

        // Notify parent component of balance update
        if (onBalanceUpdate) {
          onBalanceUpdate();
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to withdraw money',
        });
      } finally {
        setIsProcessing(false);
      }
    }, 2000); // 2 second simulated withdrawal processing
  };

  const availableBalance = wallet.balance;
  const lockedAmount = wallet.escrowedAmount || 0;
  const totalInvested = wallet.totalInvested || 0;
  const totalReturns = wallet.totalReturns || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-primary" />
              <CardTitle>Wallet</CardTitle>
            </div>
            <div className="flex gap-2">
              {!hasBankAccount && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBankAccountDialogOpen(true)}
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  Add Bank Account
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => hasBankAccount ? setTopUpDialogOpen(true) : setBankAccountDialogOpen(true)}
                className="bg-gradient-primary"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Money
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWithdrawDialogOpen(true)}
                disabled={wallet.balance === 0 || !hasBankAccount}
              >
                <ArrowDownCircle className="h-4 w-4 mr-1" />
                Withdraw
              </Button>
            </div>
          </div>
          <CardDescription>Manage your investment wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available Balance */}
          <div className="bg-gradient-primary p-6 rounded-lg text-primary-foreground">
            <p className="text-sm opacity-90 mb-1">Available Balance</p>
            <p className="text-4xl font-bold">{formatCurrency(availableBalance)}</p>
          </div>

          {showDetails && (
            <div className="grid grid-cols-2 gap-4">
              {/* Locked in Escrow */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">In Escrow</p>
                <p className="text-lg font-semibold">{formatCurrencyCompact(lockedAmount, true)}</p>
              </div>

              {/* Total Invested */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
                <p className="text-lg font-semibold">{formatCurrencyCompact(totalInvested, true)}</p>
              </div>

              {/* Total Returns */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Total Returns</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrencyCompact(totalReturns, true)}</p>
              </div>

              {/* Net Worth */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Net Worth</p>
                <p className="text-lg font-semibold">
                  {formatCurrencyCompact(availableBalance + lockedAmount + totalInvested, true)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top-Up Dialog */}
      <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              Add Money to Wallet
            </DialogTitle>
            <DialogDescription>
              Transfer money to LogiFin bank account and submit proof
            </DialogDescription>
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
              <p className="text-xs text-muted-foreground mt-1">
                Min: ₹1,000 | Max: ₹1,00,00,000
              </p>
            </div>

            {/* Transaction Image Upload */}
            <div>
              <Label htmlFor="transactionImage">Upload Transaction Screenshot *</Label>
              <Input
                id="transactionImage"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validate file type - only allow images (check both MIME type and extension)
                    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

                    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
                    const isValidType = validImageTypes.includes(file.type.toLowerCase());
                    const isValidExtension = validExtensions.includes(fileExtension);

                    if (!isValidType || !isValidExtension) {
                      toast({
                        title: 'Invalid File Type',
                        description: 'Please upload an image file only (JPG, PNG, GIF, or WebP)',
                        variant: 'destructive',
                      });
                      e.target.value = ''; // Reset the input
                      setTransactionImage('');
                      setTransactionImageFile(null);
                      return;
                    }

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
                Upload a screenshot of your bank transaction as proof (Images only: JPG, PNG, GIF, WebP)
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

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-orange-600" />
              Withdraw Money from Wallet
            </DialogTitle>
            <DialogDescription>
              Withdraw funds to your linked bank account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Available Balance */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available Balance</span>
                <span className="text-lg font-semibold text-primary">{formatCurrencyCompact(wallet.balance, true)}</span>
              </div>
            </div>

            {/* Quick Amount Selection */}
            <div>
              <Label className="text-sm mb-2 block">Quick Select</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.filter(amt => amt <= wallet.balance).map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setWithdrawAmount(amount.toString())}
                    className={withdrawAmount === amount.toString() ? 'border-primary bg-primary/10' : ''}
                  >
                    {formatCurrencyCompact(amount, true)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <Label htmlFor="withdrawAmount">Withdrawal Amount (₹)</Label>
              <Input
                id="withdrawAmount"
                type="number"
                placeholder="Enter amount (min ₹1,000)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="1000"
                max={wallet.balance}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Min: ₹1,000 | Max: {formatCurrencyCompact(wallet.balance, true)}
              </p>
            </div>

            {/* Bank Account Info */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Bank Account</p>
              <p className="text-xs text-muted-foreground">
                This is a simulated withdrawal system. In production, this would transfer funds to your linked bank account via IMPS/NEFT/RTGS.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={isProcessing} variant="destructive">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                  Withdraw {withdrawAmount ? formatCurrencyCompact(parseFloat(withdrawAmount), true) : '₹0'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bank Account Dialog */}
      <Dialog open={bankAccountDialogOpen} onOpenChange={setBankAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Add Bank Account
            </DialogTitle>
            <DialogDescription>
              Link your bank account to add or withdraw money
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Alert message */}
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <p className="text-xs text-orange-800">
                You need to add a bank account before you can add or withdraw money from your wallet
              </p>
            </div>

            {/* Account Holder Name */}
            <div>
              <Label htmlFor="accountHolderName">Account Holder Name *</Label>
              <Input
                id="accountHolderName"
                placeholder="As per bank records"
                value={bankAccountForm.accountHolderName}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountHolderName: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Account Number */}
            <div>
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                type="text"
                placeholder="Enter account number"
                value={bankAccountForm.accountNumber}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* IFSC Code */}
            <div>
              <Label htmlFor="ifscCode">IFSC Code *</Label>
              <Input
                id="ifscCode"
                placeholder="e.g., SBIN0001234"
                value={bankAccountForm.ifscCode}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, ifscCode: e.target.value.toUpperCase() })}
                className="mt-1"
              />
            </div>

            {/* Bank Name */}
            <div>
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                placeholder="e.g., State Bank of India"
                value={bankAccountForm.bankName}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, bankName: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Account Type */}
            <div>
              <Label htmlFor="accountType">Account Type *</Label>
              <select
                id="accountType"
                value={bankAccountForm.accountType}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountType: e.target.value as 'savings' | 'current' })}
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="savings">Savings Account</option>
                <option value="current">Current Account</option>
              </select>
            </div>

            {/* Note */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> This is a simulated system. In production, bank account verification would be done through penny drop or other secure methods.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBankAccountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBankAccount} className="bg-gradient-primary">
              <Building2 className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletCard;
