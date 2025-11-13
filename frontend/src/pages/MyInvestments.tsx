import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  IndianRupee,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  TruckIcon,
  Package,
  AlertCircle,
  Lock
} from "lucide-react";
import { auth } from "@/lib/auth";
import { data } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import AdvancedFilter, { type FilterConfig } from "@/components/AdvancedFilter";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";

const MyInvestments = () => {
  const user = auth.getCurrentUser();
  const [myInvestments, setMyInvestments] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>({
    balance: 0,
    escrowedAmount: 0,
    totalInvested: 0,
    totalReturns: 0,
    lockedAmount: 0,
    userId: user?.id || ''
  });
  const [trips, setTrips] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by origin, destination...',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'escrowed', label: 'Escrowed' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'defaulted', label: 'Defaulted' },
      ],
      placeholder: 'Select status',
    },
    {
      id: 'amount',
      label: 'Investment Amount (₹)',
      type: 'range',
      min: 0,
      max: 10000000,
    },
    {
      id: 'interestRate',
      label: 'Interest Rate (%)',
      type: 'range',
      min: 0,
      max: 20,
    },
    {
      id: 'date',
      label: 'Investment Date',
      type: 'date',
    },
  ];

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        console.error('No user ID found - user not authenticated');
        setLoading(false);
        return;
      }

      try {
        const [allInvestments, walletData, allTrips] = await Promise.all([
          data.getInvestments(),
          data.getWallet(user.id),
          data.getTrips()
        ]);

        // Get all users to find company members
        const allUsers = auth.getAllUsers();

        // Get user IDs from the same company (including current user)
        const companyUserIds = user.company
          ? allUsers
              .filter(u => u.company === user.company && u.role === 'lender')
              .map(u => u.id)
          : [user.id];

        // Filter investments for users in the same company
        const companyInvestments = allInvestments.filter(i =>
          companyUserIds.includes(i.lenderId)
        );

        // Create a map of trips for quick lookup
        const tripsMap = new Map(allTrips.map(trip => [trip.id, trip]));

        setMyInvestments(companyInvestments);
        setWallet(walletData);
        setTrips(tripsMap);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, user?.company]);

  // Auto-refresh data every 15 seconds to sync company investments
  useEffect(() => {
    if (!user?.id) return;

    const autoRefresh = async () => {
      try {
        // Silently fetch updated data without showing loading state
        const [allInvestments, walletData, allTrips] = await Promise.all([
          data.getInvestments(),
          data.getWallet(user.id),
          data.getTrips()
        ]);

        const allUsers = auth.getAllUsers();
        const companyUserIds = user.company
          ? allUsers
              .filter(u => u.company === user.company && u.role === 'lender')
              .map(u => u.id)
          : [user.id];

        const companyInvestments = allInvestments.filter(i =>
          companyUserIds.includes(i.lenderId)
        );

        const tripsMap = new Map(allTrips.map(trip => [trip.id, trip]));

        setMyInvestments(companyInvestments);
        setWallet(walletData);
        setTrips(tripsMap);
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    };

    const interval = setInterval(autoRefresh, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [user?.id, user?.company]);

  // Apply filters to investments
  const applyFilters = (investments: any[]) => {
    return investments.filter(investment => {
      const trip = trips.get(investment.tripId);
      if (!trip) return false;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          trip.origin?.toLowerCase().includes(searchLower) ||
          trip.destination?.toLowerCase().includes(searchLower) ||
          trip.loadType?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && investment.status !== filters.status) return false;

      // Amount range filter
      if (filters.amount_min && investment.amount < parseFloat(filters.amount_min)) return false;
      if (filters.amount_max && investment.amount > parseFloat(filters.amount_max)) return false;

      // Interest rate range filter
      if (filters.interestRate_min && investment.interestRate < parseFloat(filters.interestRate_min)) return false;
      if (filters.interestRate_max && investment.interestRate > parseFloat(filters.interestRate_max)) return false;

      // Date filter
      if (filters.date) {
        const investmentDate = new Date(investment.createdAt).toISOString().split('T')[0];
        if (investmentDate !== filters.date) return false;
      }

      return true;
    });
  };

  const escrowedInvestments = applyFilters(myInvestments.filter(i => i.status === 'escrowed'));
  const activeInvestments = applyFilters(myInvestments.filter(i => i.status === 'active'));
  const completedInvestments = applyFilters(myInvestments.filter(i => i.status === 'completed'));
  const defaultedInvestments = applyFilters(myInvestments.filter(i => i.status === 'defaulted'));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'escrowed': return 'bg-primary';
      case 'active': return 'bg-secondary';
      case 'completed': return 'bg-green-500';
      case 'defaulted': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'escrowed': return <Lock className="h-4 w-4" />;
      case 'active': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'defaulted': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTripStatus = (tripId: string) => {
    const trip = trips.get(tripId);
    return trip?.status || 'unknown';
  };

  const getTripDetails = (tripId: string) => {
    return trips.get(tripId);
  };

  const EscrowedInvestmentCard = ({ investment }: { investment: any }) => {
    const trip = getTripDetails(investment.tripId);
    if (!trip) return null;

    // Get lender name for company investments
    const isOwnInvestment = investment.lenderId === user?.id;
    const lenderName = isOwnInvestment
      ? 'You'
      : auth.getAllUsers().find(u => u.id === investment.lenderId)?.name || 'Unknown';

    return (
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-primary" />
                <CardTitle className="text-xl">
                  {trip.origin} → {trip.destination}
                </CardTitle>
                {!isOwnInvestment && (
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    {toTitleCase(lenderName)}'s Investment
                  </Badge>
                )}
              </div>
              <CardDescription>
                {trip.loadType} • {trip.weight}kg • {trip.distance}km
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-1">
                Load Provider: {trip.loadOwnerName}
              </p>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary">
              <Lock className="h-3 w-3 mr-1" />
              Escrowed
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Your bid has been placed and funds are in escrow. Awaiting confirmation...
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Escrowed Amount</p>
                  <p className="font-semibold">₹{(investment.amount / 1000).toFixed(0)}K</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Interest Rate</p>
                  <p className="font-semibold">{investment.interestRate}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Invested At</p>
                  <p className="font-semibold text-sm">
                    {new Date(investment.investedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const InvestmentCard = ({ investment }: { investment: any }) => {
    const trip = getTripDetails(investment.tripId);
    if (!trip) return null;

    const daysToMaturity = Math.ceil(
      (new Date(investment.maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceInvestment = Math.ceil(
      (Date.now() - new Date(investment.investedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const progress = investment.status === 'completed' ? 100 : Math.min((daysSinceInvestment / 30) * 100, 100);

    // Get lender name for company investments
    const isOwnInvestment = investment.lenderId === user?.id;
    const lenderName = isOwnInvestment
      ? 'You'
      : auth.getAllUsers().find(u => u.id === investment.lenderId)?.name || 'Unknown';

    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <CardTitle className="text-xl">
                  {trip.origin} → {trip.destination}
                </CardTitle>
                {!isOwnInvestment && (
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    {toTitleCase(lenderName)}'s Investment
                  </Badge>
                )}
              </div>
              <CardDescription>
                {trip.loadType} • {trip.weight}kg • {trip.distance}km
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-1">
                Load Provider: {trip.loadOwnerName}
              </p>
              {trip.transporterName && (
                <p className="text-sm text-muted-foreground">
                  Vehicle Provider: {trip.transporterName}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge className={getStatusColor(investment.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(investment.status)}
                  {investment.status}
                </span>
              </Badge>
              <Badge variant="outline">
                Trip: {trip.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Investment Details */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Invested Amount</p>
                <p className="font-semibold">₹{(investment.amount / 1000).toFixed(0)}K</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Interest Rate</p>
                <p className="font-semibold">{investment.interestRate}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Expected Return</p>
                <p className="font-semibold text-accent">
                  ₹{(investment.expectedReturn / 1000).toFixed(1)}K
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Maturity Date</p>
                <p className="font-semibold text-sm">
                  {new Date(investment.maturityDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Investment Progress</span>
              <span className="font-semibold">
                {investment.status === 'completed' ? 'Completed' :
                 investment.status === 'defaulted' ? 'Defaulted' :
                 `${daysToMaturity} days remaining`}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  investment.status === 'completed' ? 'bg-green-500' :
                  investment.status === 'defaulted' ? 'bg-destructive' :
                  'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Trip Activity Timeline */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3">Trip Activity</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Trip Created</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(trip.createdAt).toLocaleString()}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>

              {trip.fundedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Investment Funded</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trip.fundedAt).toLocaleString()}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
              )}

              {trip.status === 'in_transit' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-2 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">In Transit</p>
                    <p className="text-xs text-muted-foreground">Vehicle on route</p>
                  </div>
                  <TruckIcon className="h-4 w-4 text-secondary" />
                </div>
              )}

              {trip.completedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Trip Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trip.completedAt).toLocaleString()}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              )}

              {trip.status === 'pending' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-muted rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Awaiting Assignment</p>
                    <p className="text-xs text-muted-foreground">No vehicle assigned yet</p>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Investment Dates */}
          <div className="border-t pt-4 grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Invested On</p>
              <p className="font-medium">{new Date(investment.investedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Days Since Investment</p>
              <p className="font-medium">{daysSinceInvestment} days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout role="lender">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading investments...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="lender">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Lendings</h1>
            <p className="text-muted-foreground mt-1">Track all your lendings and their progress</p>
          </div>
          <AdvancedFilter
            filters={filterConfig}
            currentFilters={filters}
            onFilterChange={setFilters}
            onClearFilters={() => setFilters({})}
          />
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Investments</p>
                <p className="text-3xl font-bold mt-2">{myInvestments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Escrowed</p>
                <p className="text-3xl font-bold mt-2 text-primary">{escrowedInvestments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold mt-2 text-secondary">{activeInvestments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-2 text-green-500">{completedInvestments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Returns</p>
                <p className="text-3xl font-bold mt-2 text-accent">
                  ₹{(wallet.totalReturns / 1000).toFixed(0)}K
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investments Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({myInvestments.length})</TabsTrigger>
            <TabsTrigger value="escrowed">Escrowed ({escrowedInvestments.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeInvestments.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedInvestments.length})</TabsTrigger>
            {defaultedInvestments.length > 0 && (
              <TabsTrigger value="defaulted">Defaulted ({defaultedInvestments.length})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {myInvestments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No investments yet</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {escrowedInvestments.map(investment => (
                  <EscrowedInvestmentCard key={investment.id} investment={investment} />
                ))}
                {activeInvestments.map(investment => (
                  <InvestmentCard key={investment.id} investment={investment} />
                ))}
                {completedInvestments.map(investment => (
                  <InvestmentCard key={investment.id} investment={investment} />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="escrowed" className="space-y-4">
            {escrowedInvestments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No escrowed investments</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Funds in escrow are awaiting confirmation before becoming active
                  </p>
                </CardContent>
              </Card>
            ) : (
              escrowedInvestments.map(investment => (
                <EscrowedInvestmentCard key={investment.id} investment={investment} />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeInvestments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active investments</p>
                </CardContent>
              </Card>
            ) : (
              activeInvestments.map(investment => (
                <InvestmentCard key={investment.id} investment={investment} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedInvestments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed investments</p>
                </CardContent>
              </Card>
            ) : (
              completedInvestments.map(investment => (
                <InvestmentCard key={investment.id} investment={investment} />
              ))
            )}
          </TabsContent>

          {defaultedInvestments.length > 0 && (
            <TabsContent value="defaulted" className="space-y-4">
              {defaultedInvestments.map(investment => (
                <InvestmentCard key={investment.id} investment={investment} />
              ))}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MyInvestments;
