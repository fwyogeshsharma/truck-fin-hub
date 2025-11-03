import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruckIcon, CheckCircle2, Clock, MapPin, IndianRupee, Wallet as WalletIcon, TrendingUp, DollarSign, X } from "lucide-react";
import { auth } from "@/lib/auth";
import { data, Trip, Wallet } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrencyForTransporter, formatCurrency } from "@/lib/currency";
import WalletCard from "@/components/WalletCard";
import { toTitleCase } from "@/lib/utils";

const TransporterDashboard = () => {
  const user = auth.getCurrentUser();
  const availableTripsRef = useRef<HTMLDivElement>(null);
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [wallet, setWallet] = useState<Wallet>({
    userId: user?.id || 't1',
    balance: 0,
    lockedAmount: 0,
    escrowedAmount: 0,
    totalInvested: 0,
    totalReturns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allTrips, walletData] = await Promise.all([
          data.getTrips(),
          data.getWallet(user?.id || 't1')
        ]);

        // Filter trips for this transporter
        const filteredTrips = allTrips.filter(t =>
          t.transporterId === user?.id || t.status === 'funded'
        );

        setMyTrips(filteredTrips);
        setWallet(walletData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Calculate financial analytics
  const completedTrips = myTrips.filter(t => t.status === 'completed' || t.status === 'repaid');
  const totalEarnings = completedTrips.reduce((sum, trip) => sum + trip.amount, 0);

  // Calculate interest paid (if this transporter is also a borrower)
  const repaidTrips = myTrips.filter(t => t.status === 'repaid' && t.repaymentInterest);
  const totalInterestPaid = repaidTrips.reduce((sum, trip) => sum + (trip.repaymentInterest || 0), 0);

  // Calculate average trip value
  const avgTripValue = completedTrips.length > 0 ? totalEarnings / completedTrips.length : 0;

  const stats = [
    {
      title: "Active Trips",
      value: myTrips.filter(t => t.status === 'in_transit').length,
      icon: TruckIcon,
      color: "primary",
    },
    {
      title: "Completed This Month",
      value: myTrips.filter(t => t.status === 'completed').length,
      icon: CheckCircle2,
      color: "secondary",
    },
    {
      title: "Pending Acceptance",
      value: myTrips.filter(t => t.status === 'funded' && !t.transporterId).length,
      icon: Clock,
      color: "accent",
    },
  ];

  const scrollToAvailableTrips = (filter?: string) => {
    if (filter) {
      setStatusFilter(filter);
    }
    availableTripsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearFilter = () => {
    setStatusFilter(null);
  };

  const handleAcceptTrip = async (tripId: string) => {
    await data.updateTrip(tripId, {
      transporterId: user?.id,
      transporterName: user?.name || 'Vehicle Provider',
      status: 'in_transit',
    });
    // Reload data to show updated trip
    const allTrips = await data.getTrips();
    const filteredTrips = allTrips.filter(t =>
      t.transporterId === user?.id || t.status === 'funded'
    );
    setMyTrips(filteredTrips);
  };

  const handleCompleteTrip = async (tripId: string) => {
    await data.updateTrip(tripId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
    // Reload data to show updated trip
    const allTrips = await data.getTrips();
    const filteredTrips = allTrips.filter(t =>
      t.transporterId === user?.id || t.status === 'funded'
    );
    setMyTrips(filteredTrips);
  };

  if (loading) {
    return (
      <DashboardLayout role="transporter">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="transporter">
      <div className="space-y-4 md:space-y-6">
        <div className="px-1">
          <h1 className="text-lg md:text-2xl font-bold">{toTitleCase(user?.name) || "User"}'s Dashboard</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">Manage your trips and deliveries</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const getFilterStatus = () => {
              if (stat.title === "Pending Acceptance") return 'pending';
              if (stat.title === "Active Trips") return 'active';
              if (stat.title === "Completed This Month") return 'completed';
              return null;
            };
            const filterStatus = getFilterStatus();
            const isLastCard = index === stats.length - 1;
            return (
              <Card
                key={stat.title}
                className={`${filterStatus ? 'cursor-pointer hover:border-primary transition-colors hover:shadow-md' : ''} ${isLastCard ? 'col-span-2 md:col-span-1' : ''}`}
                onClick={filterStatus ? () => scrollToAvailableTrips(filterStatus) : undefined}
              >
                <CardContent className="p-3 md:pt-6 md:pb-6 md:px-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] md:text-sm text-muted-foreground truncate">{stat.title}</p>
                      <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 tabular-nums">{stat.value}</p>
                    </div>
                    <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full bg-${stat.color}/10 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-4 w-4 md:h-6 md:w-6 text-${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Wallet */}
        {user?.id && <WalletCard userId={user.id} showDetails={true} />}

        {/* Financial Analytics */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Financial Analytics
            </CardTitle>
            <CardDescription className="text-xs">Your earnings overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {/* Total Earnings */}
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm text-muted-foreground">
                  <span>Total Earnings</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-primary">
                  {formatCurrency(totalEarnings)}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  {completedTrips.length} trips
                </p>
              </div>

              {/* Average Trip Value */}
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm text-muted-foreground">
                  <TruckIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>Avg Trip</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-secondary">
                  {formatCurrency(avgTripValue)}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  Per trip
                </p>
              </div>

              {/* Interest Paid */}
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>Interest</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-orange-600">
                  {formatCurrency(totalInterestPaid)}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  {repaidTrips.length} trips
                </p>
              </div>

              {/* Wallet Balance */}
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm text-muted-foreground">
                  <WalletIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>Balance</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  {formatCurrency(wallet.balance)}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  Available
                </p>
              </div>
            </div>

            {/* Detailed Interest Breakdown */}
            {repaidTrips.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3">Interest Paid Breakdown</h4>
                <div className="space-y-2">
                  {repaidTrips.slice(0, 5).map((trip) => (
                    <div key={trip.id} className="flex flex-col gap-2 p-2.5 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5 flex-1 min-w-0">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="font-medium text-xs flex-1 min-w-0">
                            {trip.origin} → {trip.destination}
                          </p>
                        </div>
                        <p className="font-bold text-orange-600 text-sm whitespace-nowrap">
                          {formatCurrency(trip.repaymentInterest || 0)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pl-5">
                        <span className="truncate">{trip.loadType}</span>
                        <span className="whitespace-nowrap ml-2">
                          {trip.interestRate}% • {trip.repaymentDays || trip.maturityDays}d
                        </span>
                      </div>
                    </div>
                  ))}
                  {repaidTrips.length > 5 && (
                    <p className="text-[10px] text-center text-muted-foreground pt-1">
                      +{repaidTrips.length - 5} more trips
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Trips Section with Filters */}
        <div ref={availableTripsRef}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg flex items-center gap-2 flex-wrap">
                  {statusFilter === 'pending' && 'Available Trips'}
                  {statusFilter === 'active' && 'Active Trips'}
                  {statusFilter === 'completed' && 'Completed Trips'}
                  {!statusFilter && 'All Trips'}
                  {statusFilter === 'pending' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      Pending
                    </span>
                  )}
                  {statusFilter === 'active' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary flex items-center gap-1">
                      <TruckIcon className="h-2.5 w-2.5" />
                      In Transit
                    </span>
                  )}
                  {statusFilter === 'completed' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Completed
                    </span>
                  )}
                </CardTitle>
                {statusFilter && (
                  <Button variant="ghost" size="sm" onClick={clearFilter} className="gap-1 h-7 px-2">
                    <X className="h-3 w-3" />
                    <span className="text-xs">Clear</span>
                  </Button>
                )}
              </div>
              <CardDescription className="text-[10px] md:text-sm">
                {statusFilter === 'pending' && 'Funded trips awaiting assignment'}
                {statusFilter === 'active' && 'Trips currently in transit'}
                {statusFilter === 'completed' && 'Successfully completed trips'}
                {!statusFilter && 'View all your trips'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {/* Pending Trips */}
              {(statusFilter === 'pending' || !statusFilter) && (
                <>
                  {!statusFilter && myTrips.filter(t => t.status === 'funded' && !t.transporterId).length > 0 && (
                    <h3 className="font-semibold text-xs md:text-sm text-muted-foreground mb-2">Pending Acceptance</h3>
                  )}
                  {myTrips.filter(t => t.status === 'funded' && !t.transporterId).length === 0 && statusFilter === 'pending' ? (
                    <div className="text-center py-6 md:py-8 text-muted-foreground">
                      <Clock className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs md:text-sm">No pending trips available at the moment</p>
                    </div>
                  ) : (
                    myTrips.filter(t => t.status === 'funded' && !t.transporterId).slice(0, statusFilter === 'pending' ? undefined : 3).map((trip) => (
                      <div key={trip.id} className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between md:p-4 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                            <h4 className="font-semibold text-sm md:text-base truncate">{trip.origin} → {trip.destination}</h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent whitespace-nowrap">Pending</span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground">{trip.loadType} • {trip.weight} kg • {trip.distance} km</p>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
                          <div className="text-left md:text-right">
                            <p className="font-semibold text-sm md:text-base text-secondary">{formatCurrencyForTransporter(trip.amount)}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">Payment</p>
                          </div>
                          <Button className="bg-gradient-primary h-8 px-3 text-sm md:h-10 md:px-4 md:text-base" onClick={() => handleAcceptTrip(trip.id)}>
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* Active Trips */}
              {(statusFilter === 'active' || !statusFilter) && (
                <>
                  {!statusFilter && myTrips.filter(t => t.status === 'in_transit').length > 0 && (
                    <h3 className="font-semibold text-xs md:text-sm text-muted-foreground mb-2 mt-4 md:mt-6">Active Trips</h3>
                  )}
                  {myTrips.filter(t => t.status === 'in_transit').length === 0 && statusFilter === 'active' ? (
                    <div className="text-center py-6 md:py-8 text-muted-foreground">
                      <TruckIcon className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs md:text-sm">No active trips at the moment</p>
                    </div>
                  ) : (
                    myTrips.filter(t => t.status === 'in_transit').map((trip) => (
                      <div key={trip.id} className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between md:p-4 border rounded-lg bg-primary/5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <TruckIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                            <h4 className="font-semibold text-sm md:text-base truncate">{trip.origin} → {trip.destination}</h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary whitespace-nowrap">In Transit</span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground">{trip.loadType} • {trip.weight} kg</p>
                        </div>
                        <Button variant="outline" className="h-8 px-3 text-sm md:h-10 md:px-4 md:text-base w-full md:w-auto" onClick={() => handleCompleteTrip(trip.id)}>
                          Mark Complete
                        </Button>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* Completed Trips */}
              {(statusFilter === 'completed' || !statusFilter) && (
                <>
                  {!statusFilter && myTrips.filter(t => t.status === 'completed').length > 0 && (
                    <h3 className="font-semibold text-xs md:text-sm text-muted-foreground mb-2 mt-4 md:mt-6">Completed Trips</h3>
                  )}
                  {myTrips.filter(t => t.status === 'completed').length === 0 && statusFilter === 'completed' ? (
                    <div className="text-center py-6 md:py-8 text-muted-foreground">
                      <CheckCircle2 className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs md:text-sm">No completed trips yet</p>
                    </div>
                  ) : (
                    myTrips.filter(t => t.status === 'completed').slice(0, statusFilter === 'completed' ? undefined : 3).map((trip) => (
                      <div key={trip.id} className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between md:p-4 border rounded-lg bg-secondary/5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-secondary flex-shrink-0" />
                            <h4 className="font-semibold text-sm md:text-base truncate">{trip.origin} → {trip.destination}</h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary whitespace-nowrap">Completed</span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground">{trip.loadType} • {trip.weight} kg</p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="font-semibold text-sm md:text-base text-secondary">{formatCurrencyForTransporter(trip.amount)}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground">Earned</p>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* Show message when no filter and no trips */}
              {!statusFilter &&
                myTrips.filter(t => t.status === 'funded' && !t.transporterId).length === 0 &&
                myTrips.filter(t => t.status === 'in_transit').length === 0 &&
                myTrips.filter(t => t.status === 'completed').length === 0 && (
                  <div className="text-center py-6 md:py-8 text-muted-foreground">
                    <TruckIcon className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs md:text-sm">No trips available</p>
                  </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TransporterDashboard;
