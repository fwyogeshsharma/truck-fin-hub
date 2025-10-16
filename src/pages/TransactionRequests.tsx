import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';

interface TransactionRequest {
  id: string;
  user_id: string;
  request_type: 'add_money' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  transaction_image_url?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_name?: string;
  transaction_id?: string;
  admin_notes?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_display_id?: string;
}

const TransactionRequestsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [requests, setRequests] = useState<TransactionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TransactionRequest | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState<'approved' | 'rejected' | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Security check - only super admin can access
  useEffect(() => {
    if (user?.role !== 'super_admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'This page is only accessible to Super Admins',
      });
      navigate('/');
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const statusParam = activeTab === 'all' ? '' : `?status=${activeTab}`;
      const response = await fetch(`/api/transaction-requests${statusParam}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load transaction requests',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProcessDialog = (request: TransactionRequest, action: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setProcessingAction(action);
    setProcessDialogOpen(true);
    setTransactionId('');
    setAdminNotes('');
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest || !processingAction) return;

    if (processingAction === 'approved' && selectedRequest.request_type === 'add_money' && !transactionId) {
      toast({
        variant: 'destructive',
        title: 'Transaction ID Required',
        description: 'Please enter the transaction ID for approval',
      });
      return;
    }

    try {
      const response = await fetch(`/api/transaction-requests/${selectedRequest.id}/process`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: processingAction,
          processed_by: user?.id,
          transaction_id: transactionId || undefined,
          admin_notes: adminNotes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to process request');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Transaction request ${processingAction} successfully`,
      });

      setProcessDialogOpen(false);
      setSelectedRequest(null);
      setProcessingAction(null);
      fetchRequests();
    } catch (error: any) {
      console.error('Error processing request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to process transaction request',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'add_money' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <ArrowUpCircle className="h-3 w-3 mr-1" />
        Add Money
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        <ArrowDownCircle className="h-3 w-3 mr-1" />
        Withdrawal
      </Badge>
    );
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <DashboardLayout role={user?.role || 'super_admin'}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Transaction Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage and verify all add money and withdrawal requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Requests</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground mt-1">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-sm text-muted-foreground mt-1">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground mt-1">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Requests</CardTitle>
            <CardDescription>View and process all transaction requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full md:w-[500px] grid-cols-4">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading requests...</p>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No requests found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.user_name}</p>
                              <p className="text-xs text-muted-foreground">{request.user_email}</p>
                              <p className="text-xs text-muted-foreground">ID: {request.user_display_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(request.request_type)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(request.amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {new Date(request.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {request.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleOpenProcessDialog(request, 'approved')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleOpenProcessDialog(request, 'rejected')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Request Details</DialogTitle>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">User</Label>
                    <p className="font-semibold">{selectedRequest.user_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.user_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">User ID</Label>
                    <p className="font-semibold font-mono">{selectedRequest.user_display_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Type</Label>
                    <div className="mt-1">{getTypeBadge(selectedRequest.request_type)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Amount</Label>
                    <p className="text-xl font-bold">{formatCurrency(selectedRequest.amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Date</Label>
                    <p className="font-semibold">
                      {new Date(selectedRequest.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {selectedRequest.request_type === 'add_money' && selectedRequest.transaction_image_url && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Transaction Proof</Label>
                    <img
                      src={selectedRequest.transaction_image_url}
                      alt="Transaction proof"
                      className="mt-2 w-full h-auto rounded-lg border"
                    />
                  </div>
                )}

                {selectedRequest.request_type === 'withdrawal' && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Bank Details</Label>
                    <Card className="mt-2">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Bank Name</p>
                            <p className="font-semibold">{selectedRequest.bank_name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Account Number</p>
                            <p className="font-semibold font-mono">{selectedRequest.bank_account_number}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">IFSC Code</p>
                            <p className="font-semibold font-mono">{selectedRequest.bank_ifsc_code}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {selectedRequest.transaction_id && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Transaction ID</Label>
                    <p className="font-semibold font-mono">{selectedRequest.transaction_id}</p>
                  </div>
                )}

                {selectedRequest.admin_notes && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Admin Notes</Label>
                    <p className="text-sm">{selectedRequest.admin_notes}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Process Dialog */}
        <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {processingAction === 'approved' ? 'Approve' : 'Reject'} Transaction Request
              </DialogTitle>
              <DialogDescription>
                {processingAction === 'approved'
                  ? 'Confirm the details and approve this request'
                  : 'Provide a reason for rejecting this request'}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-semibold">{selectedRequest.user_name}</p>
                  <p className="text-sm text-muted-foreground mt-2">Amount</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedRequest.amount)}</p>
                </div>

                {processingAction === 'approved' && selectedRequest.request_type === 'add_money' && (
                  <div>
                    <Label htmlFor="transactionId">Transaction ID *</Label>
                    <Input
                      id="transactionId"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter bank transaction ID"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the transaction ID from your bank statement
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="adminNotes">Notes (Optional)</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes or comments..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleProcessRequest}
                className={processingAction === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                variant={processingAction === 'rejected' ? 'destructive' : 'default'}
              >
                {processingAction === 'approved' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Request
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Request
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

export default TransactionRequestsPage;
