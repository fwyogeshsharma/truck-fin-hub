import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { data, Trip } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdvancedFilter, { type FilterConfig } from '@/components/AdvancedFilter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  TruckIcon,
  MapPin,
  Package,
  Calendar,
  IndianRupee,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  Star,
  Upload,
  Download,
  FileSpreadsheet,
  Link,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LoadAgentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [refreshKey, setRefreshKey] = useState(0);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const trips = await data.getTrips();
        // Filter trips by company
        const filteredTrips = trips.filter(trip => {
          if (!user?.company) return true;
          return trip.loadOwnerName === user.company;
        });
        setAllTrips(filteredTrips);
      } catch (error) {
        console.error('Failed to load trips:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [refreshKey, user?.company]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTripTab, setCreateTripTab] = useState<'form' | 'excel' | 'api'>('form');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [documentViewDialogOpen, setDocumentViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ type: string; data: string } | null>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [fetchingFromApi, setFetchingFromApi] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: 'Refreshed!',
      description: 'Trip list has been updated',
    });
  };

  const handleDocumentUpload = async (tripId: string, docType: 'bilty' | 'ewaybill' | 'invoice', file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const trip = await data.getTrip(tripId);

      if (trip) {
        const updatedTrip = await data.updateTrip(tripId, {
          documents: {
            ...trip.documents,
            [docType]: base64String,
          },
        });

        toast({
          title: 'Document Uploaded!',
          description: `${docType.charAt(0).toUpperCase() + docType.slice(1)} has been uploaded successfully`,
        });

        // Update selected trip to show uploaded document immediately
        if (updatedTrip) {
          setSelectedTrip(updatedTrip);
        }
        setRefreshKey(prev => prev + 1);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleViewDocument = (docType: string, docData: string) => {
    setSelectedDocument({ type: docType, data: docData });
    setDocumentViewDialogOpen(true);
  };

  // Form states with today's date pre-filled
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    distance: '',
    loadType: '',
    weight: '',
    amount: '',
    maturityDays: '30',
    date: new Date().toISOString().split('T')[0], // Today's date
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (amount < 20000 || amount > 80000) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Trip value must be between ₹20,000 and ₹80,000',
      });
      return;
    }

    try {
      const trip = await data.createTrip({
        loadOwnerId: user?.company === 'RollingRadius' ? 'rr' : 'darcl',
        loadOwnerName: user?.company || 'Load Agent',
        loadOwnerLogo: user?.companyLogo || '/rr_full_transp_old.png',
        loadOwnerRating: 4.5,
        origin: formData.origin,
        destination: formData.destination,
        distance: parseFloat(formData.distance),
        loadType: formData.loadType,
        weight: parseFloat(formData.weight),
        amount: parseFloat(formData.amount),
        maturityDays: parseInt(formData.maturityDays),
        riskLevel: 'low', // Default risk level
        insuranceStatus: true, // Default insured
      });

      toast({
        title: 'Trip Created Successfully!',
        description: `Trip from ${formData.origin} to ${formData.destination} is now live`,
      });

      // Reset form
      setFormData({
        origin: '',
        destination: '',
        distance: '',
        loadType: '',
        weight: '',
        amount: '',
        maturityDays: '30',
        date: new Date().toISOString().split('T')[0],
      });

      setCreateDialogOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create trip',
      });
    }
  };

  const handleViewTrip = (trip: any) => {
    setSelectedTrip(trip);
    setViewDialogOpen(true);
  };

  const handleDownloadSampleExcel = () => {
    // Create sample Excel data with proper CSV formatting
    const sampleData = [
      ['Origin', 'Destination', 'Distance (km)', 'Load Type', 'Weight (kg)', 'Amount (₹)', 'Maturity Days', 'Date'],
      ['"Mumbai, Maharashtra"', '"Delhi, NCR"', '1400', 'Electronics', '15000', '50000', '30', '2025-10-06'],
      ['"Bangalore, Karnataka"', '"Chennai, Tamil Nadu"', '350', 'FMCG', '12000', '35000', '25', '2025-10-07'],
      ['"Pune, Maharashtra"', '"Hyderabad, Telangana"', '560', 'Machinery', '20000', '75000', '45', '2025-10-08'],
    ];

    // Convert to CSV format (fields with commas are already quoted)
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'trip_upload_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Sample Downloaded!',
      description: 'Use this template to upload multiple trips',
    });
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' || char === '"' || char === '"') { // Handle different quote types
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());

    // Debug log
    console.log('Raw line:', line);
    console.log('Parsed result:', result);

    return result;
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingExcel(true);

    try {
      const text = await file.text();
      // Split by newlines and remove empty lines
      const rows = text.split(/\r?\n/).filter(row => row.trim());

      // Skip header row
      const dataRows = rows.slice(1);

      let successCount = 0;
      let errorCount = 0;

      for (const rowText of dataRows) {
        try {
          // Parse CSV line (handles commas within fields)
          let row = parseCSVLine(rowText);

          // Log parsed row for debugging
          console.log('Parsed row:', row);

          // Handle case where origin/destination have unquoted commas (e.g., "Mumbai, Maharashtra" becomes 2 fields)
          // If we have 10 fields instead of 8, merge fields to fix it
          if (row.length === 10) {
            console.log('Detected 10 fields - merging origin and destination parts');
            row = [
              `${row[0]}, ${row[1]}`, // Merge "Mumbai" + "Maharashtra" -> "Mumbai, Maharashtra"
              `${row[2]}, ${row[3]}`, // Merge "Delhi" + "NCR" -> "Delhi, NCR"
              row[4],  // distance
              row[5],  // loadType
              row[6],  // weight
              row[7],  // amount
              row[8],  // maturityDays
              row[9],  // date
            ];
            console.log('Merged to:', row);
          }

          // Ensure we have exactly 7-8 fields
          if (row.length < 7 || !row[0]) {
            console.warn(`Invalid row length (${row.length}) for: ${rowText}`);
            errorCount++;
            continue;
          }

          const origin = row[0];
          const destination = row[1];
          const distance = row[2];
          const loadType = row[3];
          const weight = row[4];
          const amount = row[5];
          const maturityDays = row[6];
          // row[7] is date (optional)

          const tripAmount = parseFloat(amount);
          if (isNaN(tripAmount) || tripAmount < 20000 || tripAmount > 80000) {
            console.warn(`Invalid amount (${amount}) for row: ${rowText}`);
            errorCount++;
            continue;
          }

          const parsedDistance = parseFloat(distance);
          const parsedWeight = parseFloat(weight);
          const parsedMaturityDays = parseInt(maturityDays);

          if (isNaN(parsedDistance) || isNaN(parsedWeight) || isNaN(parsedMaturityDays)) {
            console.warn(`Invalid number format in row: ${rowText}`);
            errorCount++;
            continue;
          }

          await data.createTrip({
            loadOwnerId: user?.company === 'RollingRadius' ? 'rr' : 'darcl',
            loadOwnerName: user?.company || 'Load Agent',
            loadOwnerLogo: user?.companyLogo || '/rr_full_transp_old.png',
            loadOwnerRating: 4.5,
            origin,
            destination,
            distance: parsedDistance,
            loadType,
            weight: parsedWeight,
            amount: tripAmount,
            maturityDays: parsedMaturityDays,
            riskLevel: 'low',
            insuranceStatus: true,
          });

          successCount++;
        } catch (error) {
          console.error('Failed to create trip from row:', rowText, error);
          errorCount++;
        }
      }

      toast({
        title: 'Bulk Upload Complete!',
        description: `${successCount} trips created successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });

      if (successCount > 0) {
        setCreateDialogOpen(false);
        setRefreshKey(prev => prev + 1);
      }
      event.target.value = ''; // Reset file input
    } catch (error) {
      console.error('CSV Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to process CSV file. Please check the format.',
      });
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleFetchFromApi = async () => {
    if (!apiEndpoint.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid URL',
        description: 'Please enter a valid API endpoint',
      });
      return;
    }

    setFetchingFromApi(true);

    try {
      const response = await fetch(apiEndpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData = await response.json();

      // Handle both array and object with trips array
      const trips = Array.isArray(apiData) ? apiData : (apiData.trips || apiData.data || []);

      if (!Array.isArray(trips) || trips.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Data Found',
          description: 'No trip data found in the API response',
        });
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const tripData of trips) {
        try {
          // Extract and validate trip data
          const origin = tripData.origin || tripData.from || tripData.source || '';
          const destination = tripData.destination || tripData.to || tripData.target || '';
          const distance = parseFloat(tripData.distance || tripData.distanceKm || tripData.distance_km || 0);
          const loadType = tripData.loadType || tripData.load_type || tripData.cargoType || 'General Cargo';
          const weight = parseFloat(tripData.weight || tripData.weightKg || tripData.weight_kg || 0);
          const amount = parseFloat(tripData.amount || tripData.value || tripData.price || 0);
          const maturityDays = parseInt(tripData.maturityDays || tripData.maturity_days || tripData.paymentTerm || '30');

          // Validation
          if (!origin || !destination) {
            errorCount++;
            continue;
          }

          if (amount < 20000 || amount > 80000) {
            errorCount++;
            continue;
          }

          await data.createTrip({
            loadOwnerId: user?.company === 'RollingRadius' ? 'rr' : 'darcl',
            loadOwnerName: user?.company || 'Load Agent',
            loadOwnerLogo: user?.companyLogo || '/rr_full_transp_old.png',
            loadOwnerRating: 4.5,
            origin,
            destination,
            distance,
            loadType,
            weight,
            amount,
            maturityDays,
            riskLevel: tripData.riskLevel || 'low',
            insuranceStatus: tripData.insuranceStatus !== undefined ? tripData.insuranceStatus : true,
          });

          successCount++;
        } catch (error) {
          console.error('Failed to create trip from API data:', tripData, error);
          errorCount++;
        }
      }

      toast({
        title: 'API Import Complete!',
        description: `${successCount} trips imported successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });

      if (successCount > 0) {
        setCreateDialogOpen(false);
        setRefreshKey(prev => prev + 1);
        setApiEndpoint('');
      }
    } catch (error) {
      console.error('API fetch error:', error);
      toast({
        variant: 'destructive',
        title: 'API Fetch Failed',
        description: error instanceof Error ? error.message : 'Failed to fetch data from API',
      });
    } finally {
      setFetchingFromApi(false);
    }
  };

  // Filter trips with advanced filters
  const filteredTrips = allTrips.filter((trip) => {
    // Basic search (kept for backward compatibility)
    const matchesBasicSearch =
      trip.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.loadType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.loadOwnerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBasicStatus = statusFilter === 'all' || trip.status === statusFilter;

    // Advanced filter search
    const matchesAdvancedSearch = !advancedFilters.search ||
      trip.origin.toLowerCase().includes(advancedFilters.search.toLowerCase()) ||
      trip.destination.toLowerCase().includes(advancedFilters.search.toLowerCase()) ||
      trip.loadType.toLowerCase().includes(advancedFilters.search.toLowerCase()) ||
      trip.loadOwnerName.toLowerCase().includes(advancedFilters.search.toLowerCase());

    const matchesAdvancedStatus = !advancedFilters.status || advancedFilters.status === 'all' || trip.status === advancedFilters.status;

    const matchesLoadType = !advancedFilters.loadType || advancedFilters.loadType === 'all' || trip.loadType === advancedFilters.loadType;

    const matchesAmountRange =
      (!advancedFilters.amount_min || trip.amount >= parseFloat(advancedFilters.amount_min)) &&
      (!advancedFilters.amount_max || trip.amount <= parseFloat(advancedFilters.amount_max));

    const matchesDistanceRange =
      (!advancedFilters.distance_min || trip.distance >= parseFloat(advancedFilters.distance_min)) &&
      (!advancedFilters.distance_max || trip.distance <= parseFloat(advancedFilters.distance_max));

    const matchesWeightRange =
      (!advancedFilters.weight_min || trip.weight >= parseFloat(advancedFilters.weight_min)) &&
      (!advancedFilters.weight_max || trip.weight <= parseFloat(advancedFilters.weight_max));

    const matchesRiskLevel = !advancedFilters.riskLevel || advancedFilters.riskLevel === 'all' || trip.riskLevel === advancedFilters.riskLevel;

    const matchesBidStatus = !advancedFilters.hasBids || advancedFilters.hasBids === 'all' ||
      (advancedFilters.hasBids === 'yes' && trip.bids && trip.bids.length > 0) ||
      (advancedFilters.hasBids === 'no' && (!trip.bids || trip.bids.length === 0));

    return matchesBasicSearch && matchesBasicStatus && matchesAdvancedSearch && matchesAdvancedStatus &&
      matchesLoadType && matchesAmountRange && matchesDistanceRange && matchesWeightRange &&
      matchesRiskLevel && matchesBidStatus;
  });

  const handleAllotTrip = async (tripId: string, lenderId: string, lenderName: string) => {
    const result = await data.allotTrip(tripId, lenderId, lenderName);

    if (result) {
      toast({
        title: 'Trip Allotted Successfully!',
        description: `Trip has been allotted to ${lenderName}`,
      });
      setRefreshKey(prev => prev + 1); // Refresh trip list
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to allot trip',
      });
    }
  };

  // Advanced filter configuration
  const filterConfig: FilterConfig[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by origin, destination, load type, or company...',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'escrowed', label: 'Escrowed' },
        { value: 'funded', label: 'Funded' },
        { value: 'in_transit', label: 'In Transit' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
      placeholder: 'Select status',
    },
    {
      id: 'loadType',
      label: 'Load Type',
      type: 'select',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'Electronics', label: 'Electronics' },
        { value: 'FMCG', label: 'FMCG' },
        { value: 'Textiles', label: 'Textiles' },
        { value: 'Automotive Parts', label: 'Automotive Parts' },
        { value: 'Machinery', label: 'Machinery' },
        { value: 'Food & Beverages', label: 'Food & Beverages' },
      ],
      placeholder: 'Select load type',
    },
    {
      id: 'amount',
      label: 'Trip Value (₹)',
      type: 'range',
      min: 0,
      max: 10000000,
    },
    {
      id: 'distance',
      label: 'Distance (km)',
      type: 'range',
      min: 0,
      max: 5000,
    },
    {
      id: 'weight',
      label: 'Weight (kg)',
      type: 'range',
      min: 0,
      max: 50000,
    },
    {
      id: 'riskLevel',
      label: 'Risk Level',
      type: 'select',
      options: [
        { value: 'all', label: 'All Levels' },
        { value: 'low', label: 'Low Risk' },
        { value: 'medium', label: 'Medium Risk' },
        { value: 'high', label: 'High Risk' },
      ],
      placeholder: 'Select risk level',
    },
    {
      id: 'hasBids',
      label: 'Bid Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Trips' },
        { value: 'yes', label: 'Has Bids' },
        { value: 'no', label: 'No Bids' },
      ],
      placeholder: 'Select bid status',
    },
  ];

  const handleAllotAllTrips = async () => {
    console.log('Starting bulk allotment...');
    console.log('All trips:', allTrips);

    const escrowedTrips = allTrips.filter((t) => t.status === 'escrowed' && t.bids && t.bids.length > 0);
    console.log('Escrowed trips with bids:', escrowedTrips);

    if (escrowedTrips.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Trips to Allot',
        description: 'There are no escrowed trips with bids',
      });
      return;
    }

    toast({
      title: 'Allotting Trips...',
      description: `Processing ${escrowedTrips.length} trips`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const trip of escrowedTrips) {
      try {
        console.log(`Allotting trip ${trip.id} to ${trip.bids[0].lenderName}...`);

        // Allot to the first bidder (or you can add logic to choose the best bid)
        const bid = trip.bids[0];
        const result = await data.allotTrip(trip.id, bid.lenderId, bid.lenderName);

        if (result) {
          console.log(`✓ Trip ${trip.id} allotted successfully`);
          successCount++;
        } else {
          console.error(`✗ Failed to allot trip ${trip.id}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error allotting trip ${trip.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Bulk allotment complete: ${successCount} success, ${errorCount} errors`);

    toast({
      title: 'Bulk Allotment Complete!',
      description: `${successCount} trips allotted successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
    });

    setRefreshKey(prev => prev + 1); // Refresh trip list
  };

  // Stats
  const stats = [
    {
      title: 'Total Trips',
      value: allTrips.length,
      icon: TruckIcon,
      color: 'text-primary',
    },
    {
      title: 'Pending',
      value: allTrips.filter((t) => t.status === 'pending').length,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Escrowed',
      value: allTrips.filter((t) => t.status === 'escrowed').length,
      icon: Shield,
      color: 'text-orange-600',
    },
    {
      title: 'Funded',
      value: allTrips.filter((t) => t.status === 'funded').length,
      icon: CheckCircle,
      color: 'text-green-600',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'escrowed':
        return (
          <Badge className="bg-orange-600">
            <Shield className="h-3 w-3 mr-1" />
            Escrowed
          </Badge>
        );
      case 'funded':
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Funded
          </Badge>
        );
      case 'in_transit':
        return (
          <Badge className="bg-blue-600">
            <TruckIcon className="h-3 w-3 mr-1" />
            In Transit
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-purple-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="load_agent">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading trips...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="load_agent">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Load Agent Dashboard</h1>
            <p className="text-muted-foreground mt-1">Create and manage trips across the portal</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Trip
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
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
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>

        {/* Escrowed Trips - Pending Allotment */}
        {allTrips.filter((t) => t.status === 'escrowed').length > 0 && (
          <Card className="border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    Escrowed Trips - Awaiting Allotment
                  </CardTitle>
                  <CardDescription>Trips with lender bids pending your approval</CardDescription>
                </div>
                <Button
                  onClick={handleAllotAllTrips}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Allot All Trips
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allTrips
                  .filter((t) => t.status === 'escrowed')
                  .map((trip) => (
                    <Card key={trip.id} className="border-orange-300 bg-white dark:bg-card">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              {trip.loadOwnerLogo && (
                                <img
                                  src={trip.loadOwnerLogo}
                                  alt={trip.loadOwnerName}
                                  className="h-10 w-10 object-contain rounded border p-1"
                                />
                              )}
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {trip.origin} → {trip.destination}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {trip.loadType} • {trip.distance}km • ₹{(trip.amount / 1000).toFixed(0)}K
                                </p>
                              </div>
                            </div>

                            {/* Bids Section */}
                            {trip.bids && trip.bids.length > 0 && (
                              <div className="mt-4 p-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                <h4 className="font-semibold text-sm mb-3 text-orange-900 dark:text-orange-100">
                                  Lender Bids ({trip.bids.length})
                                </h4>
                                <div className="space-y-2">
                                  {trip.bids.map((bid: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-white dark:bg-card rounded border"
                                    >
                                      <div>
                                        <p className="font-medium">{bid.lenderName}</p>
                                        <p className="text-sm text-muted-foreground">
                                          Amount: ₹{(bid.amount / 1000).toFixed(0)}K • Rate: {bid.interestRate}%
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => handleAllotTrip(trip.id, bid.lenderId, bid.lenderName)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Allot
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <Badge className="bg-orange-600 ml-4">
                            <Shield className="h-3 w-3 mr-1" />
                            Escrowed
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Trips */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Trips in Portal</CardTitle>
                <CardDescription>View and search all trips across the platform</CardDescription>
              </div>
              <div className="flex gap-2">
                <AdvancedFilter
                  filters={filterConfig}
                  currentFilters={advancedFilters}
                  onFilterChange={setAdvancedFilters}
                  onClearFilters={() => setAdvancedFilters({})}
                />
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
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Load Type</TableHead>
                  <TableHead>Load Owner</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bid Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No trips found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrips
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium">
                                {trip.origin} → {trip.destination}
                              </p>
                              <p className="text-xs text-muted-foreground">{trip.distance}km</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{trip.loadType}</p>
                            <p className="text-xs text-muted-foreground">{trip.weight}kg</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {trip.loadOwnerLogo && (
                              <img
                                src={trip.loadOwnerLogo}
                                alt={trip.loadOwnerName}
                                className="h-6 object-contain"
                              />
                            )}
                            <div>
                              <p className="font-medium text-sm">{trip.loadOwnerName}</p>
                              {trip.loadOwnerRating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs">{trip.loadOwnerRating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold">₹{(trip.amount / 1000).toFixed(0)}K</p>
                        </TableCell>
                        <TableCell>
                          {trip.bids && trip.bids.length > 0 ? (
                            <div>
                              <p className="font-semibold text-green-600">
                                ₹{(trip.bids[0].amount / 1000).toFixed(0)}K
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @ {trip.bids[0].interestRate}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                by {trip.bids[0].lenderName}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No bids</p>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(trip.status)}</TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {new Date(trip.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTrip(trip)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {trip.status === 'escrowed' && trip.bids && trip.bids.length > 0 && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  const bid = trip.bids[0]; // For now, allot to first bidder
                                  handleAllotTrip(trip.id, bid.lenderId, bid.lenderName);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Allot
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Trip Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create New Trip
              </DialogTitle>
              <DialogDescription>Add trips individually or in bulk</DialogDescription>
            </DialogHeader>

            <Tabs value={createTripTab} onValueChange={(value) => setCreateTripTab(value as 'form' | 'excel' | 'api')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="form" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Single Trip
                </TabsTrigger>
                <TabsTrigger value="excel" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Bulk Upload
                </TabsTrigger>
                <TabsTrigger value="api" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  API Import
                </TabsTrigger>
              </TabsList>

              <TabsContent value="form">
                <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Trip Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maturityDays">Maturity Days</Label>
                  <Input
                    id="maturityDays"
                    name="maturityDays"
                    type="number"
                    placeholder="e.g., 30"
                    value={formData.maturityDays}
                    onChange={handleChange}
                    min="1"
                    max="180"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin</Label>
                  <Input
                    id="origin"
                    name="origin"
                    placeholder="e.g., Mumbai, Maharashtra"
                    value={formData.origin}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    name="destination"
                    placeholder="e.g., Delhi, NCR"
                    value={formData.destination}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input
                    id="distance"
                    name="distance"
                    type="number"
                    placeholder="e.g., 1400"
                    value={formData.distance}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loadType">Load Type</Label>
                  <Input
                    id="loadType"
                    name="loadType"
                    placeholder="e.g., Electronics, FMCG"
                    value={formData.loadType}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    placeholder="e.g., 15000"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Trip Value (₹)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="e.g., 50000"
                    value={formData.amount}
                    onChange={handleChange}
                    min="20000"
                    max="80000"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Between ₹20,000 and ₹80,000</p>
                </div>
              </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-gradient-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Trip
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>

              <TabsContent value="excel" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileSpreadsheet className="h-8 w-8 text-primary" />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">Upload Excel/CSV File</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload a CSV file with multiple trip details to create trips in bulk
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDownloadSampleExcel}
                        className="w-full max-w-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Sample Template
                      </Button>

                      <div className="relative">
                        <Input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleExcelUpload}
                          disabled={uploadingExcel}
                          className="w-full max-w-sm mx-auto"
                          id="excel-upload"
                        />
                      </div>

                      {uploadingExcel && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                          Processing file...
                        </div>
                      )}
                    </div>

                    <div className="mt-6 p-4 bg-muted rounded-lg text-left">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        File Format Requirements
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• CSV format with comma-separated values</li>
                        <li>• First row must be headers (will be skipped)</li>
                        <li>• Columns: Origin, Destination, Distance (km), Load Type, Weight (kg), Amount (₹), Maturity Days, Date</li>
                        <li>• Trip amount must be between ₹20,000 and ₹80,000</li>
                        <li>• Download the sample template for reference</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="api" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Link className="h-8 w-8 text-primary" />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">Import from API</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Fetch trip data from an external API endpoint and create trips automatically
                      </p>
                    </div>

                    <div className="space-y-3 max-w-xl mx-auto">
                      <div className="space-y-2">
                        <Label htmlFor="api-endpoint" className="text-left block">
                          API Endpoint URL
                        </Label>
                        <Input
                          id="api-endpoint"
                          type="url"
                          placeholder="https://api.example.com/trips"
                          value={apiEndpoint}
                          onChange={(e) => setApiEndpoint(e.target.value)}
                          disabled={fetchingFromApi}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground text-left">
                          Enter the full URL of your API endpoint that returns trip data
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={handleFetchFromApi}
                        disabled={fetchingFromApi || !apiEndpoint.trim()}
                        className="w-full bg-gradient-primary"
                      >
                        {fetchingFromApi ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Fetching Trips...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Fetch & Import Trips
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="mt-6 p-4 bg-muted rounded-lg text-left">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        API Response Format
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Your API should return a JSON array of trips or an object with a "trips" or "data" field containing the array:
                      </p>
                      <div className="bg-background p-3 rounded border font-mono text-xs overflow-x-auto">
                        <pre>{`[
  {
    "origin": "Mumbai, Maharashtra",
    "destination": "Delhi, NCR",
    "distance": 1400,
    "loadType": "Electronics",
    "weight": 15000,
    "amount": 50000,
    "maturityDays": 30
  }
]`}</pre>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-semibold">Supported field names:</p>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                          <li>• <strong>origin:</strong> origin, from, source</li>
                          <li>• <strong>destination:</strong> destination, to, target</li>
                          <li>• <strong>distance:</strong> distance, distanceKm, distance_km</li>
                          <li>• <strong>loadType:</strong> loadType, load_type, cargoType</li>
                          <li>• <strong>weight:</strong> weight, weightKg, weight_kg</li>
                          <li>• <strong>amount:</strong> amount, value, price (₹20,000 - ₹80,000)</li>
                          <li>• <strong>maturityDays:</strong> maturityDays, maturity_days, paymentTerm</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* View Trip Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Trip Details</DialogTitle>
              <DialogDescription>Complete trip information</DialogDescription>
            </DialogHeader>

            {selectedTrip && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Route</p>
                    <p className="font-semibold">
                      {selectedTrip.origin} → {selectedTrip.destination}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTrip.distance}km
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Load Type</p>
                    <p className="font-semibold">{selectedTrip.loadType}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTrip.weight}kg
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Trip Value</p>
                    <p className="font-semibold">
                      ₹{(selectedTrip.amount / 1000).toFixed(0)}K
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    {getStatusBadge(selectedTrip.status)}
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Load Owner</p>
                    <p className="font-semibold">{selectedTrip.loadOwnerName}</p>
                    {selectedTrip.loadOwnerRating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{selectedTrip.loadOwnerRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Created</p>
                    <p className="font-semibold">
                      {new Date(selectedTrip.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>

                  {selectedTrip.riskLevel && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
                      <Badge
                        className={`${
                          selectedTrip.riskLevel === 'low'
                            ? 'bg-green-600'
                            : selectedTrip.riskLevel === 'medium'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        } text-white`}
                      >
                        {selectedTrip.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  )}

                  {selectedTrip.insuranceStatus !== undefined && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Insurance</p>
                      <Badge
                        className={`${
                          selectedTrip.insuranceStatus ? 'bg-green-600' : 'bg-gray-600'
                        } text-white flex items-center gap-1 w-fit`}
                      >
                        <Shield className="h-3 w-3" />
                        {selectedTrip.insuranceStatus ? 'Insured' : 'Not Insured'}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Document Upload Section */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Trip Documents
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Bilty Upload */}
                    <div className="p-3 border rounded-lg space-y-2">
                      <Label htmlFor={`bilty-${selectedTrip.id}`} className="text-sm font-medium">
                        Bilty
                      </Label>
                      {selectedTrip.documents?.bilty ? (
                        <div className="space-y-2">
                          <Badge className="bg-green-600 w-full justify-center text-xs py-1">Uploaded</Badge>
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleViewDocument('Bilty', selectedTrip.documents!.bilty!)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = selectedTrip.documents!.bilty!;
                                link.download = `bilty-${selectedTrip.id}.pdf`;
                                link.click();
                              }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Input
                          id={`bilty-${selectedTrip.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(selectedTrip.id, 'bilty', file);
                          }}
                          className="text-xs"
                        />
                      )}
                    </div>

                    {/* E-Way Bill Upload */}
                    <div className="p-3 border rounded-lg space-y-2">
                      <Label htmlFor={`ewaybill-${selectedTrip.id}`} className="text-sm font-medium">
                        E-Way Bill
                      </Label>
                      {selectedTrip.documents?.ewaybill ? (
                        <div className="space-y-2">
                          <Badge className="bg-green-600 w-full justify-center text-xs py-1">Uploaded</Badge>
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleViewDocument('E-Way Bill', selectedTrip.documents!.ewaybill!)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = selectedTrip.documents!.ewaybill!;
                                link.download = `ewaybill-${selectedTrip.id}.pdf`;
                                link.click();
                              }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Input
                          id={`ewaybill-${selectedTrip.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(selectedTrip.id, 'ewaybill', file);
                          }}
                          className="text-xs"
                        />
                      )}
                    </div>

                    {/* Invoice Upload */}
                    <div className="p-3 border rounded-lg space-y-2">
                      <Label htmlFor={`invoice-${selectedTrip.id}`} className="text-sm font-medium">
                        Invoice
                      </Label>
                      {selectedTrip.documents?.invoice ? (
                        <div className="space-y-2">
                          <Badge className="bg-green-600 w-full justify-center text-xs py-1">Uploaded</Badge>
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleViewDocument('Invoice', selectedTrip.documents!.invoice!)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = selectedTrip.documents!.invoice!;
                                link.download = `invoice-${selectedTrip.id}.pdf`;
                                link.click();
                              }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Input
                          id={`invoice-${selectedTrip.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(selectedTrip.id, 'invoice', file);
                          }}
                          className="text-xs"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Viewer Dialog */}
        <Dialog open={documentViewDialogOpen} onOpenChange={setDocumentViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                View {selectedDocument?.type}
              </DialogTitle>
              <DialogDescription>Document preview</DialogDescription>
            </DialogHeader>

            {selectedDocument && (
              <div className="overflow-auto max-h-[70vh] border rounded-lg">
                {selectedDocument.data.startsWith('data:application/pdf') ? (
                  <iframe
                    src={selectedDocument.data}
                    className="w-full h-[70vh]"
                    title={selectedDocument.type}
                  />
                ) : (
                  <img
                    src={selectedDocument.data}
                    alt={selectedDocument.type}
                    className="w-full h-auto"
                  />
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDocumentViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default LoadAgentDashboard;
