import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, TrendingUp, Package, IndianRupee } from "lucide-react";
import { auth } from "@/lib/auth";
import { data } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

const LenderDashboard = () => {
  const { toast } = useToast();
  const user = auth.getCurrentUser();
  const trips = data.getTrips().filter(t => t.status === 'pending');
  const myInvestments = data.getInvestments().filter(i => i.lenderId === user?.id);
  const wallet = data.getWallet(user?.id || 'l1');

  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [bidRate, setBidRate] = useState<number>(12);

  const stats = [
    {
      title: "Total Invested",
      value: `₹${(wallet.totalInvested / 100000).toFixed(1)}L`,
      icon: IndianRupee,
      color: "primary",
    },
    {
      title: "Active Investments",
      value: myInvestments.filter(i => i.status === 'active').length,
      icon: Package,
      color: "secondary",
    },
    {
      title: "Total Returns",
      value: `₹${(wallet.totalReturns / 1000).toFixed(0)}K`,
      icon: TrendingUp,
      color: "accent",
    },
  ];

  const handleInvest = (tripId: string) => {
    const trip = data.getTrip(tripId);
    if (!trip) return;

    const investmentAmount = trip.requestedAmount;
    const expectedReturn = investmentAmount * (bidRate / 100);

    // Create investment
    data.createInvestment({
      lenderId: user?.id || 'l1',
      tripId,
      amount: investmentAmount,
      interestRate: bidRate,
      expectedReturn,
      status: 'active',
      maturityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Update trip
    data.updateTrip(tripId, {
      status: 'funded',
      interestRate: bidRate,
      fundedAt: new Date().toISOString(),
      lenderId: user?.id,
      lenderName: user?.name || 'Lender',
    });

    // Update wallet
    data.updateWallet(user?.id || 'l1', {
      balance: wallet.balance - investmentAmount,
      totalInvested: wallet.totalInvested + investmentAmount,
    });

    toast({
      title: "Investment successful!",
      description: `Invested ₹${(investmentAmount / 1000).toFixed(0)}K at ${bidRate}% interest`,
    });

    setSelectedTrip(null);
  };

  return (
    <DashboardLayout role="lender">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Lender Dashboard</h1>
          <p className="text-muted-foreground mt-1">Invest in trips and earn returns</p>
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
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Available for Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">₹{(wallet.balance / 100000).toFixed(2)}L</p>
          </CardContent>
        </Card>

        {/* Investment Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Opportunities</CardTitle>
            <CardDescription>Available trips awaiting financing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trips.slice(0, 5).map((trip) => (
                <div key={trip.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{trip.origin} → {trip.destination}</h4>
                        <p className="text-sm text-muted-foreground">
                          {trip.loadType} • {trip.weight}kg • {trip.distance}km
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Load Owner: {trip.loadOwnerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Requested Amount</p>
                        <p className="text-2xl font-bold text-secondary">₹{(trip.requestedAmount / 1000).toFixed(0)}K</p>
                      </div>
                    </div>

                    {selectedTrip === trip.id ? (
                      <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`rate-${trip.id}`}>Your Interest Rate (10-18%)</Label>
                          <div className="flex items-center gap-4">
                            <Input
                              id={`rate-${trip.id}`}
                              type="number"
                              min="10"
                              max="18"
                              step="0.5"
                              value={bidRate}
                              onChange={(e) => setBidRate(parseFloat(e.target.value))}
                              className="w-32"
                            />
                            <span className="text-sm text-muted-foreground">
                              Expected return: ₹{((trip.requestedAmount * bidRate) / 100 / 1000).toFixed(1)}K
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="bg-gradient-primary"
                            onClick={() => handleInvest(trip.id)}
                          >
                            Confirm Investment
                          </Button>
                          <Button variant="outline" onClick={() => setSelectedTrip(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedTrip(trip.id);
                          setBidRate(12);
                        }}
                      >
                        Place Bid
                      </Button>
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

export default LenderDashboard;
