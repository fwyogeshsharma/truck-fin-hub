import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruckIcon, Plus, IndianRupee, TrendingUp, Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { data, Trip, Wallet } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";

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

  /**
   * Effect hook to load trips and wallet data when component mounts
   * or when user ID changes
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch both trips and wallet data in parallel for better performance
        const [allTrips, walletData] = await Promise.all([
          data.getTrips(),
          data.getWallet(user?.id || 'lo1')
        ]);

        // Filter trips to only show those belonging to this load owner
        // Checks both loadOwnerId match and legacy loadOwnerName filter
        const filteredTrips = allTrips.filter(t =>
          t.loadOwnerId === user?.id || t.loadOwnerName.includes('ABC')
        );

        setTrips(filteredTrips);
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

  const repaymentTrips = getRepaymentTrips();

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

      toast({
        title: 'Repayment Successful',
        description: `Successfully repaid ${formatCurrency(totalRepayment)} to ${trip.lenderName}`,
      });

      // Reload trips data
      const allTrips = await data.getTrips();
      const filteredTrips = allTrips.filter(t =>
        t.loadOwnerId === user?.id || t.loadOwnerName.includes('ABC')
      );
      setTrips(filteredTrips);

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
      <div className="space-y-6">
        {/* Header section with user name and Create Trip button */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : "User"}'s Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your trips and financing requests</p>
          </div>
          <Button className="bg-gradient-primary gap-2" onClick={() => navigate('/create-trip')}>
            <Plus className="h-4 w-4" />
            Create Trip
          </Button>
        </div>

        {/* Tabs for Dashboard and Repayments */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="repayments">
              Repayments {repaymentTrips.length > 0 && `(${repaymentTrips.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">

        {/* Stats section - displays key metrics in card format */}
        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full bg-${stat.color}/10 flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 text-${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Wallet Balance section - shows available, locked, and total financed amounts */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
            <CardDescription>Available funds and locked amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-secondary">₹{(wallet.balance / 1000).toFixed(0)}K</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Locked Amount</p>
                <p className="text-2xl font-bold text-accent">₹{(wallet.lockedAmount / 1000).toFixed(0)}K</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Financed</p>
                <p className="text-2xl font-bold text-primary">₹{(wallet.totalInvested / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Trips section - lists up to 5 most recent trips with status and financial details */}
        <Card>
          <CardHeader>
            <CardTitle>Your Trips</CardTitle>
            <CardDescription>Recent trip financing requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trips.slice(0, 5).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{trip.origin} → {trip.destination}</h4>
                      {/* Status badge with conditional styling based on trip status */}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        trip.status === 'funded' ? 'bg-secondary/20 text-secondary' :
                        trip.status === 'pending' ? 'bg-accent/20 text-accent' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                    {/* Trip details: load type, weight, and distance */}
                    <p className="text-sm text-muted-foreground">{trip.loadType} • {trip.weight}kg • {trip.distance}km</p>
                  </div>
                  {/* Financial information section */}
                  <div className="text-right">
                    <p className="font-semibold">₹{(trip.amount / 1000).toFixed(0)}K</p>
                    <p className="text-sm text-muted-foreground">Requested: ₹{(trip.amount / 1000).toFixed(0)}K</p>
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

          {/* Repayments Tab */}
          <TabsContent value="repayments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Repayments</CardTitle>
                <CardDescription>
                  Completed trips awaiting loan repayment - sorted by urgency (maturity date)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {repaymentTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending repayments</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      All completed trips have been repaid
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                        <Card key={trip.id} className={`${isOverdue ? 'border-red-500 bg-red-50/50' : isUrgent ? 'border-orange-500 bg-orange-50/50' : ''}`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                {/* Trip Info */}
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-lg">
                                      {trip.origin} → {trip.destination}
                                    </h4>
                                    <Badge variant="secondary">Completed</Badge>
                                    {isOverdue && (
                                      <Badge variant="destructive" className="flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Overdue
                                      </Badge>
                                    )}
                                    {isUrgent && !isOverdue && (
                                      <Badge className="bg-orange-600 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Urgent
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {trip.loadType} • {trip.weight}kg • {trip.distance}km
                                  </p>
                                </div>

                                {/* Lender Info */}
                                <div className="bg-muted/50 p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Lender</p>
                                  <p className="font-medium">{trip.lenderName}</p>
                                </div>

                                {/* Financial Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Principal</p>
                                    <p className="font-semibold">{formatCurrency(principal)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Interest ({interestRate}%)</p>
                                    <p className="font-semibold text-orange-600">{formatCurrency(interest)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total Repayment</p>
                                    <p className="font-semibold text-primary">{formatCurrency(totalRepayment)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Maturity Days
                                    </p>
                                    <p className={`font-semibold ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : ''}`}>
                                      {daysToMaturity !== null ? (
                                        isOverdue ? `Overdue by ${Math.abs(daysToMaturity)} days` : `${daysToMaturity} days left`
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

                              {/* Repay Button */}
                              <div className="flex flex-col items-end gap-2">
                                <Button
                                  onClick={() => handleRepayment(trip)}
                                  disabled={repaying[trip.id]}
                                  className={`${isOverdue || isUrgent ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                >
                                  {repaying[trip.id] ? (
                                    <>
                                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <IndianRupee className="h-4 w-4 mr-2" />
                                      Repay {formatCurrency(totalRepayment)}
                                    </>
                                  )}
                                </Button>
                                {isOverdue && (
                                  <p className="text-xs text-red-600 font-medium">
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default LoadOwnerDashboard;
