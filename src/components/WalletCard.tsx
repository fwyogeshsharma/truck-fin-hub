import { useState } from 'react';
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
import { Wallet as WalletIcon, Plus, ArrowUpCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { data } from '@/lib/data';

interface WalletCardProps {
  userId: string;
  showDetails?: boolean;
  onBalanceUpdate?: () => void;
}

const WalletCard = ({ userId, showDetails = true, onBalanceUpdate }: WalletCardProps) => {
  const { toast } = useToast();
  const wallet = data.getWallet(userId);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

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

    // Simulate payment processing
    setIsProcessing(true);

    setTimeout(() => {
      // Update wallet balance
      data.updateWallet(userId, {
        balance: wallet.balance + amount,
      });

      // Create transaction record
      data.createTransaction({
        userId,
        type: 'credit',
        amount,
        category: 'payment',
        description: 'Wallet top-up via payment gateway',
        balanceAfter: wallet.balance + amount,
      });

      toast({
        title: 'Payment Successful!',
        description: `₹${(amount / 1000).toFixed(0)}K added to your wallet`,
      });

      setIsProcessing(false);
      setTopUpDialogOpen(false);
      setTopUpAmount('');

      // Notify parent component of balance update
      if (onBalanceUpdate) {
        onBalanceUpdate();
      }
    }, 2000); // 2 second simulated payment processing
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
            <Button
              size="sm"
              onClick={() => setTopUpDialogOpen(true)}
              className="bg-gradient-primary"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Money
            </Button>
          </div>
          <CardDescription>Manage your investment wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available Balance */}
          <div className="bg-gradient-primary p-6 rounded-lg text-primary-foreground">
            <p className="text-sm opacity-90 mb-1">Available Balance</p>
            <p className="text-4xl font-bold">₹{(availableBalance / 100000).toFixed(1)}L</p>
            <p className="text-sm opacity-75 mt-2">₹{availableBalance.toLocaleString('en-IN')}</p>
          </div>

          {showDetails && (
            <div className="grid grid-cols-2 gap-4">
              {/* Locked in Escrow */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">In Escrow</p>
                <p className="text-lg font-semibold">₹{(lockedAmount / 1000).toFixed(0)}K</p>
              </div>

              {/* Total Invested */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
                <p className="text-lg font-semibold">₹{(totalInvested / 100000).toFixed(1)}L</p>
              </div>

              {/* Total Returns */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Total Returns</p>
                <p className="text-lg font-semibold text-green-600">₹{(totalReturns / 1000).toFixed(0)}K</p>
              </div>

              {/* Net Worth */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Net Worth</p>
                <p className="text-lg font-semibold">
                  ₹{((availableBalance + lockedAmount + totalInvested) / 100000).toFixed(1)}L
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top-Up Dialog */}
      <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              Add Money to Wallet
            </DialogTitle>
            <DialogDescription>
              Top up your wallet to invest in more opportunities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Amount Selection */}
            <div>
              <Label className="text-sm mb-2 block">Quick Select</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setTopUpAmount(amount.toString())}
                    className={topUpAmount === amount.toString() ? 'border-primary bg-primary/10' : ''}
                  >
                    ₹{(amount / 1000).toFixed(0)}K
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
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
              <p className="text-xs text-muted-foreground mt-1">
                Min: ₹1,000 | Max: ₹1,00,00,000
              </p>
            </div>

            {/* Payment Method Info */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Payment Gateway</p>
              <p className="text-xs text-muted-foreground">
                This is a simulated payment system. In production, this would integrate with payment gateways like Razorpay, PayU, or bank UPI.
              </p>
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
    </>
  );
};

export default WalletCard;
