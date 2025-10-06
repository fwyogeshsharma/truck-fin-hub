import { useState, useEffect } from "react";
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
import { MapPin, Package, TruckIcon, IndianRupee, Calendar, TrendingUp, CheckSquare, Square, Star, Shield, Wallet, Plus, Loader2, AlertCircle, Maximize2, Minimize2, ChevronDown, ChevronUp } from "lucide-react";
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
  const [trips, setTrips] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any>({
    balance: 0,
    escrowedAmount: 0,
    totalInvested: 0,
    totalReturns: 0,
    lockedAmount: 0,
    userId: user?.id || ''
  });
  const [loading, setLoading] = useState(true);
  const wallet = walletData;

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        console.error('No user ID found - user not authenticated');
        setLoading(false);
        return;
      }

      try {
        const [allTrips, wallet] = await Promise.all([
          data.getTrips(),
          data.getWallet(user.id)
        ]);

        // Filter for pending trips
        const pendingTrips = allTrips.filter(t => t.status === 'pending');
        setTrips(pendingTrips);
        setWalletData(wallet);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [bidRate, setBidRate] = useState<number>(12);
  const [filterLoadType, setFilterLoadType] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [isCompactView, setIsCompactView] = useState(true); // Default to compact view

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterOrigin, setFilterOrigin] = useState<string>("");
  const [filterDestination, setFilterDestination] = useState<string>("");
  const [tripValueRange, setTripValueRange] = useState<[number, number]>([0, 80000]);

  // Top-up dialog states
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingInvestmentAmount, setPendingInvestmentAmount] = useState(0);

  // Bid dialog states
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedTripForBid, setSelectedTripForBid] = useState<any>(null);
  const [customBidRate, setCustomBidRate] = useState<number>(12);

  const refreshWallet = async () => {
    if (!user?.id) return;
    const wallet = await data.getWallet(user.id);
    setWalletData(wallet);
  };

  const filteredTrips = trips.filter(trip => {
    const matchesLoadType = !filterLoadType || trip.loadType.toLowerCase().includes(filterLoadType.toLowerCase());
    const matchesMinAmount = !minAmount || trip.amount >= parseFloat(minAmount);
    const matchesMaxAmount = !maxAmount || trip.amount <= parseFloat(maxAmount);

    // Advanced filters
    const matchesOrigin = !filterOrigin || trip.origin.toLowerCase().includes(filterOrigin.toLowerCase());
    const matchesDestination = !filterDestination || trip.destination.toLowerCase().includes(filterDestination.toLowerCase());
    const matchesTripValueRange = trip.amount >= tripValueRange[0] && trip.amount <= tripValueRange[1];

    return matchesLoadType && matchesMinAmount && matchesMaxAmount && matchesOrigin && matchesDestination && matchesTripValueRange;
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

    if (!user?.id) return;

    // Simulate payment processing
    setIsProcessing(true);

    setTimeout(() => {
      // Update wallet balance
      data.updateWallet(user.id, {
        balance: wallet.balance + amount,
      });

      // Create transaction record
      data.createTransaction({
        userId: user.id,
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

  const handleInvest = async (tripId: string, customAmount?: number, customRate?: number) => {
    if (!user?.id) return;

    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    const investmentAmount = customAmount || trip.amount;
    const interestRate = customRate !== undefined ? customRate : bidRate;

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

    const expectedReturn = investmentAmount * (interestRate / 100);
    const maturityDays = trip.maturityDays || 30;

    try {
      // Move amount to escrow
      await data.updateWallet(user.id, {
        balance: wallet.balance - investmentAmount,
        escrowedAmount: (wallet.escrowedAmount || 0) + investmentAmount,
      });

      await refreshWallet();

      // Create escrowed investment immediately
      const escrowedInvestment = await data.createInvestment({
        lenderId: user.id,
        tripId,
        amount: investmentAmount,
        interestRate: interestRate,
        expectedReturn,
        status: 'escrowed',
        maturityDate: new Date(Date.now() + maturityDays * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Add bid to trip_bids table
      await data.addBid(
        tripId,
        user.id,
        user.name || 'Lender',
        investmentAmount,
        interestRate
      );

      // Update trip status to escrowed
      await data.updateTrip(tripId, {
        status: 'escrowed',
      });

      // Refresh trips list
      const allTrips = await data.getTrips();
      const pendingTrips = allTrips.filter(t => t.status === 'pending');
      setTrips(pendingTrips);

      toast({
        title: "Bid confirmed!",
        description: `₹${(investmentAmount / 1000).toFixed(0)}K moved to escrow. Awaiting load agent confirmation.`,
      });

      setSelectedTrip(null);
      setBidDialogOpen(false);
      setCustomBidRate(12);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to place bid',
      });
    }
  };

  const handleOpenBidDialog = (trip: any) => {
    setSelectedTripForBid(trip);
    setCustomBidRate(bidRate);
    setBidDialogOpen(true);
  };

  const handleConfirmBid = () => {
    if (!selectedTripForBid) return;

    const amount = selectedTripForBid.amount;

    if (customBidRate < 8 || customBidRate > 18) {
      toast({
        variant: 'destructive',
        title: 'Invalid Interest Rate',
        description: 'Interest rate must be between 8% and 18%',
      });
      return;
    }

    handleInvest(selectedTripForBid.id, amount, customBidRate);
  };

  const handleBulkInvest = async () => {
    if (!user?.id || selectedTrips.length === 0) return;

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

    try {
      // Move total amount to escrow
      await data.updateWallet(user.id, {
        balance: wallet.balance - totalInvestmentAmount,
        escrowedAmount: (wallet.escrowedAmount || 0) + totalInvestmentAmount,
      });

      await refreshWallet();

      // Create escrowed investments immediately
      for (const tripId of selectedTrips) {
        const trip = trips.find(t => t.id === tripId);
        if (!trip) continue;

        const investmentAmount = trip.amount;
        const expectedReturn = investmentAmount * (bidRate / 100);
        const maturityDays = trip.maturityDays || 30;

        // Create investment
        await data.createInvestment({
          lenderId: user.id,
          tripId,
          amount: investmentAmount,
          interestRate: bidRate,
          expectedReturn,
          status: 'escrowed',
          maturityDate: new Date(Date.now() + maturityDays * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Add bid to trip_bids table
        await data.addBid(
          tripId,
          user.id,
          user.name || 'Lender',
          investmentAmount,
          bidRate
        );

        // Update trip status to escrowed
        await data.updateTrip(tripId, {
          status: 'escrowed',
        });
      }

      // Refresh trips list
      const allTrips = await data.getTrips();
      const pendingTrips = allTrips.filter(t => t.status === 'pending');
      setTrips(pendingTrips);

      toast({
        title: "Bulk bids confirmed!",
        description: `${selectedTrips.length} trips • ₹${(totalInvestmentAmount / 1000).toFixed(0)}K moved to escrow. Awaiting load agent confirmation.`,
      });

      setSelectedTrips([]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to place bulk bids',
      });
    }
  };

  const handleResetData = () => {
    localStorage.removeItem('logistics_trips');
    window.location.reload();
  };

  if (loading) {
    return (
      <DashboardLayout role="lender">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading investment opportunities...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="lender">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Lender Opportunities</h1>
            <p className="text-muted-foreground mt-1">Browse and invest in available trips</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompactView(!isCompactView)}
              className="gap-2"
            >
              {isCompactView ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              {isCompactView ? 'Expand' : 'Compact'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetData}>
              Reset Data
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Narrow down opportunities by your preferences</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="gap-2"
              >
                {showAdvancedFilters ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Advanced
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Advanced Filters
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Basic Filters */}
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
                    placeholder="80000"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    max="80000"
                  />
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="pt-4 border-t space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="filterOrigin">Origin (Start Location)</Label>
                      <Input
                        id="filterOrigin"
                        placeholder="e.g., Mumbai, Delhi"
                        value={filterOrigin}
                        onChange={(e) => setFilterOrigin(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="filterDestination">Destination</Label>
                      <Input
                        id="filterDestination"
                        placeholder="e.g., Bangalore, Chennai"
                        value={filterDestination}
                        onChange={(e) => setFilterDestination(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Trip Value Range Slider */}
                  <div>
                    <Label htmlFor="tripValueRange">
                      Trip Value Range: ₹{(tripValueRange[0] / 1000).toFixed(0)}K - ₹{(tripValueRange[1] / 1000).toFixed(0)}K
                    </Label>
                    <div className="mt-2 space-y-3">
                      {/* Min Range Slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Minimum</span>
                          <span className="text-xs font-medium">₹{(tripValueRange[0] / 1000).toFixed(0)}K</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="80000"
                          step="1000"
                          value={tripValueRange[0]}
                          onChange={(e) => {
                            const newMin = parseInt(e.target.value);
                            if (newMin <= tripValueRange[1]) {
                              setTripValueRange([newMin, tripValueRange[1]]);
                            }
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      {/* Max Range Slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Maximum</span>
                          <span className="text-xs font-medium">₹{(tripValueRange[1] / 1000).toFixed(0)}K</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="80000"
                          step="1000"
                          value={tripValueRange[1]}
                          onChange={(e) => {
                            const newMax = parseInt(e.target.value);
                            if (newMax >= tripValueRange[0]) {
                              setTripValueRange([tripValueRange[0], newMax]);
                            }
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                      </div>

                      {/* Scale markers */}
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>₹0</span>
                        <span>₹20K</span>
                        <span>₹40K</span>
                        <span>₹60K</span>
                        <span>₹80K</span>
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterLoadType("");
                        setMinAmount("");
                        setMaxAmount("");
                        setFilterOrigin("");
                        setFilterDestination("");
                        setTripValueRange([0, 80000]);
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              )}
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
          ) : isCompactView ? (
            // Compact View
            filteredTrips.map((trip) => {
              const isMultiSelected = selectedTrips.includes(trip.id);
              const expectedReturn = trip.amount * (bidRate / 100);

              return (
                <Card key={trip.id} className={`p-2.5 ${isMultiSelected ? 'ring-2 ring-primary' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isMultiSelected}
                      onCheckedChange={() => toggleTripSelection(trip.id)}
                      id={`select-compact-${trip.id}`}
                    />
                    <div className="flex-1 grid grid-cols-12 gap-3 items-center">
                      {/* Route & Load - 4 columns */}
                      <div className="col-span-4">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                          <p className="font-semibold text-sm truncate">{trip.origin} → {trip.destination}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{trip.loadType} • {trip.weight}kg • {trip.distance}km</p>
                      </div>

                      {/* Company Logo - 2 columns */}
                      <div className="col-span-2 flex justify-center">
                        {trip.loadOwnerLogo && (
                          <img
                            src={trip.loadOwnerLogo}
                            alt={trip.loadOwnerName}
                            className="h-8 object-contain"
                            title={trip.loadOwnerName}
                          />
                        )}
                      </div>

                      {/* Trip Value - 2 columns */}
                      <div className="col-span-2 text-center">
                        <p className="text-xs text-muted-foreground">Trip Value</p>
                        <p className="font-semibold">₹{(trip.amount / 1000).toFixed(0)}K</p>
                      </div>

                      {/* Return - 2 columns */}
                      <div className="col-span-2 text-center">
                        <p className="text-xs text-muted-foreground">Return ({bidRate}%)</p>
                        <p className="font-semibold text-green-600">₹{(expectedReturn / 1000).toFixed(1)}K</p>
                      </div>

                      {/* Risk & Bid - 2 columns */}
                      <div className="col-span-2 flex gap-2 items-center justify-end">
                        {trip.riskLevel && (
                          <Badge className={`text-xs px-2 py-0.5 ${
                            trip.riskLevel === 'low' ? 'bg-green-600' :
                            trip.riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                          } text-white`}>
                            {trip.riskLevel === 'low' ? 'LOW' : trip.riskLevel === 'medium' ? 'MED' : 'HIGH'}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleOpenBidDialog(trip)}
                          className="bg-gradient-primary h-7 px-3 text-xs"
                        >
                          Bid
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            // Expanded View
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

        {/* Bid Dialog */}
        <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Place Your Bid
              </DialogTitle>
              <DialogDescription>
                Enter your bid amount and interest rate for this trip
              </DialogDescription>
            </DialogHeader>

            {selectedTripForBid && (
              <div className="space-y-4">
                {/* Trip Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    {selectedTripForBid.loadOwnerLogo && (
                      <img
                        src={selectedTripForBid.loadOwnerLogo}
                        alt={selectedTripForBid.loadOwnerName}
                        className="h-12 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">
                        {selectedTripForBid.origin} → {selectedTripForBid.destination}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {selectedTripForBid.loadType} • {selectedTripForBid.weight}kg • {selectedTripForBid.distance}km
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Trip Value:</span>
                        <span className="text-sm font-semibold">₹{(selectedTripForBid.amount / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip Value Display */}
                <div className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trip Value</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{(selectedTripForBid.amount / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₹{selectedTripForBid.amount.toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Interest Rate Input */}
                <div>
                  <Label htmlFor="customBidRate">Interest Rate (%)</Label>
                  <Input
                    id="customBidRate"
                    type="number"
                    value={customBidRate}
                    onChange={(e) => setCustomBidRate(parseFloat(e.target.value))}
                    min="8"
                    max="18"
                    step="0.5"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended range: 8-12% annually
                  </p>
                </div>

                {/* Expected Return */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-900">Expected Return</span>
                    <span className="text-lg font-bold text-green-700">
                      ₹{((selectedTripForBid.amount * customBidRate) / 100 / 1000).toFixed(1)}K
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    At {customBidRate}% interest on ₹{(selectedTripForBid.amount / 1000).toFixed(0)}K
                  </p>
                </div>

                {/* Wallet Balance Check */}
                <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Your Wallet Balance</span>
                  <span className="font-semibold">₹{(wallet.balance / 1000).toFixed(0)}K</span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setBidDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmBid} className="bg-gradient-primary">
                <TrendingUp className="h-4 w-4 mr-2" />
                Confirm Bid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default InvestmentOpportunities;
