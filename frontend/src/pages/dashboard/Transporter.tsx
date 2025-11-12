import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruckIcon, CheckCircle2, Clock, MapPin } from "lucide-react";
import { auth } from "@/lib/auth";
import { data, Trip, Wallet } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import WalletCard from "@/components/WalletCard";

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
        const userId = user?.id || 't1';
        console.log('🔍 Transporter Dashboard - Loading trips for loadOwnerId:', userId);

        // Get trips filtered by loadOwnerId (transporter acts as load owner)
        const [trips, walletData] = await Promise.all([
          data.getTrips({ loadOwnerId: userId }),
          data.getWallet(userId)
        ]);

        console.log('✅ Transporter Dashboard - Received trips:', trips.length);
        setMyTrips(trips);
        setWallet(walletData);
      } catch (error) {
        console.error('❌ Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

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
    const trips = await data.getTrips({ loadOwnerId: user?.id || 't1' });
    setMyTrips(trips);
  };

  const handleCompleteTrip = async (tripId: string) => {
    await data.updateTrip(tripId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
    // Reload data to show updated trip
    const trips = await data.getTrips({ loadOwnerId: user?.id || 't1' });
    setMyTrips(trips);
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
      <div className="space-y-4 md:space-y-6 px-3 sm:px-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : "User"}'s Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your trips and deliveries</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-${stat.color}/10 flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Wallet */}
        {user?.id && <WalletCard userId={user.id} showDetails={true} />}

        {/* Available Trips */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Available Trips</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Funded trips awaiting assignment</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {myTrips.filter(t => t.status === 'funded' && !t.transporterId).slice(0, 3).map((trip) => (
                <div key={trip.id} className="flex flex-col gap-3 p-3 sm:p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2 flex-wrap">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <h4 className="font-semibold text-sm sm:text-base flex-1 min-w-0">{trip.origin} → {trip.destination}</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{trip.loadType} • {trip.weight}kg • {trip.distance}km</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2 border-t">
                    <div className="flex-1">
                      <p className="font-semibold text-base sm:text-lg text-secondary">₹{(trip.amount / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-muted-foreground">Payment</p>
                    </div>
                    <Button className="bg-gradient-primary min-h-[44px] px-4 sm:px-6" onClick={() => handleAcceptTrip(trip.id)}>
                      Accept Trip
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Trips */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Your Active Trips</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Trips in transit</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {myTrips.filter(t => t.status === 'in_transit').map((trip) => (
                <div key={trip.id} className="flex flex-col gap-3 p-3 sm:p-4 border rounded-lg bg-secondary/5">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2 flex-wrap">
                      <TruckIcon className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                      <h4 className="font-semibold text-sm sm:text-base flex-1 min-w-0">{trip.origin} → {trip.destination}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">In Transit</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{trip.loadType} • {trip.weight}kg</p>
                  </div>
                  <Button variant="outline" className="w-full min-h-[44px]" onClick={() => handleCompleteTrip(trip.id)}>
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
