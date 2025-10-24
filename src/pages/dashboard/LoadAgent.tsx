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
  AlertCircle,
  Star,
  Upload,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Code,
  Copy,
  Link,
  ChevronLeft,
  ChevronRight,
  FileText,
  Truck,
  Building2,
  DollarSign,
  Percent,
  Navigation,
  Weight,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DocumentProgress from '@/components/DocumentProgress';
import { formatPercentage } from '@/lib/currency';

const LoadAgentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [refreshKey, setRefreshKey] = useState(0);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [repaying, setRepaying] = useState<Record<string, boolean>>({});

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
  const [uploadingDocuments, setUploadingDocuments] = useState<Record<string, boolean>>({});

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
    const uploadKey = `${tripId}-${docType}`;
    console.log(`📤 Starting upload: ${docType} for trip ${tripId}`, { fileName: file.name, fileSize: file.size });

    // Define maximum file size (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    // Check file size before processing
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);

      toast({
        title: 'File Too Large',
        description: `The file size (${fileSizeMB}MB) exceeds the maximum allowed size of ${maxSizeMB}MB. Please upload a smaller file.`,
        variant: 'destructive',
      });

      console.error(`❌ File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
      return;
    }

    // Set loading state
    setUploadingDocuments(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          console.log(`📄 File read complete: ${docType}, size: ${base64String.length} bytes`);

          const trip = await data.getTrip(tripId);
          console.log(`🔍 Current trip documents:`, trip?.documents);

          if (trip) {
            // Helper to convert snake_case to camelCase for single key
            const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

            const newDocuments = {
              ...trip.documents,
              [docType]: base64String,
            };

            // Check if all documents are uploaded (check both snake_case and camelCase)
            const requiredDocs = ['ewaybill', 'bilty', 'advance_invoice', 'pod', 'final_invoice'];
            const allDocsUploaded = requiredDocs.every(doc => {
              const camelCaseKey = toCamelCase(doc);
              return newDocuments[doc] || (newDocuments as any)[camelCaseKey];
            });

            // Update trip with ONLY documents - NEVER change status automatically
            // Status changes should only happen through explicit workflow actions (allotment, etc.)
            const updateData: any = {
              documents: newDocuments,
            };

            const updatedTrip = await data.updateTrip(tripId, updateData);

            console.log(`✅ Document uploaded successfully: ${docType}`, updatedTrip?.documents);

            // Show toast notification
            if (allDocsUploaded) {
              toast({
                title: 'All Documents Uploaded! ✅',
                description: `All 5 documents uploaded successfully! Trip status remains ${trip.status}.`,
              });
            } else {
              const uploadedCount = requiredDocs.filter(doc => {
                const camelCaseKey = toCamelCase(doc);
                return newDocuments[doc] || (newDocuments as any)[camelCaseKey];
              }).length;
              toast({
                title: 'Document Uploaded!',
                description: `${docType.charAt(0).toUpperCase() + docType.slice(1).replace(/_/g, ' ')} uploaded successfully. ${uploadedCount}/5 documents completed.`,
              });
            }

            // Update selected trip to show uploaded document immediately
            if (updatedTrip) {
              setSelectedTrip(updatedTrip);
              console.log(`🔄 Updated selected trip with new documents:`, updatedTrip.documents);
            }
            setRefreshKey(prev => prev + 1);
          }
        } catch (error: any) {
          console.error('Error uploading document:', error);

          // Check if error is 413 Content Too Large
          if (error?.status === 413 || error?.message?.includes('413') || error?.message?.toLowerCase().includes('too large')) {
            toast({
              title: 'Content Too Large',
              description: 'The file content is too large for the server. Please upload images only (JPG, PNG) and ensure they are compressed/optimized. Avoid uploading PDF files.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Upload Failed',
              description: error?.message || 'Failed to upload document. Please try again.',
              variant: 'destructive',
            });
          }
        } finally {
          // Clear loading state
          setUploadingDocuments(prev => {
            const newState = { ...prev };
            delete newState[uploadKey];
            return newState;
          });
        }
      };

      reader.onerror = () => {
        toast({
          title: 'Upload Failed',
          description: 'Failed to read file. Please try again.',
          variant: 'destructive',
        });
        setUploadingDocuments(prev => {
          const newState = { ...prev };
          delete newState[uploadKey];
          return newState;
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error starting upload:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to start upload. Please try again.',
        variant: 'destructive',
      });
      setUploadingDocuments(prev => {
        const newState = { ...prev };
        delete newState[uploadKey];
        return newState;
      });
    }
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
    // Mandatory fields
    ewayBillNumber: '',
    ewayBillImage: null as File | null,
    pickup: '',
    destination: '',
    sender: '',
    receiver: '',
    transporter: '',
    loanAmount: '',
    loanInterestRate: '12',
    maturityDays: '30',
    // Optional fields
    clientCompany: '',
    clientLogo: '',
    origin: '',
    distance: '',
    loadType: '',
    weight: '',
    amount: '',
    interestRate: '12',
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
    const { name, value, files } = e.target;

    // Handle file upload for eway bill image
    if (name === 'ewayBillImage' && files && files[0]) {
      setFormData({ ...formData, ewayBillImage: files[0] });
    }
    // Capitalize city names for origin, destination, and pickup
    else if (name === 'origin' || name === 'destination' || name === 'pickup') {
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

    const loanAmount = parseFloat(formData.loanAmount);
    if (loanAmount < 20000 || loanAmount > 80000) {
      toast({
        variant: 'destructive',
        title: 'Invalid Loan Amount',
        description: 'Loan amount must be between ₹20,000 and ₹80,000',
      });
      return;
    }

    try {
      const loanInterestRate = parseFloat(formData.loanInterestRate);

      // Convert eway bill image to base64 if provided
      let ewayBillImageBase64 = '';
      if (formData.ewayBillImage) {
        const reader = new FileReader();
        ewayBillImageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(formData.ewayBillImage!);
        });
      }

      const trip = await data.createTrip({
        loadOwnerId: user?.id || user?.userId || '',
        loadOwnerName: user?.company || user?.name || 'Shipper',
        loadOwnerLogo: user?.companyLogo || '',
        loadOwnerRating: null,
        // Mandatory fields
        ewayBillNumber: formData.ewayBillNumber,
        ewayBillImage: ewayBillImageBase64,
        pickup: formData.pickup,
        destination: formData.destination,
        sender: formData.sender,
        receiver: formData.receiver,
        transporter: formData.transporter,
        loanAmount: loanAmount,
        loanInterestRate: loanInterestRate,
        maturityDays: parseInt(formData.maturityDays),
        // Legacy/optional fields
        clientCompany: formData.clientCompany || formData.sender,
        clientLogo: formData.clientLogo,
        origin: formData.pickup,
        distance: parseFloat(formData.distance || '0'),
        loadType: formData.loadType || 'General Cargo',
        weight: parseFloat(formData.weight || '0'),
        amount: loanAmount,
        interestRate: loanInterestRate,
        riskLevel: 'low', // Default risk level
        insuranceStatus: true, // Default insured
      });

      toast({
        title: 'Trip Created Successfully!',
        description: `Trip from ${formData.pickup} to ${formData.destination} is now live`,
      });

      // Reset form
      setFormData({
        // Mandatory fields
        ewayBillNumber: '',
        ewayBillImage: null,
        pickup: '',
        destination: '',
        sender: '',
        receiver: '',
        transporter: '',
        loanAmount: '',
        loanInterestRate: '12',
        maturityDays: '30',
        // Optional fields
        clientCompany: '',
        clientLogo: '',
        origin: '',
        distance: '',
        loadType: '',
        weight: '',
        amount: '',
        interestRate: '12',
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
    console.log('👁️ Viewing trip:', trip.id);
    console.log('📋 Trip documents:', trip.documents);
    console.log('📊 Document types available:', Object.keys(trip.documents || {}));
    setSelectedTrip(trip);
    setViewDialogOpen(true);
  };

  const handleDownloadSampleExcel = () => {
    // Create sample Excel data with proper CSV formatting including new mandatory fields
    const sampleData = [
      [
        'E-way Bill Number*',
        'Pickup*',
        'Destination*',
        'Sender*',
        'Receiver*',
        'Transporter*',
        'Loan Amount (₹)*',
        'Loan Interest Rate (%)*',
        'Maturity Days*',
        'Distance (km)',
        'Load Type',
        'Weight (kg)'
      ],
      [
        '123456789012',
        '"Mumbai, Maharashtra"',
        '"Delhi, NCR"',
        'ABC Company Pvt Ltd',
        'XYZ Industries Ltd',
        'Fast Transport Services',
        '50000',
        '12',
        '30',
        '1400',
        'Electronics',
        '15000'
      ],
      [
        '987654321098',
        '"Bangalore, Karnataka"',
        '"Chennai, Tamil Nadu"',
        'Emami Ltd',
        'Southern Distributors',
        'Express Logistics',
        '35000',
        '11',
        '25',
        '350',
        'FMCG',
        '12000'
      ],
      [
        '456789012345',
        '"Pune, Maharashtra"',
        '"Hyderabad, Telangana"',
        'Greenply Industries',
        'AP Trading Co',
        'Swift Cargo',
        '75000',
        '12.5',
        '45',
        '560',
        'Machinery',
        '20000'
      ],
    ];

    // Convert to CSV format (fields with commas are already quoted)
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'trip_upload_template_new.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Sample Downloaded!',
      description: 'Use this template to upload multiple trips with new mandatory fields',
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

          // Handle case where pickup/destination have unquoted commas
          // Expected: 12 fields (9 mandatory + 3 optional)
          if (row.length === 14) {
            console.log('Detected 14 fields - merging pickup and destination parts');
            row = [
              row[0],  // ewayBillNumber
              `${row[1]}, ${row[2]}`, // Merge pickup location
              `${row[3]}, ${row[4]}`, // Merge destination
              row[5],  // sender
              row[6],  // receiver
              row[7],  // transporter
              row[8],  // loanAmount
              row[9],  // loanInterestRate
              row[10], // maturityDays
              row[11], // distance
              row[12], // loadType
              row[13], // weight
            ];
            console.log('Merged to:', row);
          }

          // Ensure we have at least 9 mandatory fields
          if (row.length < 9 || !row[0]) {
            console.warn(`Invalid row length (${row.length}) for: ${rowText}`);
            errorCount++;
            continue;
          }

          // Map CSV columns to variables
          const ewayBillNumber = row[0];
          const pickup = row[1];
          const destination = row[2];
          const sender = row[3];
          const receiver = row[4];
          const transporter = row[5];
          const loanAmount = row[6];
          const loanInterestRate = row[7];
          const maturityDays = row[8];
          // Optional fields
          const distance = row[9] || '0';
          const loadType = row[10] || 'General Cargo';
          const weight = row[11] || '0';

          // Validate loan amount
          const tripLoanAmount = parseFloat(loanAmount);
          if (isNaN(tripLoanAmount) || tripLoanAmount < 20000 || tripLoanAmount > 80000) {
            console.warn(`Invalid loan amount (${loanAmount}) for row: ${rowText}`);
            errorCount++;
            continue;
          }

          // Validate interest rate
          const parsedInterestRate = parseFloat(loanInterestRate);
          if (isNaN(parsedInterestRate)) {
            console.warn(`Invalid interest rate (${loanInterestRate}) for row: ${rowText}`);
            errorCount++;
            continue;
          }

          const parsedDistance = parseFloat(distance);
          const parsedWeight = parseFloat(weight);
          const parsedMaturityDays = parseInt(maturityDays);

          if (isNaN(parsedMaturityDays)) {
            console.warn(`Invalid maturity days (${maturityDays}) in row: ${rowText}`);
            errorCount++;
            continue;
          }

          await data.createTrip({
            loadOwnerId: user?.id || user?.userId || '',
            loadOwnerName: user?.company || user?.name || 'Shipper',
            loadOwnerLogo: user?.companyLogo || '',
            loadOwnerRating: null,
            // Mandatory fields
            ewayBillNumber,
            ewayBillImage: '',
            pickup,
            destination,
            sender,
            receiver,
            transporter,
            loanAmount: tripLoanAmount,
            loanInterestRate: parsedInterestRate,
            maturityDays: parsedMaturityDays,
            // Legacy/optional fields
            clientCompany: sender,
            clientLogo: '',
            origin: pickup,
            distance: parsedDistance,
            loadType,
            weight: parsedWeight,
            amount: tripLoanAmount,
            interestRate: parsedInterestRate,
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
    // Get trip details before allotment to know the amount
    const trip = allTrips.find(t => t.id === tripId);
    const bid = trip?.bids?.find(b => b.lenderId === lenderId);
    const amount = bid?.amount || 0;

    // Pass current user ID so the money goes to the user who is allotting (not trip creator)
    const result = await data.allotTrip(tripId, lenderId, lenderName, user?.id);

    if (result) {
      toast({
        title: 'Trip Allotted Successfully!',
        description: `Trip allotted to ${lenderName}. ₹${amount.toLocaleString('en-IN')} has been credited to your wallet. Check your wallet to see the transaction.`,
        duration: 6000, // Show for 6 seconds
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
        const result = await data.allotTrip(trip.id, bid.lenderId, bid.lenderName, user?.id);

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

  // Helper function to check if trip is both funded AND completed
  const isFundedAndCompleted = (trip: Trip) => {
    const isCompleted = trip.status === 'completed';
    const hasFunding = trip.lenderId || (trip as any).lender_id;
    return isCompleted && hasFunding;
  };

  // Calculate days remaining until maturity
  const getDaysToMaturity = (trip: Trip) => {
    const fundedAt = trip.fundedAt || (trip as any).funded_at;
    const maturityDays = trip.maturityDays || (trip as any).maturity_days;

    if (!fundedAt || !maturityDays) {
      console.log('⚠️ Missing funding info for trip:', trip.id, { fundedAt, maturityDays });
      return null;
    }

    const fundedDate = new Date(fundedAt);
    const maturityDate = new Date(fundedDate);
    maturityDate.setDate(fundedDate.getDate() + maturityDays);

    const today = new Date();
    const daysRemaining = Math.ceil((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return daysRemaining;
  };

  // Get trips that need loan closure (completed and funded)
  const getLoanClosureTrips = () => {
    const closureTrips = allTrips
      .filter(trip => {
        // Check if trip is completed
        const isCompleted = trip.status === 'completed';

        // Check if trip has lender info (check both camelCase and snake_case)
        const hasLender = trip.lenderId || (trip as any).lender_id;

        // Debug log
        if (isCompleted && !hasLender) {
          console.log('⚠️ Completed trip without lender:', trip.id, trip);
        }

        return isCompleted && hasLender;
      })
      .map(trip => ({
        ...trip,
        daysToMaturity: getDaysToMaturity(trip),
      }))
      .sort((a, b) => {
        // Sort by days to maturity (urgent ones first)
        const daysA = a.daysToMaturity ?? Infinity;
        const daysB = b.daysToMaturity ?? Infinity;
        return daysA - daysB;
      });

    console.log('📊 Loan Closure Trips:', closureTrips.length, 'trips found');
    console.log('📋 All trips:', allTrips.length, 'Completed:', allTrips.filter(t => t.status === 'completed').length);

    return closureTrips;
  };

  const loanClosureTrips = getLoanClosureTrips();

  // Handle loan repayment
  const handleLoanRepayment = async (trip: Trip) => {
    // Check for lender info (both camelCase and snake_case)
    const lenderId = trip.lenderId || (trip as any).lender_id;
    const lenderName = trip.lenderName || (trip as any).lender_name;

    if (!lenderId || !lenderName) {
      toast({
        title: 'Error',
        description: 'No lender information found for this trip',
        variant: 'destructive',
      });
      return;
    }

    setRepaying(prev => ({ ...prev, [trip.id]: true }));

    try {
      // Calculate total repayment amount (principal + interest)
      const principal = trip.amount;
      const interestRate = trip.interestRate || (trip as any).interest_rate || 0;
      const maturityDays = trip.maturityDays || (trip as any).maturity_days || 30;
      const interest = (principal * (interestRate / 365) * maturityDays) / 100;
      const totalRepayment = principal + interest;

      console.log('💰 Processing loan repayment:', {
        tripId: trip.id,
        lenderId,
        lenderName,
        principal,
        interest,
        totalRepayment,
      });

      // Process repayment via transaction
      await data.createTransaction({
        fromUserId: user?.id || '',
        toUserId: lenderId,
        amount: totalRepayment,
        type: 'repayment',
        tripId: trip.id,
        description: `Loan repayment for trip ${trip.origin} → ${trip.destination}`,
      });

      toast({
        title: 'Repayment Successful',
        description: `Successfully repaid ₹${(totalRepayment / 1000).toFixed(2)}K to ${lenderName}`,
      });

      // Reload trips
      setRefreshKey(prev => prev + 1);

    } catch (error: any) {
      console.error('Repayment error:', error);
      toast({
        title: 'Repayment Failed',
        description: error?.message || 'Failed to process repayment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRepaying(prev => ({ ...prev, [trip.id]: false }));
    }
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
      title: 'Active',
      value: allTrips.filter((t) => t.status === 'funded' || t.status === 'in_transit' || t.status === 'escrowed').length,
      icon: TruckIcon,
      color: 'text-blue-600',
    },
    {
      title: 'Completed',
      value: allTrips.filter((t) => t.status === 'completed').length,
      icon: CheckCircle,
      color: 'text-purple-600',
    },
  ];

  const getStatusBadge = (status: string, trip?: Trip) => {
    // If trip is provided and it's both funded AND completed, show special combined badge
    if (trip && isFundedAndCompleted(trip)) {
      return (
        <Badge className="bg-gradient-to-r from-green-600 to-purple-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Funded & Completed
        </Badge>
      );
    }

    // Otherwise show regular status badge
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

        {/* Tabs for All Trips and Loan Closure */}
        <Tabs defaultValue="all-trips" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all-trips">All Trips</TabsTrigger>
            <TabsTrigger value="loan-closure">
              Loan Closure {loanClosureTrips.length > 0 && `(${loanClosureTrips.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-trips" className="space-y-6">
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
                              {trip.loadOwnerLogo ? (
                                <img
                                  src={trip.loadOwnerLogo}
                                  alt={trip.loadOwnerName}
                                  className="h-10 w-10 object-contain rounded border p-1"
                                />
                              ) : (
                                <div className="flex items-center justify-center gap-2 h-10 w-10 rounded border p-1 bg-muted">
                                  <Building2 className="h-5 w-5 text-muted-foreground" />
                                </div>
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
                            {trip.loadOwnerLogo ? (
                              <img
                                src={trip.loadOwnerLogo}
                                alt={trip.loadOwnerName}
                                className="h-8 object-contain"
                                title={trip.loadOwnerName}
                              />
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-foreground">{trip.loadOwnerName}</span>
                              </div>
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
                        <TableCell>
                          {/* Pass trip object to getStatusBadge to show combined "Funded & Completed" status */}
                          {getStatusBadge(trip.status, trip)}
                        </TableCell>
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
          </TabsContent>

          {/* Loan Closure Tab */}
          <TabsContent value="loan-closure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Loan Closure - Pending Repayments</CardTitle>
                <CardDescription>
                  Trips marked as "Funded & Completed" awaiting loan repayment - sorted by maturity urgency
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loanClosureTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending loan closures</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      All loans have been repaid or no loans are due
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loanClosureTrips.map((trip: any) => {
                      const principal = trip.amount;
                      const interestRate = trip.interestRate || trip.interest_rate || 0;
                      const maturityDays = trip.maturityDays || trip.maturity_days || 30;
                      const interest = (principal * (interestRate / 365) * maturityDays) / 100;
                      const totalRepayment = principal + interest;
                      const daysToMaturity = trip.daysToMaturity;
                      const isOverdue = daysToMaturity !== null && daysToMaturity < 0;
                      const isUrgent = daysToMaturity !== null && daysToMaturity >= 0 && daysToMaturity <= 10;

                      return (
                        <Card key={trip.id} className={`${isOverdue ? 'border-red-500 bg-red-50/50' : isUrgent ? 'border-orange-500 bg-orange-50/50' : ''}`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                {/* Trip Info */}
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-lg">
                                      {trip.origin} → {trip.destination}
                                    </h4>
                                    {/* Show combined "Funded & Completed" badge */}
                                    {getStatusBadge(trip.status, trip)}
                                    {isOverdue && (
                                      <Badge variant="destructive" className="flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Overdue
                                      </Badge>
                                    )}
                                    {isUrgent && !isOverdue && (
                                      <Badge className="bg-orange-600 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Urgent - {daysToMaturity} days left
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {trip.loadType} • {trip.weight}kg • {trip.distance}km
                                  </p>
                                </div>

                                {/* Lender Info */}
                                <div className="bg-muted/50 p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Lender</p>
                                  <p className="font-medium">{trip.lenderName || (trip as any).lender_name || 'Unknown Lender'}</p>
                                </div>

                                {/* Financial Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Principal</p>
                                    <p className="font-semibold">₹{(principal / 1000).toFixed(0)}K</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Interest ({interestRate}%)</p>
                                    <p className="font-semibold text-orange-600">₹{(interest / 1000).toFixed(2)}K</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total Repayment</p>
                                    <p className="font-semibold text-primary">₹{(totalRepayment / 1000).toFixed(2)}K</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Maturity Status
                                    </p>
                                    <p className={`font-semibold ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : ''}`}>
                                      {daysToMaturity !== null ? (
                                        isOverdue ? `Overdue by ${Math.abs(daysToMaturity)} days` : `${daysToMaturity} days left`
                                      ) : (
                                        `${maturityDays} days`
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {/* Dates */}
                                {trip.fundedAt && (
                                  <div className="text-xs text-muted-foreground">
                                    Funded: {new Date(trip.fundedAt).toLocaleDateString()} •
                                    Completed: {trip.completedAt ? new Date(trip.completedAt).toLocaleDateString() : 'N/A'}
                                  </div>
                                )}
                              </div>

                              {/* Repay Button */}
                              <div className="flex flex-col items-end gap-2">
                                <Button
                                  onClick={() => handleLoanRepayment(trip)}
                                  disabled={repaying[trip.id]}
                                  className={`${isOverdue || isUrgent ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                >
                                  {repaying[trip.id] ? (
                                    <>
                                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <IndianRupee className="h-4 w-4 mr-2" />
                                      Close Loan - ₹{(totalRepayment / 1000).toFixed(2)}K
                                    </>
                                  )}
                                </Button>
                                {isOverdue && (
                                  <p className="text-xs text-red-600 font-medium text-right">
                                    ⚠️ Payment overdue<br/>Late fees may apply
                                  </p>
                                )}
                                {isUrgent && !isOverdue && (
                                  <p className="text-xs text-orange-600 font-medium text-right">
                                    ⏰ Payment due in {daysToMaturity} days
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
                <form onSubmit={handleCreateTrip} className="space-y-6">
              {/* Mandatory Fields Section */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-base text-blue-900 dark:text-blue-100">Trip & Documentation Details</h3>
                </div>

                <div className="space-y-5">
                  {/* E-way Bill Number */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ewayBillNumber" className="text-sm font-semibold flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        E-way Bill Number *
                      </Label>
                      <Input
                        id="ewayBillNumber"
                        name="ewayBillNumber"
                        placeholder="Enter 12-digit bill number"
                        value={formData.ewayBillNumber}
                        onChange={handleChange}
                        required
                        className="h-11 border-2 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ewayBillImage" className="text-sm font-semibold flex items-center gap-1.5">
                        <Upload className="h-3.5 w-3.5 text-gray-600" />
                        E-way Bill Image (Optional)
                      </Label>
                      <Input
                        id="ewayBillImage"
                        name="ewayBillImage"
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="cursor-pointer h-11 border-2"
                      />
                    </div>
                  </div>

                  {/* Pickup & Destination */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickup" className="text-sm font-semibold flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-green-600" />
                        Pickup Location *
                      </Label>
                      <Input
                        id="pickup"
                        name="pickup"
                        placeholder="e.g., Mumbai, Maharashtra"
                        value={formData.pickup}
                        onChange={handleChange}
                        required
                        className="h-11 border-2 focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="destination" className="text-sm font-semibold flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-red-600" />
                        Destination *
                      </Label>
                      <Input
                        id="destination"
                        name="destination"
                        placeholder="e.g., Delhi, NCR"
                        value={formData.destination}
                        onChange={handleChange}
                        required
                        className="h-11 border-2 focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Sender & Receiver */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sender" className="text-sm font-semibold flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-purple-600" />
                        Sender (Consignee) *
                      </Label>
                      <Input
                        id="sender"
                        name="sender"
                        placeholder="e.g., ABC Company Pvt Ltd"
                        value={formData.sender}
                        onChange={handleChange}
                        required
                        className="h-11 border-2 focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="receiver" className="text-sm font-semibold flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-orange-600" />
                        Receiver *
                      </Label>
                      <Input
                        id="receiver"
                        name="receiver"
                        placeholder="e.g., XYZ Industries Ltd"
                        value={formData.receiver}
                        onChange={handleChange}
                        required
                        className="h-11 border-2 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Transporter */}
                  <div className="space-y-2">
                    <Label htmlFor="transporter" className="text-sm font-semibold flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-blue-600" />
                      Transporter *
                    </Label>
                    <Input
                      id="transporter"
                      name="transporter"
                      placeholder="e.g., Fast Transport Services"
                      value={formData.transporter}
                      onChange={handleChange}
                      required
                      className="h-11 border-2 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Details Section */}
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-100">Financial Details</h3>
                </div>

                <div className="space-y-5">
                  {/* Loan Amount & Interest Rate */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="loanAmount" className="text-sm font-semibold flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                        Loan Amount (₹) *
                      </Label>
                      <Input
                        id="loanAmount"
                        name="loanAmount"
                        type="number"
                        placeholder="50000"
                        value={formData.loanAmount}
                        onChange={handleChange}
                        required
                        className="h-11 border-2 focus:border-emerald-500 text-lg font-semibold"
                      />
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Enter loan amount</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loanInterestRate" className="text-sm font-semibold flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-emerald-600" />
                        Interest Rate (%) *
                      </Label>
                      <Input
                        id="loanInterestRate"
                        name="loanInterestRate"
                        type="number"
                        placeholder="12"
                        value={formData.loanInterestRate}
                        onChange={handleChange}
                        step="0.5"
                        required
                        className="h-11 border-2 focus:border-emerald-500 text-lg font-semibold"
                      />
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Enter interest rate</p>
                    </div>
                  </div>

                  {/* Maturity Days */}
                  <div className="space-y-2">
                    <Label htmlFor="maturityDays" className="text-sm font-semibold flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                      Maturity Period (Days) *
                    </Label>
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
                      className="max-w-xs h-11 border-2 focus:border-emerald-500 text-lg font-semibold"
                    />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Payment term: 1-365 days</p>
                  </div>
                </div>
              </div>

              {/* Optional Fields Section */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Additional Information (Optional)</h3>
                </div>

                <div className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="distance" className="text-sm font-semibold flex items-center gap-1.5">
                        <Navigation className="h-3.5 w-3.5 text-slate-600" />
                        Distance (km)
                      </Label>
                      <Input
                        id="distance"
                        name="distance"
                        type="number"
                        placeholder="1400"
                        value={formData.distance}
                        onChange={handleChange}
                        className="h-11 border-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loadType" className="text-sm font-semibold flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-slate-600" />
                        Load Type
                      </Label>
                      <Input
                        id="loadType"
                        name="loadType"
                        placeholder="e.g., Electronics, FMCG"
                        value={formData.loadType}
                        onChange={handleChange}
                        className="h-11 border-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-semibold flex items-center gap-1.5">
                      <Weight className="h-3.5 w-3.5 text-slate-600" />
                      Weight (kg)
                    </Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      placeholder="15000"
                      value={formData.weight}
                      onChange={handleChange}
                      className="max-w-xs h-11 border-2"
                    />
                  </div>
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
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold mb-1 text-blue-600">Mandatory Columns (Required*)</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• E-way Bill Number* - Unique 12-digit number</li>
                          <li>• Pickup* - Origin/pickup location (e.g., "Mumbai, Maharashtra")</li>
                          <li>• Destination* - Delivery destination</li>
                          <li>• Sender* - Consignee/sender company name</li>
                          <li>• Receiver* - Receiver company name</li>
                          <li>• Transporter* - Transport service provider name</li>
                          <li>• Loan Amount (₹)* - Between ₹20,000 and ₹80,000</li>
                          <li>• Loan Interest Rate (%)* - Between 8% and 18%</li>
                          <li>• Maturity Days* - Payment term (1-365 days)</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 text-gray-600">Optional Columns</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Distance (km) - Trip distance</li>
                          <li>• Load Type - Type of cargo</li>
                          <li>• Weight (kg) - Cargo weight</li>
                        </ul>
                      </div>
                      <div className="pt-2 border-t">
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• CSV format with comma-separated values</li>
                          <li>• First row must be headers (will be skipped)</li>
                          <li>• Download the sample template for exact format</li>
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

              <TabsContent value="api" className="space-y-4">
                <div className="space-y-6">
                  {/* Header Section */}
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Code className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg">API Integration</h3>
                    <p className="text-sm text-muted-foreground">
                      Integrate our API into your system to automatically create trips
                    </p>
                  </div>

                  {/* API Documentation */}
                  <div className="space-y-4">
                    {/* Endpoint Information */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Link className="h-4 w-4 text-primary" />
                        API Endpoint
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-background rounded border font-mono text-sm">
                          <div>
                            <span className="text-green-600 font-semibold">POST</span>
                            <span className="ml-2">https://api.truckfinhub.com/v1/trips/create</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText('https://api.truckfinhub.com/v1/trips/create');
                              toast({
                                title: 'Copied!',
                                description: 'API endpoint copied to clipboard',
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Authentication */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Authentication
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Include your API key in the request headers:
                      </p>
                      <div className="bg-background p-3 rounded border font-mono text-xs overflow-x-auto relative group">
                        <pre>{`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}</pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            navigator.clipboard.writeText('Authorization: Bearer YOUR_API_KEY\nContent-Type: application/json');
                            toast({
                              title: 'Copied!',
                              description: 'Headers copied to clipboard',
                            });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Contact support to get your API key: support@truckfinhub.com
                      </p>
                    </div>

                    {/* Request Body */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Code className="h-4 w-4 text-primary" />
                        Request Body (JSON)
                      </h4>
                      <div className="bg-background p-3 rounded border font-mono text-xs overflow-x-auto relative group">
                        <pre>{`{
  "ewayBillNumber": "123456789012",
  "pickup": "Mumbai, Maharashtra",
  "destination": "Delhi, NCR",
  "sender": "ABC Company Pvt Ltd",
  "receiver": "XYZ Industries Ltd",
  "transporter": "Fast Transport Services",
  "loanAmount": 50000,
  "loanInterestRate": 12,
  "maturityDays": 30,
  "distance": 1400,
  "loadType": "Electronics",
  "weight": 15000
}`}</pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const payload = {
                              ewayBillNumber: "123456789012",
                              pickup: "Mumbai, Maharashtra",
                              destination: "Delhi, NCR",
                              sender: "ABC Company Pvt Ltd",
                              receiver: "XYZ Industries Ltd",
                              transporter: "Fast Transport Services",
                              loanAmount: 50000,
                              loanInterestRate: 12,
                              maturityDays: 30,
                              distance: 1400,
                              loadType: "Electronics",
                              weight: 15000
                            };
                            navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                            toast({
                              title: 'Copied!',
                              description: 'Request body copied to clipboard',
                            });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Field Descriptions */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-sm mb-3">Field Descriptions</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold mb-2 text-blue-600">Mandatory Fields (Required*)</p>
                          <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-3 gap-2 font-semibold pb-2 border-b">
                              <span>Field</span>
                              <span>Type</span>
                              <span>Description</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-mono">ewayBillNumber*</span>
                              <span className="text-muted-foreground">string</span>
                              <span className="text-muted-foreground">E-way bill number (12-digit unique number)</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-mono">pickup*</span>
                              <span className="text-muted-foreground">string</span>
                              <span className="text-muted-foreground">Pickup/origin location</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-mono">destination*</span>
                              <span className="text-muted-foreground">string</span>
                              <span className="text-muted-foreground">Delivery destination location</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-mono">sender*</span>
                              <span className="text-muted-foreground">string</span>
                              <span className="text-muted-foreground">Sender/consignee company name</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-mono">receiver*</span>
                              <span className="text-muted-foreground">string</span>
                              <span className="text-muted-foreground">Receiver company name</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-mono">transporter*</span>
                              <span className="text-muted-foreground">string</span>
                              <span className="text-muted-foreground">Transport service provider name</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-mono">loanAmount*</span>
                              <span className="text-muted-foreground">number</span>
                              <span className="text-muted-foreground">Loan amount in ₹ (20,000 - 80,000)</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-mono">loanInterestRate*</span>
                              <span className="text-muted-foreground">number</span>
                              <span className="text-muted-foreground">Interest rate percentage (8% - 18%)</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-mono">maturityDays*</span>
                              <span className="text-muted-foreground">number</span>
                              <span className="text-muted-foreground">Payment term in days (1-365)</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs font-semibold mb-2 text-gray-600">Optional Fields</p>
                          <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-mono">distance</span>
                              <span className="text-muted-foreground">number</span>
                              <span className="text-muted-foreground">Distance in kilometers</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-mono">loadType</span>
                              <span className="text-muted-foreground">string</span>
                              <span className="text-muted-foreground">Type of cargo (e.g., Electronics, FMCG)</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="font-mono">weight</span>
                              <span className="text-muted-foreground">number</span>
                              <span className="text-muted-foreground">Weight in kilograms</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Response Examples */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-sm mb-3">Response Examples</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold mb-1 text-green-600">Success (200 OK)</p>
                          <div className="bg-background p-3 rounded border font-mono text-xs overflow-x-auto relative group">
                            <pre>{`{
  "success": true,
  "tripId": "trip_abc123xyz",
  "message": "Trip created successfully",
  "data": {
    "id": "trip_abc123xyz",
    "status": "pending",
    "createdAt": "2025-10-15T12:00:00Z"
  }
}`}</pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const response = {
                                  success: true,
                                  tripId: "trip_abc123xyz",
                                  message: "Trip created successfully",
                                  data: {
                                    id: "trip_abc123xyz",
                                    status: "pending",
                                    createdAt: "2025-10-15T12:00:00Z"
                                  }
                                };
                                navigator.clipboard.writeText(JSON.stringify(response, null, 2));
                                toast({
                                  title: 'Copied!',
                                  description: 'Success response copied to clipboard',
                                });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold mb-1 text-red-600">Error (400 Bad Request)</p>
                          <div className="bg-background p-3 rounded border font-mono text-xs overflow-x-auto relative group">
                            <pre>{`{
  "success": false,
  "error": "Validation Error",
  "message": "Trip amount must be between ₹20,000 and ₹80,000",
  "fields": {
    "amount": "Invalid amount"
  }
}`}</pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const response = {
                                  success: false,
                                  error: "Validation Error",
                                  message: "Trip amount must be between ₹20,000 and ₹80,000",
                                  fields: {
                                    amount: "Invalid amount"
                                  }
                                };
                                navigator.clipboard.writeText(JSON.stringify(response, null, 2));
                                toast({
                                  title: 'Copied!',
                                  description: 'Error response copied to clipboard',
                                });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Code Examples */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-sm mb-3">Code Examples</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold mb-1">JavaScript (Fetch)</p>
                          <div className="bg-background p-3 rounded border font-mono text-xs overflow-x-auto relative group">
                            <pre>{`fetch('https://api.truckfinhub.com/v1/trips/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ewayBillNumber: "123456789012",
    pickup: "Mumbai, Maharashtra",
    destination: "Delhi, NCR",
    sender: "ABC Company Pvt Ltd",
    receiver: "XYZ Industries Ltd",
    transporter: "Fast Transport Services",
    loanAmount: 50000,
    loanInterestRate: 12,
    maturityDays: 30,
    distance: 1400,
    loadType: "Electronics",
    weight: 15000
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`}</pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const code = `fetch('https://api.truckfinhub.com/v1/trips/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ewayBillNumber: "123456789012",
    pickup: "Mumbai, Maharashtra",
    destination: "Delhi, NCR",
    sender: "ABC Company Pvt Ltd",
    receiver: "XYZ Industries Ltd",
    transporter: "Fast Transport Services",
    loanAmount: 50000,
    loanInterestRate: 12,
    maturityDays: 30,
    distance: 1400,
    loadType: "Electronics",
    weight: 15000
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
                                navigator.clipboard.writeText(code);
                                toast({
                                  title: 'Copied!',
                                  description: 'JavaScript code copied to clipboard',
                                });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold mb-1">Python (Requests)</p>
                          <div className="bg-background p-3 rounded border font-mono text-xs overflow-x-auto relative group">
                            <pre>{`import requests

url = "https://api.truckfinhub.com/v1/trips/create"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "ewayBillNumber": "123456789012",
    "pickup": "Mumbai, Maharashtra",
    "destination": "Delhi, NCR",
    "sender": "ABC Company Pvt Ltd",
    "receiver": "XYZ Industries Ltd",
    "transporter": "Fast Transport Services",
    "loanAmount": 50000,
    "loanInterestRate": 12,
    "maturityDays": 30,
    "distance": 1400,
    "loadType": "Electronics",
    "weight": 15000
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}</pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const code = `import requests

url = "https://api.truckfinhub.com/v1/trips/create"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "ewayBillNumber": "123456789012",
    "pickup": "Mumbai, Maharashtra",
    "destination": "Delhi, NCR",
    "sender": "ABC Company Pvt Ltd",
    "receiver": "XYZ Industries Ltd",
    "transporter": "Fast Transport Services",
    "loanAmount": 50000,
    "loanInterestRate": 12,
    "maturityDays": 30,
    "distance": 1400,
    "loadType": "Electronics",
    "weight": 15000
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
                                navigator.clipboard.writeText(code);
                                toast({
                                  title: 'Copied!',
                                  description: 'Python code copied to clipboard',
                                });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold mb-1">cURL</p>
                          <div className="bg-background p-3 rounded border font-mono text-xs overflow-x-auto relative group">
                            <pre>{`curl -X POST https://api.truckfinhub.com/v1/trips/create \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ewayBillNumber": "123456789012",
    "pickup": "Mumbai, Maharashtra",
    "destination": "Delhi, NCR",
    "sender": "ABC Company Pvt Ltd",
    "receiver": "XYZ Industries Ltd",
    "transporter": "Fast Transport Services",
    "loanAmount": 50000,
    "loanInterestRate": 12,
    "maturityDays": 30,
    "distance": 1400,
    "loadType": "Electronics",
    "weight": 15000
  }'`}</pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const code = `curl -X POST https://api.truckfinhub.com/v1/trips/create \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type": "application/json" \\
  -d '{
    "ewayBillNumber": "123456789012",
    "pickup": "Mumbai, Maharashtra",
    "destination": "Delhi, NCR",
    "sender": "ABC Company Pvt Ltd",
    "receiver": "XYZ Industries Ltd",
    "transporter": "Fast Transport Services",
    "loanAmount": 50000,
    "loanInterestRate": 12,
    "maturityDays": 30,
    "distance": 1400,
    "loadType": "Electronics",
    "weight": 15000
  }'`;
                                navigator.clipboard.writeText(code);
                                toast({
                                  title: 'Copied!',
                                  description: 'cURL command copied to clipboard',
                                });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Supported Companies */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-sm mb-3">Supported Consignee Companies</h4>
                      <div className="bg-background p-3 rounded border text-xs max-h-40 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                          {clientCompanies.map((company) => (
                            <div key={company.name} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              <span>{company.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Support Information */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">Need Help?</h4>
                      <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                        Contact our support team for API key generation and integration assistance:
                      </p>
                      <div className="space-y-1 text-xs">
                        <p className="text-blue-900 dark:text-blue-100">
                          <strong>Email:</strong> support@truckfinhub.com
                        </p>
                        <p className="text-blue-900 dark:text-blue-100">
                          <strong>Phone:</strong> +91 1800-XXX-XXXX
                        </p>
                        <p className="text-blue-900 dark:text-blue-100">
                          <strong>Documentation:</strong> https://docs.truckfinhub.com
                        </p>
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
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                  <h3 className="font-semibold mb-6 flex items-center gap-2 text-lg">
                    <Package className="h-6 w-6" />
                    Trip Documents
                  </h3>

                  {/* Document Progress Tracker */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
                    <DocumentProgress
                      documents={selectedTrip.documents}
                      showSteps={true}
                    />
                  </div>

                  <div className="grid md:grid-cols-5 gap-5">
                    {/* 1. E-Way Bill Upload */}
                    <div className="p-4 border-2 rounded-lg space-y-2 hover:border-primary/50 transition-colors">
                      <Label htmlFor={`ewaybill-${selectedTrip.id}`} className="text-sm font-semibold">
                        1. E-Way Bill
                      </Label>
                      {uploadingDocuments[`${selectedTrip.id}-ewaybill`] ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Uploading...</span>
                        </div>
                      ) : selectedTrip.documents?.ewaybill ? (
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
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleDocumentUpload(selectedTrip.id, 'ewaybill', file);
                              e.target.value = ''; // Reset input after upload
                            }
                          }}
                          className="text-xs"
                          disabled={uploadingDocuments[`${selectedTrip.id}-ewaybill`]}
                        />
                      )}
                    </div>

                    {/* 2. Bilty Upload */}
                    <div className="p-4 border-2 rounded-lg space-y-2 hover:border-primary/50 transition-colors">
                      <Label htmlFor={`bilty-${selectedTrip.id}`} className="text-sm font-semibold">
                        2. Bilty
                      </Label>
                      {uploadingDocuments[`${selectedTrip.id}-bilty`] ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Uploading...</span>
                        </div>
                      ) : selectedTrip.documents?.bilty ? (
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
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleDocumentUpload(selectedTrip.id, 'bilty', file);
                              e.target.value = ''; // Reset input after upload
                            }
                          }}
                          className="text-xs"
                          disabled={uploadingDocuments[`${selectedTrip.id}-bilty`]}
                        />
                      )}
                    </div>

                    {/* 3. Advance Invoice Upload */}
                    <div className="p-4 border-2 rounded-lg space-y-2 hover:border-primary/50 transition-colors">
                      <Label htmlFor={`advance_invoice-${selectedTrip.id}`} className="text-sm font-semibold">
                        3. Advance Invoice
                      </Label>
                      {uploadingDocuments[`${selectedTrip.id}-advance_invoice`] ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Uploading...</span>
                        </div>
                      ) : (selectedTrip.documents as any)?.advanceInvoice ? (
                        <div className="space-y-2">
                          <Badge className="bg-green-600 w-full justify-center text-xs py-1">Uploaded</Badge>
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleViewDocument('Advance Invoice', (selectedTrip.documents as any)!.advanceInvoice!)}
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
                                link.href = (selectedTrip.documents as any)!.advanceInvoice!;
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
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleDocumentUpload(selectedTrip.id, 'advance_invoice', file);
                              e.target.value = ''; // Reset input after upload
                            }
                          }}
                          className="text-xs"
                          disabled={uploadingDocuments[`${selectedTrip.id}-advance_invoice`]}
                        />
                      )}
                    </div>

                    {/* 4. POD Upload */}
                    <div className="p-4 border-2 rounded-lg space-y-2 hover:border-primary/50 transition-colors">
                      <Label htmlFor={`pod-${selectedTrip.id}`} className="text-sm font-semibold">
                        4. POD
                      </Label>
                      {uploadingDocuments[`${selectedTrip.id}-pod`] ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Uploading...</span>
                        </div>
                      ) : selectedTrip.documents?.pod ? (
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
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleDocumentUpload(selectedTrip.id, 'pod', file);
                              e.target.value = ''; // Reset input after upload
                            }
                          }}
                          className="text-xs"
                          disabled={uploadingDocuments[`${selectedTrip.id}-pod`]}
                        />
                      )}
                    </div>

                    {/* 5. Final Invoice Upload */}
                    <div className="p-4 border-2 rounded-lg space-y-2 hover:border-primary/50 transition-colors">
                      <Label htmlFor={`final_invoice-${selectedTrip.id}`} className="text-sm font-semibold">
                        5. Final Invoice
                      </Label>
                      {uploadingDocuments[`${selectedTrip.id}-final_invoice`] ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Uploading...</span>
                        </div>
                      ) : (selectedTrip.documents as any)?.finalInvoice ? (
                        <div className="space-y-2">
                          <Badge className="bg-green-600 w-full justify-center text-xs py-1">Uploaded</Badge>
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleViewDocument('Final Invoice', (selectedTrip.documents as any)!.finalInvoice!)}
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
                                link.href = (selectedTrip.documents as any)!.finalInvoice!;
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
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleDocumentUpload(selectedTrip.id, 'final_invoice', file);
                              e.target.value = ''; // Reset input after upload
                            }
                          }}
                          className="text-xs"
                          disabled={uploadingDocuments[`${selectedTrip.id}-final_invoice`]}
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
