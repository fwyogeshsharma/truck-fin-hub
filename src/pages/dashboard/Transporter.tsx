import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruckIcon, CheckCircle2, Clock, MapPin, IndianRupee, Wallet as WalletIcon, TrendingUp, DollarSign } from "lucide-react";
import { auth } from "@/lib/auth";
import { data, Trip, Wallet } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrencyForTransporter, formatCurrency } from "@/lib/currency";
import WalletCard from "@/components/WalletCard";
import { toTitleCase } from "@/lib/utils";

const TransporterDashboard = () => {
  const user = auth.getCurrentUser();
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{toTitleCase(user?.name) || "User"}'s Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your trips and deliveries</p>
        </div>

        {/* Stats */}
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

        {/* Wallet */}
        {user?.id && <WalletCard userId={user.id} showDetails={true} />}

        {/* Financial Analytics */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Financial Analytics
            </CardTitle>
            <CardDescription>Your earnings and financial overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {/* Total Earnings */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IndianRupee className="h-4 w-4" />
                  <span>Total Earnings</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(totalEarnings)}
                </p>
                <p className="text-xs text-muted-foreground">
                  From {completedTrips.length} completed trips
                </p>
              </div>

              {/* Average Trip Value */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TruckIcon className="h-4 w-4" />
                  <span>Avg Trip Value</span>
                </div>
                <p className="text-2xl font-bold text-secondary">
                  {formatCurrency(avgTripValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Per completed trip
                </p>
              </div>

              {/* Interest Paid */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Interest Paid</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totalInterestPaid)}
                </p>
                <p className="text-xs text-muted-foreground">
                  On {repaidTrips.length} financed trips
                </p>
              </div>

              {/* Wallet Balance */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <WalletIcon className="h-4 w-4" />
                  <span>Available Balance</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(wallet.balance)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ready to use
                </p>
              </div>
            </div>

            {/* Detailed Interest Breakdown */}
            {repaidTrips.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Interest Paid Breakdown
                </h4>
                <div className="space-y-3">
                  {repaidTrips.slice(0, 5).map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{trip.origin} → {trip.destination}</p>
                        <p className="text-xs text-muted-foreground">
                          {trip.loadType} • Principal: {formatCurrency(trip.repaymentPrincipal || trip.amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-600">
                          {formatCurrency(trip.repaymentInterest || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {trip.interestRate}% for {trip.repaymentDays || trip.maturityDays} days
                        </p>
                      </div>
                    </div>
                  ))}
                  {repaidTrips.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground">
                      And {repaidTrips.length - 5} more trips...
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Trips */}
        <Card>
          <CardHeader>
            <CardTitle>Available Trips</CardTitle>
            <CardDescription>Funded trips awaiting assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTrips.filter(t => t.status === 'funded' && !t.transporterId).slice(0, 3).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">{trip.origin} → {trip.destination}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{trip.loadType} • {trip.weight} kg • {trip.distance} km</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-secondary">{formatCurrencyForTransporter(trip.amount)}</p>
                      <p className="text-xs text-muted-foreground">Payment</p>
                    </div>
                    <Button className="bg-gradient-primary" onClick={() => handleAcceptTrip(trip.id)}>
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Trips */}
        <Card>
          <CardHeader>
            <CardTitle>Your Active Trips</CardTitle>
            <CardDescription>Trips in transit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTrips.filter(t => t.status === 'in_transit').map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg bg-secondary/5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TruckIcon className="h-4 w-4 text-secondary" />
                      <h4 className="font-semibold">{trip.origin} → {trip.destination}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">In Transit</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{trip.loadType} • {trip.weight} kg</p>
                  </div>
                  <Button variant="outline" onClick={() => handleCompleteTrip(trip.id)}>
                    Mark Complete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TransporterDashboard;
