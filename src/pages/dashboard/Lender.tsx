import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Package, IndianRupee, Lock, ArrowUpRight, ArrowDownRight, Sparkles, Brain, RefreshCw } from "lucide-react";
import { auth } from "@/lib/auth";
import { data } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import WalletCard from "@/components/WalletCard";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const LenderDashboard = () => {
  const { toast } = useToast();
  const user = auth.getCurrentUser();
  const [refreshKey, setRefreshKey] = useState(0);

  const trips = data.getTrips();
  const myInvestments = data.getInvestments().filter(i => i.lenderId === user?.id);
  const wallet = data.getWallet(user?.id || 'l1');

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: 'Refreshed!',
      description: 'Investment data has been updated',
    });
  };

  // Mock data for investment growth chart (last 6 months)
  const investmentGrowthData = [
    { month: 'May', invested: 150000, returns: 12000 },
    { month: 'Jun', invested: 280000, returns: 24500 },
    { month: 'Jul', invested: 420000, returns: 38000 },
    { month: 'Aug', invested: 580000, returns: 52000 },
    { month: 'Sep', invested: 740000, returns: 68000 },
    { month: 'Oct', invested: wallet.totalInvested, returns: wallet.totalReturns },
  ];

  // Portfolio distribution by actual invested companies
  const getPortfolioDistribution = () => {
    const companyInvestments: { [key: string]: number } = {};
    let totalInvested = 0;

    myInvestments.forEach(investment => {
      const trip = data.getTrip(investment.tripId);
      if (trip && (investment.status === 'active' || investment.status === 'completed')) {
        const companyName = trip.loadOwnerName;
        companyInvestments[companyName] = (companyInvestments[companyName] || 0) + investment.amount;
        totalInvested += investment.amount;
      }
    });

    const portfolioData = Object.entries(companyInvestments)
      .map(([name, amount], index) => ({
        name,
        value: totalInvested > 0 ? Math.round((amount / totalInvested) * 100) : 0,
        amount,
        color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316'][index % 8],
      }))
      .sort((a, b) => b.value - a.value);

    return portfolioData.length > 0 ? portfolioData : [
      { name: 'No investments yet', value: 100, amount: 0, color: '#6b7280' }
    ];
  };

  const portfolioData = getPortfolioDistribution();

  // Monthly returns data - more realistic with gradual growth
  const monthlyReturnsData = [
    { month: 'May', returns: 8500 },
    { month: 'Jun', returns: 11200 },
    { month: 'Jul', returns: 14800 },
    { month: 'Aug', returns: 18600 },
    { month: 'Sep', returns: 23400 },
    { month: 'Oct', returns: 28900 },
  ];

  const activeInvestments = myInvestments.filter(i => i.status === 'active');
  const completedInvestments = myInvestments.filter(i => i.status === 'completed');

  const stats = [
    {
      title: "Total Invested",
      value: `₹${(wallet.totalInvested / 100000).toFixed(1)}L`,
      icon: IndianRupee,
      color: "primary",
    },
    {
      title: "Escrowed Amount",
      value: `₹${((wallet.escrowedAmount || 0) / 1000).toFixed(0)}K`,
      icon: Lock,
      color: "secondary",
      detail: "Pending confirmation",
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

  // Get recent active trips
  const recentTrips = trips
    .filter(t => t.status === 'funded' || t.status === 'in_transit')
    .slice(0, 5);

  // AI Insights - Calculate investment opportunities
  const pendingTrips = trips.filter(t => t.status === 'pending');
  const totalPendingInvestment = pendingTrips.reduce((sum, trip) => sum + trip.amount, 0);
  const avgInterestRate = 10; // Average recommended rate
  const potentialEarnings = totalPendingInvestment * (avgInterestRate / 100);

  // Best opportunity - highest LTV ratio with good amount
  const bestOpportunity = pendingTrips
    .map(trip => ({
      ...trip,
      ltvRatio: (trip.amount / trip.amount) * 100,
    }))
    .filter(trip => trip.ltvRatio <= 75 && trip.amount >= 50000)
    .sort((a, b) => b.amount - a.amount)[0];

  // AI Insights recommendations
  const aiInsights = [
    {
      icon: Sparkles,
      title: "New Investment Opportunities",
      description: `${pendingTrips.length} trips available for funding`,
      action: `Invest at ${avgInterestRate}% to earn ₹${(potentialEarnings / 1000).toFixed(0)}K`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    bestOpportunity && {
      icon: TrendingUp,
      title: "Best Opportunity",
      description: `${bestOpportunity.origin} → ${bestOpportunity.destination}`,
      action: `${bestOpportunity.loadType} • ₹${(bestOpportunity.amount / 1000).toFixed(0)}K • LTV ${bestOpportunity.ltvRatio.toFixed(0)}%`,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Brain,
      title: "Portfolio Diversification",
      description: `Balance your portfolio with ${portfolioData[0].name} sector`,
      action: `Currently ${portfolioData[0].value}% allocation`,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ].filter(Boolean);

  return (
    <DashboardLayout role="lender">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : "User"}'s Dashboard</h1>
            <p className="text-muted-foreground mt-1">Invest in trips and earn returns</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    {(stat as any).detail && (
                      <p className="text-xs text-muted-foreground mt-1">{(stat as any).detail}</p>
                    )}
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
        <WalletCard userId={user?.id || 'l1'} showDetails={true} />

        {/* AI Insights */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Insights & Recommendations
            </CardTitle>
            <CardDescription>Smart suggestions to maximize your returns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiInsights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 rounded-full ${insight.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${insight.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mb-1">{insight.description}</p>
                      <p className={`text-sm font-medium ${insight.color}`}>{insight.action}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = '/opportunities'}
                      className="flex items-center gap-1"
                    >
                      View
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Investment Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Growth</CardTitle>
            <CardDescription>Your investment portfolio over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={investmentGrowthData}>
                <defs>
                  <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="invested" stroke="#0EA5E9" fillOpacity={1} fill="url(#colorInvested)" name="Total Invested" />
                <Area type="monotone" dataKey="returns" stroke="#10b981" fillOpacity={1} fill="url(#colorReturns)" name="Total Returns" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Portfolio Distribution & Monthly Returns */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Portfolio Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Distribution</CardTitle>
              <CardDescription>Investment breakdown by company</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => value > 0 ? `${name}: ${value}%` : ''}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: string, props: any) => [
                      `${value}% (₹${(props.payload.amount / 1000).toFixed(0)}K)`,
                      'Investment'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {portfolioData.length > 1 && portfolioData[0].amount > 0 && (
                <div className="mt-4 space-y-2">
                  {portfolioData.slice(0, 5).map((company, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: company.color }}
                        />
                        <span className="text-muted-foreground">{company.name}</span>
                      </div>
                      <span className="font-medium">₹{(company.amount / 1000).toFixed(0)}K ({company.value}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Returns */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Returns</CardTitle>
              <CardDescription>Returns earned each month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyReturnsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(value: any) => [`₹${(value / 1000).toFixed(1)}K`, 'Returns']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="returns" fill="#10b981" name="Returns" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Escrowed Investments */}
        {myInvestments.filter(i => i.status === 'escrowed').length > 0 && (
          <Card className="border-orange-500/50 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-600" />
                Pending Bids (Escrowed)
              </CardTitle>
              <CardDescription>Awaiting load agent confirmation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myInvestments
                  .filter(i => i.status === 'escrowed')
                  .map((investment) => {
                    const trip = data.getTrip(investment.tripId);
                    if (!trip) return null;
                    return (
                      <div key={investment.id} className="flex items-center justify-between p-4 border border-orange-300 rounded-lg bg-white">
                        <div className="flex items-center gap-4">
                          {trip.loadOwnerLogo && (
                            <img
                              src={trip.loadOwnerLogo}
                              alt={trip.loadOwnerName}
                              className="h-12 w-12 object-contain rounded border p-1"
                            />
                          )}
                          <div>
                            <h4 className="font-semibold">{trip.origin} → {trip.destination}</h4>
                            <p className="text-sm text-muted-foreground">
                              {trip.loadType} • {trip.distance}km
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Awaiting Allotment
                            </span>
                          </div>
                          <p className="text-sm font-semibold mt-1">₹{(investment.amount / 1000).toFixed(0)}K at {investment.interestRate}%</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Active Trips */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Active Trips</CardTitle>
            <CardDescription>Track your funded investments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTrips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No active trips yet</p>
                </div>
              ) : (
                recentTrips.map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {trip.loadOwnerLogo && (
                        <img
                          src={trip.loadOwnerLogo}
                          alt={trip.loadOwnerName}
                          className="h-12 w-12 object-contain rounded border p-1"
                        />
                      )}
                      <div>
                        <h4 className="font-semibold">{trip.origin} → {trip.destination}</h4>
                        <p className="text-sm text-muted-foreground">
                          {trip.loadType} • {trip.distance}km
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trip.status === 'in_transit' ? 'bg-secondary/20 text-secondary' :
                          trip.status === 'funded' ? 'bg-primary/20 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {trip.status === 'in_transit' ? 'In Transit' :
                           trip.status === 'funded' ? 'Funded' : trip.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold mt-1">₹{(trip.amount / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LenderDashboard;
