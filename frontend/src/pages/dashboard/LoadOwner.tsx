import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruckIcon, Plus, IndianRupee, TrendingUp, Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { data, Trip, Wallet } from "@/lib/data";
import { apiClient } from "@/api/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import RatingDialog from "@/components/RatingDialog";
import { toTitleCase } from "@/lib/utils";

/**
 * LoadOwnerDashboard Component
 *
 * Main dashboard for Load Owners (truck/transport company owners) who need
 * financing for their trips. This component displays:
 * - Active trips and financing requests
 * - Wallet balance and financial overview
 * - Statistics on trip status and financing
 * - Quick access to create new trip financing requests
 */
const LoadOwnerDashboard = () => {
  const navigate = useNavigate();
  const user = auth.getCurrentUser();
  const { toast } = useToast();

  // State for storing trips owned by this load owner
  const [trips, setTrips] = useState<Trip[]>([]);

  // Wallet state containing balance, locked amounts, and investment totals
  const [wallet, setWallet] = useState<Wallet>({
    userId: user?.id || 'lo1',
    balance: 0,
    lockedAmount: 0,
    escrowedAmount: 0,
    totalInvested: 0,
    totalReturns: 0,
  });

  // Loading state for data fetching
  const [loading, setLoading] = useState(true);
  const [repaying, setRepaying] = useState<Record<string, boolean>>({});

  // Rating dialog states
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [tripForRating, setTripForRating] = useState<Trip | null>(null);

  /**
   * Effect hook to load trips and wallet data when component mounts
   * or when user ID changes
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load trips for this load owner by user ID using API
        let trips;
        if (user?.id) {
          // Use API to get trips by load_owner_id
          trips = await apiClient.get<Trip[]>(`/trips?loadOwnerId=${user.id}`);
        } else {
          trips = await data.getTrips();
        }

        // Fetch wallet data
        const walletData = await data.getWallet(user?.id || 'lo1');

        setTrips(trips);
        setWallet(walletData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Calculate days remaining until maturity
  const getDaysToMaturity = (trip: Trip) => {
    if (!trip.fundedAt || !trip.maturityDays) return null;

    const fundedDate = new Date(trip.fundedAt);
    const maturityDate = new Date(fundedDate);
    maturityDate.setDate(fundedDate.getDate() + trip.maturityDays);

    const today = new Date();
    const daysRemaining = Math.ceil((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return daysRemaining;
  };

  // Get trips that need repayment (completed but not yet repaid)
  const getRepaymentTrips = () => {
    return trips
      .filter(trip => trip.status === 'completed' && trip.lenderId)
      .map(trip => ({
        ...trip,
        daysToMaturity: getDaysToMaturity(trip),
      }))
      .sort((a, b) => {
        // Sort by days to maturity (urgent ones first - negative or low days first)
        const daysA = a.daysToMaturity ?? Infinity;
        const daysB = b.daysToMaturity ?? Infinity;
        return daysA - daysB;
      });
  };

  // Get trips that have been repaid
  const getRepaidTrips = () => {
    return trips
      .filter(trip => trip.status === 'repaid' && trip.lenderId)
      .sort((a, b) => {
        // Sort by repaid date (most recent first)
        const dateA = a.repaidAt ? new Date(a.repaidAt).getTime() : 0;
        const dateB = b.repaidAt ? new Date(b.repaidAt).getTime() : 0;
        return dateB - dateA;
      });
  };

  const repaymentTrips = getRepaymentTrips();
  const repaidTrips = getRepaidTrips();

  // Handle repayment
  const handleRepayment = async (trip: Trip) => {
    if (!trip.lenderId || !trip.lenderName) {
      toast({
        title: 'Error',
        description: 'No lender information found for this trip',
        variant: 'destructive',
      });
      return;
    }

    setRepaying(prev => ({ ...prev, [trip.id]: true }));

    try {
      // Calculate repayment details
      const principal = trip.amount;
      const interestRate = trip.interestRate || 0;
      const maturityDays = trip.maturityDays || 30;

      // Process repayment via new repayment endpoint
      const API_URL = import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD ? 'https://34.93.247.3/api' : '/api');

      const response = await fetch(`${API_URL}/wallets/repayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trip_id: trip.id,
          borrower_id: user?.id || '',
          lender_id: trip.lenderId,
          principal_amount: principal,
          interest_rate: interestRate,
          maturity_days: maturityDays,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process repayment');
      }

      const repaymentResult = await response.json();
      const totalRepayment = repaymentResult.repayment_details.total;

      // Update local wallet state with new balance
      if (repaymentResult.borrower_wallet) {
        setWallet(repaymentResult.borrower_wallet);
      }

      toast({
        title: 'Repayment Successful',
        description: `Successfully repaid ${formatCurrency(totalRepayment)} to ${toTitleCase(trip.lenderName)}. New balance: ${formatCurrency(repaymentResult.borrower_wallet?.balance || 0)}`,
      });

      // Reload trips and wallet data
      // Reload trips and wallet after repayment
      const trips = user?.id
        ? await apiClient.get<Trip[]>(`/trips?loadOwnerId=${user.id}`)
        : await data.getTrips();
      const walletData = await data.getWallet(user?.id || 'lo1');

      setTrips(trips);
      setWallet(walletData);

      // Open rating dialog after successful repayment
      setTripForRating(trip);
      setRatingDialogOpen(true);

    } catch (error: any) {
      console.error('Repayment error:', error);
      toast({
        title: 'Repayment Failed',
        description: error?.message || 'Failed to process repayment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRepaying(prev => ({ ...prev, [trip.id]: false }));
    }
  };

  /**
   * Dashboard statistics cards showing key metrics:
   * - Active Trips: Count of trips that are pending, funded, or in transit
   * - Total Financed: Sum of all trips that have been financed (have interest rate)
   * - Pending Requests: Count of trips awaiting funding approval
   */
  const stats = [
    {
      title: "Active Trips",
      value: trips.filter(t => ['pending', 'funded', 'in_transit'].includes(t.status)).length,
      icon: TruckIcon,
      color: "primary",
    },
    {
      title: "Total Financed",
      value: `₹${(trips.reduce((sum, t) => sum + (t.interestRate ? t.amount : 0), 0) / 100000).toFixed(1)}L`,
      icon: IndianRupee,
      color: "secondary",
    },
    {
      title: "Pending Requests",
      value: trips.filter(t => t.status === 'pending').length,
      icon: TrendingUp,
      color: "accent",
    },
  ];

  // Show loading state while fetching data
  if (loading) {
    return (
      <DashboardLayout role="load_owner">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="load_owner">
      <div className="mobile-section-spacing">
        {/* Header section with user name and Create Trip button - Mobile optimized */}
        <div className="mobile-stack">
          <div className="flex-1">
            <h1 className="responsive-heading-2">{user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : "User"}'s Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your trips and financing requests</p>
          </div>
          <Button className="bg-gradient-primary gap-2 mobile-button w-full sm:w-auto touch-target" onClick={() => navigate('/create-trip')}>
            <Plus className="h-4 w-4" />
            <span>Create Trip</span>
          </Button>
        </div>

        {/* Tabs for Dashboard, Repayments, and Repaid Loans - Mobile optimized */}
        <Tabs defaultValue="dashboard" className="mobile-section-spacing">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="repayments" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5">
              <span className="hidden sm:inline">Pending </span>Repayments {repaymentTrips.length > 0 && `(${repaymentTrips.length})`}
            </TabsTrigger>
            <TabsTrigger value="repaid" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5">
              <span className="hidden sm:inline">Repaid </span>Loans {repaidTrips.length > 0 && `(${repaidTrips.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mobile-section-spacing">

        {/* Stats section - displays key metrics in card format - Mobile optimized */}
        <div className="mobile-stat-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="dashboard-stat-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
                      <p className="stat-value mt-1 sm:mt-2">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-${stat.color}/10 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Wallet Balance section - shows available, locked, and total financed amounts - Mobile optimized */}
        <Card className="bg-gradient-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Wallet Balance</CardTitle>
            <CardDescription className="text-sm">Available funds and locked amounts</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="mobile-stat-grid">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Available Balance</p>
                <p className="text-xl sm:text-2xl font-bold text-secondary">₹{(wallet.balance / 1000).toFixed(0)}K</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Locked Amount</p>
                <p className="text-xl sm:text-2xl font-bold text-accent">₹{(wallet.lockedAmount / 1000).toFixed(0)}K</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Financed</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">₹{(wallet.totalInvested / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Trips section - lists up to 5 most recent trips with status and financial details - Mobile optimized */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Your Trips</CardTitle>
            <CardDescription className="text-sm">Recent trip financing requests</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="touch-spacing-y">
              {trips.slice(0, 5).map((trip) => (
                <div key={trip.id} className="mobile-list-item border rounded-lg hover:bg-muted/50 transition-colors flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-sm sm:text-base">{trip.origin} → {trip.destination}</h4>
                      {/* Status badge with conditional styling based on trip status */}
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                        trip.status === 'funded' ? 'bg-secondary/20 text-secondary' :
                        trip.status === 'pending' ? 'bg-accent/20 text-accent' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                    {/* Trip details: load type, weight, and distance */}
                    <p className="text-xs sm:text-sm text-muted-foreground">{trip.loadType} • {trip.weight} kg • {trip.distance} km</p>
                  </div>
                  {/* Financial information section */}
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="font-semibold text-sm sm:text-base">₹{(trip.amount / 1000).toFixed(0)}K</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Requested: ₹{(trip.amount / 1000).toFixed(0)}K</p>
                    {trip.interestRate && (
                      <p className="text-xs text-secondary">{trip.interestRate.toFixed(2)}% interest</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Repayments Tab - Mobile optimized */}
          <TabsContent value="repayments" className="mobile-section-spacing">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Pending Repayments</CardTitle>
                <CardDescription className="text-sm">
                  Completed trips awaiting loan repayment - sorted by urgency (maturity date)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {repaymentTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm sm:text-base">No pending repayments</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      All completed trips have been repaid
                    </p>
                  </div>
                ) : (
                  <div className="touch-spacing-y">
                    {repaymentTrips.map((trip: any) => {
                      const principal = trip.amount;
                      const interestRate = trip.interestRate || 0;
                      const maturityDays = trip.maturityDays || 30;
                      const interest = (principal * (interestRate / 365) * maturityDays) / 100;
                      const totalRepayment = principal + interest;
                      const daysToMaturity = trip.daysToMaturity;
                      const isOverdue = daysToMaturity !== null && daysToMaturity < 0;
                      const isUrgent = daysToMaturity !== null && daysToMaturity >= 0 && daysToMaturity <= 3;

                      return (
                        <Card key={trip.id} className={`${isOverdue ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20' : isUrgent ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20' : ''}`}>
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col lg:flex-row items-start gap-4">
                              <div className="flex-1 w-full touch-spacing-y">
                                {/* Trip Info */}
                                <div>
                                  <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-semibold text-base sm:text-lg">
                                      {trip.origin} → {trip.destination}
                                    </h4>
                                    <Badge variant="secondary" className="text-xs">Completed</Badge>
                                    {isOverdue && (
                                      <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                                        <AlertCircle className="h-3 w-3" />
                                        Overdue
                                      </Badge>
                                    )}
                                    {isUrgent && !isOverdue && (
                                      <Badge className="bg-orange-600 flex items-center gap-1 text-xs">
                                        <Clock className="h-3 w-3" />
                                        Urgent
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    {trip.loadType} • {trip.weight} kg • {trip.distance} km
                                  </p>
                                </div>

                                {/* Lender Info */}
                                <div className="bg-muted/50 p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Lender</p>
                                  <p className="font-medium text-sm sm:text-base">{toTitleCase(trip.lenderName)}</p>
                                </div>

                                {/* Financial Details - Mobile optimized grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Principal</p>
                                    <p className="font-semibold text-sm sm:text-base">{formatCurrency(principal)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Interest ({interestRate}%)</p>
                                    <p className="font-semibold text-orange-600 text-sm sm:text-base">{formatCurrency(interest)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total Repayment</p>
                                    <p className="font-semibold text-primary text-sm sm:text-base">{formatCurrency(totalRepayment)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Maturity
                                    </p>
                                    <p className={`font-semibold text-sm sm:text-base ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : ''}`}>
                                      {daysToMaturity !== null ? (
                                        isOverdue ? `${Math.abs(daysToMaturity)}d overdue` : `${daysToMaturity}d left`
                                      ) : (
                                        `${maturityDays} days`
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {/* Dates */}
                                {trip.fundedAt && (
                                  <div className="text-xs text-muted-foreground">
                                    Funded: {new Date(trip.fundedAt).toLocaleDateString()} •
                                    Completed: {trip.completedAt ? new Date(trip.completedAt).toLocaleDateString() : 'N/A'}
                                  </div>
                                )}
                              </div>

                              {/* Repay Button - Full width on mobile */}
                              <div className="flex flex-col items-stretch lg:items-end gap-2 w-full lg:w-auto">
                                <Button
                                  onClick={() => handleRepayment(trip)}
                                  disabled={repaying[trip.id]}
                                  className={`${isOverdue || isUrgent ? 'bg-red-600 hover:bg-red-700' : ''} mobile-button w-full lg:w-auto touch-target`}
                                >
                                  {repaying[trip.id] ? (
                                    <>
                                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                                      <span>Processing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Repay {formatCurrency(totalRepayment)}</span>
                                    </>
                                  )}
                                </Button>
                                {isOverdue && (
                                  <p className="text-xs text-red-600 font-medium text-center lg:text-right">
                                    Late payment penalties may apply
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Repaid Loans Tab */}
          <TabsContent value="repaid" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  Repaid Loans
                </CardTitle>
                <CardDescription>
                  Successfully completed loan repayments - View repayment details and history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {repaidTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No repaid loans yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Completed loan repayments will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {repaidTrips.map((trip: Trip) => {
                      const repaidDate = trip.repaidAt ? new Date(trip.repaidAt) : null;
                      const formattedDate = repaidDate ? repaidDate.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A';

                      return (
                        <Card key={trip.id} className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col lg:flex-row items-start gap-4">
                              <div className="flex-1 w-full touch-spacing-y">
                                {/* Trip Info */}
                                <div>
                                  <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-semibold text-base sm:text-lg">
                                      {trip.origin} → {trip.destination}
                                    </h4>
                                    <Badge className="bg-green-600 text-xs">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Repaid
                                    </Badge>
                                  </div>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    {trip.loadType} • {trip.weight} kg • {trip.distance} km
                                  </p>
                                </div>

                                {/* Lender Info */}
                                <div className="bg-muted/50 p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Lender</p>
                                  <p className="font-medium text-sm sm:text-base">{toTitleCase(trip.lenderName) || 'Unknown Lender'}</p>
                                </div>

                                {/* Repayment Details - Mobile optimized grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Principal</p>
                                    <p className="font-semibold text-sm sm:text-base">₹{((trip.repaymentPrincipal || trip.amount) / 1000).toFixed(0)}K</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Interest Paid</p>
                                    <p className="font-semibold text-orange-600 text-sm sm:text-base">₹{((trip.repaymentInterest || 0) / 1000).toFixed(2)}K</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total Repaid</p>
                                    <p className="font-semibold text-green-600 text-sm sm:text-base">₹{((trip.repaymentAmount || trip.amount) / 1000).toFixed(2)}K</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Days</p>
                                    <p className="font-semibold text-sm sm:text-base">{trip.repaymentDays || trip.maturityDays || 0} days</p>
                                  </div>
                                  <div className="col-span-2 sm:col-span-1">
                                    <p className="text-xs text-muted-foreground">Repaid On</p>
                                    <p className="font-semibold text-xs">{formattedDate}</p>
                                  </div>
                                </div>

                                {/* Calculation Summary */}
                                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">Repayment Calculation</p>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <p>Principal: ₹{((trip.repaymentPrincipal || trip.amount) / 1000).toFixed(2)}K</p>
                                    <p>Interest ({trip.interestRate}% for {trip.repaymentDays || trip.maturityDays} days): ₹{((trip.repaymentInterest || 0) / 1000).toFixed(2)}K</p>
                                    <p className="font-bold text-green-700 dark:text-green-400 pt-1 border-t">
                                      Total: ₹{((trip.repaymentAmount || trip.amount) / 1000).toFixed(2)}K
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="flex flex-col items-center lg:items-end gap-2 w-full lg:w-auto">
                                <Badge className="bg-green-600 text-white text-xs flex items-center gap-1 px-3 py-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Loan Closed
                                </Badge>
                                {trip.repaidAt && (
                                  <p className="text-xs text-muted-foreground text-center lg:text-right">
                                    Closed {Math.floor((Date.now() - new Date(trip.repaidAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rating Dialog */}
        {tripForRating && (
          <RatingDialog
            open={ratingDialogOpen}
            onClose={() => {
              setRatingDialogOpen(false);
              setTripForRating(null);
            }}
            onRatingSubmitted={async () => {
              // Reload trips after rating is submitted
              const trips = user?.id
                ? await apiClient.get<Trip[]>(`/trips?loadOwnerId=${user.id}`)
                : await data.getTrips();
              setTrips(trips);
            }}
            tripId={tripForRating.id}
            lenderId={tripForRating.lenderId || ''}
            lenderName={toTitleCase(tripForRating.lenderName) || 'Unknown'}
            borrowerId={user?.id || ''}
            borrowerName={toTitleCase(user?.name) || ''}
            loanAmount={tripForRating.amount || 0}
            interestRate={tripForRating.interestRate || 0}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default LoadOwnerDashboard;
