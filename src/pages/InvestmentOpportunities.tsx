import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Package, TruckIcon, IndianRupee, Calendar, TrendingUp, CheckSquare, Square, Star, Shield, Wallet, Plus, Loader2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { auth } from "@/lib/auth";
import { data } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const InvestmentOpportunities = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const user = auth.getCurrentUser();
  const allTrips = data.getTrips();
  const trips = allTrips.filter(t => t.status === 'pending');

  const [walletData, setWalletData] = useState(data.getWallet(user?.id || 'l1'));
  const wallet = walletData;

  console.log('Total trips:', allTrips.length);
  console.log('Pending trips:', trips.length);
  console.log('Trips data:', trips);

  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [bidRate, setBidRate] = useState<number>(12);
  const [filterLoadType, setFilterLoadType] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

  // Top-up dialog states
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingInvestmentAmount, setPendingInvestmentAmount] = useState(0);

  const refreshWallet = () => {
    setWalletData(data.getWallet(user?.id || 'l1'));
  };

  const filteredTrips = trips.filter(trip => {
    const matchesLoadType = !filterLoadType || trip.loadType.toLowerCase().includes(filterLoadType.toLowerCase());
    const matchesMinAmount = !minAmount || trip.amount >= parseFloat(minAmount);
    const matchesMaxAmount = !maxAmount || trip.amount <= parseFloat(maxAmount);
    return matchesLoadType && matchesMinAmount && matchesMaxAmount;
  });

  const toggleTripSelection = (tripId: string) => {
    setSelectedTrips(prev =>
      prev.includes(tripId)
        ? prev.filter(id => id !== tripId)
        : [...prev, tripId]
    );
    setSelectedTrip(null); // Clear single selection when using multi-select
  };

  const toggleSelectAll = () => {
    if (selectedTrips.length === filteredTrips.length) {
      setSelectedTrips([]);
    } else {
      setSelectedTrips(filteredTrips.map(t => t.id));
    }
  };

  // Calculate totals for selected trips
  const selectedTripsData = filteredTrips.filter(t => selectedTrips.includes(t.id));
  const totalInvestmentAmount = selectedTripsData.reduce((sum, trip) => sum + trip.amount, 0);
  const totalExpectedReturn = totalInvestmentAmount * (bidRate / 100);

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

    // Simulate payment processing
    setIsProcessing(true);

    setTimeout(() => {
      // Update wallet balance
      data.updateWallet(user?.id || 'l1', {
        balance: wallet.balance + amount,
      });

      // Create transaction record
      data.createTransaction({
        userId: user?.id || 'l1',
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
      refreshWallet();
    }, 2000);
  };

  const handleInvest = (tripId: string) => {
    const trip = data.getTrip(tripId);
    if (!trip) return;

    const investmentAmount = trip.amount;

    // Check if balance is insufficient
    if (wallet.balance < investmentAmount) {
      setPendingInvestmentAmount(investmentAmount);
      setTopUpAmount((investmentAmount - wallet.balance).toString());
      setTopUpDialogOpen(true);
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: `You need ₹${((investmentAmount - wallet.balance) / 1000).toFixed(0)}K more to invest`,
      });
      return;
    }

    const expectedReturn = investmentAmount * (bidRate / 100);
    const maturityDays = trip.maturityDays || 30;

    // Move amount to escrow
    data.updateWallet(user?.id || 'l1', {
      balance: wallet.balance - investmentAmount,
      escrowedAmount: (wallet.escrowedAmount || 0) + investmentAmount,
    });

    refreshWallet();

    // Create escrowed investment immediately
    const escrowedInvestment = data.createInvestment({
      lenderId: user?.id || 'l1',
      tripId,
      amount: investmentAmount,
      interestRate: bidRate,
      expectedReturn,
      status: 'escrowed',
      maturityDate: new Date(Date.now() + maturityDays * 24 * 60 * 60 * 1000).toISOString(),
    });

    toast({
      title: "Bid confirmed!",
      description: `₹${(investmentAmount / 1000).toFixed(0)}K moved to escrow. Awaiting confirmation.`,
    });

    setSelectedTrip(null);

    // Simulate confirmation after 3 seconds
    setTimeout(() => {
      // Update investment status to active
      data.updateInvestment(escrowedInvestment.id, {
        status: 'active',
      });

      data.updateTrip(tripId, {
        status: 'funded',
        interestRate: bidRate,
        fundedAt: new Date().toISOString(),
        lenderId: user?.id,
        lenderName: user?.name || 'Lender',
      });

      const currentWallet = data.getWallet(user?.id || 'l1');
      data.updateWallet(user?.id || 'l1', {
        escrowedAmount: (currentWallet.escrowedAmount || 0) - investmentAmount,
        totalInvested: currentWallet.totalInvested + investmentAmount,
      });

      toast({
        title: "Investment active!",
        description: `₹${(investmentAmount / 1000).toFixed(0)}K at ${bidRate}% interest is now active`,
      });
    }, 3000);
  };

  const handleBulkInvest = () => {
    if (selectedTrips.length === 0) return;

    // Check if balance is insufficient
    if (wallet.balance < totalInvestmentAmount) {
      setPendingInvestmentAmount(totalInvestmentAmount);
      setTopUpAmount((totalInvestmentAmount - wallet.balance).toString());
      setTopUpDialogOpen(true);
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: `You need ₹${((totalInvestmentAmount - wallet.balance) / 1000).toFixed(0)}K more to invest in all selected trips`,
      });
      return;
    }

    // Move total amount to escrow
    data.updateWallet(user?.id || 'l1', {
      balance: wallet.balance - totalInvestmentAmount,
      escrowedAmount: (wallet.escrowedAmount || 0) + totalInvestmentAmount,
    });

    refreshWallet();

    // Create escrowed investments immediately
    const escrowedInvestments = selectedTrips.map(tripId => {
      const trip = data.getTrip(tripId);
      if (!trip) return null;

      const investmentAmount = trip.amount;
      const expectedReturn = investmentAmount * (bidRate / 100);
      const maturityDays = trip.maturityDays || 30;

      return data.createInvestment({
        lenderId: user?.id || 'l1',
        tripId,
        amount: investmentAmount,
        interestRate: bidRate,
        expectedReturn,
        status: 'escrowed',
        maturityDate: new Date(Date.now() + maturityDays * 24 * 60 * 60 * 1000).toISOString(),
      });
    }).filter(Boolean);

    toast({
      title: "Bulk bids confirmed!",
      description: `${selectedTrips.length} trips • ₹${(totalInvestmentAmount / 1000).toFixed(0)}K moved to escrow`,
    });

    // Simulate confirmation after 3 seconds
    setTimeout(() => {
      escrowedInvestments.forEach((investment) => {
        if (!investment) return;

        // Update investment status to active
        data.updateInvestment(investment.id, {
          status: 'active',
        });

        data.updateTrip(investment.tripId, {
          status: 'funded',
          interestRate: bidRate,
          fundedAt: new Date().toISOString(),
          lenderId: user?.id,
          lenderName: user?.name || 'Lender',
        });
      });

      const currentWallet = data.getWallet(user?.id || 'l1');
      data.updateWallet(user?.id || 'l1', {
        escrowedAmount: (currentWallet.escrowedAmount || 0) - totalInvestmentAmount,
        totalInvested: currentWallet.totalInvested + totalInvestmentAmount,
      });

      toast({
        title: "Investments active!",
        description: `${selectedTrips.length} trips at ${bidRate}% interest are now active`,
      });

      setSelectedTrips([]);
    }, 3000);
  };

  const handleResetData = () => {
    localStorage.removeItem('logistics_trips');
    window.location.reload();
  };

  return (
    <DashboardLayout role="lender">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Investment Opportunities</h1>
            <p className="text-muted-foreground mt-1">Browse and invest in available trips</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetData}>
            Reset Data
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Narrow down opportunities by your preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="loadType">Load Type</Label>
                <Input
                  id="loadType"
                  placeholder="e.g., Electronics"
                  value={filterLoadType}
                  onChange={(e) => setFilterLoadType(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="minAmount">Min Amount (₹)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maxAmount">Max Amount (₹)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  placeholder="1000000"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Investment Panel */}
        {selectedTrips.length > 0 && (
          <Card className="border-2 border-primary bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    Bulk Investment: {selectedTrips.length} trip{selectedTrips.length > 1 ? 's' : ''} selected
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bulkBidRate">Common Interest Rate (%)</Label>
                      <Input
                        id="bulkBidRate"
                        type="number"
                        value={bidRate}
                        onChange={(e) => setBidRate(parseFloat(e.target.value))}
                        min="8"
                        max="18"
                        step="0.5"
                        className="mt-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Investment:</span>
                        <span className="font-semibold">₹{(totalInvestmentAmount / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Interest Rate:</span>
                        <span className="font-semibold">{bidRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expected Return:</span>
                        <span className="font-semibold text-accent">₹{(totalExpectedReturn / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    className="bg-gradient-primary"
                    onClick={handleBulkInvest}
                    disabled={wallet.balance < totalInvestmentAmount}
                  >
                    Confirm {selectedTrips.length} Bid{selectedTrips.length > 1 ? 's' : ''}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedTrips([])}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Trips */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Available Trips ({filteredTrips.length})</h2>
              {filteredTrips.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2"
                >
                  {selectedTrips.length === filteredTrips.length ? (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4" />
                      Select All
                    </>
                  )}
                </Button>
              )}
            </div>
            <Badge variant="outline">Wallet: ₹{(wallet.balance / 100000).toFixed(1)}L</Badge>
          </div>

          {filteredTrips.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No investment opportunities match your filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredTrips.map((trip) => {
              const isSelected = selectedTrip === trip.id;
              const expectedReturn = trip.amount * (bidRate / 100);
              const daysToMaturity = trip.maturityDays || 30;

              const isMultiSelected = selectedTrips.includes(trip.id);

              return (
                <Card key={trip.id} className={isSelected || isMultiSelected ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isMultiSelected}
                          onCheckedChange={() => toggleTripSelection(trip.id)}
                          id={`select-${trip.id}`}
                        />
                      </div>
                      <div className="flex gap-4 flex-1">
                        {trip.clientLogo && (
                          <div className="flex-shrink-0">
                            <img
                              src={trip.clientLogo}
                              alt={trip.clientCompany}
                              className="h-16 w-16 object-contain rounded-lg border border-border p-2 bg-card"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <CardTitle className="text-xl">
                              {trip.origin} → {trip.destination}
                            </CardTitle>
                          </div>
                          <CardDescription>
                            {trip.loadType} • {trip.weight}kg • {trip.distance}km
                          </CardDescription>
                          {trip.loadOwnerLogo && (
                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-xs text-muted-foreground">Trip by:</span>
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border">
                                <img
                                  src={trip.loadOwnerLogo}
                                  alt={trip.loadOwnerName}
                                  className="h-6 object-contain"
                                />
                                {trip.loadOwnerRating && (
                                  <div className="flex items-center gap-0.5 pl-2 border-l border-border">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-medium">{trip.loadOwnerRating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {/* Risk Level */}
                          {trip.riskLevel && (
                            <Badge
                              variant={trip.riskLevel === 'low' ? 'default' : trip.riskLevel === 'medium' ? 'secondary' : 'destructive'}
                              className={`text-xs ${
                                trip.riskLevel === 'low' ? 'bg-green-600' :
                                trip.riskLevel === 'medium' ? 'bg-yellow-600' :
                                'bg-red-600'
                              } text-white`}
                            >
                              {trip.riskLevel.toUpperCase()}
                            </Badge>
                          )}
                          {/* Insurance Status */}
                          {trip.insuranceStatus ? (
                            <Badge className="bg-green-600 text-white flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Insured
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Not Insured
                            </Badge>
                          )}
                          {/* Status */}
                          <Badge variant="secondary">{trip.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Trip Value</p>
                          <p className="font-semibold">₹{(trip.amount / 1000).toFixed(0)}K</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="font-semibold">
                            {new Date(trip.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Maturity Period</p>
                          <p className="font-semibold">{trip.maturityDays || 30} days</p>
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="border-t pt-4 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`rate-${trip.id}`}>Your Bid Rate (%)</Label>
                          <Input
                            id={`rate-${trip.id}`}
                            type="number"
                            value={bidRate}
                            onChange={(e) => setBidRate(parseFloat(e.target.value))}
                            min="8"
                            max="18"
                            step="0.5"
                          />
                          <p className="text-xs text-muted-foreground">
                            Recommended range: 8-12% annually
                          </p>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Investment Amount</span>
                            <span className="font-semibold">
                              ₹{(trip.amount / 1000).toFixed(0)}K
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Interest Rate</span>
                            <span className="font-semibold">{bidRate}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Expected Return</span>
                            <span className="font-semibold text-accent">
                              ₹{(expectedReturn / 1000).toFixed(1)}K
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Maturity Period</span>
                            <span className="font-semibold">{daysToMaturity} days</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            className="bg-gradient-primary flex-1"
                            onClick={() => handleInvest(trip.id)}
                          >
                            Confirm Bid
                          </Button>
                          <Button variant="outline" onClick={() => setSelectedTrip(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => setSelectedTrip(trip.id)}
                      >
                        Place Bid
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Top-Up Dialog */}
        <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Add Money to Wallet
              </DialogTitle>
              <DialogDescription>
                Top up your wallet to invest in opportunities
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Current Balance & Required Amount */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Insufficient Balance</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className="text-lg font-semibold">₹{(wallet.balance / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Required Amount</p>
                    <p className="text-lg font-semibold text-red-600">₹{(pendingInvestmentAmount / 1000).toFixed(0)}K</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Amount Needed</p>
                  <p className="text-xl font-bold text-primary">₹{((pendingInvestmentAmount - wallet.balance) / 1000).toFixed(0)}K</p>
                </div>
              </div>

              {/* Quick Amount Selection */}
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
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  <strong>Simulated Payment:</strong> This is a demo payment system. Funds will be added instantly after a 2-second processing delay.
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
                    Processing Payment...
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
      </div>
    </DashboardLayout>
  );
};

export default InvestmentOpportunities;
