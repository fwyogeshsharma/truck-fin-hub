import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { kycService } from '@/lib/kyc-service';
import { KYCData, KYCStatus } from '@/lib/kyc-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Clock, AlertCircle, FileText, Eye } from 'lucide-react';

const KYCAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [kycApplications, setKYCApplications] = useState<KYCData[]>([]);
  const [selectedKYC, setSelectedKYC] = useState<KYCData | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, inProgress: 0, resubmissionRequired: 0 });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/auth');
      return;
    }

    loadKYCApplications();
  }, [user, navigate]);

  const loadKYCApplications = () => {
    const allKYC = kycService.getAllKYCData();
    setKYCApplications(allKYC);
    setStats(kycService.getKYCStatistics());
  };

  const handleViewDetails = (kyc: KYCData) => {
    setSelectedKYC(kyc);
    setReviewDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedKYC) return;

    try {
      kycService.updateKYCStatus(selectedKYC.id, 'approved');
      toast({
        title: 'KYC Approved',
        description: `KYC application for ${selectedKYC.personalInfo?.fullName || selectedKYC.businessInfo?.entityName} has been approved`,
      });
      loadKYCApplications();
      setReviewDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve KYC',
      });
    }
  };

  const handleReject = () => {
    if (!selectedKYC || !rejectionReason) {
      toast({
        variant: 'destructive',
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection',
      });
      return;
    }

    try {
      kycService.updateKYCStatus(selectedKYC.id, 'rejected', rejectionReason);
      toast({
        title: 'KYC Rejected',
        description: `KYC application has been rejected`,
      });
      loadKYCApplications();
      setReviewDialogOpen(false);
      setRejectionReason('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject KYC',
      });
    }
  };

  const getStatusBadge = (status: KYCStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending_review':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'in_progress':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout role={user?.role}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">KYC Management</h1>
          <p className="text-muted-foreground mt-1">Review and approve KYC applications</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>KYC Applications</CardTitle>
            <CardDescription>Review and manage KYC verification requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kycApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No KYC applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  kycApplications.map((kyc) => (
                    <TableRow key={kyc.id}>
                      <TableCell className="font-medium">
                        {kyc.personalInfo?.fullName || kyc.businessInfo?.entityName || 'N/A'}
                      </TableCell>
                      <TableCell className="capitalize">{kyc.entityType}</TableCell>
                      <TableCell>
                        {kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString() : 'Not submitted'}
                      </TableCell>
                      <TableCell>{getStatusBadge(kyc.status)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(kyc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>KYC Application Review</DialogTitle>
              <DialogDescription>
                Review and approve or reject this KYC application
              </DialogDescription>
            </DialogHeader>

            {selectedKYC && (
              <div className="space-y-4">
                {/* Personal/Business Info */}
                <div className="p-4 border rounded-lg space-y-2">
                  <h3 className="font-semibold">
                    {selectedKYC.entityType === 'individual' ? 'Personal Information' : 'Business Information'}
                  </h3>
                  {selectedKYC.personalInfo && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p>{selectedKYC.personalInfo.fullName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p>{selectedKYC.personalInfo.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedKYC.businessInfo && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Entity Name:</span>
                        <p>{selectedKYC.businessInfo.entityName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">PAN:</span>
                        <p>{selectedKYC.businessInfo.panNumber}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Documents */}
                {selectedKYC.identityDocuments && (
                  <div className="p-4 border rounded-lg space-y-2">
                    <h3 className="font-semibold">Identity Documents</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">PAN:</span>
                        <p>{selectedKYC.identityDocuments.pan.documentNumber}</p>
                        <Badge variant="outline" className="mt-1">
                          {selectedKYC.identityDocuments.pan.verificationStatus}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Aadhaar:</span>
                        <p>{selectedKYC.identityDocuments.aadhaar.documentNumber}</p>
                        <Badge variant="outline" className="mt-1">
                          {selectedKYC.identityDocuments.aadhaar.verificationStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compliance Checks */}
                {selectedKYC.complianceChecks && (
                  <div className="p-4 border rounded-lg space-y-2">
                    <h3 className="font-semibold">Compliance Checks</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>PEP Screening:</span>
                        <Badge variant={selectedKYC.complianceChecks.pepScreening.isPEP ? 'destructive' : 'outline'}>
                          {selectedKYC.complianceChecks.pepScreening.isPEP ? 'PEP Detected' : 'Clear'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Sanction List:</span>
                        <Badge variant={selectedKYC.complianceChecks.sanctionScreening.onSanctionList ? 'destructive' : 'outline'}>
                          {selectedKYC.complianceChecks.sanctionScreening.onSanctionList ? 'On List' : 'Clear'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Fraud Check:</span>
                        <Badge variant={selectedKYC.complianceChecks.fraudCheck.duplicateDetected ? 'destructive' : 'outline'}>
                          {selectedKYC.complianceChecks.fraudCheck.duplicateDetected ? 'Duplicate' : 'Clear'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>AML Score:</span>
                        <span className="font-medium">{selectedKYC.complianceChecks.amlScore}/100</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedKYC.status === 'pending_review' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                    <Textarea
                      placeholder="Provide reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {selectedKYC?.status === 'pending_review' && (
                <>
                  <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                    Close
                  </Button>
                  <Button variant="destructive" onClick={handleReject}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default KYCAdmin;
