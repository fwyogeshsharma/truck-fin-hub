import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { data, Trip, Wallet, Transaction } from '@/lib/data';
import { apiClient } from '@/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdvancedFilter, { type FilterConfig } from '@/components/AdvancedFilter';
import { AreaChart, Area, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DocumentProgress from '@/components/DocumentProgress';
import ContractAcceptanceDialog from '@/components/ContractAcceptanceDialog';
import RatingDialog from '@/components/RatingDialog';
import { formatPercentage } from '@/lib/currency';
import { toTitleCase } from '@/lib/utils';

const LoadAgentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();
  const allTripsTabRef = useRef<HTMLDivElement>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [repaying, setRepaying] = useState<Record<string, boolean>>({});
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState('all-trips');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Contract acceptance states
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  const [pendingAllotment, setPendingAllotment] = useState<{
    tripId: string;
    lenderId: string;
    lenderName: string;
    agreementId: string;
  } | null>(null);
  const [contractLoading, setContractLoading] = useState(false);

  // Rating dialog states
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [tripForRating, setTripForRating] = useState<Trip | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load trips for this load owner/transporter by user ID
        let trips;
        if (user?.id) {
          // Use API to get trips by load_owner_id
          trips = await apiClient.get<Trip[]>(`/trips?loadOwnerId=${user.id}`);
        } else {
          trips = await data.getTrips();
        }
        setAllTrips(trips);

        // Load wallet and transactions
        if (user?.id) {
          const [walletData, transactionsData] = await Promise.all([
            data.getWallet(user.id),
            data.getTransactions(user.id)
          ]);
          setWallet(walletData);
          setTransactions(transactionsData);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshKey, user?.id]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTripTab, setCreateTripTab] = useState<'form' | 'excel' | 'api'>('form');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [documentViewDialogOpen, setDocumentViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ type: string; data: string } | null>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState<Record<string, boolean>>({});
  const [repaymentDialogOpen, setRepaymentDialogOpen] = useState(false);
  const [tripForRepayment, setTripForRepayment] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tripForEdit, setTripForEdit] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripForDelete, setTripForDelete] = useState<any>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
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

    // Define maximum file size (10 MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes

    // Check file size before processing
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);

      toast({
        title: 'File Too Large',
        description: `The file size (${fileSizeMB} MB) exceeds the maximum allowed size of ${maxSizeMB} MB. Please upload a smaller file.`,
        variant: 'destructive',
      });

      console.error(`❌ File size (${fileSizeMB} MB) exceeds maximum allowed size (${maxSizeMB} MB)`);
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

            // Check if trip is funded (has a lender)
            const isFunded = trip.lenderId || (trip as any).lender_id;
            const isFundedStatus = trip.status === 'funded' || trip.status === 'in_transit';

            // Update trip with documents
            const updateData: any = {
              documents: newDocuments,
            };

            // CRITICAL LOGIC:
            // If trip is FUNDED (has lender) AND all docs are uploaded → mark as COMPLETED
            // This will show in Loan Closure tab as "Funded & Completed"
            // If trip is NOT funded (escrowed/pending) → keep status unchanged (preserve allotment requests)
            if (allDocsUploaded && isFunded && isFundedStatus && trip.status !== 'completed' && trip.status !== 'cancelled') {
              updateData.status = 'completed';
              updateData.completedAt = new Date().toISOString();
              console.log(`🎉 Trip is FUNDED and all documents uploaded! Marking as COMPLETED for loan closure tracking`);
            }

            const updatedTrip = await data.updateTrip(tripId, updateData);

            console.log(`✅ Document uploaded successfully: ${docType}`, updatedTrip?.documents);

            // Show toast notification
            if (allDocsUploaded && updateData.status === 'completed') {
              toast({
                title: 'Trip Completed! 🎉',
                description: `All documents uploaded! Trip marked as "Funded & Completed" - now appears in Loan Closure tab.`,
              });
            } else if (allDocsUploaded) {
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
        loadOwnerName: user?.company || user?.name || 'Transporter',
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

  const handleEditTrip = (trip: any) => {
    setTripForEdit(trip);
    setEditDialogOpen(true);
  };

  const handleDeleteTrip = (trip: any) => {
    setTripForDelete(trip);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTrip = async () => {
    if (!tripForDelete) return;

    try {
      await data.deleteTrip(tripForDelete.id);
      toast({
        title: 'Trip Deleted',
        description: 'The trip has been successfully deleted.',
      });
      setDeleteDialogOpen(false);
      setTripForDelete(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete trip. Please try again.',
      });
    }
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
            loadOwnerName: user?.company || user?.name || 'Transporter',
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

    const matchesBasicStatus = !statusFilter || statusFilter === 'all' ||
      (statusFilter === 'pending' && trip.status === 'pending') ||
      (statusFilter === 'active' && (trip.status === 'funded' || trip.status === 'in_transit' || trip.status === 'escrowed')) ||
      (statusFilter === 'completed' && trip.status === 'completed');

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
  }, [advancedFilters, statusFilter]);

  const handleAllotTrip = async (tripId: string, lenderId: string, lenderName: string) => {
    try {
      console.log('=== handleAllotTrip called ===');
      console.log('tripId:', tripId, 'lenderId:', lenderId, 'lenderName:', lenderName);

      // Get trip details before allotment to know the amount
      const trip = allTrips.find(t => t.id === tripId);
      const bid = trip?.bids?.find(b => b.lenderId === lenderId);

      console.log('Found trip:', trip);
      console.log('Found bid:', bid);

      if (!trip || !bid) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Trip or bid not found',
        });
        return;
      }

      // Show loading toast while checking for contract
      toast({
        title: 'Checking for loan agreement...',
        description: 'Please wait while we verify if this bid has a signed contract.',
        duration: 2000,
      });

      // Always try to fetch loan agreement for this bid
      let agreement = null;
      let hasContract = false;

      // Try to find loan agreement by bid ID
      try {
        console.log('Fetching loan agreement for bid ID:', bid.id);
        const response = await apiClient.get(`/loan-agreements/bid/${bid.id}`);
        console.log('Loan agreement API response status:', response.status);

        if (response.status === 200 && response.data) {
          agreement = response.data;
          hasContract = true;
          console.log('✅ Loan agreement found:', agreement);
        }
      } catch (error: any) {
        console.log('❌ No loan agreement found for bid:', bid.id);
        if (error.response?.status !== 404) {
          console.error('Error fetching loan agreement:', error);
          toast({
            variant: 'destructive',
            title: 'Warning',
            description: 'Could not check for loan agreement. Proceeding with standard allotment.',
            duration: 3000,
          });
        }
      }

      if (hasContract && agreement) {
        console.log('Loan agreement found:', agreement);

        // Prepare contract data for dialog
        const contractDataToSet = {
          lenderName: lenderName,
          lenderSignature: agreement.lenderSignatureImage || agreement.lender_signature_image || '',
          termsAndConditions: agreement.termsAndConditions || agreement.terms_and_conditions || agreement.contractTerms || agreement.contract_terms || 'No terms specified',
          interestRateClause: agreement.interestRateClause || agreement.interest_rate_clause || 'Standard interest terms apply',
          repaymentClause: agreement.repaymentClause || agreement.repayment_clause || 'Standard repayment terms apply',
          latePaymentClause: agreement.latePaymentClause || agreement.late_payment_clause || 'Late payment penalties may apply',
          defaultClause: agreement.defaultClause || agreement.default_clause || 'Standard default terms apply',
          tripAmount: agreement.loanAmount || agreement.loan_amount || bid.amount,
          interestRate: agreement.interestRate || agreement.interest_rate || bid.interestRate,
          maturityDays: agreement.maturityDays || agreement.maturity_days || trip.maturityDays || 30,
        };

        console.log('Setting contract data:', contractDataToSet);

        // Store pending allotment data first (including agreement ID)
        setPendingAllotment({
          tripId,
          lenderId,
          lenderName,
          agreementId: agreement.id,
        });

        // Set contract data
        setContractData(contractDataToSet);

        // Use setTimeout to ensure state updates have propagated
        setTimeout(() => {
          console.log('Opening contract dialog');
          setContractDialogOpen(true);

          // Notify user
          toast({
            title: 'Contract Review Required',
            description: 'Please review and sign the loan agreement to complete allotment.',
            duration: 5000,
          });
        }, 100);
      } else {
        // No contract - proceed with normal allotment (backward compatibility)
        const amount = bid?.amount || 0;
        const result = await data.allotTrip(tripId, lenderId, lenderName, user?.id);

        if (result) {
          toast({
            title: 'Trip Allotted Successfully!',
            description: `Trip allotted to ${toTitleCase(lenderName)}. ₹${amount.toLocaleString('en-IN')} has been credited to your wallet. Check your wallet to see the transaction.`,
            duration: 6000,
          });
          setRefreshKey(prev => prev + 1);
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to allot trip',
          });
        }
      }
    } catch (error) {
      console.error('Error in handleAllotTrip:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process allotment request',
      });
    }
  };

  const handleContractAccept = async (borrowerSignature: string) => {
    if (!pendingAllotment) {
      console.error('No pending allotment data');
      return;
    }

    try {
      setContractLoading(true);
      console.log('📝 Starting contract acceptance process...');
      console.log('Agreement ID:', pendingAllotment.agreementId);
      console.log('Borrower signature length:', borrowerSignature.length);

      const trip = allTrips.find(t => t.id === pendingAllotment.tripId);
      const bid = trip?.bids?.find(b => b.lenderId === pendingAllotment.lenderId);

      if (!pendingAllotment.agreementId) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Contract agreement ID not found',
        });
        setContractLoading(false);
        return;
      }

      // 1. Update loan agreement with borrower signature
      console.log('Updating loan agreement with borrower signature...');
      await apiClient.put(`/loan-agreements/${pendingAllotment.agreementId}`, {
        borrowerSignatureImage: borrowerSignature,
        borrowerSignedAt: new Date().toISOString(),
        status: 'accepted',
        contractAccepted: true,
      });
      console.log('✅ Loan agreement updated successfully');

      // 2. Proceed with trip allotment
      console.log('Proceeding with trip allotment...');
      const amount = bid?.amount || 0;
      const result = await data.allotTrip(
        pendingAllotment.tripId,
        pendingAllotment.lenderId,
        pendingAllotment.lenderName,
        user?.id
      );

      if (result) {
        console.log('✅ Trip allotted successfully!');
        toast({
          title: 'Contract Accepted & Trip Allotted!',
          description: `Contract signed successfully. Trip allotted to ${toTitleCase(pendingAllotment.lenderName)}. ₹${amount.toLocaleString('en-IN')} has been credited to your wallet.`,
          duration: 6000,
        });
        setRefreshKey(prev => prev + 1);
        setContractDialogOpen(false);
        setPendingAllotment(null);
        setContractData(null);
      } else {
        console.error('❌ Trip allotment failed');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Contract signed but failed to allot trip. Please contact support.',
        });
      }
    } catch (error: any) {
      console.error('❌ Error accepting contract:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to accept contract. Please try again.',
      });
    } finally {
      setContractLoading(false);
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

  // Helper to check if all documents are uploaded
  const hasAllDocuments = (trip: Trip) => {
    const docs = trip.documents || {};
    const requiredDocs = ['ewaybill', 'bilty', 'advance_invoice', 'pod', 'final_invoice'];

    // Helper to convert snake_case to camelCase
    const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

    const allDocsUploaded = requiredDocs.every(doc => {
      const camelCaseKey = toCamelCase(doc);
      return docs[doc] || (docs as any)[camelCaseKey];
    });

    return allDocsUploaded;
  };

  // Get trips that need loan closure (completed AND funded AND all documents uploaded)
  const getLoanClosureTrips = () => {
    const closureTrips = allTrips
      .filter(trip => {
        // Check if trip is completed
        const isCompleted = trip.status === 'completed';

        // Check if trip has lender info (check both camelCase and snake_case)
        const hasLender = trip.lenderId || (trip as any).lender_id;

        // Check if all documents are uploaded
        const docsComplete = hasAllDocuments(trip);

        // Debug log
        if (isCompleted && !hasLender) {
          console.log('⚠️ Completed trip without lender:', trip.id, trip);
        }
        if (isCompleted && hasLender && !docsComplete) {
          console.log('⚠️ Funded & Completed trip but missing documents:', trip.id, trip);
        }

        // ONLY show trips that are: completed + funded + all docs uploaded
        return isCompleted && hasLender && docsComplete;
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

  // Get trips that have been repaid
  const getRepaidTrips = () => {
    return allTrips
      .filter(trip => trip.status === 'repaid' && (trip.lenderId || (trip as any).lender_id))
      .sort((a, b) => {
        // Sort by repaid date (most recent first)
        const dateA = a.repaidAt ? new Date(a.repaidAt).getTime() : 0;
        const dateB = b.repaidAt ? new Date(b.repaidAt).getTime() : 0;
        return dateB - dateA;
      });
  };

  const repaidTrips = getRepaidTrips();

  // Open repayment confirmation dialog
  const handleLoanRepayment = (trip: Trip) => {
    setTripForRepayment(trip);
    setRepaymentDialogOpen(true);
  };

  // Process actual loan repayment
  const processLoanRepayment = async (trip: Trip) => {
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
      // Calculate total repayment based on ACTUAL days (not maturity days)
      // This allows early repayment with reduced interest
      const principal = trip.amount;
      const interestRate = trip.interestRate || (trip as any).interest_rate || 0;
      const fundedAt = trip.fundedAt || (trip as any).funded_at;

      // Calculate actual days loan was active
      const fundedDate = new Date(fundedAt);
      const today = new Date();
      const actualDays = Math.ceil((today.getTime() - fundedDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate interest based on actual days (not maturity days)
      const interestRatePerDay = interestRate / 365;
      const interest = (principal * interestRatePerDay * actualDays) / 100;
      const totalRepayment = principal + interest;

      console.log('💰 Processing loan repayment:', {
        tripId: trip.id,
        lenderId,
        lenderName,
        principal,
        interest,
        totalRepayment,
        actualDays,
      });

      // Process repayment via new repayment endpoint
      const API_URL = import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD ? 'https://34.93.247.3/api' : '/api');

      const response = await fetch(`${API_URL}/wallets/repayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trip_id: trip.id,
          borrower_id: user?.id || '',
          lender_id: lenderId,
          principal_amount: principal,
          interest_rate: interestRate,
          maturity_days: actualDays, // Use actual days for interest calculation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process repayment');
      }

      const repaymentResult = await response.json();
      const finalTotalRepayment = repaymentResult.repayment_details.total;

      // Update wallet state with new balance
      if (repaymentResult.borrower_wallet) {
        setWallet(repaymentResult.borrower_wallet);
      }

      toast({
        title: 'Repayment Successful',
        description: `Successfully repaid ₹${(finalTotalRepayment / 1000).toFixed(2)}K to ${toTitleCase(lenderName)} (${actualDays} days). New balance: ₹${((repaymentResult.borrower_wallet?.balance || 0) / 1000).toFixed(2)}K`,
      });

      // Close repayment dialog and reload trips and wallet
      setRepaymentDialogOpen(false);
      setRefreshKey(prev => prev + 1);

      // Refresh wallet data from server
      if (user?.id) {
        const walletData = await data.getWallet(user.id);
        setWallet(walletData);
      }

      // Open rating dialog after successful repayment
      setTripForRating(trip);
      setRatingDialogOpen(true);

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

  // Loan Analytics Calculations
  const fundedTrips = allTrips.filter(t => (t.lenderId || (t as any).lender_id) && (t.status === 'funded' || t.status === 'in_transit' || t.status === 'completed'));
  const completedTrips = allTrips.filter(t => t.status === 'completed' && (t.lenderId || (t as any).lender_id));

  const loanTaken = fundedTrips.reduce((sum, t) => sum + (t.amount || t.loanAmount || 0), 0);
  const loanRepaid = completedTrips.reduce((sum, t) => {
    const principal = t.amount || t.loanAmount || 0;
    const interestRate = (t as any).interest_rate || t.interestRate || t.loanInterestRate || 0;
    const maturityDays = (t as any).maturity_days || t.maturityDays || 30;
    const interest = (principal * (interestRate / 365) * maturityDays) / 100;
    return sum + principal + interest;
  }, 0);
  const loanPending = loanTaken - completedTrips.reduce((sum, t) => sum + (t.amount || t.loanAmount || 0), 0);

  // Calculate interest paid (interest paid to lenders on completed trips)
  const profit = completedTrips.reduce((sum, t) => {
    const principal = t.amount || t.loanAmount || 0;
    const interestRate = (t as any).interest_rate || t.interestRate || t.loanInterestRate || 0;
    const maturityDays = (t as any).maturity_days || t.maturityDays || 30;
    const interest = (principal * (interestRate / 365) * maturityDays) / 100;
    return sum + interest;
  }, 0);

  // Monthly interest paid data for graph (last 6 months)
  const getLast6MonthsData = () => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();

      // Calculate profit for this month
      const monthProfit = completedTrips
        .filter(t => {
          const completedAt = t.completedAt || (t as any).completed_at;
          if (!completedAt) return false;
          const completedDate = new Date(completedAt);
          return completedDate.getMonth() === date.getMonth() &&
                 completedDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, t) => {
          const principal = t.amount || t.loanAmount || 0;
          const interestRate = (t as any).interest_rate || t.interestRate || t.loanInterestRate || 0;
          const maturityDays = (t as any).maturity_days || t.maturityDays || 30;
          const interest = (principal * (interestRate / 365) * maturityDays) / 100;
          return sum + interest;
        }, 0);

      // Calculate loans taken for this month
      const monthLoansTaken = fundedTrips
        .filter(t => {
          const fundedAt = t.fundedAt || (t as any).funded_at;
          if (!fundedAt) return false;
          const fundedDate = new Date(fundedAt);
          return fundedDate.getMonth() === date.getMonth() &&
                 fundedDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, t) => sum + (t.amount || t.loanAmount || 0), 0);

      months.push({
        month: `${monthName} ${year}`,
        profit: Math.round(monthProfit),
        loansTaken: Math.round(monthLoansTaken),
      });
    }

    return months;
  };

  const monthlyData = getLast6MonthsData();

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
      color: 'text-accent',
    },
    {
      title: 'Active',
      value: allTrips.filter((t) => t.status === 'funded' || t.status === 'in_transit' || t.status === 'escrowed').length,
      icon: TruckIcon,
      color: 'text-primary',
    },
    {
      title: 'Completed',
      value: allTrips.filter((t) => t.status === 'completed').length,
      icon: CheckCircle,
      color: 'text-secondary',
    },
  ];

  const scrollToAllTripsTab = (filter?: string) => {
    if (filter) {
      setStatusFilter(filter);
      setActiveTab('all-trips');
    }
    allTripsTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearFilter = () => {
    setStatusFilter(null);
  };

  const getStatusBadge = (status: string, trip?: Trip) => {
    // If trip is provided and it's both funded AND completed, show special combined badge
    if (trip && isFundedAndCompleted(trip)) {
      return (
        <Badge className="bg-gradient-to-r from-secondary to-primary text-white">
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
          <Badge className="bg-accent text-white">
            <Shield className="h-3 w-3 mr-1" />
            Escrowed
          </Badge>
        );
      case 'funded':
        return (
          <Badge className="bg-secondary text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Funded
          </Badge>
        );
      case 'in_transit':
        return (
          <Badge className="bg-primary text-white">
            <TruckIcon className="h-3 w-3 mr-1" />
            In Transit
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-primary-dark text-white">
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
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
          <div className="px-1">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold">Transporter Dashboard</h1>
            <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5 md:mt-1">Create and manage trips across the portal</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-primary w-full md:w-auto h-9 md:h-10 text-sm md:text-base">
            <Plus className="h-4 w-4 mr-2" />
            Create Trip
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const getFilterStatus = () => {
            if (stat.title === 'Total Trips') return 'all';
            if (stat.title === 'Pending') return 'pending';
            if (stat.title === 'Active') return 'active';
            if (stat.title === 'Completed') return 'completed';
            return null;
          };
          const filterStatus = getFilterStatus();
          return (
            <Card
              key={stat.title}
              className={filterStatus ? 'cursor-pointer hover:border-primary transition-colors hover:shadow-md' : ''}
              onClick={filterStatus ? () => scrollToAllTripsTab(filterStatus) : undefined}
            >
              <CardContent className="p-3 md:pt-6 md:pb-6 md:px-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] md:text-sm text-muted-foreground truncate">{stat.title}</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold mt-1 md:mt-2 tabular-nums">{stat.value}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>

        {/* Loan Analytics Card */}
        <Card className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Financial Analytics
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Comprehensive view of loans, repayments, and profit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 md:space-y-6">
              {/* Loan Metrics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4">
                <div className="bg-white dark:bg-card p-2.5 md:p-3 lg:p-4 rounded-lg border">
                  <div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-1.5">
                    <TrendingUp className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-blue-600 flex-shrink-0" />
                    <p className="text-[9px] md:text-[10px] lg:text-xs font-medium text-muted-foreground truncate">Loan Taken</p>
                  </div>
                  <p className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-600">₹{(loanTaken / 1000).toFixed(1)}K</p>
                  <p className="text-[9px] md:text-[10px] lg:text-xs text-muted-foreground mt-0.5">{fundedTrips.length} trips</p>
                </div>

                <div className="bg-white dark:bg-card p-2.5 md:p-3 lg:p-4 rounded-lg border">
                  <div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-1.5">
                    <CheckCircle className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-green-600 flex-shrink-0" />
                    <p className="text-[9px] md:text-[10px] lg:text-xs font-medium text-muted-foreground truncate">Loan Repaid</p>
                  </div>
                  <p className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-green-600">₹{(loanRepaid / 1000).toFixed(1)}K</p>
                  <p className="text-[9px] md:text-[10px] lg:text-xs text-muted-foreground mt-0.5">{completedTrips.length} trips</p>
                </div>

                <div className="bg-white dark:bg-card p-2.5 md:p-3 lg:p-4 rounded-lg border">
                  <div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-1.5">
                    <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-orange-600 flex-shrink-0" />
                    <p className="text-[9px] md:text-[10px] lg:text-xs font-medium text-muted-foreground truncate">Pending</p>
                  </div>
                  <p className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-orange-600">₹{(loanPending / 1000).toFixed(1)}K</p>
                  <p className="text-[9px] md:text-[10px] lg:text-xs text-muted-foreground mt-0.5">{fundedTrips.length - completedTrips.length} active</p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 p-2.5 md:p-3 lg:p-4 rounded-lg border border-primary/30">
                  <div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-1.5">
                    <Star className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-primary flex-shrink-0" />
                    <p className="text-[9px] md:text-[10px] lg:text-xs font-medium text-muted-foreground truncate">Interest</p>
                  </div>
                  <p className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-primary">₹{(profit / 1000).toFixed(1)}K</p>
                  <p className="text-[9px] md:text-[10px] lg:text-xs text-muted-foreground mt-0.5">Total paid</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                {/* Monthly Interest Paid Trend */}
                <div className="bg-white dark:bg-card p-3 md:p-4 rounded-lg border">
                  <h4 className="text-xs md:text-sm font-semibold mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2">
                    <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                    <span className="truncate">Monthly Interest (6 Months)</span>
                  </h4>
                  <ResponsiveContainer width="100%" height={180} className="md:h-[200px]">
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 8 }} className="md:text-[10px]" />
                      <YAxis tick={{ fontSize: 8 }} className="md:text-[10px]" />
                      <Tooltip
                        formatter={(value: any) => `₹${value.toLocaleString()}`}
                        contentStyle={{ fontSize: '10px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                        name="Interest Paid"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Loans vs Interest Paid */}
                <div className="bg-white dark:bg-card p-3 md:p-4 rounded-lg border">
                  <h4 className="text-xs md:text-sm font-semibold mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2">
                    <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 text-secondary flex-shrink-0" />
                    <span className="truncate">Loans vs Interest</span>
                  </h4>
                  <ResponsiveContainer width="100%" height={180} className="md:h-[200px]">
                    <RechartsBarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 8 }} className="md:text-[10px]" />
                      <YAxis tick={{ fontSize: 8 }} className="md:text-[10px]" />
                      <Tooltip
                        formatter={(value: any) => `₹${value.toLocaleString()}`}
                        contentStyle={{ fontSize: '10px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="loansTaken" fill="#3b82f6" name="Loans Taken" />
                      <Bar dataKey="profit" fill="#10b981" name="Interest Paid" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Loan Status Breakdown */}
              <div className="bg-white dark:bg-card p-3 md:p-4 rounded-lg border">
                <h4 className="text-xs md:text-sm font-semibold mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2">
                  <Percent className="h-3.5 w-3.5 md:h-4 md:w-4 text-accent flex-shrink-0" />
                  <span>Loan Status Breakdown</span>
                </h4>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height={160} className="md:h-[200px]">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Repaid', value: completedTrips.length, color: '#10b981' },
                            { name: 'Pending', value: fundedTrips.length - completedTrips.length, color: '#f59e0b' },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Repaid', value: completedTrips.length, color: '#10b981' },
                            { name: 'Pending', value: fundedTrips.length - completedTrips.length, color: '#f59e0b' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 w-full space-y-2 md:space-y-3">
                    <div className="flex items-center justify-between p-2 md:p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-600 flex-shrink-0"></div>
                        <span className="text-xs md:text-sm font-medium">Repaid Loans</span>
                      </div>
                      <span className="text-xs md:text-sm font-bold">{completedTrips.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 md:p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-orange-600 flex-shrink-0"></div>
                        <span className="text-xs md:text-sm font-medium">Pending Loans</span>
                      </div>
                      <span className="text-xs md:text-sm font-bold">{fundedTrips.length - completedTrips.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 md:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-600 flex-shrink-0"></div>
                        <span className="text-xs md:text-sm font-medium">Total Funded</span>
                      </div>
                      <span className="text-xs md:text-sm font-bold">{fundedTrips.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for All Trips, Loan Closure, and Repaid Loans */}
        <div ref={allTripsTabRef}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="all-trips" className="text-[10px] md:text-sm py-2 md:py-2.5 flex-col md:flex-row gap-1 md:gap-2">
              <span>All Trips</span>
              {statusFilter && statusFilter !== 'all' && (
                <span className="text-[8px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-primary/20">
                  Filtered
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="loan-closure" className="text-[10px] md:text-sm py-2 md:py-2.5 flex-col md:flex-row gap-1 md:gap-2">
              <span className="truncate">Pending</span>
              {loanClosureTrips.length > 0 && <span className="text-[8px] md:text-xs">({loanClosureTrips.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="repaid-loans" className="text-[10px] md:text-sm py-2 md:py-2.5 flex-col md:flex-row gap-1 md:gap-2">
              <span className="truncate">Repaid</span>
              {repaidTrips.length > 0 && <span className="text-[8px] md:text-xs">({repaidTrips.length})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-trips" className="space-y-4 md:space-y-6">
        {/* Filter Status Display */}
        {statusFilter && statusFilter !== 'all' && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-3 md:py-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    {statusFilter === 'pending' && (
                      <>
                        <Clock className="h-4 w-4 md:h-5 md:w-5 text-accent flex-shrink-0" />
                        <span className="font-semibold text-xs md:text-sm">Showing Pending Trips Only</span>
                      </>
                    )}
                    {statusFilter === 'active' && (
                      <>
                        <TruckIcon className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                        <span className="font-semibold text-xs md:text-sm">Showing Active Trips Only</span>
                      </>
                    )}
                    {statusFilter === 'completed' && (
                      <>
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-secondary flex-shrink-0" />
                        <span className="font-semibold text-xs md:text-sm">Showing Completed Trips Only</span>
                      </>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[10px] md:text-xs">
                    {allTrips.filter(t => {
                      if (statusFilter === 'pending') return t.status === 'pending';
                      if (statusFilter === 'active') return t.status === 'funded' || t.status === 'in_transit' || t.status === 'escrowed';
                      if (statusFilter === 'completed') return t.status === 'completed';
                      return true;
                    }).length} trips
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilter}
                  className="gap-1.5 md:gap-2 h-8 md:h-9 text-xs md:text-sm w-full md:w-auto"
                >
                  <XCircle className="h-3 w-3 md:h-4 md:w-4" />
                  Clear Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Escrowed Trips - Pending Allotment */}
        {(!statusFilter || statusFilter === 'all' || statusFilter === 'active') && allTrips.filter((t) => t.status === 'escrowed').length > 0 && (
          <Card className="border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
                <div>
                  <CardTitle className="flex items-center gap-1.5 md:gap-2 text-sm md:text-base lg:text-lg">
                    <Shield className="h-4 w-4 md:h-5 md:w-5 text-orange-600 flex-shrink-0" />
                    <span className="truncate">Escrowed Trips - Awaiting Allotment</span>
                  </CardTitle>
                  <CardDescription className="text-[10px] md:text-xs lg:text-sm mt-1">Trips with lender bids pending your approval</CardDescription>
                </div>
                <Button
                  onClick={handleAllotAllTrips}
                  className="bg-green-600 hover:bg-green-700 w-full md:w-auto h-8 md:h-9 lg:h-10 text-xs md:text-sm"
                >
                  <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  Allot All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {allTrips
                  .filter((t) => t.status === 'escrowed')
                  .map((trip) => (
                    <Card key={trip.id} className="border-orange-300 bg-white dark:bg-card">
                      <CardContent className="p-3 md:pt-6 md:pb-6 md:px-6">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-0">
                          <div className="flex-1 w-full">
                            <div className="flex items-start gap-2 md:gap-4 mb-3">
                              {trip.loadOwnerLogo ? (
                                <img
                                  src={trip.loadOwnerLogo}
                                  alt={trip.loadOwnerName}
                                  className="h-8 w-8 md:h-10 md:w-10 object-contain rounded border p-1 flex-shrink-0"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded border p-1 bg-muted flex-shrink-0">
                                  <Building2 className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm md:text-base lg:text-lg truncate">
                                  {trip.origin} → {trip.destination}
                                </h3>
                                <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground">
                                  {trip.loadType} • {trip.distance} km • ₹{(trip.amount / 1000).toFixed(0)}K
                                </p>
                              </div>
                              <Badge className="bg-orange-600 flex-shrink-0 text-[10px] md:text-xs">
                                <Shield className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                                Escrowed
                              </Badge>
                            </div>

                            {/* Bids Section */}
                            {trip.bids && trip.bids.length > 0 && (
                              <div className="mt-3 md:mt-4 p-2.5 md:p-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                <h4 className="font-semibold text-xs md:text-sm mb-2 md:mb-3 text-orange-900 dark:text-orange-100">
                                  Lender Bids ({trip.bids.length})
                                </h4>
                                <div className="space-y-2">
                                  {trip.bids.map((bid: any, index: number) => {
                                    return (
                                      <div
                                        key={index}
                                        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0 p-2.5 md:p-3 bg-white dark:bg-card rounded border"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-xs md:text-sm truncate">{toTitleCase(bid.lenderName)}</p>
                                          <p className="text-[10px] md:text-xs text-muted-foreground">
                                            Amount: ₹{(bid.amount / 1000).toFixed(0)}K • Rate: {formatPercentage(bid.interestRate)}%
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => handleAllotTrip(trip.id, bid.lenderId, bid.lenderName)}
                                          className="bg-green-600 hover:bg-green-700 h-7 md:h-8 px-2.5 md:px-3 text-xs md:text-sm w-full md:w-auto"
                                        >
                                          <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                          Allot
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
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
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
              <div>
                <CardTitle className="text-base md:text-lg">All Trips in Portal</CardTitle>
                <CardDescription className="text-[10px] md:text-xs lg:text-sm mt-0.5 md:mt-1">View and search all trips across the platform</CardDescription>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
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
                  className="gap-1.5 md:gap-2 h-8 md:h-9 text-xs md:text-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden md:inline">Refresh</span>
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
                  <TableHead>Transporter</TableHead>
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
                              <p className="text-xs text-muted-foreground">{trip.distance} km</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{trip.loadType}</p>
                            <p className="text-xs text-muted-foreground">{trip.weight} kg</p>
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
                                <span className="text-xs font-medium text-foreground">{toTitleCase(trip.loadOwnerName)}</span>
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
                              {formatPercentage(trip.interestRate || 12)}% ARR
                            </p>
                            <div className="hidden group-hover:block absolute z-10 bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                              <p className="text-sm font-semibold">{formatPercentage(trip.interestRate || 12)}% ARR</p>
                              <p className="text-sm text-muted-foreground">{formatPercentage((trip.interestRate || 12) * (trip.maturityDays || 30) / 365)}% for {trip.maturityDays || 30} days</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {trip.bids && trip.bids.length > 0 ? (
                            <div>
                              <p className="font-semibold text-green-600">
                                ₹{(trip.bids[0].amount / 1000).toFixed(0)}K
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @ {formatPercentage(trip.bids[0].interestRate)}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                by {toTitleCase(trip.bids[0].lenderName)}
                              </p>
                            </div>
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
                              <Eye className="h-4 w-4" />
                            </Button>
                            {trip.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTrip(trip)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteTrip(trip)}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
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
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              {/* Left side - Items per page and info */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="itemsPerPage" className="text-xs sm:text-sm whitespace-nowrap">
                    <span className="hidden sm:inline">Items per page:</span>
                    <span className="sm:hidden">Rows:</span>
                  </Label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded px-2 py-1.5 text-xs sm:text-sm min-w-[60px]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left sm:ml-4">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredTrips.length)} of {filteredTrips.length}
                </span>
              </div>

              {/* Right side - Pagination buttons */}
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="gap-1 h-8 px-2 sm:px-3"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="flex gap-0.5 sm:gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === 1 ||
                             page === totalPages ||
                             (page >= currentPage - 1 && page <= currentPage + 1);
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center gap-0.5 sm:gap-1">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-1 sm:px-2 text-muted-foreground text-xs sm:text-sm">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
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
                  className="gap-1 h-8 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                  Trips marked as "Funded & Completed" with all documents uploaded - awaiting loan repayment (sorted by maturity urgency)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loanClosureTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending loan closures</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Trips will appear here when they are: Funded + Completed + All documents uploaded
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
                                    {trip.loadType} • {trip.weight} kg • {trip.distance} km
                                  </p>
                                </div>

                                {/* Lender Info */}
                                <div className="bg-muted/50 p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Lender</p>
                                  <p className="font-medium">{toTitleCase(trip.lenderName || (trip as any).lender_name) || 'Unknown Lender'}</p>
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
                                      Close Loan - {(totalRepayment / 1000).toFixed(2)}K
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

          {/* Repaid Loans Tab */}
          <TabsContent value="repaid-loans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Repaid Loans
                </CardTitle>
                <CardDescription>
                  Successfully completed loan repayments with full calculation details and closure timestamps
                </CardDescription>
              </CardHeader>
              <CardContent>
                {repaidTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No repaid loans yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Completed loan repayments will appear here with full calculation details
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {repaidTrips.map((trip: any) => {
                      const repaidDate = trip.repaidAt || trip.repaid_at ? new Date(trip.repaidAt || trip.repaid_at) : null;
                      const formattedDate = repaidDate ? repaidDate.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A';

                      const lenderName = toTitleCase(trip.lenderName || trip.lender_name) || 'Unknown Lender';
                      const principal = trip.repaymentPrincipal || trip.repayment_principal || trip.amount;
                      const interest = trip.repaymentInterest || trip.repayment_interest || 0;
                      const total = trip.repaymentAmount || trip.repayment_amount || trip.amount;
                      const days = trip.repaymentDays || trip.repayment_days || trip.maturityDays || trip.maturity_days || 0;
                      const rate = trip.interestRate || trip.interest_rate || 0;

                      return (
                        <Card key={trip.id} className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20 overflow-hidden">
                          {/* Status Banner - Prominent on mobile */}
                          <div className="bg-green-600 text-white px-4 py-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="font-semibold text-sm sm:text-base">Loan Repaid & Closed</span>
                            </div>
                            {trip.repaidAt && (
                              <span className="text-xs sm:text-sm opacity-90">
                                {Math.floor((Date.now() - new Date(trip.repaidAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                              </span>
                            )}
                          </div>

                          <CardContent className="p-4 sm:p-6">
                            <div className="space-y-4">
                              {/* Trip Info */}
                              <div>
                                <h4 className="font-bold text-lg sm:text-xl mb-2">
                                  {trip.origin} → {trip.destination}
                                </h4>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {trip.loadType} • {trip.weight} kg • {trip.distance} km
                                </p>
                              </div>

                              {/* Lender Info */}
                              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-xs text-muted-foreground mb-1">Lender</p>
                                <p className="font-bold text-base sm:text-lg">{lenderName}</p>
                              </div>

                              {/* Repayment Calculation Details */}
                              <div className="bg-white dark:bg-gray-900 p-3 sm:p-5 rounded-lg border-2 border-green-300 dark:border-green-700 space-y-3">
                                <p className="font-bold text-sm sm:text-base text-green-700 dark:text-green-400 flex items-center gap-2">
                                  <IndianRupee className="h-4 w-4" />
                                  Repayment Calculation
                                </p>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                  <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Principal</p>
                                    <p className="font-bold text-base sm:text-lg">₹{(principal / 1000).toFixed(2)}K</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Loan amount</p>
                                  </div>

                                  <div className="p-2.5 sm:p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Interest</p>
                                    <p className="font-bold text-base sm:text-lg text-orange-600">₹{(interest / 1000).toFixed(2)}K</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{rate}% for {days} days</p>
                                  </div>

                                  <div className="p-2.5 sm:p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total Repaid</p>
                                    <p className="font-bold text-base sm:text-lg text-green-700">₹{(total / 1000).toFixed(2)}K</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Principal + Interest</p>
                                  </div>

                                  <div className="p-2.5 sm:p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Duration</p>
                                    <p className="font-bold text-base sm:text-lg">{days} days</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Actual period</p>
                                  </div>
                                </div>

                                  {/* Formula - Mobile optimized */}
                                  <div className="p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-950 rounded border">
                                    <p className="text-[10px] sm:text-xs font-semibold mb-2">Calculation Formula:</p>
                                    <div className="font-mono text-[10px] sm:text-xs text-muted-foreground space-y-1">
                                      <p className="break-words">Interest = Principal × (Rate/365) × Days</p>
                                      <p className="break-words">= ₹{(principal / 1000).toFixed(0)}K × ({rate}%/365) × {days} days</p>
                                      <p className="text-green-700 dark:text-green-400 font-bold">= ₹{(interest / 1000).toFixed(2)}K</p>
                                    </div>
                                  </div>

                                  {/* Total Summary - Mobile optimized */}
                                  <div className="p-3 sm:p-4 bg-gradient-to-r from-green-100 to-purple-100 dark:from-green-900/30 dark:to-purple-900/30 rounded-lg border-2 border-green-400 dark:border-green-600">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                                      <div>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">Total Amount Repaid</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                          ₹{(principal / 1000).toFixed(0)}K + ₹{(interest / 1000).toFixed(2)}K
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                                        <p className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-400">
                                          {(total / 1000).toFixed(2)}K
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Closure Information - Mobile optimized */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-lg border">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Loan Closed On</p>
                                    <p className="font-bold text-sm">{formattedDate}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      Trip ID: {trip.id.substring(0, 8)}
                                    </p>
                                  </div>
                                  {trip.repaidAt && (
                                    <div className="sm:text-right">
                                      <p className="text-xs text-muted-foreground mb-1">Time Since Closure</p>
                                      <p className="font-bold text-sm text-green-600">
                                        {Math.floor((Date.now() - new Date(trip.repaidAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                                      </p>
                                    </div>
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
        </div>

        {/* Create Trip Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="w-[92vw] sm:w-[95vw] md:w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            <DialogHeader className="space-y-1.5 sm:space-y-2">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="truncate">Create New Trip</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">Add trips individually or in bulk</DialogDescription>
            </DialogHeader>

            <Tabs value={createTripTab} onValueChange={(value) => setCreateTripTab(value as 'form' | 'excel' | 'api')}>
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="form" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-4 text-xs sm:text-sm">
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="truncate">Single<span className="hidden sm:inline"> Trip</span></span>
                </TabsTrigger>
                <TabsTrigger value="excel" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-4 text-xs sm:text-sm">
                  <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="truncate">Bulk<span className="hidden sm:inline"> Upload</span></span>
                </TabsTrigger>
                <TabsTrigger value="api" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-4 text-xs sm:text-sm">
                  <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="truncate">API<span className="hidden sm:inline"> Support</span></span>
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

                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    className="w-full sm:w-auto touch-target"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="api" className="space-y-4 p-1 sm:p-0 overflow-x-hidden">
                <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
                  {/* Header Section */}
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Code className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg">API Integration</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground px-2">
                      Integrate our API into your system to automatically create trips
                    </p>
                  </div>

                  {/* API Documentation */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* Endpoint Information */}
                    <div className="p-3 sm:p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
                        <Link className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        API Endpoint
                      </h4>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 bg-background rounded border">
                          <div className="font-mono text-[10px] sm:text-xs flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="text-green-600 font-semibold shrink-0">POST</span>
                              <span className="break-words" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>https://api.truckfinhub.com/v1/trips/create</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="self-start sm:self-auto shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText('https://api.truckfinhub.com/v1/trips/create');
                              toast({
                                title: 'Copied!',
                                description: 'API endpoint copied to clipboard',
                              });
                            }}
                          >
                            <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Authentication */}
                    <div className="p-3 sm:p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        Authentication
                      </h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">
                        Include your API key in the request headers:
                      </p>
                      <div className="bg-background p-2 sm:p-3 rounded border font-mono text-[10px] sm:text-xs overflow-x-auto relative group">
                        <pre className="whitespace-pre-wrap sm:whitespace-pre max-w-full" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>{`Authorization: Bearer YOUR_API_KEY
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
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                        Contact support to get your API key:{' '}
                        <span className="break-words" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>support@truckfinhub.com</span>
                      </p>
                    </div>

                    {/* Request Body */}
                    <div className="p-3 sm:p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
                        <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        Request Body (JSON)
                      </h4>
                      <div className="bg-background p-2 sm:p-3 rounded border font-mono text-[10px] sm:text-xs overflow-x-auto relative group">
                        <pre className="max-w-full whitespace-pre-wrap sm:whitespace-pre" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>{`{
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
                    <div className="p-3 sm:p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3">Field Descriptions</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] sm:text-xs font-semibold mb-2 text-blue-600">Mandatory Fields (Required*)</p>
                          <div className="space-y-2 text-[10px] sm:text-xs">
                            {/* Table Header - Hidden on mobile */}
                            <div className="hidden sm:grid sm:grid-cols-3 gap-2 font-semibold pb-2 border-b">
                              <span>Field</span>
                              <span>Type</span>
                              <span>Description</span>
                            </div>
                            {/* Mobile: Card layout, Desktop: Table row */}
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-0 bg-muted/50 sm:bg-transparent rounded sm:rounded-none">
                              <span className="font-mono font-semibold sm:font-normal">ewayBillNumber*</span>
                              <span className="text-muted-foreground text-[10px] sm:text-xs"><span className="sm:hidden">Type: </span>string</span>
                              <span className="text-muted-foreground"><span className="sm:hidden font-medium">Description: </span>E-way bill number (12-digit unique number)</span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-0 bg-muted/50 sm:bg-transparent rounded sm:rounded-none">
                              <span className="font-mono font-semibold sm:font-normal">pickup*</span>
                              <span className="text-muted-foreground text-[10px] sm:text-xs"><span className="sm:hidden">Type: </span>string</span>
                              <span className="text-muted-foreground"><span className="sm:hidden font-medium">Description: </span>Pickup/origin location</span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-0 bg-muted/50 sm:bg-transparent rounded sm:rounded-none">
                              <span className="font-mono font-semibold sm:font-normal">destination*</span>
                              <span className="text-muted-foreground text-[10px] sm:text-xs"><span className="sm:hidden">Type: </span>string</span>
                              <span className="text-muted-foreground"><span className="sm:hidden font-medium">Description: </span>Delivery destination location</span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-0 bg-muted/50 sm:bg-transparent rounded sm:rounded-none">
                              <span className="font-mono font-semibold sm:font-normal">sender*</span>
                              <span className="text-muted-foreground text-[10px] sm:text-xs"><span className="sm:hidden">Type: </span>string</span>
                              <span className="text-muted-foreground"><span className="sm:hidden font-medium">Description: </span>Sender/consignee company name</span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-0 bg-muted/50 sm:bg-transparent rounded sm:rounded-none">
                              <span className="font-mono font-semibold sm:font-normal">receiver*</span>
                              <span className="text-muted-foreground text-[10px] sm:text-xs"><span className="sm:hidden">Type: </span>string</span>
                              <span className="text-muted-foreground"><span className="sm:hidden font-medium">Description: </span>Receiver company name</span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-0 bg-muted/50 sm:bg-transparent rounded sm:rounded-none">
                              <span className="font-mono font-semibold sm:font-normal">transporter*</span>
                              <span className="text-muted-foreground text-[10px] sm:text-xs"><span className="sm:hidden">Type: </span>string</span>
                              <span className="text-muted-foreground"><span className="sm:hidden font-medium">Description: </span>Transport service provider name</span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-0 bg-muted/50 sm:bg-transparent rounded sm:rounded-none">
                              <span className="font-mono font-semibold sm:font-normal">loanAmount*</span>
                              <span className="text-muted-foreground text-[10px] sm:text-xs"><span className="sm:hidden">Type: </span>number</span>
                              <span className="text-muted-foreground"><span className="sm:hidden font-medium">Description: </span>Loan amount in ₹ (20,000 - 80,000)</span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-0 bg-muted/50 sm:bg-transparent rounded sm:rounded-none">
                              <span className="font-mono font-semibold sm:font-normal">loanInterestRate*</span>
                              <span className="text-muted-foreground text-[10px] sm:text-xs"><span className="sm:hidden">Type: </span>number</span>
                              <span className="text-muted-foreground"><span className="sm:hidden font-medium">Description: </span>Interest rate percentage (8% - 18%)</span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-0 bg-muted/50 sm:bg-transparent rounded sm:rounded-none">
                              <span className="font-mono font-semibold sm:font-normal">maturityDays*</span>
                              <span className="text-muted-foreground text-[10px] sm:text-xs"><span className="sm:hidden">Type: </span>number</span>
                              <span className="text-muted-foreground"><span className="sm:hidden font-medium">Description: </span>Payment term in days (1-365)</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-[10px] sm:text-xs font-semibold mb-2 text-gray-600">Optional Fields</p>
                          <div className="space-y-2 text-[10px] sm:text-xs">
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-0 bg-muted/50 sm:bg-transparent rounded sm:rounded-none">
                              <span className="font-mono font-semibold sm:font-normal">distance</span>
                              <span className="text-muted-foreground text-[10px] sm:text-xs"><span className="sm:hidden">Type: </span>number</span>
                              <span className="text-muted-foreground"><span className="sm:hidden font-medium">Description: </span>Distance in kilometers</span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-0 bg-muted/50 sm:bg-transparent rounded sm:rounded-none">
                              <span className="font-mono font-semibold sm:font-normal">loadType</span>
                              <span className="text-muted-foreground text-[10px] sm:text-xs"><span className="sm:hidden">Type: </span>string</span>
                              <span className="text-muted-foreground"><span className="sm:hidden font-medium">Description: </span>Type of cargo (e.g., Electronics, FMCG)</span>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2 p-2 sm:p-0 bg-muted/50 sm:bg-transparent rounded sm:rounded-none">
                              <span className="font-mono font-semibold sm:font-normal">weight</span>
                              <span className="text-muted-foreground text-[10px] sm:text-xs"><span className="sm:hidden">Type: </span>number</span>
                              <span className="text-muted-foreground"><span className="sm:hidden font-medium">Description: </span>Weight in kilograms</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Response Examples */}
                    <div className="p-3 sm:p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3">Response Examples</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] sm:text-xs font-semibold mb-1 text-green-600">Success (200 OK)</p>
                          <div className="bg-background p-2 sm:p-3 rounded border font-mono text-[10px] sm:text-xs overflow-x-auto relative group">
                            <pre className="max-w-full whitespace-pre-wrap sm:whitespace-pre" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>{`{
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
                          <p className="text-[10px] sm:text-xs font-semibold mb-1 text-red-600">Error (400 Bad Request)</p>
                          <div className="bg-background p-2 sm:p-3 rounded border font-mono text-[10px] sm:text-xs overflow-x-auto relative group">
                            <pre className="max-w-full whitespace-pre-wrap sm:whitespace-pre" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>{`{
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
                    <div className="p-3 sm:p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3">Code Examples</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] sm:text-xs font-semibold mb-1">JavaScript (Fetch)</p>
                          <div className="bg-background p-2 sm:p-3 rounded border font-mono text-[10px] sm:text-xs overflow-x-auto relative group">
                            <pre className="max-w-full whitespace-pre-wrap sm:whitespace-pre" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>{`fetch('https://api.truckfinhub.com/v1/trips/create', {
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
                          <p className="text-[10px] sm:text-xs font-semibold mb-1">Python (Requests)</p>
                          <div className="bg-background p-2 sm:p-3 rounded border font-mono text-[10px] sm:text-xs overflow-x-auto relative group">
                            <pre className="max-w-full whitespace-pre-wrap sm:whitespace-pre" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>{`import requests

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
                          <p className="text-[10px] sm:text-xs font-semibold mb-1">cURL</p>
                          <div className="bg-background p-2 sm:p-3 rounded border font-mono text-[10px] sm:text-xs overflow-x-auto relative group">
                            <pre className="max-w-full whitespace-pre-wrap sm:whitespace-pre" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>{`curl -X POST https://api.truckfinhub.com/v1/trips/create \\
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
                    <div className="p-3 sm:p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3">Supported Consignee Companies</h4>
                      <div className="bg-background p-2 sm:p-3 rounded border text-[10px] sm:text-xs max-h-40 overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {clientCompanies.map((company) => (
                            <div key={company.name} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                              <span className="truncate">{company.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Support Information */}
                    <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-xs sm:text-sm mb-2 text-blue-900 dark:text-blue-100">Need Help?</h4>
                      <p className="text-[10px] sm:text-xs text-blue-800 dark:text-blue-200 mb-2">
                        Contact our support team for API key generation and integration assistance:
                      </p>
                      <div className="space-y-1 text-[10px] sm:text-xs">
                        <p className="text-blue-900 dark:text-blue-100">
                          <strong>Email:</strong>{' '}
                          <span className="break-words" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>support@truckfinhub.com</span>
                        </p>
                        <p className="text-blue-900 dark:text-blue-100">
                          <strong>Phone:</strong> +91 1800-XXX-XXXX
                        </p>
                        <p className="text-blue-900 dark:text-blue-100">
                          <strong>Documentation:</strong>{' '}
                          <span className="break-words" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>https://docs.truckfinhub.com</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    className="w-full sm:w-auto touch-target"
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
                      {selectedTrip.distance} km
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Load Type</p>
                    <p className="font-semibold">{selectedTrip.loadType}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTrip.weight} kg
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
                    <p className="font-semibold">{toTitleCase(selectedTrip.loadOwnerName)}</p>
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

                {/* Loan Repayment Notice - Show if funded and completed */}
                {isFundedAndCompleted(selectedTrip) && (() => {
                  const principal = selectedTrip.amount;
                  const interestRate = selectedTrip.interestRate || (selectedTrip as any).interest_rate || 0;
                  const maturityDays = selectedTrip.maturityDays || (selectedTrip as any).maturity_days || 30;
                  const interest = (principal * (interestRate / 365) * maturityDays) / 100;
                  const totalRepayment = principal + interest;
                  const daysToMaturity = getDaysToMaturity(selectedTrip);

                  return (
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-purple-50 dark:from-green-950/20 dark:to-purple-950/20 border-2 border-green-400 dark:border-green-700 rounded-lg shadow-lg">
                      <div className="flex items-start gap-3 mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-green-900 dark:text-green-100 mb-1">Loan Repayment Available</h4>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            This trip is funded and all documents are completed. Close the loan to complete repayment.
                          </p>
                        </div>
                        {selectedTrip.lenderName && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Lender</p>
                            <p className="font-semibold">{toTitleCase(selectedTrip.lenderName)}</p>
                          </div>
                        )}
                      </div>

                      {/* Loan Details */}
                      <div className="grid grid-cols-4 gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800">
                        <div>
                          <p className="text-xs text-muted-foreground">Principal</p>
                          <p className="font-bold text-lg">₹{(principal / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Interest ({interestRate}%)</p>
                          <p className="font-bold text-lg text-orange-600">₹{(interest / 1000).toFixed(2)}K</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Repayment</p>
                          <p className="font-bold text-lg text-primary">₹{(totalRepayment / 1000).toFixed(2)}K</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Maturity</p>
                          <p className={`font-bold text-sm ${daysToMaturity !== null && daysToMaturity < 0 ? 'text-red-600' : daysToMaturity !== null && daysToMaturity <= 10 ? 'text-orange-600' : 'text-green-600'}`}>
                            {daysToMaturity !== null ? (
                              daysToMaturity < 0 ? `Overdue ${Math.abs(daysToMaturity)}d` : `${daysToMaturity} days`
                            ) : (
                              `${maturityDays} days`
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
              <div className="flex items-center justify-between w-full gap-4">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>

                {/* Show loan repayment button if trip is funded AND all documents uploaded */}
                {selectedTrip && isFundedAndCompleted(selectedTrip) && (
                  <Button
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleLoanRepayment(selectedTrip);
                    }}
                    disabled={repaying[selectedTrip.id]}
                    className="bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700"
                  >
                    {repaying[selectedTrip.id] ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing Repayment...
                      </>
                    ) : (
                      <>
                        <IndianRupee className="h-4 w-4 mr-2" />
                        Close Loan - Repay Now
                      </>
                    )}
                  </Button>
                )}
              </div>
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

        {/* Loan Repayment Confirmation Dialog */}
        <Dialog open={repaymentDialogOpen} onOpenChange={setRepaymentDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <IndianRupee className="h-6 w-6 text-primary" />
                Loan Repayment Calculation
              </DialogTitle>
              <DialogDescription className="text-base">
                Detailed breakdown of loan repayment based on actual days
              </DialogDescription>
            </DialogHeader>

            {tripForRepayment && (() => {
              const principal = tripForRepayment.amount;
              const interestRate = tripForRepayment.interestRate || (tripForRepayment as any).interest_rate || 0;
              const maturityDays = tripForRepayment.maturityDays || (tripForRepayment as any).maturity_days || 30;
              const fundedAt = tripForRepayment.fundedAt || (tripForRepayment as any).funded_at;

              // Calculate actual days loan was active
              const fundedDate = new Date(fundedAt);
              const today = new Date();
              const actualDays = Math.ceil((today.getTime() - fundedDate.getTime()) / (1000 * 60 * 60 * 24));

              // Calculate interest per day
              const interestRatePerDay = interestRate / 365;

              // Calculate interest based on actual days
              const actualInterest = (principal * interestRatePerDay * actualDays) / 100;
              const actualTotalRepayment = principal + actualInterest;

              // Calculate what it would be at maturity (for comparison)
              const maturityInterest = (principal * interestRatePerDay * maturityDays) / 100;
              const maturityTotalRepayment = principal + maturityInterest;

              const isEarlyPayment = actualDays < maturityDays;
              const savings = isEarlyPayment ? maturityInterest - actualInterest : 0;

              return (
                <div className="space-y-6">
                  {/* Trip Info */}
                  <div className="p-5 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <TruckIcon className="h-5 w-5 text-primary" />
                      <p className="text-base font-semibold text-muted-foreground">Trip Details</p>
                    </div>
                    <p className="font-bold text-xl mb-2">
                      {tripForRepayment.origin} → {tripForRepayment.destination}
                    </p>
                    {tripForRepayment.lenderName && (
                      <p className="text-base text-muted-foreground">
                        <span className="font-semibold">Lender:</span> {toTitleCase(tripForRepayment.lenderName)}
                      </p>
                    )}
                  </div>

                  {/* Calculation Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Calculation Breakdown:</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      {/* Principal */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-muted-foreground mb-2">Principal Amount</p>
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">₹{(principal / 1000).toFixed(0)}K</p>
                        <p className="text-sm text-muted-foreground mt-2">Original loan amount</p>
                      </div>

                      {/* Interest Rate */}
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                        <p className="text-sm text-muted-foreground mb-2">Annual Interest Rate</p>
                        <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{interestRate}%</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Per day: {interestRatePerDay.toFixed(4)}%
                        </p>
                      </div>

                      {/* Maturity Days */}
                      <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-muted-foreground mb-2">Maturity Period</p>
                        <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">{maturityDays} days</p>
                        <p className="text-sm text-muted-foreground mt-2">Original loan term</p>
                      </div>

                      {/* Actual Days */}
                      <div className={`p-4 rounded-lg border-2 ${isEarlyPayment ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}>
                        <p className="text-sm text-muted-foreground mb-2">Actual Days</p>
                        <p className={`text-3xl font-bold ${isEarlyPayment ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{actualDays} days</p>
                        <p className={`text-sm font-semibold mt-2 ${isEarlyPayment ? 'text-green-600' : 'text-red-600'}`}>
                          {isEarlyPayment ? `Early by ${maturityDays - actualDays} days` : `Overdue by ${actualDays - maturityDays} days`}
                        </p>
                      </div>
                    </div>

                    {/* Interest Calculation Formula */}
                    <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-gray-300 dark:border-gray-700">
                      <p className="text-base font-semibold mb-3">Interest Calculation Formula:</p>
                      <div className="font-mono text-sm space-y-2 bg-white dark:bg-gray-950 p-4 rounded border">
                        <p className="text-base">Interest = Principal × (Rate/365) × Actual Days</p>
                        <p className="text-muted-foreground">
                          = ₹{(principal / 1000).toFixed(0)}K × ({interestRate}%/365) × {actualDays} days
                        </p>
                        <p className="text-primary font-bold text-lg">
                          = ₹{(actualInterest / 1000).toFixed(2)}K
                        </p>
                      </div>
                    </div>

                    {/* Total Repayment */}
                    <div className="p-6 bg-gradient-to-r from-green-50 to-purple-50 dark:from-green-950/20 dark:to-purple-950/20 rounded-lg border-4 border-primary shadow-lg">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="font-semibold text-lg mb-2">Total Repayment Amount:</p>
                          <div className="text-base text-muted-foreground space-y-1">
                            <p>Principal: ₹{(principal / 1000).toFixed(0)}K</p>
                            <p>Interest ({actualDays} days): ₹{(actualInterest / 1000).toFixed(2)}K</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-8 w-8 text-primary" />
                          <p className="text-4xl md:text-5xl font-bold text-primary">{(actualTotalRepayment / 1000).toFixed(2)}K</p>
                        </div>
                      </div>
                    </div>

                    {/* Early Payment Savings */}
                    {isEarlyPayment && savings > 0 && (
                      <div className="p-5 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-400 dark:border-green-700 shadow-md">
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <p className="font-bold text-lg text-green-900 dark:text-green-100">Early Payment Savings!</p>
                        </div>
                        <p className="text-base mb-2">
                          By paying {maturityDays - actualDays} days early, you save <span className="font-bold text-green-700">₹{(savings / 1000).toFixed(2)}K</span> in interest.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          (At maturity, total would be: ₹{(maturityTotalRepayment / 1000).toFixed(2)}K)
                        </p>
                      </div>
                    )}

                    {/* Overdue Warning */}
                    {!isEarlyPayment && actualDays > maturityDays && (
                      <div className="p-5 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-400 dark:border-red-700 shadow-md">
                        <div className="flex items-center gap-3 mb-3">
                          <AlertCircle className="h-6 w-6 text-red-600" />
                          <p className="font-bold text-lg text-red-900 dark:text-red-100">Payment Overdue</p>
                        </div>
                        <p className="text-base">
                          Payment is <span className="font-bold text-red-700">{actualDays - maturityDays} days overdue</span>. Additional interest of <span className="font-bold text-red-700">₹{((actualInterest - maturityInterest) / 1000).toFixed(2)}K</span> has accrued.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <DialogFooter className="border-t pt-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRepaymentDialogOpen(false)}
                  className="order-2 sm:order-1"
                  size="lg"
                >
                  Cancel
                </Button>
                {tripForRepayment && (
                  <Button
                    onClick={() => processLoanRepayment(tripForRepayment)}
                    disabled={repaying[tripForRepayment.id]}
                    className="bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700 order-1 sm:order-2"
                    size="lg"
                  >
                    {repaying[tripForRepayment.id] ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing Repayment...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Confirm Repayment
                      </>
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contract Acceptance Dialog */}
        <ContractAcceptanceDialog
          open={contractDialogOpen && contractData !== null}
          onClose={() => {
            setContractDialogOpen(false);
            setPendingAllotment(null);
            setContractData(null);
          }}
          onAccept={handleContractAccept}
          contract={contractData || {
            lenderName: '',
            lenderSignature: '',
            termsAndConditions: '',
            interestRateClause: '',
            repaymentClause: '',
            latePaymentClause: '',
            defaultClause: '',
            tripAmount: 0,
            interestRate: 0,
            maturityDays: 0,
          }}
          loading={contractLoading}
        />

        {/* Rating Dialog */}
        {tripForRating && (
          <RatingDialog
            open={ratingDialogOpen}
            onClose={() => {
              setRatingDialogOpen(false);
              setTripForRating(null);
            }}
            onRatingSubmitted={() => {
              setRefreshKey(prev => prev + 1);
            }}
            tripId={tripForRating.id}
            lenderId={tripForRating.lenderId || (tripForRating as any).lender_id || ''}
            lenderName={toTitleCase(tripForRating.lenderName || (tripForRating as any).lender_name) || 'Unknown'}
            borrowerId={user?.id || ''}
            borrowerName={user?.name || ''}
            loanAmount={tripForRating.amount || 0}
            interestRate={tripForRating.interestRate || (tripForRating as any).interest_rate || 0}
          />
        )}

        {/* Edit Trip Dialog */}
        {tripForEdit && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Trip</DialogTitle>
                <DialogDescription>
                  Update trip details for {tripForEdit.origin} → {tripForEdit.destination}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-pickup">Pickup Location</Label>
                    <Input
                      id="edit-pickup"
                      value={tripForEdit.pickup || tripForEdit.origin || ''}
                      onChange={(e) => setTripForEdit({ ...tripForEdit, pickup: e.target.value, origin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-destination">Destination</Label>
                    <Input
                      id="edit-destination"
                      value={tripForEdit.destination || ''}
                      onChange={(e) => setTripForEdit({ ...tripForEdit, destination: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-distance">Distance (km)</Label>
                    <Input
                      id="edit-distance"
                      type="number"
                      value={tripForEdit.distance || ''}
                      onChange={(e) => setTripForEdit({ ...tripForEdit, distance: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-weight">Weight (kg)</Label>
                    <Input
                      id="edit-weight"
                      type="number"
                      value={tripForEdit.weight || ''}
                      onChange={(e) => setTripForEdit({ ...tripForEdit, weight: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-loadType">Load Type</Label>
                    <Input
                      id="edit-loadType"
                      value={tripForEdit.loadType || ''}
                      onChange={(e) => setTripForEdit({ ...tripForEdit, loadType: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount">Loan Amount (₹)</Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      value={tripForEdit.amount || tripForEdit.loanAmount || ''}
                      onChange={(e) => setTripForEdit({ ...tripForEdit, amount: parseFloat(e.target.value), loanAmount: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-interestRate">Interest Rate (%)</Label>
                    <Input
                      id="edit-interestRate"
                      type="number"
                      step="0.1"
                      value={tripForEdit.interestRate || tripForEdit.loanInterestRate || ''}
                      onChange={(e) => setTripForEdit({ ...tripForEdit, interestRate: parseFloat(e.target.value), loanInterestRate: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-maturityDays">Maturity Days</Label>
                    <Input
                      id="edit-maturityDays"
                      type="number"
                      value={tripForEdit.maturityDays || ''}
                      onChange={(e) => setTripForEdit({ ...tripForEdit, maturityDays: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await data.updateTrip(tripForEdit.id, {
                        pickup: tripForEdit.pickup,
                        origin: tripForEdit.origin,
                        destination: tripForEdit.destination,
                        distance: tripForEdit.distance,
                        weight: tripForEdit.weight,
                        loadType: tripForEdit.loadType,
                        amount: tripForEdit.amount,
                        loanAmount: tripForEdit.loanAmount,
                        interestRate: tripForEdit.interestRate,
                        loanInterestRate: tripForEdit.loanInterestRate,
                        maturityDays: tripForEdit.maturityDays,
                      });
                      toast({
                        title: 'Trip Updated',
                        description: 'The trip has been successfully updated.',
                      });
                      setEditDialogOpen(false);
                      setTripForEdit(null);
                      setRefreshKey(prev => prev + 1);
                    } catch (error) {
                      console.error('Error updating trip:', error);
                      toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Failed to update trip. Please try again.',
                      });
                    }
                  }}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this trip? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {tripForDelete && (
              <div className="py-4">
                <p className="text-sm font-semibold">Trip Details:</p>
                <p className="text-sm text-muted-foreground">
                  {tripForDelete.origin || tripForDelete.pickup} → {tripForDelete.destination}
                </p>
                <p className="text-sm text-muted-foreground">
                  {tripForDelete.loadType} • {tripForDelete.weight} kg
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteTrip}>
                Delete Trip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default LoadAgentDashboard;
