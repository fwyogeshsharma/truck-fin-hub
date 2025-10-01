import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, TruckIcon, IndianRupee, Calendar, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { data } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

const InvestmentOpportunities = () => {
  const { toast } = useToast();
  const user = auth.getCurrentUser();
  const allTrips = data.getTrips();
  const trips = allTrips.filter(t => t.status === 'pending');
  const wallet = data.getWallet(user?.id || 'l1');

  console.log('Total trips:', allTrips.length);
  console.log('Pending trips:', trips.length);
  console.log('Trips data:', trips);

  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [bidRate, setBidRate] = useState<number>(12);
  const [filterLoadType, setFilterLoadType] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

  const filteredTrips = trips.filter(trip => {
    const matchesLoadType = !filterLoadType || trip.loadType.toLowerCase().includes(filterLoadType.toLowerCase());
    const matchesMinAmount = !minAmount || trip.requestedAmount >= parseFloat(minAmount);
    const matchesMaxAmount = !maxAmount || trip.requestedAmount <= parseFloat(maxAmount);
    return matchesLoadType && matchesMinAmount && matchesMaxAmount;
  });

  const handleInvest = (tripId: string) => {
    const trip = data.getTrip(tripId);
    if (!trip) return;

    const investmentAmount = trip.requestedAmount;
    const expectedReturn = investmentAmount * (bidRate / 100);

    // Move amount to escrow
    data.updateWallet(user?.id || 'l1', {
      balance: wallet.balance - investmentAmount,
      escrowedAmount: (wallet.escrowedAmount || 0) + investmentAmount,
    });

    toast({
      title: "Bid confirmed!",
      description: `₹${(investmentAmount / 1000).toFixed(0)}K moved to escrow. Awaiting confirmation.`,
    });

    setSelectedTrip(null);

    // Simulate confirmation after 3 seconds
    setTimeout(() => {
      const maturityDays = trip.maturityDays || 30;

      data.createInvestment({
        lenderId: user?.id || 'l1',
        tripId,
        amount: investmentAmount,
        interestRate: bidRate,
        expectedReturn,
        status: 'active',
        maturityDate: new Date(Date.now() + maturityDays * 24 * 60 * 60 * 1000).toISOString(),
      });

      data.updateTrip(tripId, {
        status: 'funded',
        interestRate: bidRate,
        fundedAt: new Date().toISOString(),
        lenderId: user?.id,
        lenderName: user?.name || 'Lender',
      });

      const currentWallet = data.getWallet(user?.id || 'l1');
      data.updateWallet(user?.id || 'l1', {
        escrowedAmount: (currentWallet.escrowedAmount || 0) - investmentAmount,
        totalInvested: currentWallet.totalInvested + investmentAmount,
      });

      toast({
        title: "Investment active!",
        description: `₹${(investmentAmount / 1000).toFixed(0)}K at ${bidRate}% interest is now active`,
      });
    }, 3000);
  };

  const handleResetData = () => {
    localStorage.removeItem('logistics_trips');
    window.location.reload();
  };

  return (
    <DashboardLayout role="lender">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Investment Opportunities</h1>
            <p className="text-muted-foreground mt-1">Browse and invest in available trips</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetData}>
            Reset Data
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Narrow down opportunities by your preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="loadType">Load Type</Label>
                <Input
                  id="loadType"
                  placeholder="e.g., Electronics"
                  value={filterLoadType}
                  onChange={(e) => setFilterLoadType(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="minAmount">Min Amount (₹)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maxAmount">Max Amount (₹)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  placeholder="1000000"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Trips */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Trips ({filteredTrips.length})</h2>
            <Badge variant="outline">Wallet: ₹{(wallet.balance / 100000).toFixed(1)}L</Badge>
          </div>

          {filteredTrips.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No investment opportunities match your filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredTrips.map((trip) => {
              const isSelected = selectedTrip === trip.id;
              const expectedReturn = trip.requestedAmount * (bidRate / 100);
              const daysToMaturity = trip.maturityDays || 30;

              return (
                <Card key={trip.id} className={isSelected ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        {trip.loadOwnerLogo && (
                          <div className="flex-shrink-0">
                            <img
                              src={trip.loadOwnerLogo}
                              alt={trip.loadOwnerName}
                              className="h-16 w-16 object-contain rounded-lg border border-border p-2 bg-card"
                            />
                          </div>
                        )}
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
                          <p className="text-sm text-muted-foreground mt-1">
                            Load Provider: {trip.loadOwnerName}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{trip.status}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Requested Amount</p>
                          <p className="font-semibold">₹{(trip.requestedAmount / 1000).toFixed(0)}K</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TruckIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Trip Value</p>
                          <p className="font-semibold">₹{(trip.amount / 1000).toFixed(0)}K</p>
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
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">LTV Ratio</p>
                          <p className="font-semibold">
                            {((trip.requestedAmount / trip.amount) * 100).toFixed(0)}%
                          </p>
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
                            value={bidRate}
                            onChange={(e) => setBidRate(parseFloat(e.target.value))}
                            min="8"
                            max="18"
                            step="0.5"
                          />
                          <p className="text-xs text-muted-foreground">
                            Recommended range: 8-12% annually
                          </p>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Investment Amount</span>
                            <span className="font-semibold">
                              ₹{(trip.requestedAmount / 1000).toFixed(0)}K
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Interest Rate</span>
                            <span className="font-semibold">{bidRate}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Expected Return</span>
                            <span className="font-semibold text-accent">
                              ₹{(expectedReturn / 1000).toFixed(1)}K
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
                            onClick={() => handleInvest(trip.id)}
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvestmentOpportunities;
