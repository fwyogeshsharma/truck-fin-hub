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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MapPin, Package, TruckIcon, IndianRupee, Calendar, TrendingUp, CheckSquare, Square, Star, Shield, Wallet, Plus, Loader2, AlertCircle, Maximize2, Minimize2, ChevronDown, ChevronUp, Building2, Users, TrendingUp as TrendingUpIcon, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { auth } from "@/lib/auth";
import { data } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatCurrencyCompact, formatPercentage } from "@/lib/currency";
import AdvancedFilter, { type FilterConfig } from "@/components/AdvancedFilter";
import { getCompanyInfo } from "@/data/companyInfo";

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
  const [isCompactView, setIsCompactView] = useState(true); // Default to compact view
  const [tripInterestRates, setTripInterestRates] = useState<Record<string, number>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Advanced filter state for new component
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});

  // Advanced filter configuration
  const filterConfig: FilterConfig[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by origin, destination, or load type...',
    },
    {
      id: 'loadType',
      label: 'Load Type',
      type: 'select',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'Electronics', label: 'Electronics' },
        { value: 'FMCG', label: 'FMCG' },
        { value: 'Textiles', label: 'Textiles' },
        { value: 'Automotive Parts', label: 'Automotive Parts' },
        { value: 'Machinery', label: 'Machinery' },
        { value: 'Food & Beverages', label: 'Food & Beverages' },
      ],
      placeholder: 'Select load type',
    },
    {
      id: 'amount',
      label: 'Trip Value (₹)',
      type: 'range',
      min: 0,
      max: 10000000,
    },
    {
      id: 'distance',
      label: 'Distance (km)',
      type: 'range',
      min: 0,
      max: 5000,
    },
    {
      id: 'weight',
      label: 'Weight (kg)',
      type: 'range',
      min: 0,
      max: 50000,
    },
    {
      id: 'riskLevel',
      label: 'Risk Level',
      type: 'select',
      options: [
        { value: 'all', label: 'All Levels' },
        { value: 'low', label: 'Low Risk' },
        { value: 'medium', label: 'Medium Risk' },
        { value: 'high', label: 'High Risk' },
      ],
      placeholder: 'Select risk level',
    },
  ];

  // Top-up dialog states
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingInvestmentAmount, setPendingInvestmentAmount] = useState(0);

  // Bid dialog states
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedTripForBid, setSelectedTripForBid] = useState<any>(null);
  const [customBidRate, setCustomBidRate] = useState<number>(0);

  const refreshWallet = async () => {
    if (!user?.id) return;
    const wallet = await data.getWallet(user.id);
    setWalletData(wallet);
  };

  const filteredTrips = trips.filter(trip => {
    // New advanced filter component filters
    const matchesSearch = !advancedFilters.search ||
      trip.origin.toLowerCase().includes(advancedFilters.search.toLowerCase()) ||
      trip.destination.toLowerCase().includes(advancedFilters.search.toLowerCase()) ||
      trip.loadType.toLowerCase().includes(advancedFilters.search.toLowerCase());

    const matchesAdvancedLoadType = !advancedFilters.loadType || advancedFilters.loadType === 'all' || trip.loadType === advancedFilters.loadType;

    const matchesAmountRange =
      (!advancedFilters.amount_min || trip.amount >= parseFloat(advancedFilters.amount_min)) &&
      (!advancedFilters.amount_max || trip.amount <= parseFloat(advancedFilters.amount_max));

    const matchesDistanceRange =
      (!advancedFilters.distance_min || trip.distance >= parseFloat(advancedFilters.distance_min)) &&
      (!advancedFilters.distance_max || trip.distance <= parseFloat(advancedFilters.distance_max));

    const matchesWeightRange =
      (!advancedFilters.weight_min || trip.weight >= parseFloat(advancedFilters.weight_min)) &&
      (!advancedFilters.weight_max || trip.weight <= parseFloat(advancedFilters.weight_max));

    const matchesRiskLevel = !advancedFilters.riskLevel || advancedFilters.riskLevel === 'all' || trip.riskLevel === advancedFilters.riskLevel;

    return matchesSearch && matchesAdvancedLoadType && matchesAmountRange && matchesDistanceRange && matchesWeightRange && matchesRiskLevel;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTrips = filteredTrips.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [advancedFilters]);

  const toggleTripSelection = (tripId: string) => {
    setSelectedTrips(prev => {
      const newSelection = prev.includes(tripId)
        ? prev.filter(id => id !== tripId)
        : [...prev, tripId];

      // Initialize interest rate for newly selected trip using trip's own interest rate
      if (!prev.includes(tripId) && !tripInterestRates[tripId]) {
        const trip = trips.find(t => t.id === tripId);
        setTripInterestRates(prevRates => ({
          ...prevRates,
          [tripId]: trip?.interestRate || 12
        }));
      }

      return newSelection;
    });
    setSelectedTrip(null); // Clear single selection when using multi-select
  };

  const updateTripInterestRate = (tripId: string, rate: number) => {
    setTripInterestRates(prev => ({
      ...prev,
      [tripId]: rate
    }));
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
  const totalExpectedReturn = selectedTripsData.reduce((sum, trip) => {
    const rate = tripInterestRates[trip.id] || trip.interestRate || 12;
    const maturityDays = trip.maturityDays || 30;
    const yearlyRate = (rate * 365) / maturityDays;
    const adjustedYearlyRate = yearlyRate - (yearlyRate * 0.3);
    return sum + (trip.amount * (adjustedYearlyRate / 100));
  }, 0);

  // Calculate average interest rate (raw rate) from selected trips
  const averageInterestRate = selectedTrips.length > 0
    ? selectedTrips.reduce((sum, tripId) => {
        const trip = trips.find(t => t.id === tripId);
        return sum + (tripInterestRates[tripId] || trip?.interestRate || 12);
      }, 0) / selectedTrips.length
    : 0;

  // Calculate average ARR % (annualized rate) from selected trips
  const averageARR = selectedTrips.length > 0
    ? selectedTrips.reduce((sum, tripId) => {
        const trip = trips.find(t => t.id === tripId);
        if (!trip) return sum;
        const rate = tripInterestRates[tripId] || trip?.interestRate || 12;
        const maturityDays = trip.maturityDays || 30;
        const yearlyRate = (rate * 365) / maturityDays;
        const adjustedYearlyRate = yearlyRate - (yearlyRate * 0.3);
        return sum + adjustedYearlyRate;
      }, 0) / selectedTrips.length
    : 0;

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
        description: `${formatCurrency(amount)} added to your wallet`,
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
    const interestRate = customRate !== undefined ? customRate : (trip.interestRate || 12);

    // Check if balance is insufficient
    if (wallet.balance < investmentAmount) {
      setPendingInvestmentAmount(investmentAmount);
      setTopUpAmount((investmentAmount - wallet.balance).toString());
      setTopUpDialogOpen(true);
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: `You need ${formatCurrency(investmentAmount - wallet.balance)} more to invest`,
      });
      return;
    }

    const maturityDays = trip.maturityDays || 30;
//     const yearlyRate = (interestRate * 365) / maturityDays;
    const yearlyRate = interestRate;
    const lenderInterestRate = (interestRate * maturityDays) / 365;

    const adjustedYearlyRate = yearlyRate - (yearlyRate * 0.3);
    const expectedReturn = investmentAmount * (adjustedYearlyRate / 100);

    try {
      // Move amount to escrow
      const updatedWallet = await data.updateWallet(user.id, {
        balance: wallet.balance - investmentAmount,
        escrowedAmount: (wallet.escrowedAmount || 0) + investmentAmount,
      });

      // Create transaction record for lender
      await data.createTransaction({
        userId: user.id,
        type: 'debit',
        amount: investmentAmount,
        category: 'investment',
        description: `Escrowed ₹${investmentAmount} for trip ${trip.origin} → ${trip.destination}`,
        balanceAfter: wallet.balance - investmentAmount,
      });

      await refreshWallet();

      // Create escrowed investment immediately
      const escrowedInvestment = await data.createInvestment({
        lenderId: user.id,
        tripId,
        amount: investmentAmount,
        interestRate: lenderInterestRate,
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
        lenderInterestRate
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
        description: `${formatCurrency(investmentAmount)} moved to escrow. Awaiting Borrower confirmation.`,
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
    setCustomBidRate(trip.interestRate || 12);
    setBidDialogOpen(true);
  };

  const handleConfirmBid = () => {
    if (!selectedTripForBid) return;

    const amount = selectedTripForBid.amount;

    if (customBidRate < 0 || customBidRate > 20) {
      toast({
        variant: 'destructive',
        title: 'Invalid Interest Rate',
        description: 'Interest rate must be between 0% and 20%',
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
        description: `You need ${formatCurrency(totalInvestmentAmount - wallet.balance)} more to invest in all selected trips`,
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
        const tripRate = tripInterestRates[tripId] || trip.interestRate || 12; // Use individual trip rate
        const maturityDays = trip.maturityDays || 30;
        const yearlyRate = (tripRate * 365) / maturityDays;
        const adjustedYearlyRate = yearlyRate - (yearlyRate * 0.3);
        const expectedReturn = investmentAmount * (adjustedYearlyRate / 100);

        // Create investment
        await data.createInvestment({
          lenderId: user.id,
          tripId,
          amount: investmentAmount,
          interestRate: tripRate,
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
          tripRate
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
        description: `${selectedTrips.length} trips • ${formatCurrency(totalInvestmentAmount)} moved to escrow. Awaiting Borrower confirmation.`,
      });

      setSelectedTrips([]);
      setTripInterestRates({});
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
      <TooltipProvider>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Lender Opportunities</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Browse and invest in available trips</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompactView(!isCompactView)}
              className="gap-2"
            >
              {isCompactView ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{isCompactView ? 'Expand' : 'Compact'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetData} className="hidden sm:inline-flex">
              Reset Data
            </Button>
          </div>
        </div>

        {/* Bulk Investment Panel */}
        {selectedTrips.length > 0 && (
          <Card className="border-2 border-primary bg-primary/5">
            <CardContent className="pt-4 sm:pt-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <h3 className="font-semibold text-base sm:text-lg">
                        Bulk Investment: {selectedTrips.length} trip{selectedTrips.length > 1 ? 's' : ''} selected
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="gap-2 self-start"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            <span className="text-sm">Collapse</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            <span className="text-sm">Expand Trips</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="bulkBidRate" className="text-xs">Average ARR (%) - Read Only</Label>
                        <Input
                          id="bulkBidRate"
                          type="text"
                          value={`${averageARR.toFixed(2)}%`}
                          disabled
                          className="mt-1 h-8 sm:h-9 text-sm bg-muted cursor-not-allowed"
                        />
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Average annualized return rate of selected trips</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Total Investment:</span>
                          <span className="font-semibold">{formatCurrencyCompact(totalInvestmentAmount, true)}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Total ARR:</span>
                          <span className="font-semibold text-accent">{formatCurrencyCompact(totalExpectedReturn, true)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                    <Button
                      className="bg-gradient-primary flex-1 sm:flex-none text-sm h-9 sm:h-10"
                      onClick={handleBulkInvest}
                      disabled={wallet.balance < totalInvestmentAmount}
                    >
                      Confirm {selectedTrips.length} Bid{selectedTrips.length > 1 ? 's' : ''}
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none text-sm h-9 sm:h-10" onClick={() => { setSelectedTrips([]); setTripInterestRates({}); }}>
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Expanded Trip List */}
                {isExpanded && (
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">Selected Trips with Individual Interest Rates</h4>
                    {selectedTripsData.map((trip) => {
                      const tripRate = tripInterestRates[trip.id] || trip.interestRate || 12;
                      const maturityDays = trip.maturityDays || 30;
                      const yearlyRate = (tripRate * 365) / maturityDays;
                      const adjustedYearlyRate = yearlyRate - (yearlyRate * 0.3);
                      const tripReturn = trip.amount * (adjustedYearlyRate / 100);

                      // Handler to convert slider yearly rate back to monthly rate for storage
                      const handleYearlyRateChange = (yearlyARR: number) => {
                        // Convert yearly ARR back to monthly rate
                        // yearlyARR = (monthlyRate * 365 / maturityDays) * 0.7
                        // monthlyRate = yearlyARR / 0.7 * maturityDays / 365
                        const monthlyRate = (yearlyARR / 0.7) * (maturityDays / 365);
                        updateTripInterestRate(trip.id, monthlyRate);
                      };

                      return (
                        <div key={trip.id} className="p-3 bg-card border rounded-lg">
                          <div className="flex items-center gap-3">
                            {/* Logo */}
                            {trip.clientLogo && (
                              <img
                                src={trip.clientLogo}
                                alt={trip.clientCompany || 'Company'}
                                className="h-10 w-10 object-contain flex-shrink-0"
                              />
                            )}

                            {/* Trip Details - Fixed width */}
                            <div className="w-64 flex-shrink-0">
                              <div className="flex items-center gap-1 mb-1">
                                <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                                <p className="font-semibold text-xs truncate">
                                  {trip.origin} → {trip.destination}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {trip.loadType} • {trip.weight}kg • {trip.distance}km
                              </p>
                            </div>

                            {/* Trip Value - Compact */}
                            <div className="w-24 flex-shrink-0 text-center">
                              <p className="text-xs text-muted-foreground">Value</p>
                              <p className="font-semibold text-sm">{formatCurrencyCompact(trip.amount, true)}</p>
                            </div>

                            {/* Range Slider - Takes remaining space */}
                            <div className="flex-1 min-w-0 px-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <input
                                    id={`rate-${trip.id}`}
                                    type="range"
                                    value={adjustedYearlyRate}
                                    onChange={(e) => handleYearlyRateChange(parseFloat(e.target.value))}
                                    min="0"
                                    max="100"
                                    step="1"
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                  />
                                  <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                                    <span>0%</span>
                                    <span>100%</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* ARR % Display - Compact */}
                            <div className="w-16 flex-shrink-0 text-center">
                              <p className="text-xs text-muted-foreground">ARR %</p>
                              <p className="font-bold text-sm text-primary">{adjustedYearlyRate.toFixed(1)}%</p>
                            </div>

                            {/* ARR Amount - Compact */}
                            <div className="w-24 flex-shrink-0 text-center">
                              <p className="text-xs text-muted-foreground">ARR</p>
                              <p className="font-semibold text-sm text-green-600">{formatCurrencyCompact(tripReturn, true)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Trips */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h2 className="text-lg sm:text-xl font-semibold">Available Trips ({filteredTrips.length})</h2>
              <div className="flex items-center gap-2">
                <AdvancedFilter
                  filters={filterConfig}
                  currentFilters={advancedFilters}
                  onFilterChange={setAdvancedFilters}
                  onClearFilters={() => setAdvancedFilters({})}
                />
                {filteredTrips.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                  >
                    {selectedTrips.length === filteredTrips.length ? (
                      <>
                        <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Deselect All</span>
                        <span className="sm:hidden">Deselect</span>
                      </>
                    ) : (
                      <>
                        <Square className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Select All</span>
                        <span className="sm:hidden">Select</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 rounded-lg px-3 sm:px-4 py-2">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Available Balance</span>
                <span className="text-base sm:text-xl font-bold text-primary">{formatCurrencyCompact(wallet.balance, true)}</span>
              </div>
            </div>
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
            paginatedTrips.map((trip) => {
              const isMultiSelected = selectedTrips.includes(trip.id);
              const tripRate = tripInterestRates[trip.id] || trip.interestRate || 12;
              const yearlyRate = (tripRate * 365) / (trip.maturityDays || 30);
              const adjustedYearlyRate = yearlyRate - (yearlyRate * 0.3);
              const expectedReturn = trip.amount * (adjustedYearlyRate / 100);

              return (
                <Card key={trip.id} className={`p-2 sm:p-2.5 ${isMultiSelected ? 'ring-2 ring-primary' : ''}`}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Checkbox
                      checked={isMultiSelected}
                      onCheckedChange={() => toggleTripSelection(trip.id)}
                      id={`select-compact-${trip.id}`}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 items-center">
                      {/* Mobile: Single column layout */}
                      <div className="md:hidden flex items-center gap-3 w-full">
                        {/* Logos and Route */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {trip.clientLogo && (
                            <img
                              src={trip.clientLogo}
                              alt={trip.clientCompany || 'Company'}
                              className="h-6 w-auto object-contain flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                              <p className="font-semibold text-xs truncate">{trip.origin} → {trip.destination}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{trip.loadType} • {trip.weight}kg</p>
                          </div>
                        </div>
                        {/* Action Button */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {trip.riskLevel && (
                            <Badge className={`text-[10px] px-1.5 py-0 ${
                              trip.riskLevel === 'low' ? 'bg-green-600' :
                              trip.riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                            } text-white`}>
                              {trip.riskLevel === 'low' ? 'L' : trip.riskLevel === 'medium' ? 'M' : 'H'}
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleOpenBidDialog(trip)}
                            className="bg-gradient-primary h-7 px-2 text-xs"
                          >
                            Bid
                          </Button>
                        </div>
                      </div>

                      {/* Desktop: Grid layout - Load Owner (Client/Consignee) Logo - 1 column */}
                      <div className="hidden md:flex md:col-span-1 justify-center">
                        {trip.clientLogo ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="relative group">
                                <img
                                  src={trip.clientLogo}
                                  alt={trip.clientCompany || 'Company'}
                                  className="h-8 w-auto object-contain transition-transform group-hover:scale-110"
                                />
                                <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Info className="h-2.5 w-2.5 text-white" />
                                </div>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-4" side="top" align="center">
                              {(() => {
                                const companyInfo = getCompanyInfo(trip.clientCompany || '');
                                return companyInfo ? (
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        <div>
                                          <h4 className="font-semibold text-base">{companyInfo.name}</h4>
                                          <Badge variant="outline" className="mt-1 text-xs">{companyInfo.industry}</Badge>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg">
                                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                      <div>
                                        <span className="font-bold text-lg">{Number(companyInfo.rating).toFixed(1)}</span>
                                        <span className="text-xs text-muted-foreground ml-1">/ 5.0 Rating</span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      {companyInfo.marketCap && (
                                        <div className="flex items-start gap-2">
                                          <TrendingUpIcon className="h-4 w-4 text-green-600 mt-0.5" />
                                          <div>
                                            <p className="text-xs text-muted-foreground">Market Cap</p>
                                            <p className="font-semibold text-sm">{companyInfo.marketCap}</p>
                                          </div>
                                        </div>
                                      )}
                                      {companyInfo.headquarters && (
                                        <div className="flex items-start gap-2">
                                          <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                                          <div>
                                            <p className="text-xs text-muted-foreground">Headquarters</p>
                                            <p className="font-semibold text-sm">{companyInfo.headquarters}</p>
                                          </div>
                                        </div>
                                      )}
                                      {companyInfo.founded && (
                                        <div className="flex items-start gap-2">
                                          <Calendar className="h-4 w-4 text-purple-600 mt-0.5" />
                                          <div>
                                            <p className="text-xs text-muted-foreground">Founded</p>
                                            <p className="font-semibold text-sm">{companyInfo.founded}</p>
                                          </div>
                                        </div>
                                      )}
                                      {companyInfo.employees && (
                                        <div className="flex items-start gap-2">
                                          <Users className="h-4 w-4 text-orange-600 mt-0.5" />
                                          <div>
                                            <p className="text-xs text-muted-foreground">Employees</p>
                                            <p className="font-semibold text-sm">{companyInfo.employees}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {companyInfo.financials && (
                                      <div className="border-t pt-3 space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Financials</p>
                                        <div className="grid grid-cols-3 gap-2">
                                          {companyInfo.financials.revenue && (
                                            <div className="bg-muted/50 p-2 rounded">
                                              <p className="text-xs text-muted-foreground">Revenue</p>
                                              <p className="font-semibold text-sm">{companyInfo.financials.revenue}</p>
                                            </div>
                                          )}
                                          {companyInfo.financials.profit && (
                                            <div className="bg-muted/50 p-2 rounded">
                                              <p className="text-xs text-muted-foreground">Profit</p>
                                              <p className="font-semibold text-sm">{companyInfo.financials.profit}</p>
                                            </div>
                                          )}
                                          {companyInfo.financials.debtToEquity && (
                                            <div className="bg-muted/50 p-2 rounded">
                                              <p className="text-xs text-muted-foreground">D/E Ratio</p>
                                              <p className="font-semibold text-sm">{companyInfo.financials.debtToEquity}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    <div className="border-t pt-3">
                                      <p className="text-xs text-muted-foreground leading-relaxed">{companyInfo.description}</p>
                                    </div>

                                    {companyInfo.trustFactors && companyInfo.trustFactors.length > 0 && (
                                      <div className="border-t pt-3 bg-blue-50 -m-4 mt-3 p-4 rounded-b-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Package className="h-4 w-4 text-blue-700" />
                                          <p className="text-xs font-semibold text-blue-900 uppercase">Load Owner - Trust Factors</p>
                                        </div>
                                        <ul className="text-xs space-y-1.5">
                                          {companyInfo.trustFactors.map((factor, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-blue-800">
                                              <span className="text-blue-600 mt-0.5">✓</span>
                                              <span>{factor}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Package className="h-5 w-5 text-primary" />
                                      <p className="font-semibold">{trip.clientCompany || 'Load Owner'}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Company shipping the goods</p>
                                  </div>
                                );
                              })()}
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <div className="h-8 w-10 bg-muted rounded flex items-center justify-center border border-dashed">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Route & Load - 3 columns */}
                      <div className="hidden md:block md:col-span-3">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                          <p className="font-semibold text-sm truncate">{trip.origin} → {trip.destination}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{trip.loadType} • {trip.weight}kg • {trip.distance}km</p>
                      </div>

                      {/* Load Owner (Borrower) Logo with Rating - 2 columns */}
                      <div className="hidden md:flex md:col-span-2 justify-center items-center gap-1.5">
                        {trip.loadOwnerLogo && (
                          <>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="flex items-center gap-1.5 hover:bg-muted/50 rounded-lg p-1 transition-colors">
                                  <img
                                    src={trip.loadOwnerLogo}
                                    alt={trip.loadOwnerName}
                                    className="h-8 object-contain"
                                  />
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-3.5 w-3.5 text-primary cursor-pointer" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Click for Borrower details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-96 p-4" side="top" align="center">
                                {(() => {
                                  const companyInfo = getCompanyInfo(trip.loadOwnerName);
                                  return companyInfo ? (
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                          <Building2 className="h-5 w-5 text-primary" />
                                          <div>
                                            <h4 className="font-semibold text-base">{companyInfo.name}</h4>
                                            <Badge variant="outline" className="mt-1 text-xs">{companyInfo.industry}</Badge>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg">
                                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                        <div>
                                          <span className="font-bold text-lg">{Number(companyInfo.rating).toFixed(1)}</span>
                                          <span className="text-xs text-muted-foreground ml-1">/ 5.0 Rating</span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        {companyInfo.marketCap && (
                                          <div className="flex items-start gap-2">
                                            <TrendingUpIcon className="h-4 w-4 text-green-600 mt-0.5" />
                                            <div>
                                              <p className="text-xs text-muted-foreground">Market Cap</p>
                                              <p className="font-semibold text-sm">{companyInfo.marketCap}</p>
                                            </div>
                                          </div>
                                        )}
                                        {companyInfo.headquarters && (
                                          <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                                            <div>
                                              <p className="text-xs text-muted-foreground">Headquarters</p>
                                              <p className="font-semibold text-sm">{companyInfo.headquarters}</p>
                                            </div>
                                          </div>
                                        )}
                                        {companyInfo.founded && (
                                          <div className="flex items-start gap-2">
                                            <Calendar className="h-4 w-4 text-purple-600 mt-0.5" />
                                            <div>
                                              <p className="text-xs text-muted-foreground">Founded</p>
                                              <p className="font-semibold text-sm">{companyInfo.founded}</p>
                                            </div>
                                          </div>
                                        )}
                                        {companyInfo.employees && (
                                          <div className="flex items-start gap-2">
                                            <Users className="h-4 w-4 text-orange-600 mt-0.5" />
                                            <div>
                                              <p className="text-xs text-muted-foreground">Employees</p>
                                              <p className="font-semibold text-sm">{companyInfo.employees}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {companyInfo.financials && (
                                        <div className="border-t pt-3 space-y-2">
                                          <p className="text-xs font-semibold text-muted-foreground uppercase">Financials</p>
                                          <div className="grid grid-cols-3 gap-2">
                                            {companyInfo.financials.revenue && (
                                              <div className="bg-muted/50 p-2 rounded">
                                                <p className="text-xs text-muted-foreground">Revenue</p>
                                                <p className="font-semibold text-sm">{companyInfo.financials.revenue}</p>
                                              </div>
                                            )}
                                            {companyInfo.financials.profit && (
                                              <div className="bg-muted/50 p-2 rounded">
                                                <p className="text-xs text-muted-foreground">Profit</p>
                                                <p className="font-semibold text-sm">{companyInfo.financials.profit}</p>
                                              </div>
                                            )}
                                            {companyInfo.financials.debtToEquity && (
                                              <div className="bg-muted/50 p-2 rounded">
                                                <p className="text-xs text-muted-foreground">D/E Ratio</p>
                                                <p className="font-semibold text-sm">{companyInfo.financials.debtToEquity}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      <div className="border-t pt-3">
                                        <p className="text-xs text-muted-foreground leading-relaxed">{companyInfo.description}</p>
                                      </div>

                                      {companyInfo.trustFactors && companyInfo.trustFactors.length > 0 && (
                                        <div className="border-t pt-3 bg-green-50 -m-4 mt-3 p-4 rounded-b-lg">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Shield className="h-4 w-4 text-green-700" />
                                            <p className="text-xs font-semibold text-green-900 uppercase">Trust Factors</p>
                                          </div>
                                          <ul className="text-xs space-y-1.5">
                                            {companyInfo.trustFactors.map((factor, idx) => (
                                              <li key={idx} className="flex items-start gap-2 text-green-800">
                                                <span className="text-green-600 mt-0.5">✓</span>
                                                <span>{factor}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <p className="font-semibold">{trip.loadOwnerName}</p>
                                      <p className="text-sm text-muted-foreground">Borrower company information</p>
                                    </div>
                                  );
                                })()}
                              </PopoverContent>
                            </Popover>
                            {(() => {
                              const companyInfo = getCompanyInfo(trip.loadOwnerName);
                              const rating = companyInfo?.rating || trip.loadOwnerRating;
                              return rating && (
                                <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-semibold">{Number(rating).toFixed(1)}</span>
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>

                      {/* Trip Value - 2 columns */}
                      <div className="hidden md:block md:col-span-2 text-center">
                        <p className="text-xs text-muted-foreground">Trip Value</p>
                        <p className="font-semibold">{formatCurrencyCompact(trip.amount, true)}</p>
                      </div>

                      {/* ARR - 2 columns */}
                      <div className="hidden md:block md:col-span-2 text-center">
                        <p className="text-xs text-muted-foreground">ARR ({formatPercentage(((tripInterestRates[trip.id] || trip.interestRate || 12) * 365) / (trip.maturityDays || 30) * 0.7)}%)</p>
                        <p className="font-semibold text-green-600">{formatCurrencyCompact(trip.amount * ((((tripInterestRates[trip.id] || trip.interestRate || 12) * 365) / (trip.maturityDays || 30)) * 0.7 / 100), true)}</p>
                      </div>

                      {/* Risk & Bid - 2 columns */}
                      <div className="hidden md:flex md:col-span-2 gap-2 items-center justify-end">
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
            paginatedTrips.map((trip) => {
              const isSelected = selectedTrip === trip.id;
              const daysToMaturity = trip.maturityDays || 30;
              const tripRate = tripInterestRates[trip.id] || trip.interestRate || 12;
              const yearlyRate = (tripRate * 365) / daysToMaturity;
              const adjustedYearlyRate = yearlyRate - (yearlyRate * 0.3);
              const expectedReturn = trip.amount * (adjustedYearlyRate / 100);

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
                        <div className="flex-shrink-0">
                          {trip.clientLogo ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="relative group h-16 w-16 rounded-lg border border-border p-2 bg-card hover:border-primary transition-colors">
                                  <img
                                    src={trip.clientLogo}
                                    alt={trip.clientCompany || 'Company'}
                                    className="h-full w-full object-contain"
                                  />
                                  <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                    <Info className="h-3 w-3 text-white" />
                                  </div>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-96 p-4" side="right" align="start">
                                {(() => {
                                  const companyInfo = getCompanyInfo(trip.clientCompany || '');
                                  return companyInfo ? (
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                          <Package className="h-5 w-5 text-blue-600" />
                                          <div>
                                            <h4 className="font-semibold text-base">{companyInfo.name}</h4>
                                            <Badge variant="outline" className="mt-1 text-xs bg-blue-50">{companyInfo.industry}</Badge>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg">
                                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                        <div>
                                          <span className="font-bold text-lg">{Number(companyInfo.rating).toFixed(1)}</span>
                                          <span className="text-xs text-muted-foreground ml-1">/ 5.0 Rating</span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        {companyInfo.marketCap && (
                                          <div className="flex items-start gap-2">
                                            <TrendingUpIcon className="h-4 w-4 text-green-600 mt-0.5" />
                                            <div>
                                              <p className="text-xs text-muted-foreground">Market Cap</p>
                                              <p className="font-semibold text-sm">{companyInfo.marketCap}</p>
                                            </div>
                                          </div>
                                        )}
                                        {companyInfo.headquarters && (
                                          <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                                            <div>
                                              <p className="text-xs text-muted-foreground">Headquarters</p>
                                              <p className="font-semibold text-sm">{companyInfo.headquarters}</p>
                                            </div>
                                          </div>
                                        )}
                                        {companyInfo.founded && (
                                          <div className="flex items-start gap-2">
                                            <Calendar className="h-4 w-4 text-purple-600 mt-0.5" />
                                            <div>
                                              <p className="text-xs text-muted-foreground">Founded</p>
                                              <p className="font-semibold text-sm">{companyInfo.founded}</p>
                                            </div>
                                          </div>
                                        )}
                                        {companyInfo.employees && (
                                          <div className="flex items-start gap-2">
                                            <Users className="h-4 w-4 text-orange-600 mt-0.5" />
                                            <div>
                                              <p className="text-xs text-muted-foreground">Employees</p>
                                              <p className="font-semibold text-sm">{companyInfo.employees}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {companyInfo.financials && (
                                        <div className="border-t pt-3 space-y-2">
                                          <p className="text-xs font-semibold text-muted-foreground uppercase">Financials</p>
                                          <div className="grid grid-cols-3 gap-2">
                                            {companyInfo.financials.revenue && (
                                              <div className="bg-muted/50 p-2 rounded">
                                                <p className="text-xs text-muted-foreground">Revenue</p>
                                                <p className="font-semibold text-sm">{companyInfo.financials.revenue}</p>
                                              </div>
                                            )}
                                            {companyInfo.financials.profit && (
                                              <div className="bg-muted/50 p-2 rounded">
                                                <p className="text-xs text-muted-foreground">Profit</p>
                                                <p className="font-semibold text-sm">{companyInfo.financials.profit}</p>
                                              </div>
                                            )}
                                            {companyInfo.financials.debtToEquity && (
                                              <div className="bg-muted/50 p-2 rounded">
                                                <p className="text-xs text-muted-foreground">D/E Ratio</p>
                                                <p className="font-semibold text-sm">{companyInfo.financials.debtToEquity}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      <div className="border-t pt-3">
                                        <p className="text-xs text-muted-foreground leading-relaxed">{companyInfo.description}</p>
                                      </div>

                                      {companyInfo.trustFactors && companyInfo.trustFactors.length > 0 && (
                                        <div className="border-t pt-3 bg-blue-50 -m-4 mt-3 p-4 rounded-b-lg">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Package className="h-4 w-4 text-blue-700" />
                                            <p className="text-xs font-semibold text-blue-900 uppercase">Load Owner - Trust Factors</p>
                                          </div>
                                          <ul className="text-xs space-y-1.5">
                                            {companyInfo.trustFactors.map((factor, idx) => (
                                              <li key={idx} className="flex items-start gap-2 text-blue-800">
                                                <span className="text-blue-600 mt-0.5">✓</span>
                                                <span>{factor}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-primary" />
                                        <p className="font-semibold">{trip.clientCompany || 'Load Owner'}</p>
                                      </div>
                                      <p className="text-sm text-muted-foreground">Company shipping the goods</p>
                                    </div>
                                  );
                                })()}
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <div className="h-16 w-16 bg-muted rounded-lg border border-dashed flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground cursor-help">Borrower:</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Company requesting financing for this trip</p>
                                </TooltipContent>
                              </Tooltip>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors">
                                    <img
                                      src={trip.loadOwnerLogo}
                                      alt={trip.loadOwnerName}
                                      className="h-6 object-contain"
                                    />
                                    {(() => {
                                      const companyInfo = getCompanyInfo(trip.loadOwnerName);
                                      const rating = companyInfo?.rating || trip.loadOwnerRating;
                                      return rating && (
                                        <div className="flex items-center gap-0.5 pl-2 border-l border-border">
                                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          <span className="text-xs font-medium">{Number(rating).toFixed(1)}</span>
                                        </div>
                                      );
                                    })()}
                                    <Info className="h-3.5 w-3.5 text-primary ml-1" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-96 p-4" side="top" align="start">
                                  {(() => {
                                    const companyInfo = getCompanyInfo(trip.loadOwnerName);
                                    return companyInfo ? (
                                      <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-primary" />
                                            <div>
                                              <h4 className="font-semibold text-base">{companyInfo.name}</h4>
                                              <Badge variant="outline" className="mt-1 text-xs">{companyInfo.industry}</Badge>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg">
                                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                          <div>
                                            <span className="font-bold text-lg">{Number(companyInfo.rating).toFixed(1)}</span>
                                            <span className="text-xs text-muted-foreground ml-1">/ 5.0 Rating</span>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                          {companyInfo.marketCap && (
                                            <div className="flex items-start gap-2">
                                              <TrendingUpIcon className="h-4 w-4 text-green-600 mt-0.5" />
                                              <div>
                                                <p className="text-xs text-muted-foreground">Market Cap</p>
                                                <p className="font-semibold text-sm">{companyInfo.marketCap}</p>
                                              </div>
                                            </div>
                                          )}
                                          {companyInfo.headquarters && (
                                            <div className="flex items-start gap-2">
                                              <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                                              <div>
                                                <p className="text-xs text-muted-foreground">Headquarters</p>
                                                <p className="font-semibold text-sm">{companyInfo.headquarters}</p>
                                              </div>
                                            </div>
                                          )}
                                          {companyInfo.founded && (
                                            <div className="flex items-start gap-2">
                                              <Calendar className="h-4 w-4 text-purple-600 mt-0.5" />
                                              <div>
                                                <p className="text-xs text-muted-foreground">Founded</p>
                                                <p className="font-semibold text-sm">{companyInfo.founded}</p>
                                              </div>
                                            </div>
                                          )}
                                          {companyInfo.employees && (
                                            <div className="flex items-start gap-2">
                                              <Users className="h-4 w-4 text-orange-600 mt-0.5" />
                                              <div>
                                                <p className="text-xs text-muted-foreground">Employees</p>
                                                <p className="font-semibold text-sm">{companyInfo.employees}</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {companyInfo.financials && (
                                          <div className="border-t pt-3 space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">Financials</p>
                                            <div className="grid grid-cols-3 gap-2">
                                              {companyInfo.financials.revenue && (
                                                <div className="bg-muted/50 p-2 rounded">
                                                  <p className="text-xs text-muted-foreground">Revenue</p>
                                                  <p className="font-semibold text-sm">{companyInfo.financials.revenue}</p>
                                                </div>
                                              )}
                                              {companyInfo.financials.profit && (
                                                <div className="bg-muted/50 p-2 rounded">
                                                  <p className="text-xs text-muted-foreground">Profit</p>
                                                  <p className="font-semibold text-sm">{companyInfo.financials.profit}</p>
                                                </div>
                                              )}
                                              {companyInfo.financials.debtToEquity && (
                                                <div className="bg-muted/50 p-2 rounded">
                                                  <p className="text-xs text-muted-foreground">D/E Ratio</p>
                                                  <p className="font-semibold text-sm">{companyInfo.financials.debtToEquity}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        <div className="border-t pt-3">
                                          <p className="text-xs text-muted-foreground leading-relaxed">{companyInfo.description}</p>
                                        </div>

                                        {companyInfo.trustFactors && companyInfo.trustFactors.length > 0 && (
                                          <div className="border-t pt-3 bg-green-50 -m-4 mt-3 p-4 rounded-b-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                              <Shield className="h-4 w-4 text-green-700" />
                                              <p className="text-xs font-semibold text-green-900 uppercase">Trust Factors</p>
                                            </div>
                                            <ul className="text-xs space-y-1.5">
                                              {companyInfo.trustFactors.map((factor, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-green-800">
                                                  <span className="text-green-600 mt-0.5">✓</span>
                                                  <span>{factor}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <p className="font-semibold">{trip.loadOwnerName}</p>
                                        <p className="text-sm text-muted-foreground">Borrower company information</p>
                                      </div>
                                    );
                                  })()}
                                </PopoverContent>
                              </Popover>
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
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Trip Value</p>
                          <p className="font-semibold">{formatCurrency(trip.amount)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Offered Rate</p>
                          <p className="font-semibold text-green-600">{formatPercentage(((trip.interestRate || 12) * 365) / (trip.maturityDays || 30) * 0.7)}% ARR</p>
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
                        <Calendar className="h-4 w-4 text-muted-foreground" />
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
                            value={tripRate}
                            onChange={(e) => updateTripInterestRate(trip.id, parseFloat(e.target.value))}
                            min="0"
                            max="20"
                            step="0.5"
                          />
                          <p className="text-xs text-muted-foreground">
                            Recommended range: 0-20% annually
                          </p>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Investment Amount</span>
                            <span className="font-semibold">
                              {formatCurrency(trip.amount)}
                            </span>
                          </div>
                          {trip.interestRate && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Offered Rate</span>
                              <span className="font-semibold text-green-600">{trip.interestRate}%</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Your Bid Rate</span>
                            <span className="font-semibold">{tripRate}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">ARR (Annual Return)</span>
                            <span className="font-semibold text-accent">
                              {formatCurrency(expectedReturn)}
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
                            onClick={() => handleInvest(trip.id, trip.amount, tripRate)}
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

          {/* Pagination Controls */}
          {filteredTrips.length > 0 && totalPages > 1 && (
            <Card className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <Label htmlFor="itemsPerPage" className="text-xs sm:text-sm whitespace-nowrap">Items per page:</Label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded px-2 py-1 text-xs sm:text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {startIndex + 1}-{Math.min(endIndex, filteredTrips.length)} of {filteredTrips.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="gap-1 h-8 px-2 sm:px-3"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current
                        return page === 1 ||
                               page === totalPages ||
                               (page >= currentPage - 1 && page <= currentPage + 1);
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center gap-1">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-1 text-xs text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-1 h-8 px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </Card>
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
                        <span className="text-sm font-semibold">{formatCurrency(selectedTripForBid.amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip Value Display */}
                <div className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trip Value</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedTripForBid.amount)}
                    </span>
                  </div>
                </div>

                {/* Interest Rate Input */}
                <div>
                  <Label htmlFor="customBidRate">Interest Rate (%)</Label>
                  <Input
                    id="customBidRate"
                    type="number"
                    value={customBidRate}
                    onChange={(e) => setCustomBidRate(parseFloat(e.target.value))}
                    min="0"
                    max="20"
                    step="0.5"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended range: 0-20% annually
                  </p>
                </div>

                {/* ARR (Annual Return) */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-900">ARR (Annual Return)</span>
                    <span className="text-lg font-bold text-green-700">
                      {formatCurrency((selectedTripForBid.amount * ((customBidRate * 365) / (selectedTripForBid.maturityDays || 30)) * 0.7) / 100)}
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    At {formatPercentage(((customBidRate * 365) / (selectedTripForBid.maturityDays || 30)) * 0.7)}% yearly interest on {formatCurrency(selectedTripForBid.amount)}
                  </p>
                </div>

                {/* Wallet Balance Check */}
                <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Your Wallet Balance</span>
                  <span className="font-semibold">{formatCurrencyCompact(wallet.balance, true)}</span>
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
      </TooltipProvider>
    </DashboardLayout>
  );
};

export default InvestmentOpportunities;
