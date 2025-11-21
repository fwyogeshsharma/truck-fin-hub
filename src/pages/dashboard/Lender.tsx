import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, TrendingUp, Package, IndianRupee, Lock, ArrowUpRight, ArrowDownRight, Sparkles, Brain, RefreshCw, Clock, CheckCircle2, UserCheck, UserX, Eye, FileText, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { auth } from "@/lib/auth";
import { data, type Trip, type Investment, type Wallet as WalletType } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import WalletCard from "@/components/WalletCard";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";
import { getChartColors, getChartColorPalette } from "@/lib/chartColors";
import { apiClient } from '@/api/client';
import { toTitleCase } from "@/lib/utils";
import MaturityCountdown from '@/components/MaturityCountdown';
import DocumentProgress from '@/components/DocumentProgress';
import LenderFinancialQuestionnaire from '@/components/LenderFinancialQuestionnaire';
import RatingDialog from '@/components/RatingDialog';

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
  const [selectedTripForDocs, setSelectedTripForDocs] = useState<Trip | null>(null);
  const [documentViewOpen, setDocumentViewOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string } | null>(null);
  const [showFinancialQuestionnaire, setShowFinancialQuestionnaire] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [questionnaireShown, setQuestionnaireShown] = useState(false);

  // Pending Ratings State
  const [pendingRatings, setPendingRatings] = useState<any[]>([]);
  const [currentRatingIndex, setCurrentRatingIndex] = useState(0);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  // Pagination state
  const [pendingBidsPage, setPendingBidsPage] = useState(1);
  const [activeInvestmentsPage, setActiveInvestmentsPage] = useState(1);
  const [pendingApprovalsPage, setPendingApprovalsPage] = useState(1);
  const itemsPerPage = 10;

  // Active tab state
  const [activeTab, setActiveTab] = useState("overview");

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

  // Fetch pending ratings for lender
  const fetchPendingRatings = async () => {
    if (!user?.id) return;

    try {
      console.log('🔍 Fetching pending ratings for lender:', user.id);
      const response = await apiClient.get(`/ratings/pending/${user.id}`);

      if (response.success && response.pendingRatings && response.pendingRatings.length > 0) {
        console.log(`✅ Found ${response.pendingRatings.length} pending ratings`);
        setPendingRatings(response.pendingRatings);
        setCurrentRatingIndex(0);
        setShowRatingDialog(true); // Show the first rating dialog
      } else {
        console.log('✅ No pending ratings found');
        setPendingRatings([]);
      }
    } catch (error) {
      console.error('Failed to fetch pending ratings:', error);
    }
  };

  // Handle rating submission
  const handleRatingSubmitted = () => {
    console.log('✅ Rating submitted, checking for next rating...');

    // Move to next rating
    const nextIndex = currentRatingIndex + 1;

    if (nextIndex < pendingRatings.length) {
      // Show next rating dialog
      console.log(`📋 Showing next rating (${nextIndex + 1}/${pendingRatings.length})`);
      setCurrentRatingIndex(nextIndex);
      setShowRatingDialog(true);
    } else {
      // All ratings completed
      console.log('🎉 All ratings completed!');
      setShowRatingDialog(false);
      setPendingRatings([]);
      setCurrentRatingIndex(0);

      toast({
        title: 'All Ratings Completed',
        description: 'Thank you for rating all your borrowers!',
      });

      // Refresh dashboard data
      setRefreshKey(prev => prev + 1);
    }
  };

  // Handle rating dialog close (skip)
  const handleRatingDialogClose = () => {
    console.log('⏭️ Rating skipped, will show again on next visit');
    setShowRatingDialog(false);
    // Don't clear pendingRatings - they will show again on next dashboard load
  };

  // Helper function to generate pagination range with ellipsis
  const getPaginationRange = (currentPage: number, totalPages: number) => {
    const delta = 2; // Number of pages to show on each side of current page
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    // Always show first page
    range.push(1);

    // Calculate range around current page
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i);
      }
    }

    // Always show last page
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Add ellipsis where there are gaps
    let prev = 0;
    for (const i of range) {
      if (typeof i === 'number') {
        if (prev && i - prev > 1) {
          rangeWithDots.push('...');
        }
        rangeWithDots.push(i);
        prev = i;
      }
    }

    return rangeWithDots;
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
        const [tripsData, investmentsData, walletData, userData] = await Promise.all([
          data.getTrips(),
          data.getInvestments(),
          data.getWallet(user.id),
          apiClient.get(`/users/${user.id}`),
        ]);
        setTrips(tripsData);
        setMyInvestments(investmentsData.filter(i => i.lenderId === user.id));
        setWallet(walletData);
        setUserProfile(userData);

        // Fetch pending ratings (trips that need rating by lender)
        await fetchPendingRatings();

        // Show financial questionnaire if not completed (only for lenders, not admins)
        // Only show once per session to avoid annoying the user
        const questionnaireShownKey = `questionnaire_shown_${user.id}`;
        const hasShownThisSession = sessionStorage.getItem(questionnaireShownKey);

        if (!userData.financial_profile_completed && user.role === 'lender' && !user.is_admin && !hasShownThisSession && !questionnaireShown) {
          setShowFinancialQuestionnaire(true);
          setQuestionnaireShown(true);
          sessionStorage.setItem(questionnaireShownKey, 'true');
        }

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

  // Auto-refresh data every 15 seconds
  useEffect(() => {
    if (!user?.id) return;

    const autoRefresh = async () => {
      try {
        // Silently fetch updated data without showing loading state
        const [tripsData, investmentsData, walletData] = await Promise.all([
          data.getTrips(),
          data.getInvestments(),
          data.getWallet(user.id),
        ]);
        setTrips(tripsData);
        setMyInvestments(investmentsData.filter(i => i.lenderId === user.id));
        setWallet(walletData);
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    };

    const interval = setInterval(autoRefresh, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

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
  const allActiveInvestmentTrips = myInvestments
    .filter(i => i.status === 'active')
    .map(investment => {
      const trip = trips.find(t => t.id === investment.tripId);
      return trip ? { ...trip, investment } : null;
    })
    .filter(Boolean);

  // Pagination for active investments
  const totalActivePages = Math.ceil(allActiveInvestmentTrips.length / itemsPerPage);
  const activeStartIndex = (activeInvestmentsPage - 1) * itemsPerPage;
  const activeEndIndex = activeStartIndex + itemsPerPage;
  const activeInvestmentTrips = allActiveInvestmentTrips.slice(activeStartIndex, activeEndIndex);

  // Get escrowed investments for pending bids
  const allEscrowedInvestments = myInvestments.filter(i => i.status === 'escrowed');
  const totalPendingPages = Math.ceil(allEscrowedInvestments.length / itemsPerPage);
  const pendingStartIndex = (pendingBidsPage - 1) * itemsPerPage;
  const pendingEndIndex = pendingStartIndex + itemsPerPage;
  const paginatedEscrowedInvestments = allEscrowedInvestments.slice(pendingStartIndex, pendingEndIndex);

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

  // Get pending approval trips (completed trips awaiting claim processing)
  const getPendingApprovalTrips = () => {
    return myInvestments
      .filter(i => i.status === 'completed')
      .map(investment => {
        const trip = trips.find(t => t.id === investment.tripId);
        return trip ? { ...trip, investment } : null;
      })
      .filter(Boolean);
  };

  const allPendingApprovalTrips = getPendingApprovalTrips();
  const totalPendingApprovalPages = Math.ceil(allPendingApprovalTrips.length / itemsPerPage);
  const pendingApprovalStartIndex = (pendingApprovalsPage - 1) * itemsPerPage;
  const pendingApprovalEndIndex = pendingApprovalStartIndex + itemsPerPage;
  const paginatedPendingApprovalTrips = allPendingApprovalTrips.slice(pendingApprovalStartIndex, pendingApprovalEndIndex);

  return (
    <DashboardLayout role="lender">
      <div className="space-y-6">
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
        {user?.id && <WalletCard userId={user.id} showDetails={false} />}

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="investments">My Investments</TabsTrigger>
            <TabsTrigger value="pending-approvals" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Pending Approvals
              {allPendingApprovalTrips.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                  {allPendingApprovalTrips.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">

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
                        <span className="text-muted-foreground">{toTitleCase(borrower.name)}</span>
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
          </TabsContent>

          {/* My Investments Tab */}
          <TabsContent value="investments" className="space-y-6 mt-6">
        {/* Escrowed Investments */}
        {allEscrowedInvestments.length > 0 && (
          <Card className="border-orange-500/50 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-600" />
                Pending Bids (Escrowed) ({allEscrowedInvestments.length})
              </CardTitle>
              <CardDescription>Awaiting Borrower confirmation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paginatedEscrowedInvestments.map((investment) => {
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
                            {trip.loadType} • {trip.distance} km
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

              {/* Pagination Controls for Pending Bids */}
              {totalPendingPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {pendingStartIndex + 1} to {Math.min(pendingEndIndex, allEscrowedInvestments.length)} of {allEscrowedInvestments.length} bids
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingBidsPage(prev => Math.max(1, prev - 1))}
                      disabled={pendingBidsPage === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {getPaginationRange(pendingBidsPage, totalPendingPages).map((page, idx) => (
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                        ) : (
                          <Button
                            key={page}
                            variant={pendingBidsPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPendingBidsPage(page as number)}
                            className="min-w-[36px]"
                          >
                            {page}
                          </Button>
                        )
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingBidsPage(prev => Math.min(totalPendingPages, prev + 1))}
                      disabled={pendingBidsPage === totalPendingPages}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Active Investments - Allotted Trips */}
        <Card>
          <CardHeader>
            <CardTitle>My Active Investments ({allActiveInvestmentTrips.length})</CardTitle>
            <CardDescription>Trips allotted to you by Borrowers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeInvestmentTrips.length === 0 && allActiveInvestmentTrips.length === 0 ? (
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
                            {trip.loadType} • {trip.distance} km
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 ml-4">
                        <DocumentProgress documents={trip.documents} className="mb-2" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            Active
                          </span>
                        </div>
                        <p className="text-sm font-semibold">{formatCurrency(investment.amount)} at {Number(investment.interestRate).toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground">
                          Return: {formatCurrency(investment.expectedReturn)}
                        </p>
                        {investment.maturityDate && (
                          <MaturityCountdown maturityDate={investment.maturityDate} className="mt-1" />
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 text-xs h-7"
                          onClick={() => {
                            setSelectedTripForDocs(trip);
                            setDocumentViewOpen(true);
                          }}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View Documents
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls for Active Investments */}
            {totalActivePages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {activeStartIndex + 1} to {Math.min(activeEndIndex, allActiveInvestmentTrips.length)} of {allActiveInvestmentTrips.length} investments
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveInvestmentsPage(prev => Math.max(1, prev - 1))}
                    disabled={activeInvestmentsPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {getPaginationRange(activeInvestmentsPage, totalActivePages).map((page, idx) => (
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                      ) : (
                        <Button
                          key={page}
                          variant={activeInvestmentsPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveInvestmentsPage(page as number)}
                          className="min-w-[36px]"
                        >
                          {page}
                        </Button>
                      )
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveInvestmentsPage(prev => Math.min(totalActivePages, prev + 1))}
                    disabled={activeInvestmentsPage === totalActivePages}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Pending Approvals Tab */}
          <TabsContent value="pending-approvals" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  Pending Claim Approvals ({allPendingApprovalTrips.length})
                </CardTitle>
                <CardDescription>Completed trips awaiting claim amount approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paginatedPendingApprovalTrips.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No pending claim approvals</p>
                      <p className="text-xs mt-1">Completed trips awaiting claim processing will appear here</p>
                    </div>
                  ) : (
                    paginatedPendingApprovalTrips.map((item: any) => {
                      const trip = item;
                      const investment = item.investment;
                      const claimAmount = investment.expectedReturn;

                      return (
                        <div key={trip.id} className="flex items-start justify-between p-4 border rounded-lg bg-blue-50/50 border-blue-200">
                          <div className="flex items-start gap-4 flex-1">
                            {trip.loadOwnerLogo && (
                              <img
                                src={trip.loadOwnerLogo}
                                alt={trip.loadOwnerName}
                                className="h-12 w-12 object-contain rounded border p-1 bg-white"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold">{trip.origin} → {trip.destination}</h4>
                              <p className="text-sm text-muted-foreground">
                                {trip.loadType} • {trip.distance} km • E-way Bill: {trip.ewayBillNumber}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Borrower: {trip.loadOwnerName}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  Awaiting Claim Approval
                                </span>
                                {trip.completedAt && (
                                  <span className="text-xs text-muted-foreground">
                                    Completed: {new Date(trip.completedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Investment Amount</p>
                              <p className="text-sm font-semibold">{formatCurrency(investment.amount)}</p>
                            </div>
                            <div className="space-y-1 mt-2">
                              <p className="text-xs text-muted-foreground">Interest Rate</p>
                              <p className="text-sm font-semibold">{Number(investment.interestRate).toFixed(2)}%</p>
                            </div>
                            <div className="space-y-1 mt-2 p-2 bg-green-100 rounded">
                              <p className="text-xs text-green-700">Claim Amount</p>
                              <p className="text-lg font-bold text-green-700">{formatCurrency(claimAmount)}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 text-xs h-7"
                              onClick={() => {
                                setSelectedTripForDocs(trip);
                                setDocumentViewOpen(true);
                              }}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              View Documents
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination Controls for Pending Approvals */}
                {totalPendingApprovalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {pendingApprovalStartIndex + 1} to {Math.min(pendingApprovalEndIndex, allPendingApprovalTrips.length)} of {allPendingApprovalTrips.length} claims
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingApprovalsPage(prev => Math.max(1, prev - 1))}
                        disabled={pendingApprovalsPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {getPaginationRange(pendingApprovalsPage, totalPendingApprovalPages).map((page, idx) => (
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={pendingApprovalsPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPendingApprovalsPage(page as number)}
                              className="min-w-[36px]"
                            >
                              {page}
                            </Button>
                          )
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingApprovalsPage(prev => Math.min(totalPendingApprovalPages, prev + 1))}
                        disabled={pendingApprovalsPage === totalPendingApprovalPages}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Viewer Dialog */}
      <Dialog open={documentViewOpen} onOpenChange={setDocumentViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Trip Documents</DialogTitle>
            <DialogDescription>
              {selectedTripForDocs && `${selectedTripForDocs.origin} → ${selectedTripForDocs.destination}`}
            </DialogDescription>
          </DialogHeader>

          {selectedTripForDocs && (
            <div className="space-y-4">
              <DocumentProgress documents={selectedTripForDocs.documents} showSteps={true} />

              <div className="border-t pt-4 space-y-3">
                {['ewaybill', 'bilty', 'advance_invoice', 'pod', 'final_invoice'].map((docType, index) => {
                  const docLabels = {
                    ewaybill: 'E-Way Bill',
                    bilty: 'Bilty',
                    advance_invoice: 'Advance Invoice',
                    pod: 'POD',
                    final_invoice: 'Final Invoice'
                  };
                  const docKey = docType as keyof typeof selectedTripForDocs.documents;
                  const document = selectedTripForDocs.documents?.[docKey];

                  return (
                    <div key={docType} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${document ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                          {document ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-semibold">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{docLabels[docType as keyof typeof docLabels]}</p>
                          <p className="text-xs text-muted-foreground">
                            {document ? 'Uploaded' : 'Pending upload'}
                          </p>
                        </div>
                      </div>
                      {document && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingDocument({ url: document, name: docLabels[docType as keyof typeof docLabels] })}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={viewingDocument !== null} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingDocument?.name || 'Document'}</DialogTitle>
            <DialogDescription>
              View and download document
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 h-full overflow-hidden">
            {viewingDocument && (
              <iframe
                src={viewingDocument.url}
                className="w-full h-full border-0 rounded"
                title={viewingDocument.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Financial Questionnaire for new lenders */}
      {user?.id && (
        <LenderFinancialQuestionnaire
          open={showFinancialQuestionnaire}
          onClose={async () => {
            setShowFinancialQuestionnaire(false);
            // Reload user data to get updated financial_profile_completed flag
            try {
              const userData = await apiClient.get(`/users/${user.id}`);
              setUserProfile(userData);
              // If profile is now completed, mark as permanently shown
              if (userData.financial_profile_completed) {
                setQuestionnaireShown(true);
                // No need to keep the session flag if profile is completed
                if (user?.id) {
                  sessionStorage.removeItem(`questionnaire_shown_${user.id}`);
                }
              }
            } catch (error) {
              console.error('Failed to reload user data:', error);
            }
          }}
          userId={user.id}
          userName={user.name}
        />
      )}

      {/* Pending Ratings Dialog - Show one at a time in queue */}
      {pendingRatings.length > 0 && pendingRatings[currentRatingIndex] && (
        <RatingDialog
          open={showRatingDialog}
          onClose={handleRatingDialogClose}
          onRatingSubmitted={handleRatingSubmitted}
          tripId={pendingRatings[currentRatingIndex].trip_id}
          lenderId={pendingRatings[currentRatingIndex].lender_id}
          lenderName={pendingRatings[currentRatingIndex].lender_name}
          borrowerId={pendingRatings[currentRatingIndex].borrower_id}
          borrowerName={pendingRatings[currentRatingIndex].borrower_name}
          loanAmount={pendingRatings[currentRatingIndex].loan_amount}
          interestRate={pendingRatings[currentRatingIndex].interest_rate}
          mode="lender-rates-borrower"
          canDismiss={false}
        />
      )}
    </DashboardLayout>
  );
};

export default LenderDashboard;
