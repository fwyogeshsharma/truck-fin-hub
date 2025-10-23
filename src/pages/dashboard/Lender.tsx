import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Package, IndianRupee, Lock, ArrowUpRight, ArrowDownRight, Sparkles, Brain, RefreshCw, Clock, CheckCircle2, UserCheck, UserX } from "lucide-react";
import { auth } from "@/lib/auth";
import { data, type Trip, type Investment, type Wallet as WalletType } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import WalletCard from "@/components/WalletCard";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";
import { getChartColors, getChartColorPalette } from "@/lib/chartColors";
import { apiClient } from '@/api/client';
import MaturityCountdown from '@/components/MaturityCountdown';

const LenderDashboard = () => {
  const { toast } = useToast();
  const user = auth.getCurrentUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [myInvestments, setMyInvestments] = useState<Investment[]>([]);
  const [wallet, setWallet] = useState<WalletType>({
    userId: user?.id || '',
    balance: 0,
    lockedAmount: 0,
    escrowedAmount: 0,
    totalInvested: 0,
    totalReturns: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartColors, setChartColors] = useState(getChartColors());
  const [colorPalette, setColorPalette] = useState(getChartColorPalette());
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);

  // Update chart colors when theme changes
  useEffect(() => {
    const updateColors = () => {
      setChartColors(getChartColors());
      setColorPalette(getChartColorPalette());
    };

    // Update colors immediately
    updateColors();

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      updateColors();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  const fetchPendingApprovals = async () => {
    if (!user?.is_admin) return; // Only fetch if user is admin

    try {
      const isCompanyAdmin = user?.is_admin === true && user?.company_id;
      const companyId = isCompanyAdmin ? user.company_id : undefined;

      const url = companyId
        ? `/users/pending-approvals?companyId=${companyId}`
        : '/users/pending-approvals';

      const pendingUsers = await apiClient.get(url);
      setPendingApprovals(pendingUsers);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        console.error('No user ID found - user not authenticated');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [tripsData, investmentsData, walletData] = await Promise.all([
          data.getTrips(),
          data.getInvestments(),
          data.getWallet(user.id),
        ]);
        setTrips(tripsData);
        setMyInvestments(investmentsData.filter(i => i.lenderId === user.id));
        setWallet(walletData);

        // Fetch pending approvals if user is admin
        if (user?.is_admin) {
          await fetchPendingApprovals();
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: 'Refreshed!',
      description: 'Investment data has been updated',
    });
  };

  const handleApprove = async (userId: string) => {
    if (!user?.id) return;

    setApprovingUserId(userId);
    try {
      await apiClient.put(`/users/${userId}/approve`, { approvedBy: user.id });

      toast({
        title: "User Approved",
        description: "The user has been approved and can now log in.",
      });
      await fetchPendingApprovals();
    } catch (error) {
      console.error('Failed to approve user:', error);
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: "Failed to approve user. Please try again.",
      });
    } finally {
      setApprovingUserId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!user?.id) return;

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setApprovingUserId(userId);
    try {
      await apiClient.put(`/users/${userId}/reject`, { rejectedBy: user.id, reason });

      toast({
        title: "User Rejected",
        description: "The user request has been rejected.",
      });
      await fetchPendingApprovals();
    } catch (error) {
      console.error('Failed to reject user:', error);
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: "Failed to reject user. Please try again.",
      });
    } finally {
      setApprovingUserId(null);
    }
  };

  // User-specific investment growth data - only show if user has investments
  const hasInvestments = myInvestments.length > 0 && (wallet.totalInvested > 0 || wallet.totalReturns > 0);

  const investmentGrowthData = hasInvestments ? [
    { month: 'May', invested: wallet.totalInvested * 0.2, returns: wallet.totalReturns * 0.15 },
    { month: 'Jun', invested: wallet.totalInvested * 0.35, returns: wallet.totalReturns * 0.32 },
    { month: 'Jul', invested: wallet.totalInvested * 0.52, returns: wallet.totalReturns * 0.50 },
    { month: 'Aug', invested: wallet.totalInvested * 0.68, returns: wallet.totalReturns * 0.68 },
    { month: 'Sep', invested: wallet.totalInvested * 0.85, returns: wallet.totalReturns * 0.88 },
    { month: 'Oct', invested: wallet.totalInvested, returns: wallet.totalReturns },
  ] : [];

  // Calculate monthly returns from investment growth data
  const monthlyReturnsData = hasInvestments ? investmentGrowthData.map((data, index) => {
    if (index === 0) {
      // First month return is the initial return
      return { month: data.month, returns: data.returns };
    }
    // Monthly return = current total returns - previous total returns
    const previousReturns = investmentGrowthData[index - 1].returns;
    const monthlyReturn = data.returns - previousReturns;
    return { month: data.month, returns: monthlyReturn };
  }) : [];

  // Portfolio distribution by borrower companies
  const getPortfolioDistribution = () => {
    const borrowerInvestments: { [key: string]: number } = {};
    let totalInvested = 0;

    myInvestments.forEach(investment => {
      const trip = trips.find(t => t.id === investment.tripId);
      if (trip && (investment.status === 'active' || investment.status === 'completed')) {
        const borrowerName = trip.loadOwnerName;
        borrowerInvestments[borrowerName] = (borrowerInvestments[borrowerName] || 0) + investment.amount;
        totalInvested += investment.amount;
      }
    });

    const portfolioData = Object.entries(borrowerInvestments)
      .map(([name, amount], index) => ({
        name,
        value: totalInvested > 0 ? Math.round((amount / totalInvested) * 100) : 0,
        amount,
        color: colorPalette[index % colorPalette.length],
      }))
      .sort((a, b) => b.value - a.value);

    return portfolioData.length > 0 ? portfolioData : [
      { name: 'No investments yet', value: 100, amount: 0, color: chartColors.muted }
    ];
  };

  const portfolioData = getPortfolioDistribution();

  const activeInvestments = myInvestments.filter(i => i.status === 'active');
  const completedInvestments = myInvestments.filter(i => i.status === 'completed');

  const stats = [
    {
      title: "Total Invested",
      value: formatCurrencyCompact(wallet.totalInvested, true),
      icon: IndianRupee,
      color: "primary",
    },
    {
      title: "Escrowed Amount",
      value: formatCurrencyCompact(wallet.escrowedAmount || 0, true),
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
      value: formatCurrencyCompact(wallet.totalReturns, true),
      icon: TrendingUp,
      color: "accent",
    },
  ];

  // Get user's active investments (allotted and confirmed by Borrower)
  const activeInvestmentTrips = myInvestments
    .filter(i => i.status === 'active')
    .map(investment => {
      const trip = trips.find(t => t.id === investment.tripId);
      return trip ? { ...trip, investment } : null;
    })
    .filter(Boolean)
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
      title: "New Lender Opportunities",
      description: `${pendingTrips.length} trips available for funding`,
      action: `Invest at ${avgInterestRate}% to earn ${formatCurrencyCompact(potentialEarnings, true)}`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    bestOpportunity && {
      icon: TrendingUp,
      title: "Best Opportunity",
      description: `${bestOpportunity.origin} → ${bestOpportunity.destination}`,
      action: `${bestOpportunity.loadType} • ${formatCurrencyCompact(bestOpportunity.amount, true)} • LTV ${bestOpportunity.ltvRatio.toFixed(0)}%`,
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : "User"}'s Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Invest in trips and earn returns</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-2">{stat.value}</p>
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
        {user?.id && <WalletCard userId={user.id} showDetails={true} />}

        {/* Grant Access - Pending Approvals (Only for Admin users) */}
        {user?.is_admin && (
          <Card className={pendingApprovals && pendingApprovals.length > 0 ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Grant Access - Pending User Approvals
              </CardTitle>
              <CardDescription>
                {user?.company ?
                  `Review and approve new user access requests for ${user.company}` :
                  'Review and approve new user access requests'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!pendingApprovals || pendingApprovals.length === 0 ? (
                <div className="text-center py-8 px-4 border rounded-lg bg-muted/50">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    No Pending Approvals
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.company
                      ? `No user access requests for ${user.company} at this time.`
                      : 'All user requests have been processed.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((pendingUser) => (
                    <div key={pendingUser.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-background shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{pendingUser.name}</p>
                            <p className="text-xs text-muted-foreground">{pendingUser.email}</p>
                          </div>
                        </div>
                        <div className="ml-12 space-y-1">
                          <p className="text-xs text-muted-foreground">Phone: {pendingUser.phone || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">Company: <span className="font-medium text-foreground">{pendingUser.company}</span></p>
                          <p className="text-xs text-muted-foreground">Role: <span className="font-medium text-foreground">{pendingUser.role?.replace('_', ' ')}</span></p>
                          <p className="text-xs text-muted-foreground">Requested: {new Date(pendingUser.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(pendingUser.id)}
                          disabled={approvingUserId === pendingUser.id}
                          className="bg-green-600 hover:bg-green-700 min-w-[120px]"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          {approvingUserId === pendingUser.id ? 'Approving...' : 'Grant Access'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(pendingUser.id)}
                          disabled={approvingUserId === pendingUser.id}
                          className="min-w-[120px]"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Deny Access
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
            {hasInvestments ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={investmentGrowthData}>
                  <defs>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="invested" stroke={chartColors.primary} fillOpacity={1} fill="url(#colorInvested)" name="Total Invested" />
                  <Area type="monotone" dataKey="returns" stroke={chartColors.secondary} fillOpacity={1} fill="url(#colorReturns)" name="Total Returns" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No investment data yet</p>
                  <p className="text-xs mt-1">Start investing to see your growth chart</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Distribution & Monthly Returns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Portfolio Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Distribution</CardTitle>
              <CardDescription>Investment breakdown by borrower</CardDescription>
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
                      `${value}% (${formatCurrency(props.payload.amount)})`,
                      'Investment'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {portfolioData.length > 1 && portfolioData[0].amount > 0 && (
                <div className="mt-4 space-y-2">
                  {portfolioData.slice(0, 5).map((borrower, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: borrower.color }}
                        />
                        <span className="text-muted-foreground">{borrower.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(borrower.amount)} ({borrower.value}%)</span>
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
              {hasInvestments ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyReturnsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrencyCompact(value, true)} />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(value), 'Returns']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar dataKey="returns" fill={chartColors.secondary} name="Returns" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <IndianRupee className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No returns data yet</p>
                    <p className="text-xs mt-1">Returns will appear once you have active investments</p>
                  </div>
                </div>
              )}
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
              <CardDescription>Awaiting Borrower confirmation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myInvestments
                  .filter(i => i.status === 'escrowed')
                  .map((investment) => {
                    const trip = trips.find(t => t.id === investment.tripId);
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
                          <p className="text-sm font-semibold mt-1">{formatCurrency(investment.amount)} at {Number(investment.interestRate).toFixed(2)}%</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Investments - Allotted Trips */}
        <Card>
          <CardHeader>
            <CardTitle>My Active Investments</CardTitle>
            <CardDescription>Trips allotted to you by Borrowers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeInvestmentTrips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No active investments yet</p>
                  <p className="text-xs mt-1">Your confirmed investments will appear here</p>
                </div>
              ) : (
                activeInvestmentTrips.map((item: any) => {
                  const trip = item;
                  const investment = item.investment;
                  return (
                    <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50 border-green-200">
                      <div className="flex items-center gap-4">
                        {trip.loadOwnerLogo && (
                          <img
                            src={trip.loadOwnerLogo}
                            alt={trip.loadOwnerName}
                            className="h-12 w-12 object-contain rounded border p-1 bg-white"
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
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            Active
                          </span>
                        </div>
                        <p className="text-sm font-semibold mt-1">{formatCurrency(investment.amount)} at {Number(investment.interestRate).toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground">
                          Return: {formatCurrency(investment.expectedReturn)}
                        </p>
                        {investment.maturityDate && (
                          <MaturityCountdown maturityDate={investment.maturityDate} className="mt-1" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LenderDashboard;
