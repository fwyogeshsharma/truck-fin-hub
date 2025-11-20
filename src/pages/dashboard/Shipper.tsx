import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, IndianRupee, CreditCard, RefreshCw } from "lucide-react";
import { auth } from "@/lib/auth";
import { type Wallet as WalletType } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import WalletCard from "@/components/WalletCard";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";
import { getChartColors } from "@/lib/chartColors";
import { apiClient } from '@/api/client';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
  balanceAfter: number;
}

const ShipperDashboard = () => {
  const { toast } = useToast();
  const user = auth.getCurrentUser();
  const [wallet, setWallet] = useState<WalletType>({
    userId: user?.id || '',
    balance: 0,
    lockedAmount: 0,
    escrowedAmount: 0,
    totalInvested: 0,
    totalReturns: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartColors, setChartColors] = useState(getChartColors());
  const [refreshKey, setRefreshKey] = useState(0);

  // Update chart colors when theme changes
  useEffect(() => {
    const updateColors = () => {
      setChartColors(getChartColors());
    };

    updateColors();

    const observer = new MutationObserver(() => {
      updateColors();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  // Fetch wallet and transactions
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // Fetch wallet
        const walletData = await apiClient.get(`/wallets/${user.id}`);
        setWallet({
          userId: user.id,
          balance: walletData.balance || 0,
          lockedAmount: walletData.locked_amount || 0,
          escrowedAmount: walletData.escrowed_amount || 0,
          totalInvested: walletData.total_invested || 0,
          totalReturns: walletData.total_returns || 0,
        });

        // Fetch recent transactions
        const transactionsData = await apiClient.get(`/transactions/user/${user.id}/recent?limit=10`);
        setTransactions(transactionsData.map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          timestamp: t.timestamp,
          balanceAfter: t.balance_after,
        })));
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, toast, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Refreshing...",
      description: "Updating your dashboard data",
    });
  };

  // Calculate transaction statistics
  const last7DaysTransactions = transactions.filter(t => {
    const txDate = new Date(t.timestamp);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return txDate >= weekAgo;
  });

  const totalCredits = last7DaysTransactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = last7DaysTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  // Prepare chart data
  const chartData = transactions.slice(0, 7).reverse().map(t => ({
    date: new Date(t.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    balance: t.balanceAfter,
  }));

  if (loading) {
    return (
      <DashboardLayout role="load_owner">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="load_owner">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Shipper Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your accounts and money transfers
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Wallet Card */}
        <WalletCard />

        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Available Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(wallet.balance)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for use
              </p>
            </CardContent>
          </Card>

          {/* In Escrow */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Escrow</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(wallet.escrowedAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending withdrawals
              </p>
            </CardContent>
          </Card>

          {/* Credits (Last 7 Days) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits (7d)</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCredits)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {last7DaysTransactions.filter(t => t.type === 'credit').length} transactions
              </p>
            </CardContent>
          </Card>

          {/* Debits (Last 7 Days) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Debits (7d)</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDebits)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {last7DaysTransactions.filter(t => t.type === 'debit').length} transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Balance Trend Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Balance Trend
              </CardTitle>
              <CardDescription>Your wallet balance over recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis
                    dataKey="date"
                    stroke={chartColors.text}
                    tick={{ fill: chartColors.text }}
                  />
                  <YAxis
                    stroke={chartColors.text}
                    tick={{ fill: chartColors.text }}
                    tickFormatter={(value) => formatCurrencyCompact(value)}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Balance"]}
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.border}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: chartColors.text }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBalance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Your latest account activity</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'credit' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.timestamp).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bal: {formatCurrency(transaction.balanceAfter)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ShipperDashboard;
