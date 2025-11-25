import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { apiClient } from '@/api/client';
import {
  Upload,
  FileText,
  Eye,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  ArrowUpCircle,
  Info,
  IndianRupee,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface TrustAccount {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface Lender {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface Trip {
  id: string;
  origin: string;
  destination: string;
  load_type: string;
  amount: number;
  distance: number;
  lender_id: string;
  lender_name: string;
  status: string;
  completion_date?: string;
  interest_rate?: number;
  maturity_days?: number;
  principal_amount?: number;
  interest_amount?: number;
  lender_amount?: number;
}

interface LenderGroup {
  lender_id: string;
  lender_name: string;
  trips: Trip[];
}

interface Reconciliation {
  id: string;
  transporter_id: string;
  transporter_name: string;
  trust_account_id: string;
  trust_account_name: string;
  trip_id?: string;
  selected_trip_ids?: string[];
  selected_lender_id?: string;
  selected_lender_name?: string;
  document_name: string;
  document_type: string;
  document_url: string;
  document_data: string;
  document_size: number;
  description?: string;
  reconciliation_amount?: number;
  reconciliation_date?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  workflow_status?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  claim_requested?: boolean;
  claim_requested_at?: string;
  claim_amount?: number;
  lender_id?: string;
  lender_name?: string;
  lender_claim_amount?: number;
  transporter_claim_amount?: number;
  lender_approved?: boolean;
  lender_approved_at?: string;
  transporter_approved?: boolean;
  transporter_approved_at?: string;
  payment_notification_sent?: boolean;
  payment_notification_message?: string;
  bank_request_generated?: boolean;
  bank_request_message?: string;
  // Breakdown amounts calculated from trips
  total_principal?: number;
  total_interest?: number;
}

const Reconciliation = () => {
  const { toast } = useToast();
  const user = auth.getCurrentUser();
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [trustAccounts, setTrustAccounts] = useState<TrustAccount[]>([]);
  const [trustAccountLenders, setTrustAccountLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Reconciliation | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<Reconciliation | null>(null);
  const [claimTrips, setClaimTrips] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [claiming, setClaiming] = useState(false);

  // New states for multi-trip selection
  const [lenderGroups, setLenderGroups] = useState<LenderGroup[]>([]);
  const [selectedLenderId, setSelectedLenderId] = useState('');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);

  // State to store trip details for each reconciliation (keyed by reconciliation ID)
  const [reconTripDetails, setReconTripDetails] = useState<Record<string, Trip[]>>({});

  // Form state
  const [selectedTrustAccount, setSelectedTrustAccount] = useState('');
  const [selectedTrustAccountLender, setSelectedTrustAccountLender] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [reconciliationAmount, setReconciliationAmount] = useState('');
  const [reconciliationDate, setReconciliationDate] = useState('');

  // Fetch reconciliations
  useEffect(() => {
    fetchReconciliations();
    fetchTrustAccounts();
  }, [user?.id]);

  const fetchReconciliations = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/reconciliations?userId=${user?.id}&userRole=${user?.role}`);
      setReconciliations(data);

      // Fetch trip details for reconciliations that have selected_trip_ids
      const tripDetailsMap: Record<string, Trip[]> = {};
      for (const recon of data) {
        if (recon.selected_trip_ids && recon.selected_trip_ids.length > 0) {
          try {
            const tripDetails = await apiClient.post('/reconciliations/trips/details', {
              tripIds: recon.selected_trip_ids
            });
            tripDetailsMap[recon.id] = tripDetails;
          } catch (err) {
            console.error(`Error fetching trip details for recon ${recon.id}:`, err);
          }
        }
      }
      setReconTripDetails(tripDetailsMap);
    } catch (error: any) {
      console.error('Error fetching reconciliations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load reconciliations',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrustAccounts = async () => {
    try {
      const data = await apiClient.get('/reconciliations/trust-accounts/list');
      setTrustAccounts(data);
    } catch (error: any) {
      console.error('Error fetching trust accounts:', error);
    }
  };

  const fetchTrustAccountLenders = async (trustAccountId: string) => {
    try {
      // Fetch all lenders from users API
      const data = await apiClient.get('/users?role=lender');
      setTrustAccountLenders(data);
    } catch (error: any) {
      console.error('Error fetching lenders:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load lenders',
      });
    }
  };

  const fetchUserTrips = async () => {
    try {
      const data = await apiClient.get(`/trips?status=completed&transporterId=${user?.id}`);
      setClaimTrips(data);
    } catch (error: any) {
      console.error('Error fetching trips:', error);
    }
  };

  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
    // Trips will be fetched when lender is selected from dropdown
  };

  const handleTrustAccountChange = (trustAccountId: string) => {
    setSelectedTrustAccount(trustAccountId);
    setSelectedTrustAccountLender(''); // Clear selected lender when trust account changes
    setTrustAccountLenders([]); // Clear lenders list
    setSelectedLenderId(''); // Clear selected lender for trips
    setSelectedTripIds([]); // Clear selected trips
    setLenderGroups([]); // Clear lender groups

    if (trustAccountId) {
      fetchTrustAccountLenders(trustAccountId);
    }
  };

  const handleLenderChange = async (lenderId: string) => {
    setSelectedLenderId(lenderId);
    setSelectedTripIds([]); // Clear selected trips when lender changes
    setLenderGroups([]); // Clear existing trips

    if (lenderId) {
      // Fetch trips for this lender where current user is the load owner
      await fetchTripsForLender(lenderId);
    }
  };

  const fetchTripsForLender = async (lenderId: string) => {
    try {
      // Fetch trips where load_owner_id is current user and lender_id is selected lender
      const allTrips = await apiClient.get(`/trips?loadOwnerId=${user?.id}&lenderId=${lenderId}`);

      // Filter for active trips (funded, in_transit, completed, repaid)
      const filtered = allTrips.filter((trip: any) =>
        ['funded', 'in_transit', 'completed', 'repaid'].includes(trip.status)
      );

      // Find the selected lender's name from the lenders list
      const selectedLender = trustAccountLenders.find(l => l.id === lenderId);

      if (filtered.length > 0) {
        setLenderGroups([{
          lender_id: lenderId,
          lender_name: selectedLender?.name || filtered[0]?.lender_name || 'Unknown Lender',
          trips: filtered,
        }]);
      } else {
        // No trips found, still set up the lender group with empty trips
        setLenderGroups([{
          lender_id: lenderId,
          lender_name: selectedLender?.name || 'Unknown Lender',
          trips: [],
        }]);
      }
    } catch (error: any) {
      console.error('Error fetching trips for lender:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load trips for selected lender',
      });
    }
  };

  const handleToggleTripSelection = (tripId: string) => {
    setSelectedTripIds((prev) =>
      prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId]
    );
  };

  const handleOpenClaimDialog = (recon: Reconciliation) => {
    setSelectedReconciliation(recon);
    setClaimDialogOpen(true);
    fetchUserTrips();
  };

  const handleSubmitClaim = async () => {
    if (!selectedTripId || !selectedReconciliation) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please select a trip to submit claim.',
      });
      return;
    }

    setClaiming(true);
    try {
      // Find the selected trip to get lender info
      const selectedTrip = claimTrips.find(t => t.id === selectedTripId);
      if (!selectedTrip || !selectedTrip.lender_id) {
        throw new Error('Trip must have a lender');
      }

      // Calculate claim amounts (simple example - can be customized)
      const totalAmount = selectedReconciliation.reconciliation_amount || 0;
      const lenderPercentage = 0.7; // 70% to lender
      const transporterPercentage = 0.3; // 30% to transporter
      const lenderClaimAmount = totalAmount * lenderPercentage;
      const transporterClaimAmount = totalAmount * transporterPercentage;

      await apiClient.patch(`/reconciliations/${selectedReconciliation.id}/claim`, {
        trip_id: selectedTripId,
        lender_id: selectedTrip.lender_id,
        lender_name: selectedTrip.lender_name,
        lender_claim_amount: lenderClaimAmount,
        transporter_claim_amount: transporterClaimAmount,
        claim_amount: totalAmount,
      });

      toast({
        title: 'Claim Submitted',
        description: 'Your claim has been submitted to the lender for approval.',
      });

      setClaimDialogOpen(false);
      setSelectedTripId('');
      setSelectedReconciliation(null);
      fetchReconciliations();
    } catch (error: any) {
      console.error('Error submitting claim:', error);
      toast({
        variant: 'destructive',
        title: 'Claim Failed',
        description: error.message || 'Failed to submit claim.',
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload PDF, Excel, or image files only.',
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'File size should not exceed 10MB.',
      });
      return;
    }

    setDocumentFile(file);
  };

  const handleUploadReconciliation = async () => {
    if (!documentFile || !selectedTrustAccount) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please select a trust account and upload a document.',
      });
      return;
    }

    // Validation - lender selection required if trips are selected
    if (selectedTripIds.length > 0 && !selectedLenderId) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please select a lender.',
      });
      return;
    }

    setSaving(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const fileDataPromise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(documentFile);
      });
      const fileData = await fileDataPromise;

      const selectedAccount = trustAccounts.find(ta => ta.id === selectedTrustAccount);
      const selectedLenderGroup = lenderGroups.find(lg => lg.lender_id === selectedLenderId);

      const reconciliationData = {
        id: `recon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        transporter_id: user?.id,
        transporter_name: user?.name,
        trust_account_id: selectedTrustAccount,
        trust_account_name: selectedAccount?.name || 'Trust Account',
        selected_trip_ids: selectedTripIds,
        selected_lender_id: selectedLenderId || null,
        selected_lender_name: selectedLenderGroup?.lender_name || null,
        document_name: documentFile.name,
        document_type: documentFile.type,
        document_url: '',
        document_data: fileData,
        document_size: documentFile.size,
        description: description || null,
        reconciliation_amount: reconciliationAmount ? parseFloat(reconciliationAmount) : null,
        reconciliation_date: reconciliationDate || null,
      };

      await apiClient.post('/reconciliations', reconciliationData);

      toast({
        title: 'Reconciliation Uploaded',
        description: 'Your reconciliation document has been submitted successfully.',
      });

      // Reset form
      setUploadDialogOpen(false);
      setDocumentFile(null);
      setSelectedTrustAccount('');
      setSelectedTrustAccountLender('');
      setTrustAccountLenders([]);
      setSelectedLenderId('');
      setSelectedTripIds([]);
      setDescription('');
      setReconciliationAmount('');
      setReconciliationDate('');

      // Refresh list
      fetchReconciliations();
    } catch (error: any) {
      console.error('Error uploading reconciliation:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload reconciliation.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReconciliation = async (id: string) => {
    try {
      await apiClient.delete(`/reconciliations/${id}?userId=${user?.id}`);

      toast({
        title: 'Deleted',
        description: 'Reconciliation deleted successfully.',
      });

      fetchReconciliations();
    } catch (error: any) {
      console.error('Error deleting reconciliation:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete reconciliation.',
      });
    }
  };

  const handleReviewReconciliation = async (id: string, status: string, notes: string) => {
    try {
      await apiClient.patch(`/reconciliations/${id}/review`, {
        status,
        review_notes: notes,
        reviewed_by: user?.id,
      });

      toast({
        title: 'Review Submitted',
        description: `Reconciliation marked as ${status}.`,
      });

      fetchReconciliations();
    } catch (error: any) {
      console.error('Error reviewing reconciliation:', error);
      toast({
        variant: 'destructive',
        title: 'Review Failed',
        description: error.message || 'Failed to update reconciliation status.',
      });
    }
  };

  const handleApproveReconciliation = async (id: string) => {
    try {
      // Find the reconciliation
      const recon = reconciliations.find(r => r.id === id);
      const tripDetails = reconTripDetails[id] || [];

      // Calculate totals from trip details
      let lenderTotalAmount = 0;
      let transporterTotalAmount = 0;

      if (tripDetails.length > 0) {
        lenderTotalAmount = tripDetails.reduce((sum, t) => sum + Number(t.lender_amount || t.amount || 0), 0);
        transporterTotalAmount = (recon?.reconciliation_amount || 0) - lenderTotalAmount;
      }

      await apiClient.patch(`/reconciliations/${id}/approve`, {
        reviewed_by: user?.id,
        lender_total_amount: lenderTotalAmount,
        transporter_total_amount: transporterTotalAmount,
      });

      toast({
        title: 'Approved',
        description: 'Reconciliation approved successfully. Lender will see this in pending claims.',
      });

      fetchReconciliations();
    } catch (error: any) {
      console.error('Error approving reconciliation:', error);
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error.message || 'Failed to approve reconciliation.',
      });
    }
  };

  const handleRejectReconciliation = async (id: string) => {
    const notes = prompt('Please provide a reason for rejection:');
    if (!notes) return;

    try {
      await apiClient.patch(`/reconciliations/${id}/reject`, {
        reviewed_by: user?.id,
        review_notes: notes,
      });

      toast({
        title: 'Rejected',
        description: 'Reconciliation rejected. Transporter will be notified.',
      });

      fetchReconciliations();
    } catch (error: any) {
      console.error('Error rejecting reconciliation:', error);
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: error.message || 'Failed to reject reconciliation.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
      reviewed: { color: 'bg-blue-100 text-blue-700', icon: Eye, label: 'Reviewed' },
      approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleApproveAsTransporter = async (id: string) => {
    try {
      await apiClient.patch(`/reconciliations/${id}/approve-transporter`, {
        transporter_id: user?.id,
      });

      toast({
        title: 'Approved',
        description: 'You have approved this reconciliation. Awaiting lender approval.',
      });

      fetchReconciliations();
    } catch (error: any) {
      console.error('Error approving as transporter:', error);
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error.message || 'Failed to approve reconciliation.',
      });
    }
  };

  const isTrustAccount = user?.role === 'trust_account';

  return (
    <DashboardLayout role={user?.role || 'load_agent'}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reconciliation</h1>
            <p className="text-muted-foreground mt-1">
              {isTrustAccount
                ? 'Review reconciliation documents submitted by transporters'
                : 'Upload reconciliation documents for trust accounts'}
            </p>
          </div>
          {!isTrustAccount && (
            <Button onClick={handleOpenUploadDialog} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          )}
        </div>

        {/* Reconciliations List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reconciliations.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-2">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  {isTrustAccount
                    ? 'No reconciliation documents to review yet.'
                    : 'No reconciliation documents uploaded yet.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reconciliations.map((recon) => {
              // Dynamic card styling based on status
              const getCardStyle = () => {
                if (recon.status === 'approved') return 'border-l-4 border-l-green-500 bg-green-50/50';
                if (recon.status === 'rejected') return 'border-l-4 border-l-red-500 bg-red-50/50';
                return 'border-l-4 border-l-primary';
              };

              return (
              <Card key={recon.id} className={getCardStyle()}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{recon.document_name}</h3>
                            {getStatusBadge(recon.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {isTrustAccount
                              ? `From: ${recon.transporter_name}`
                              : `To: ${recon.trust_account_name}`
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded on {new Date(recon.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      {(recon.reconciliation_amount || recon.reconciliation_date || recon.description) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                          {recon.reconciliation_amount && (
                            <div>
                              <p className="text-xs text-muted-foreground">Amount</p>
                              <p className="font-semibold">{formatCurrency(recon.reconciliation_amount)}</p>
                            </div>
                          )}
                          {recon.reconciliation_date && (
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="font-semibold">
                                {new Date(recon.reconciliation_date).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          )}
                          {recon.description && (
                            <div className="md:col-span-2">
                              <p className="text-xs text-muted-foreground">Description</p>
                              <p className="text-sm">{recon.description}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Review Notes */}
                      {recon.review_notes && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Review Notes
                          </p>
                          <p className="text-sm">{recon.review_notes}</p>
                          {recon.reviewed_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Reviewed on {new Date(recon.reviewed_at).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Approve/Disapprove Buttons for Trust Account */}
                      {isTrustAccount && recon.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => handleApproveReconciliation(recon.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectReconciliation(recon.id)}
                            variant="destructive"
                            className="flex-1 gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Disapprove
                          </Button>
                        </div>
                      )}

                      {/* Payment Breakdown for Transporter (after trust account approval) */}
                      {!isTrustAccount && recon.status === 'approved' && (recon.lender_claim_amount || recon.transporter_claim_amount) && (
                        <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800 mt-3">
                          <p className="text-xs font-semibold mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            Payment Breakdown
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded border">
                              <p className="text-xs text-muted-foreground">Total Reconciliation</p>
                              <p className="font-bold text-primary">{formatCurrency(recon.reconciliation_amount || 0)}</p>
                            </div>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-200">
                              <p className="text-xs text-blue-700 dark:text-blue-300">Lender Amount</p>
                              <p className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(recon.lender_claim_amount || 0)}</p>
                              <p className="text-xs text-muted-foreground">(Principal + Interest)</p>
                            </div>
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded border border-green-200 col-span-2">
                              <p className="text-xs text-green-700 dark:text-green-300">Your Amount</p>
                              <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(recon.transporter_claim_amount || 0)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Transporter Approval Button (after trust account approval) */}
                      {!isTrustAccount && recon.workflow_status === 'trust_approved' && !recon.transporter_approved && (
                        <Button
                          onClick={() => handleApproveAsTransporter(recon.id)}
                          className="w-full mt-3 bg-green-600 hover:bg-green-700 gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve Reconciliation
                        </Button>
                      )}

                      {/* Approval Status Badges */}
                      {recon.workflow_status && recon.workflow_status !== 'pending' && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 mt-3">
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Approval Status
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span>Trust Account:</span>
                              <Badge className={recon.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                {recon.status === 'approved' ? 'Approved' : 'Pending'}
                              </Badge>
                            </div>
                            {recon.selected_lender_id && (
                              <div className="flex items-center justify-between">
                                <span>Lender:</span>
                                <Badge className={recon.lender_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                  {recon.lender_approved ? 'Approved' : 'Pending'}
                                </Badge>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span>Transporter:</span>
                              <Badge className={recon.transporter_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                {recon.transporter_approved ? 'Approved' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bank Request Message */}
                      {recon.bank_request_generated && recon.bank_request_message && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 mt-3">
                          <p className="text-xs text-green-700 dark:text-green-300 mb-1 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            All Approvals Complete
                          </p>
                          <p className="text-sm">{recon.bank_request_message}</p>
                        </div>
                      )}

                      {/* Selected Trips Display */}
                      {recon.selected_trip_ids && recon.selected_trip_ids.length > 0 && (
                        <div className="p-3 bg-muted/50 rounded-lg mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium">Selected Trips ({recon.selected_trip_ids.length})</p>
                            <Badge variant="outline" className="text-xs">
                              Lender: {recon.selected_lender_name}
                            </Badge>
                          </div>

                          {/* Trip Details List */}
                          {reconTripDetails[recon.id] && reconTripDetails[recon.id].length > 0 ? (
                            <div className="space-y-2">
                              {reconTripDetails[recon.id].map((trip) => (
                                <div
                                  key={trip.id}
                                  className="p-3 bg-background rounded border text-sm"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-medium">
                                      {trip.origin} → {trip.destination}
                                    </div>
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {trip.status}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-2">
                                    {trip.load_type} • {trip.distance} km • {trip.interest_rate || 0}% interest • {trip.maturity_days || 30} days
                                  </div>

                                  {/* Amount Breakdown */}
                                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Principal (Loan)</p>
                                      <p className="font-medium">{formatCurrency(trip.principal_amount || trip.amount)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Interest</p>
                                      <p className="font-medium text-orange-600">{formatCurrency(trip.interest_amount || 0)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Lender Amount</p>
                                      <p className="font-semibold text-blue-600">{formatCurrency(trip.lender_amount || trip.amount)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Transporter Amount</p>
                                      <p className="font-semibold text-green-600">
                                        {formatCurrency((recon.reconciliation_amount || 0) - (trip.lender_amount || trip.amount))}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Summary Totals */}
                              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mt-3">
                                <p className="text-xs font-semibold mb-2 text-primary">Payment Summary</p>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>Total Principal:</span>
                                    <span className="font-medium">
                                      {formatCurrency(
                                        reconTripDetails[recon.id].reduce((sum, t) => sum + Number(t.principal_amount || t.amount), 0)
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Total Interest:</span>
                                    <span className="font-medium text-orange-600">
                                      {formatCurrency(
                                        reconTripDetails[recon.id].reduce((sum, t) => sum + Number(t.interest_amount || 0), 0)
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm pt-1 border-t">
                                    <span className="font-semibold">Lender Total:</span>
                                    <span className="font-bold text-blue-600">
                                      {formatCurrency(
                                        reconTripDetails[recon.id].reduce((sum, t) => sum + Number(t.lender_amount || t.amount), 0)
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="font-semibold">Transporter Total:</span>
                                    <span className="font-bold text-green-600">
                                      {formatCurrency(
                                        (recon.reconciliation_amount || 0) -
                                        reconTripDetails[recon.id].reduce((sum, t) => sum + Number(t.lender_amount || t.amount), 0)
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              Loading trip details...
                            </p>
                          )}
                        </div>
                      )}

                      {/* Payment Notification Message (legacy support) */}
                      {recon.payment_notification_sent && recon.payment_notification_message && !recon.bank_request_generated && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 mt-3">
                          <p className="text-xs text-green-700 dark:text-green-300 mb-1 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Payment Notification
                          </p>
                          <p className="text-sm">{recon.payment_notification_message}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingDoc(recon)}
                        title="View Document"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = recon.document_data;
                          link.download = recon.document_name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        title="Download Document"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!isTrustAccount && recon.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReconciliation(recon.id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Reconciliation Document</DialogTitle>
              <DialogDescription>
                Upload a reconciliation document for review by a trust account
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Trust Account Selection */}
              <div className="space-y-2">
                <Label htmlFor="trust-account">
                  Select Trust Account <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedTrustAccount} onValueChange={handleTrustAccountChange}>
                  <SelectTrigger id="trust-account">
                    <SelectValue placeholder="Choose trust account" />
                  </SelectTrigger>
                  <SelectContent>
                    {trustAccounts.map((ta) => (
                      <SelectItem key={ta.id} value={ta.id}>
                        {ta.name} {ta.company ? `- ${ta.company}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Trust Account Lender Selection */}
              {selectedTrustAccount && (
                <div className="space-y-2">
                  <Label htmlFor="trust-account-lender">
                    Select Lender Associated with Trust Account (Optional)
                  </Label>
                  <Select
                    value={selectedTrustAccountLender}
                    onValueChange={(lenderId) => {
                      setSelectedTrustAccountLender(lenderId);
                      // Use the new handler that fetches trips by load owner AND lender
                      handleLenderChange(lenderId);
                    }}
                  >
                    <SelectTrigger id="trust-account-lender">
                      <SelectValue placeholder="Choose lender" />
                    </SelectTrigger>
                    <SelectContent>
                      {trustAccountLenders.length === 0 ? (
                        <SelectItem value="none" disabled>Loading lenders...</SelectItem>
                      ) : (
                        trustAccountLenders.map((lender) => (
                          <SelectItem key={lender.id} value={lender.id}>
                            {lender.name} {lender.company ? `- ${lender.company}` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a lender to view and select their trips
                  </p>
                </div>
              )}


              {/* Trip Selection (Multi-select) - Shows only when lender is selected */}
              {selectedLenderId && (
                <div className="space-y-2">
                  <Label>
                    Select Trips for {lenderGroups.find(lg => lg.lender_id === selectedLenderId)?.lender_name} (Optional)
                  </Label>
                  {lenderGroups.find(lg => lg.lender_id === selectedLenderId)?.trips.length === 0 ? (
                    <div className="border rounded-lg p-6 text-center bg-muted/30">
                      <p className="text-sm text-muted-foreground">
                        No trips found for this lender
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="border rounded-lg p-3 max-h-64 overflow-y-auto bg-muted/30">
                        {lenderGroups
                          .find(lg => lg.lender_id === selectedLenderId)
                          ?.trips.map((trip) => (
                            <div
                              key={trip.id}
                              className={`flex items-start gap-3 p-3 rounded-md mb-2 cursor-pointer hover:bg-muted/50 ${
                                selectedTripIds.includes(trip.id) ? 'bg-primary/10 border border-primary' : 'bg-background border border-border'
                              }`}
                              onClick={() => handleToggleTripSelection(trip.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedTripIds.includes(trip.id)}
                                onChange={() => handleToggleTripSelection(trip.id)}
                                className="mt-1"
                              />
                              <div className="flex-1 text-sm">
                                <div className="font-medium">{trip.origin} → {trip.destination}</div>
                                <div className="text-muted-foreground">
                                  {trip.load_type} • {formatCurrency(trip.amount)} • {trip.distance} km
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Status: <span className="capitalize">{trip.status}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedTripIds.length} trip{selectedTripIds.length !== 1 ? 's' : ''} selected from {lenderGroups.find(lg => lg.lender_id === selectedLenderId)?.trips.length} trips
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="document">
                  Document <span className="text-destructive">*</span>
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    id="document"
                    accept=".pdf,.xlsx,.xls,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="document" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    {documentFile ? (
                      <div>
                        <p className="font-medium">{documentFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(documentFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium">Click to upload</p>
                        <p className="text-xs text-muted-foreground">PDF, Excel, or Image (Max 10MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (Optional)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={reconciliationAmount}
                    onChange={(e) => setReconciliationAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date (Optional)</Label>
                  <Input
                    id="date"
                    type="date"
                    value={reconciliationDate}
                    onChange={(e) => setReconciliationDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any notes or description about this reconciliation..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleUploadReconciliation} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Document Dialog */}
        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {viewingDoc?.document_name}
              </DialogTitle>
              <DialogDescription>
                {viewingDoc && `${(viewingDoc.document_size / 1024).toFixed(2)} KB • ${viewingDoc.document_type}`}
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-auto max-h-[70vh]">
              {viewingDoc && (
                <>
                  {viewingDoc.document_type === 'application/pdf' ? (
                    <iframe
                      src={viewingDoc.document_data}
                      className="w-full h-[70vh] border rounded"
                      title="Document Preview"
                    />
                  ) : (
                    <img
                      src={viewingDoc.document_data}
                      alt={viewingDoc.document_name}
                      className="w-full h-auto border rounded"
                    />
                  )}
                </>
              )}
            </div>

            <DialogFooter className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (viewingDoc) {
                      const link = document.createElement('a');
                      link.href = viewingDoc.document_data;
                      link.download = viewingDoc.document_name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
              <Button onClick={() => setViewingDoc(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Claim Dialog */}
        <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Claim</DialogTitle>
              <DialogDescription>
                Select the trip for which you want to claim payment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Reconciliation Details */}
              {selectedReconciliation && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Reconciliation Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Document:</span>
                      <span className="ml-2">{selectedReconciliation.document_name}</span>
                    </div>
                    {selectedReconciliation.reconciliation_amount && (
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="ml-2 font-semibold">
                          {formatCurrency(selectedReconciliation.reconciliation_amount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Trip Selection */}
              <div className="space-y-2">
                <Label htmlFor="trip-select">
                  Select Trip <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                  <SelectTrigger id="trip-select">
                    <SelectValue placeholder="Choose a completed trip" />
                  </SelectTrigger>
                  <SelectContent>
                    {claimTrips.length === 0 ? (
                      <SelectItem value="none" disabled>No completed trips with lender</SelectItem>
                    ) : (
                      claimTrips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.origin} → {trip.destination} ({formatCurrency(trip.amount)}) - Lender: {trip.lender_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only trips with assigned lenders are shown
                </p>
              </div>

              {/* Claim Breakdown */}
              {selectedTripId && selectedReconciliation?.reconciliation_amount && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium mb-3">Claim Breakdown</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-semibold">
                        {formatCurrency(selectedReconciliation.reconciliation_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Lender Share (70%):</span>
                      <span>{formatCurrency(selectedReconciliation.reconciliation_amount * 0.7)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Your Share (30%):</span>
                      <span>{formatCurrency(selectedReconciliation.reconciliation_amount * 0.3)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    The lender will be notified to approve your claim
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setClaimDialogOpen(false);
                  setSelectedTripId('');
                }}
                disabled={claiming}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitClaim}
                disabled={claiming || !selectedTripId}
                className="gap-2"
              >
                {claiming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="h-4 w-4" />
                    Submit Claim
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Reconciliation;
