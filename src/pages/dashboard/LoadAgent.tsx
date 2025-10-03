import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { data } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LoadAgentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [refreshKey, setRefreshKey] = useState(0);

  // Filter trips by company
  const allTrips = data.getTrips().filter(trip => {
    if (!user?.company) return true;
    return trip.loadOwnerName === user.company;
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [documentViewDialogOpen, setDocumentViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ type: string; data: string } | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: 'Refreshed!',
      description: 'Trip list has been updated',
    });
  };

  const handleDocumentUpload = (tripId: string, docType: 'bilty' | 'ewaybill' | 'invoice', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const trip = data.getTrip(tripId);

      if (trip) {
        const updatedTrip = data.updateTrip(tripId, {
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

  const handleCreateTrip = (e: React.FormEvent) => {
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

    const trip = data.createTrip({
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
  };

  const handleViewTrip = (trip: any) => {
    setSelectedTrip(trip);
    setViewDialogOpen(true);
  };

  // Filter trips
  const filteredTrips = allTrips.filter((trip) => {
    const matchesSearch =
      trip.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.loadType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.loadOwnerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAllotTrip = (tripId: string, lenderId: string, lenderName: string) => {
    const result = data.allotTrip(tripId, lenderId, lenderName);

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

        {/* All Trips */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Trips in Portal</CardTitle>
                <CardDescription>View and search all trips across the platform</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Refresh
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search trips..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="escrowed">Escrowed</option>
                  <option value="funded">Funded</option>
                  <option value="in_transit">In Transit</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
              <DialogDescription>Add a new trip to the portal</DialogDescription>
            </DialogHeader>

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
