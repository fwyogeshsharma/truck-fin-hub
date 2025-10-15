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
  ChevronLeft,
  ChevronRight,
  Code,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPercentage } from '@/lib/currency';
import ShipperAPIDocumentation from '@/components/ShipperAPIDocumentation';

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

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: 'Refreshed!',
      description: 'Trip list has been updated',
    });
  };

  const handleDocumentUpload = async (tripId: string, docType: 'ewaybill' | 'bilty' | 'advance_invoice' | 'pod' | 'final_invoice', file: File) => {
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

  // Client companies list
  const clientCompanies = [
    { name: 'Alisha Torrent', logo: '/clients/AlishaTorrent.svg' },
    { name: 'Balaji', logo: '/clients/balaji.png' },
    { name: 'Berger Paints', logo: '/clients/berger.png' },
    { name: 'Bhandari Plastic', logo: '/clients/bhandari-plastic.png' },
    { name: 'Dynamic Cables', logo: '/clients/dynamic-cables.png' },
    { name: 'Emami', logo: '/clients/emami.png' },
    { name: 'Greenply', logo: '/clients/greenply.png' },
    { name: 'INA Energy', logo: '/clients/ina-energy.png' },
    { name: 'Mangal Electricals', logo: '/clients/mangal-electricals.png' },
    { name: 'Manishankar Oils', logo: '/clients/Manishankar-Oils.png' },
    { name: 'Man Structures', logo: '/clients/man-structures.png' },
    { name: 'Mohit Polytech Pvt Ltd', logo: '/clients/Mohit-Polytech-Pvt-Ltd.png' },
    { name: 'Oswal Cables', logo: '/clients/oswal-cables.png' },
    { name: 'Raydean', logo: '/clients/raydean.png' },
    { name: 'RCC', logo: '/clients/rcc.png' },
    { name: 'Rex Pipes', logo: '/clients/rex-pipes.png' },
    { name: 'RL Industries', logo: '/clients/rl-industries.png' },
    { name: 'Sagar', logo: '/clients/sagar.png' },
    { name: 'Source One', logo: '/clients/source-one.png' },
    { name: 'Star Rising', logo: '/clients/star-rising.png' },
    { name: 'True Power', logo: '/clients/true-power.png' },
    { name: 'Varun Beverages', logo: '/clients/Varun-Beverages.png' },
  ];

  // Form states with today's date pre-filled
  const [formData, setFormData] = useState({
    clientCompany: '',
    clientLogo: '',
    origin: '',
    destination: '',
    distance: '',
    loadType: '',
    weight: '',
    amount: '',
    interestRate: '12',
    maturityDays: '30',
    date: new Date().toISOString().split('T')[0], // Today's date
  });

  // Helper function to capitalize first letter of each word in a city name
  const capitalizeCity = (text: string): string => {
    return text
      .split(',')
      .map(part =>
        part.trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      )
      .join(', ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Capitalize city names for origin and destination
    if (name === 'origin' || name === 'destination') {
      setFormData({ ...formData, [name]: capitalizeCity(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleClientCompanyChange = (companyName: string) => {
    const selectedClient = clientCompanies.find(c => c.name === companyName);
    setFormData({
      ...formData,
      clientCompany: companyName,
      clientLogo: selectedClient?.logo || '',
    });
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
      const interestRate = parseFloat(formData.interestRate);

      const trip = await data.createTrip({
        loadOwnerId: user?.company === 'RollingRadius' ? 'rr' : 'darcl',
        loadOwnerName: user?.company || 'Shipper',
        loadOwnerLogo: user?.companyLogo || '/rr_full_transp_old.png',
        loadOwnerRating: 4.5,
        clientCompany: formData.clientCompany,
        clientLogo: formData.clientLogo,
        origin: formData.origin,
        destination: formData.destination,
        distance: parseFloat(formData.distance),
        loadType: formData.loadType,
        weight: parseFloat(formData.weight),
        amount: parseFloat(formData.amount),
        interestRate: interestRate,
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
        clientCompany: '',
        clientLogo: '',
        origin: '',
        destination: '',
        distance: '',
        loadType: '',
        weight: '',
        amount: '',
        interestRate: '12',
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
      ['Consignee Company', 'Origin', 'Destination', 'Distance (km)', 'Load Type', 'Weight (kg)', 'Amount (₹)', 'Interest Rate (%)', 'Maturity Days', 'Date'],
      ['Berger Paints', '"Mumbai, Maharashtra"', '"Delhi, NCR"', '1400', 'Electronics', '15000', '50000', '12', '30', '2025-10-06'],
      ['Emami', '"Bangalore, Karnataka"', '"Chennai, Tamil Nadu"', '350', 'FMCG', '12000', '35000', '11', '25', '2025-10-07'],
      ['Greenply', '"Pune, Maharashtra"', '"Hyderabad, Telangana"', '560', 'Machinery', '20000', '75000', '12.5', '45', '2025-10-08'],
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
          // If we have 12 fields instead of 10, merge fields to fix it
          if (row.length === 12) {
            console.log('Detected 12 fields - merging origin and destination parts');
            row = [
              row[0], // clientCompany
              `${row[1]}, ${row[2]}`, // Merge "Mumbai" + "Maharashtra" -> "Mumbai, Maharashtra"
              `${row[3]}, ${row[4]}`, // Merge "Delhi" + "NCR" -> "Delhi, NCR"
              row[5],  // distance
              row[6],  // loadType
              row[7],  // weight
              row[8],  // amount
              row[9],  // interestRate
              row[10], // maturityDays
              row[11], // date
            ];
            console.log('Merged to:', row);
          }

          // Ensure we have exactly 9-10 fields
          if (row.length < 9 || !row[0]) {
            console.warn(`Invalid row length (${row.length}) for: ${rowText}`);
            errorCount++;
            continue;
          }

          const clientCompany = row[0];
          const origin = row[1];
          const destination = row[2];
          const distance = row[3];
          const loadType = row[4];
          const weight = row[5];
          const amount = row[6];
          const interestRate = row[7];
          const maturityDays = row[8];
          // row[9] is date (optional)

          // Find the client logo
          const selectedClient = clientCompanies.find(c => c.name === clientCompany);
          if (!selectedClient) {
            console.warn(`Unknown client company (${clientCompany}) for row: ${rowText}`);
            errorCount++;
            continue;
          }

          const tripAmount = parseFloat(amount);
          if (isNaN(tripAmount) || tripAmount < 20000 || tripAmount > 80000) {
            console.warn(`Invalid amount (${amount}) for row: ${rowText}`);
            errorCount++;
            continue;
          }

          const parsedInterestRate = parseFloat(interestRate);
          if (isNaN(parsedInterestRate) || parsedInterestRate < 8 || parsedInterestRate > 18) {
            console.warn(`Invalid interest rate (${interestRate}) for row: ${rowText}`);
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
            loadOwnerName: user?.company || 'Shipper',
            loadOwnerLogo: user?.companyLogo || '/rr_full_transp_old.png',
            loadOwnerRating: 4.5,
            clientCompany,
            clientLogo: selectedClient.logo,
            origin,
            destination,
            distance: parsedDistance,
            loadType,
            weight: parsedWeight,
            amount: tripAmount,
            interestRate: parsedInterestRate,
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTrips = filteredTrips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [advancedFilters]);

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
            <h1 className="text-3xl font-bold">Shipper Dashboard</h1>
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
                                  {trip.bids.map((bid: any, index: number) => {
                                    // Add 30% markup to lender's bid rate
                                    // If lender bids 10%, shipper pays 10% + (10% * 0.3) = 13%
                                    const shipperRate = bid.interestRate + (bid.interestRate * 0.3);

                                    return (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-white dark:bg-card rounded border"
                                      >
                                        <div>
                                          <p className="font-medium">{bid.lenderName}</p>
                                          <p className="text-sm text-muted-foreground">
                                            Amount: ₹{(bid.amount / 1000).toFixed(0)}K • Rate: {formatPercentage(shipperRate)}%
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
                                    );
                                  })}
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
                  <TableHead>Consignor</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Load Type</TableHead>
                  <TableHead>Shipper</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Bid Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      No trips found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {trip.clientLogo ? (
                              <img
                                src={trip.clientLogo}
                                alt={trip.clientCompany || 'Company'}
                                className="h-10 w-auto object-contain"
                                title={trip.clientCompany}
                              />
                            ) : (
                              <div className="h-10 w-16 bg-muted rounded flex items-center justify-center border border-dashed">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
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
                          <div className="flex items-center justify-center gap-2">
                            {trip.loadOwnerLogo && (
                              <img
                                src={trip.loadOwnerLogo}
                                alt={trip.loadOwnerName}
                                className="h-8 object-contain"
                                title={trip.loadOwnerName}
                              />
                            )}
                            {trip.loadOwnerRating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium">{trip.loadOwnerRating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold">₹{(trip.amount / 1000).toFixed(0)}K</p>
                        </TableCell>
                        <TableCell>
                          <div className="text-center cursor-help relative group">
                            <p className="font-semibold text-green-600">
                              {formatPercentage(trip.interestRate || 12)}% ({trip.maturityDays || 30} days)
                            </p>
                            <div className="hidden group-hover:block absolute z-10 bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                              <p className="text-sm font-semibold">{formatPercentage(trip.interestRate || 12)}% in {trip.maturityDays || 30} days</p>
                              <p className="text-sm text-muted-foreground">{formatPercentage((trip.interestRate || 12) * 365 / (trip.maturityDays || 30))}% ARR</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {trip.bids && trip.bids.length > 0 ? (
                            (() => {
                              // Add 30% markup to lender's bid rate
                              // If lender bids 10%, shipper pays 10% + (10% * 0.3) = 13%
                              const shipperRate = trip.bids[0].interestRate + (trip.bids[0].interestRate * 0.3);

                              return (
                                <div>
                                  <p className="font-semibold text-green-600">
                                    ₹{(trip.bids[0].amount / 1000).toFixed(0)}K
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    @ {formatPercentage(shipperRate)}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    by {trip.bids[0].lenderName}
                                  </p>
                                </div>
                              );
                            })()
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

        {/* Pagination Controls */}
        {filteredTrips.length > 0 && totalPages > 1 && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="itemsPerPage" className="text-sm">Items per page:</Label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-muted-foreground ml-4">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredTrips.length)} of {filteredTrips.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === 1 ||
                             page === totalPages ||
                             (page >= currentPage - 1 && page <= currentPage + 1);
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center gap-1">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      </div>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

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
                  <Code className="h-4 w-4" />
                  API Support
                </TabsTrigger>
              </TabsList>

              <TabsContent value="form">
                <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientCompany">Consignee Company *</Label>
                  <select
                    id="clientCompany"
                    value={formData.clientCompany}
                    onChange={(e) => handleClientCompanyChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select Company</option>
                    {clientCompanies.map((company) => (
                      <option key={company.name} value={company.name}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

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
              </div>

              {formData.clientLogo && (
                <div className="p-3 border rounded-lg bg-muted/30 flex items-center gap-3">
                  <img
                    src={formData.clientLogo}
                    alt={formData.clientCompany}
                    className="h-12 w-auto object-contain"
                  />
                  <div>
                    <p className="text-sm font-medium">{formData.clientCompany}</p>
                    <p className="text-xs text-muted-foreground">Selected consignee</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Loan Required on Interest rate & Duration</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="interestRate"
                    name="interestRate"
                    type="number"
                    placeholder="12"
                    value={formData.interestRate}
                    onChange={handleChange}
                    step="0.5"
                    required
                    className="w-20"
                  />
                  <span className="text-sm">% Interest rate in</span>
                  <Input
                    id="maturityDays"
                    name="maturityDays"
                    type="number"
                    placeholder="30"
                    value={formData.maturityDays}
                    onChange={handleChange}
                    min="1"
                    max="365"
                    required
                    className="w-20"
                  />
                  <span className="text-sm">days</span>
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
                <div className="space-y-6">
                  {/* Header Section */}
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileSpreadsheet className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg">Upload Excel/CSV File</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload a CSV file with multiple trip details to create trips in bulk
                    </p>
                  </div>

                  {/* Upload Section */}
                  <div className="border-2 border-dashed rounded-lg p-8 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="space-y-4">
                      <Label htmlFor="excel-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                            <Upload className="h-10 w-10 text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="text-base font-semibold mb-1">Choose CSV File to Upload</p>
                            <p className="text-sm text-muted-foreground">Click here to browse or drag and drop</p>
                          </div>
                          <Button
                            type="button"
                            className="bg-gradient-primary text-base px-8 py-6 h-auto pointer-events-none"
                            size="lg"
                          >
                            <Upload className="h-5 w-5 mr-2" />
                            Select File
                          </Button>
                        </div>
                      </Label>
                      <Input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleExcelUpload}
                        disabled={uploadingExcel}
                        className="hidden"
                        id="excel-upload"
                      />

                      {uploadingExcel && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                          Processing file...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Template Download Link */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Don't have a file ready?{' '}
                      <button
                        type="button"
                        onClick={handleDownloadSampleExcel}
                        className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download sample template
                      </button>
                    </p>
                  </div>

                  {/* File Format Requirements */}
                  <div className="p-4 bg-muted rounded-lg text-left">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      File Format Requirements
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• CSV format with comma-separated values</li>
                      <li>• First row must be headers (will be skipped)</li>
                      <li>• Columns: Consignee Company, Origin, Destination, Distance (km), Load Type, Weight (kg), Amount (₹), Interest Rate (%), Maturity Days, Date</li>
                      <li>• Consignee Company must match exactly from the list (e.g., "Berger Paints", "Emami")</li>
                      <li>• Trip amount must be between ₹20,000 and ₹80,000</li>
                      <li>• Interest rate must be between 8% and 18%</li>
                      <li>• Download the sample template for reference</li>
                    </ul>
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
                <ShipperAPIDocumentation />
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
                  <div className="grid md:grid-cols-5 gap-4">
                    {/* 1. E-Way Bill Upload */}
                    <div className="p-3 border rounded-lg space-y-2">
                      <Label htmlFor={`ewaybill-${selectedTrip.id}`} className="text-sm font-medium">
                        1. E-Way Bill
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

                    {/* 2. Bilty Upload */}
                    <div className="p-3 border rounded-lg space-y-2">
                      <Label htmlFor={`bilty-${selectedTrip.id}`} className="text-sm font-medium">
                        2. Bilty
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

                    {/* 3. Advance Invoice Upload */}
                    <div className="p-3 border rounded-lg space-y-2">
                      <Label htmlFor={`advance_invoice-${selectedTrip.id}`} className="text-sm font-medium">
                        3. Advance Invoice
                      </Label>
                      {selectedTrip.documents?.advance_invoice ? (
                        <div className="space-y-2">
                          <Badge className="bg-green-600 w-full justify-center text-xs py-1">Uploaded</Badge>
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleViewDocument('Advance Invoice', selectedTrip.documents!.advance_invoice!)}
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
                                link.href = selectedTrip.documents!.advance_invoice!;
                                link.download = `advance-invoice-${selectedTrip.id}.pdf`;
                                link.click();
                              }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Input
                          id={`advance_invoice-${selectedTrip.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(selectedTrip.id, 'advance_invoice', file);
                          }}
                          className="text-xs"
                        />
                      )}
                    </div>

                    {/* 4. POD Upload */}
                    <div className="p-3 border rounded-lg space-y-2">
                      <Label htmlFor={`pod-${selectedTrip.id}`} className="text-sm font-medium">
                        4. POD
                      </Label>
                      {selectedTrip.documents?.pod ? (
                        <div className="space-y-2">
                          <Badge className="bg-green-600 w-full justify-center text-xs py-1">Uploaded</Badge>
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleViewDocument('POD', selectedTrip.documents!.pod!)}
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
                                link.href = selectedTrip.documents!.pod!;
                                link.download = `pod-${selectedTrip.id}.pdf`;
                                link.click();
                              }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Input
                          id={`pod-${selectedTrip.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(selectedTrip.id, 'pod', file);
                          }}
                          className="text-xs"
                        />
                      )}
                    </div>

                    {/* 5. Final Invoice Upload */}
                    <div className="p-3 border rounded-lg space-y-2">
                      <Label htmlFor={`final_invoice-${selectedTrip.id}`} className="text-sm font-medium">
                        5. Final Invoice
                      </Label>
                      {selectedTrip.documents?.final_invoice ? (
                        <div className="space-y-2">
                          <Badge className="bg-green-600 w-full justify-center text-xs py-1">Uploaded</Badge>
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleViewDocument('Final Invoice', selectedTrip.documents!.final_invoice!)}
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
                                link.href = selectedTrip.documents!.final_invoice!;
                                link.download = `final-invoice-${selectedTrip.id}.pdf`;
                                link.click();
                              }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Input
                          id={`final_invoice-${selectedTrip.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(selectedTrip.id, 'final_invoice', file);
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
