import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  IndianRupee,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  TruckIcon,
  Package,
  AlertCircle,
  Lock,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  XCircle,
  Shield
} from "lucide-react";
import { auth } from "@/lib/auth";
import { data } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import AdvancedFilter, { type FilterConfig } from "@/components/AdvancedFilter";
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency";
import { toTitleCase } from "@/lib/utils";

const MyInvestments = () => {
  const user = auth.getCurrentUser();
  const [myInvestments, setMyInvestments] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>({
    balance: 0,
    escrowedAmount: 0,
    totalInvested: 0,
    totalReturns: 0,
    lockedAmount: 0,
    userId: user?.id || ''
  });
  const [trips, setTrips] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [documentViewDialogOpen, setDocumentViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ type: string; data: string } | null>(null);

  // Pagination state
  const [allInvestmentsPage, setAllInvestmentsPage] = useState(1);
  const [escrowedPage, setEscrowedPage] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [defaultedPage, setDefaultedPage] = useState(1);
  const itemsPerPage = 10;

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by origin, destination...',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'escrowed', label: 'Escrowed' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'defaulted', label: 'Defaulted' },
      ],
      placeholder: 'Select status',
    },
    {
      id: 'amount',
      label: 'Investment Amount (₹)',
      type: 'range',
      min: 0,
      max: 10000000,
    },
    {
      id: 'interestRate',
      label: 'Interest Rate (%)',
      type: 'range',
      min: 0,
      max: 20,
    },
    {
      id: 'date',
      label: 'Investment Date',
      type: 'date',
    },
  ];

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        console.error('No user ID found - user not authenticated');
        setLoading(false);
        return;
      }

      try {
        const [allInvestments, walletData, allTrips] = await Promise.all([
          data.getInvestments(),
          data.getWallet(user.id),
          data.getTrips()
        ]);

        // Get all users to find company members
        const allUsers = auth.getAllUsers();

        // Get user IDs from the same company (including current user)
        const companyUserIds = user.company
          ? allUsers
              .filter(u => u.company === user.company && u.role === 'lender')
              .map(u => u.id)
          : [user.id];

        // Filter investments for users in the same company
        const companyInvestments = allInvestments.filter(i =>
          companyUserIds.includes(i.lenderId)
        );

        // Create a map of trips for quick lookup
        const tripsMap = new Map(allTrips.map(trip => [trip.id, trip]));

        setMyInvestments(companyInvestments);
        setWallet(walletData);
        setTrips(tripsMap);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, user?.company]);

  // Auto-refresh data every 15 seconds to sync company investments
  useEffect(() => {
    if (!user?.id) return;

    const autoRefresh = async () => {
      try {
        // Silently fetch updated data without showing loading state
        const [allInvestments, walletData, allTrips] = await Promise.all([
          data.getInvestments(),
          data.getWallet(user.id),
          data.getTrips()
        ]);

        const allUsers = auth.getAllUsers();
        const companyUserIds = user.company
          ? allUsers
              .filter(u => u.company === user.company && u.role === 'lender')
              .map(u => u.id)
          : [user.id];

        const companyInvestments = allInvestments.filter(i =>
          companyUserIds.includes(i.lenderId)
        );

        const tripsMap = new Map(allTrips.map(trip => [trip.id, trip]));

        setMyInvestments(companyInvestments);
        setWallet(walletData);
        setTrips(tripsMap);
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    };

    const interval = setInterval(autoRefresh, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [user?.id, user?.company]);

  // Apply filters to investments
  const applyFilters = (investments: any[]) => {
    return investments.filter(investment => {
      const trip = trips.get(investment.tripId);
      if (!trip) return false;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          trip.origin?.toLowerCase().includes(searchLower) ||
          trip.destination?.toLowerCase().includes(searchLower) ||
          trip.loadType?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && investment.status !== filters.status) return false;

      // Amount range filter
      if (filters.amount_min && investment.amount < parseFloat(filters.amount_min)) return false;
      if (filters.amount_max && investment.amount > parseFloat(filters.amount_max)) return false;

      // Interest rate range filter
      if (filters.interestRate_min && investment.interestRate < parseFloat(filters.interestRate_min)) return false;
      if (filters.interestRate_max && investment.interestRate > parseFloat(filters.interestRate_max)) return false;

      // Date filter
      if (filters.date) {
        const investmentDate = new Date(investment.createdAt).toISOString().split('T')[0];
        if (investmentDate !== filters.date) return false;
      }

      return true;
    });
  };

  // Apply filters to get all filtered investments
  const allFilteredInvestments = applyFilters(myInvestments);
  const allEscrowedInvestments = applyFilters(myInvestments.filter(i => i.status === 'escrowed'));
  const allActiveInvestments = applyFilters(myInvestments.filter(i => i.status === 'active'));
  const allCompletedInvestments = applyFilters(myInvestments.filter(i => i.status === 'completed'));
  const allDefaultedInvestments = applyFilters(myInvestments.filter(i => i.status === 'defaulted'));

  // Pagination calculations for All tab
  const totalAllPages = Math.ceil(allFilteredInvestments.length / itemsPerPage);
  const allStartIndex = (allInvestmentsPage - 1) * itemsPerPage;
  const allEndIndex = allStartIndex + itemsPerPage;
  const paginatedAllInvestments = allFilteredInvestments.slice(allStartIndex, allEndIndex);

  // Pagination calculations for Escrowed tab
  const totalEscrowedPages = Math.ceil(allEscrowedInvestments.length / itemsPerPage);
  const escrowedStartIndex = (escrowedPage - 1) * itemsPerPage;
  const escrowedEndIndex = escrowedStartIndex + itemsPerPage;
  const escrowedInvestments = allEscrowedInvestments.slice(escrowedStartIndex, escrowedEndIndex);

  // Pagination calculations for Active tab
  const totalActivePages = Math.ceil(allActiveInvestments.length / itemsPerPage);
  const activeStartIndex = (activePage - 1) * itemsPerPage;
  const activeEndIndex = activeStartIndex + itemsPerPage;
  const activeInvestments = allActiveInvestments.slice(activeStartIndex, activeEndIndex);

  // Pagination calculations for Completed tab
  const totalCompletedPages = Math.ceil(allCompletedInvestments.length / itemsPerPage);
  const completedStartIndex = (completedPage - 1) * itemsPerPage;
  const completedEndIndex = completedStartIndex + itemsPerPage;
  const completedInvestments = allCompletedInvestments.slice(completedStartIndex, completedEndIndex);

  // Pagination calculations for Defaulted tab
  const totalDefaultedPages = Math.ceil(allDefaultedInvestments.length / itemsPerPage);
  const defaultedStartIndex = (defaultedPage - 1) * itemsPerPage;
  const defaultedEndIndex = defaultedStartIndex + itemsPerPage;
  const defaultedInvestments = allDefaultedInvestments.slice(defaultedStartIndex, defaultedEndIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'escrowed': return 'bg-primary';
      case 'active': return 'bg-secondary';
      case 'completed': return 'bg-green-500';
      case 'defaulted': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'escrowed': return <Lock className="h-4 w-4" />;
      case 'active': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'defaulted': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTripStatus = (tripId: string) => {
    const trip = trips.get(tripId);
    return trip?.status || 'unknown';
  };

  const getTripStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'escrowed':
        return (
          <Badge variant="outline" className="bg-accent/10 text-accent">
            <Shield className="h-3 w-3 mr-1" />
            Escrowed
          </Badge>
        );
      case 'funded':
        return (
          <Badge variant="outline" className="bg-secondary/10 text-secondary">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Funded
          </Badge>
        );
      case 'in_transit':
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary">
            <TruckIcon className="h-3 w-3 mr-1" />
            In Transit
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'repaid':
        return (
          <Badge variant="outline" className="bg-green-600/10 text-green-700">
            <BadgeCheck className="h-3 w-3 mr-1" />
            Repaid
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTripDetails = (tripId: string) => {
    return trips.get(tripId);
  };

  const handleViewDocument = (docType: string, docData: string) => {
    setSelectedDocument({ type: docType, data: docData });
    setDocumentViewDialogOpen(true);
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

  const EscrowedInvestmentCard = ({ investment }: { investment: any }) => {
    const trip = getTripDetails(investment.tripId);
    if (!trip) return null;

    // Get lender name for company investments
    const isOwnInvestment = investment.lenderId === user?.id;
    const lenderName = isOwnInvestment
      ? 'You'
      : auth.getAllUsers().find(u => u.id === investment.lenderId)?.name || 'Unknown';

    return (
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-primary" />
                <CardTitle className="text-xl">
                  {trip.origin} → {trip.destination}
                </CardTitle>
                {!isOwnInvestment && (
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    {toTitleCase(lenderName)}'s Investment
                  </Badge>
                )}
              </div>
              <CardDescription>
                {trip.loadType} • {trip.weight} kg • {trip.distance} km
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-1">
                Borrower: {toTitleCase(trip.loadOwnerName)}
              </p>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary">
              <Lock className="h-3 w-3 mr-1" />
              Escrowed
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Your bid has been placed and funds are in escrow. Awaiting confirmation...
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Escrowed Amount</p>
                  <p className="font-semibold">₹{(investment.amount / 1000).toFixed(0)}K</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Interest Rate</p>
                  <p className="font-semibold">{investment.interestRate}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Invested At</p>
                  <p className="font-semibold text-sm">
                    {new Date(investment.investedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trip Documents */}
          {trip.documents && Object.keys(trip.documents).length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Trip Documents
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {trip.documents.ewaybill && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleViewDocument('E-Way Bill', trip.documents.ewaybill)}
                  >
                    <Eye className="h-4 w-4" />
                    E-Way Bill
                  </Button>
                )}
                {trip.documents.bilty && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleViewDocument('Bilty', trip.documents.bilty)}
                  >
                    <Eye className="h-4 w-4" />
                    Bilty
                  </Button>
                )}
                {((trip.documents as any).advance_invoice || (trip.documents as any).advanceInvoice) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleViewDocument('Advance Invoice', (trip.documents as any).advance_invoice || (trip.documents as any).advanceInvoice)}
                  >
                    <Eye className="h-4 w-4" />
                    Advance Invoice
                  </Button>
                )}
                {trip.documents.pod && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleViewDocument('POD', trip.documents.pod)}
                  >
                    <Eye className="h-4 w-4" />
                    POD
                  </Button>
                )}
                {((trip.documents as any).final_invoice || (trip.documents as any).finalInvoice) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleViewDocument('Final Invoice', (trip.documents as any).final_invoice || (trip.documents as any).finalInvoice)}
                  >
                    <Eye className="h-4 w-4" />
                    Final Invoice
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const InvestmentCard = ({ investment }: { investment: any }) => {
    const trip = getTripDetails(investment.tripId);
    if (!trip) return null;

    const daysToMaturity = Math.ceil(
      (new Date(investment.maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceInvestment = Math.ceil(
      (Date.now() - new Date(investment.investedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const progress = investment.status === 'completed' ? 100 : Math.min((daysSinceInvestment / 30) * 100, 100);

    // Get lender name for company investments
    const isOwnInvestment = investment.lenderId === user?.id;
    const lenderName = isOwnInvestment
      ? 'You'
      : auth.getAllUsers().find(u => u.id === investment.lenderId)?.name || 'Unknown';

    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <CardTitle className="text-xl">
                  {trip.origin} → {trip.destination}
                </CardTitle>
                {!isOwnInvestment && (
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    {toTitleCase(lenderName)}'s Investment
                  </Badge>
                )}
              </div>
              <CardDescription>
                {trip.loadType} • {trip.weight} kg • {trip.distance} km
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-1">
                Borrower: {toTitleCase(trip.loadOwnerName)}
              </p>
              {trip.transporterName && (
                <p className="text-sm text-muted-foreground">
                  Vehicle Provider: {trip.transporterName}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge className={getStatusColor(investment.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(investment.status)}
                  {investment.status}
                </span>
              </Badge>
              {getTripStatusBadge(trip.status)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Investment Details */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Invested Amount</p>
                <p className="font-semibold">₹{(investment.amount / 1000).toFixed(0)}K</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Interest Rate</p>
                <p className="font-semibold">{investment.interestRate}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Expected Return</p>
                <p className="font-semibold text-accent">
                  ₹{(investment.expectedReturn / 1000).toFixed(1)}K
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Maturity Date</p>
                <p className="font-semibold text-sm">
                  {new Date(investment.maturityDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Investment Progress</span>
              <span className="font-semibold">
                {investment.status === 'completed' ? 'Completed' :
                 investment.status === 'defaulted' ? 'Defaulted' :
                 `${daysToMaturity} days remaining`}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  investment.status === 'completed' ? 'bg-green-500' :
                  investment.status === 'defaulted' ? 'bg-destructive' :
                  'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Trip Activity Timeline */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3">Trip Activity</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Trip Created</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(trip.createdAt).toLocaleString()}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>

              {trip.fundedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Investment Funded</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trip.fundedAt).toLocaleString()}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
              )}

              {trip.status === 'in_transit' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-2 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">In Transit</p>
                    <p className="text-xs text-muted-foreground">Vehicle on route</p>
                  </div>
                  <TruckIcon className="h-4 w-4 text-secondary" />
                </div>
              )}

              {trip.completedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Trip Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trip.completedAt).toLocaleString()}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              )}

              {trip.status === 'pending' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-muted rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Awaiting Assignment</p>
                    <p className="text-xs text-muted-foreground">No vehicle assigned yet</p>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Investment Dates */}
          <div className="border-t pt-4 grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Invested On</p>
              <p className="font-medium">{new Date(investment.investedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Days Since Investment</p>
              <p className="font-medium">{daysSinceInvestment} days</p>
            </div>
          </div>

          {/* Trip Documents */}
          {trip.documents && Object.keys(trip.documents).length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Trip Documents
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {trip.documents.ewaybill && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleViewDocument('E-Way Bill', trip.documents.ewaybill)}
                  >
                    <Eye className="h-4 w-4" />
                    E-Way Bill
                  </Button>
                )}
                {trip.documents.bilty && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleViewDocument('Bilty', trip.documents.bilty)}
                  >
                    <Eye className="h-4 w-4" />
                    Bilty
                  </Button>
                )}
                {((trip.documents as any).advance_invoice || (trip.documents as any).advanceInvoice) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleViewDocument('Advance Invoice', (trip.documents as any).advance_invoice || (trip.documents as any).advanceInvoice)}
                  >
                    <Eye className="h-4 w-4" />
                    Advance Invoice
                  </Button>
                )}
                {trip.documents.pod && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleViewDocument('POD', trip.documents.pod)}
                  >
                    <Eye className="h-4 w-4" />
                    POD
                  </Button>
                )}
                {((trip.documents as any).final_invoice || (trip.documents as any).finalInvoice) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleViewDocument('Final Invoice', (trip.documents as any).final_invoice || (trip.documents as any).finalInvoice)}
                  >
                    <Eye className="h-4 w-4" />
                    Final Invoice
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout role="lender">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading investments...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="lender">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Lendings</h1>
            <p className="text-muted-foreground mt-1">Track all your lendings and their progress</p>
          </div>
          <AdvancedFilter
            filters={filterConfig}
            currentFilters={filters}
            onFilterChange={setFilters}
            onClearFilters={() => setFilters({})}
          />
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Investments</p>
                <p className="text-3xl font-bold mt-2">{myInvestments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Escrowed</p>
                <p className="text-3xl font-bold mt-2 text-primary">{allEscrowedInvestments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold mt-2 text-secondary">{allActiveInvestments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-2 text-green-500">{allCompletedInvestments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Returns</p>
                <p className="text-3xl font-bold mt-2 text-accent">
                  ₹{(wallet.totalReturns / 1000).toFixed(0)}K
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investments Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({allFilteredInvestments.length})</TabsTrigger>
            <TabsTrigger value="escrowed">Escrowed ({allEscrowedInvestments.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({allActiveInvestments.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({allCompletedInvestments.length})</TabsTrigger>
            {allDefaultedInvestments.length > 0 && (
              <TabsTrigger value="defaulted">Defaulted ({allDefaultedInvestments.length})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {allFilteredInvestments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No investments yet</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {paginatedAllInvestments.map(investment =>
                  investment.status === 'escrowed' ? (
                    <EscrowedInvestmentCard key={investment.id} investment={investment} />
                  ) : (
                    <InvestmentCard key={investment.id} investment={investment} />
                  )
                )}

                {/* Pagination Controls for All Investments */}
                {totalAllPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {allStartIndex + 1} to {Math.min(allEndIndex, allFilteredInvestments.length)} of {allFilteredInvestments.length} investments
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAllInvestmentsPage(prev => Math.max(1, prev - 1))}
                        disabled={allInvestmentsPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {getPaginationRange(allInvestmentsPage, totalAllPages).map((page, idx) => (
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={allInvestmentsPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setAllInvestmentsPage(page as number)}
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
                        onClick={() => setAllInvestmentsPage(prev => Math.min(totalAllPages, prev + 1))}
                        disabled={allInvestmentsPage === totalAllPages}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="escrowed" className="space-y-4">
            {allEscrowedInvestments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No escrowed investments</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Funds in escrow are awaiting confirmation before becoming active
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {escrowedInvestments.map(investment => (
                  <EscrowedInvestmentCard key={investment.id} investment={investment} />
                ))}

                {/* Pagination Controls for Escrowed Investments */}
                {totalEscrowedPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {escrowedStartIndex + 1} to {Math.min(escrowedEndIndex, allEscrowedInvestments.length)} of {allEscrowedInvestments.length} investments
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEscrowedPage(prev => Math.max(1, prev - 1))}
                        disabled={escrowedPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {getPaginationRange(escrowedPage, totalEscrowedPages).map((page, idx) => (
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={escrowedPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setEscrowedPage(page as number)}
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
                        onClick={() => setEscrowedPage(prev => Math.min(totalEscrowedPages, prev + 1))}
                        disabled={escrowedPage === totalEscrowedPages}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {allActiveInvestments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active investments</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {activeInvestments.map(investment => (
                  <InvestmentCard key={investment.id} investment={investment} />
                ))}

                {/* Pagination Controls for Active Investments */}
                {totalActivePages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {activeStartIndex + 1} to {Math.min(activeEndIndex, allActiveInvestments.length)} of {allActiveInvestments.length} investments
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivePage(prev => Math.max(1, prev - 1))}
                        disabled={activePage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {getPaginationRange(activePage, totalActivePages).map((page, idx) => (
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={activePage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setActivePage(page as number)}
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
                        onClick={() => setActivePage(prev => Math.min(totalActivePages, prev + 1))}
                        disabled={activePage === totalActivePages}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {allCompletedInvestments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed investments</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {completedInvestments.map(investment => (
                  <InvestmentCard key={investment.id} investment={investment} />
                ))}

                {/* Pagination Controls for Completed Investments */}
                {totalCompletedPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {completedStartIndex + 1} to {Math.min(completedEndIndex, allCompletedInvestments.length)} of {allCompletedInvestments.length} investments
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompletedPage(prev => Math.max(1, prev - 1))}
                        disabled={completedPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {getPaginationRange(completedPage, totalCompletedPages).map((page, idx) => (
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={completedPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCompletedPage(page as number)}
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
                        onClick={() => setCompletedPage(prev => Math.min(totalCompletedPages, prev + 1))}
                        disabled={completedPage === totalCompletedPages}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {allDefaultedInvestments.length > 0 && (
            <TabsContent value="defaulted" className="space-y-4">
              {defaultedInvestments.map(investment => (
                <InvestmentCard key={investment.id} investment={investment} />
              ))}

              {/* Pagination Controls for Defaulted Investments */}
              {totalDefaultedPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {defaultedStartIndex + 1} to {Math.min(defaultedEndIndex, allDefaultedInvestments.length)} of {allDefaultedInvestments.length} investments
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultedPage(prev => Math.max(1, prev - 1))}
                      disabled={defaultedPage === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {getPaginationRange(defaultedPage, totalDefaultedPages).map((page, idx) => (
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                        ) : (
                          <Button
                            key={page}
                            variant={defaultedPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDefaultedPage(page as number)}
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
                      onClick={() => setDefaultedPage(prev => Math.min(totalDefaultedPages, prev + 1))}
                      disabled={defaultedPage === totalDefaultedPages}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Document View Dialog */}
      <Dialog open={documentViewDialogOpen} onOpenChange={setDocumentViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.type}</DialogTitle>
            <DialogDescription>
              View the uploaded document
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {selectedDocument?.data && (
              selectedDocument.data.startsWith('data:application/pdf') ? (
                <iframe
                  src={selectedDocument.data}
                  className="w-full h-[600px] border rounded"
                  title={selectedDocument.type}
                />
              ) : (
                <img
                  src={selectedDocument.data}
                  alt={selectedDocument.type}
                  className="max-w-full h-auto"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MyInvestments;
