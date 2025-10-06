import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruckIcon, Plus, IndianRupee, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { data, Trip, Wallet } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";

const LoadOwnerDashboard = () => {
  const navigate = useNavigate();
  const user = auth.getCurrentUser();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [wallet, setWallet] = useState<Wallet>({
    userId: user?.id || 'lo1',
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
          data.getWallet(user?.id || 'lo1')
        ]);

        // Filter trips for this load owner
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

        {/* Wallet Balance */}
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

        {/* Recent Trips */}
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
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        trip.status === 'funded' ? 'bg-secondary/20 text-secondary' :
                        trip.status === 'pending' ? 'bg-accent/20 text-accent' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{trip.loadType} • {trip.weight}kg • {trip.distance}km</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{(trip.amount / 1000).toFixed(0)}K</p>
                    <p className="text-sm text-muted-foreground">Requested: ₹{(trip.amount / 1000).toFixed(0)}K</p>
                    {trip.interestRate && (
                      <p className="text-xs text-secondary">{trip.interestRate}% interest</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LoadOwnerDashboard;
