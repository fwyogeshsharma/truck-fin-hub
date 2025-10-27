import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, FileText, Download, Calendar, Search, Filter } from 'lucide-react';
import apiClient from '@/api/client';

interface PlatformFee {
  id: string;
  trip_id: string;
  lender_id: string;
  lender_name: string;
  borrower_id: string;
  borrower_name: string;
  loan_amount: number;
  fee_percentage: number;
  fee_amount: number;
  collected_at: string;
  super_admin_transaction_id?: string;
  borrower_transaction_id?: string;
}

interface FeeStats {
  total_fees: number;
  total_transactions: number;
  average_fee: number;
  total_loan_amount: number;
}

const PlatformFeeReport = () => {
  const { toast } = useToast();
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [stats, setStats] = useState<FeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredFees, setFilteredFees] = useState<PlatformFee[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchFees = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/platform-fees');
      setFees(Array.isArray(data) ? data : []);
      setFilteredFees(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch platform fees:', error);
      setFees([]);
      setFilteredFees([]);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load platform fees',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiClient.get('/platform-fees/stats');
      setStats(data || null);
    } catch (error: any) {
      console.error('Failed to fetch platform fee stats:', error);
      setStats(null);
    }
  };

  useEffect(() => {
    fetchFees();
    fetchStats();
  }, []);

  // Filter fees based on search and date range
  useEffect(() => {
    let filtered = [...fees];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (fee) =>
          fee.lender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fee.borrower_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fee.trip_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (startDate && endDate) {
      filtered = filtered.filter((fee) => {
        const feeDate = new Date(fee.collected_at);
        return feeDate >= new Date(startDate) && feeDate <= new Date(endDate);
      });
    }

    setFilteredFees(filtered);
  }, [searchTerm, startDate, endDate, fees]);

  const exportToCSV = () => {
    const headers = [
      'Trip ID',
      'Lender Name',
      'Borrower Name',
      'Loan Amount',
      'Fee %',
      'Fee Amount',
      'Collected At',
    ];

    const csvData = filteredFees.map((fee) => [
      fee.trip_id,
      fee.lender_name,
      fee.borrower_name,
      fee.loan_amount,
      fee.fee_percentage,
      fee.fee_amount,
      fee.collected_at,
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-fees-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: 'Export Successful',
      description: 'Platform fee report has been downloaded',
    });
  };

  const calculateFilteredStats = () => {
    const totalFees = filteredFees.reduce((sum, fee) => sum + fee.fee_amount, 0);
    const totalLoans = filteredFees.reduce((sum, fee) => sum + fee.loan_amount, 0);
    return {
      total_fees: totalFees,
      total_transactions: filteredFees.length,
      total_loan_amount: totalLoans,
    };
  };

  const filteredStats = calculateFilteredStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Fee Report</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of all platform fees collected from loan disbursements
          </p>
        </div>
        <Button onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_fees || 0)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_transactions || 0}</div>
            <p className="text-xs text-muted-foreground">Fee transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Fee</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.average_fee || 0)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loan Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_loan_amount || 0)}</div>
            <p className="text-xs text-muted-foreground">Loans facilitated</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by lender, borrower, or trip ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {(searchTerm || startDate || endDate) && (
            <div className="mt-4 flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="font-semibold">Filtered Results:</span>{' '}
                {filteredFees.length} transactions | Total Fees: {formatCurrency(filteredStats.total_fees)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Fee Details</CardTitle>
          <CardDescription>
            Detailed breakdown of all platform fees collected from loan disbursements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip ID</TableHead>
                  <TableHead>Lender</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead className="text-right">Loan Amount</TableHead>
                  <TableHead className="text-right">Fee %</TableHead>
                  <TableHead className="text-right">Fee Amount</TableHead>
                  <TableHead>Collected At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No platform fees found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-mono text-xs">
                        {fee.trip_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{fee.lender_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {fee.lender_id.substring(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{fee.borrower_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {fee.borrower_id.substring(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(fee.loan_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{fee.fee_percentage}%</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(fee.fee_amount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(fee.collected_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          Collected
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredFees.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {filteredFees.length} of {fees.length} transactions
              </div>
              <div className="font-semibold">
                Total Fees: {formatCurrency(filteredStats.total_fees)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformFeeReport;
