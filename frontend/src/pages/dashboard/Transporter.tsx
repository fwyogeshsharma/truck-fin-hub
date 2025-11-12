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
        // Get trips filtered by loadOwnerId (transporter acts as load owner)
        const [trips, walletData] = await Promise.all([
          data.getTrips({ loadOwnerId: user?.id || 't1' }),
          data.getWallet(user?.id || 't1')
        ]);

        setMyTrips(trips);
        setWallet(walletData);
      } catch (error) {
        console.error('Failed to load data:', error);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : "User"}'s Dashboard</h1>
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
                    <p className="text-sm text-muted-foreground">{trip.loadType} • {trip.weight}kg • {trip.distance}km</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-secondary">₹{(trip.amount / 1000).toFixed(0)}K</p>
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
                    <p className="text-sm text-muted-foreground">{trip.loadType} • {trip.weight}kg</p>
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
