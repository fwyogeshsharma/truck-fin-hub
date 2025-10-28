import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, User, TruckIcon, IndianRupee, Clock, Phone, Building } from "lucide-react";
import { auth } from "@/lib/auth";
import { data, Trip } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency } from "@/lib/currency";

interface DefaulterTrip extends Trip {
  daysOverdue: number;
  maturityDate: Date;
  totalAmountDue: number;
  interestAmount: number;
  borrowerEmail?: string;
  borrowerPhone?: string;
  borrowerCompany?: string;
}

/**
 * Defaulters Page
 *
 * Shows all loans that have crossed their maturity date and haven't been repaid.
 * Available only for Super Admin to monitor and manage defaulting borrowers.
 */
const Defaulters = () => {
  const user = auth.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [defaulters, setDefaulters] = useState<DefaulterTrip[]>([]);

  useEffect(() => {
    const loadDefaulters = async () => {
      try {
        const trips = await data.getTrips();
        const today = new Date();

        // Filter trips that are completed but not repaid and have crossed maturity
        const defaulterTripsPromises = trips
          .filter(trip => {
            // Only consider trips that are funded/completed but not repaid
            if (trip.status !== 'completed' && trip.status !== 'funded' && trip.status !== 'in_transit') {
              return false;
            }

            // Must have a funded date and maturity days
            if (!trip.fundedAt || !trip.maturityDays) {
              return false;
            }

            // Calculate maturity date
            const fundedDate = new Date(trip.fundedAt);
            const maturityDate = new Date(fundedDate);
            maturityDate.setDate(fundedDate.getDate() + trip.maturityDays);

            // Check if past maturity
            return today > maturityDate;
          })
          .map(async (trip) => {
            const fundedDate = new Date(trip.fundedAt!);
            const maturityDate = new Date(fundedDate);
            maturityDate.setDate(fundedDate.getDate() + trip.maturityDays!);

            // Calculate days overdue
            const daysOverdue = Math.floor((today.getTime() - maturityDate.getTime()) / (1000 * 60 * 60 * 24));

            // Calculate interest and total amount due
            const principal = trip.amount;
            const interestRate = trip.interestRate || 0;
            const maturityDays = trip.maturityDays || 30;
            const interestAmount = (principal * (interestRate / 365) * maturityDays) / 100;
            const totalAmountDue = principal + interestAmount;

            // Get borrower details asynchronously
            const borrower = await auth.getUserById(trip.loadOwnerId);

            return {
              ...trip,
              daysOverdue,
              maturityDate,
              totalAmountDue,
              interestAmount,
              borrowerEmail: borrower?.email,
              borrowerPhone: borrower?.phone,
              borrowerCompany: borrower?.company,
            };
          });

        const defaulterTrips = await Promise.all(defaulterTripsPromises);
        const sortedDefaulters = defaulterTrips.sort((a, b) => b.daysOverdue - a.daysOverdue); // Sort by most overdue first

        setDefaulters(sortedDefaulters);
      } catch (error) {
        console.error('Failed to load defaulters:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDefaulters();
  }, []);

  // Calculate summary statistics
  const totalDefaultedAmount = defaulters.reduce((sum, trip) => sum + trip.totalAmountDue, 0);
  const totalPrincipal = defaulters.reduce((sum, trip) => sum + trip.amount, 0);
  const totalInterest = defaulters.reduce((sum, trip) => sum + trip.interestAmount, 0);
  const avgDaysOverdue = defaulters.length > 0
    ? Math.floor(defaulters.reduce((sum, trip) => sum + trip.daysOverdue, 0) / defaulters.length)
    : 0;

  // Get severity badge color based on days overdue
  const getSeverityBadge = (daysOverdue: number) => {
    if (daysOverdue <= 7) {
      return <Badge className="bg-orange-500">Recently Overdue</Badge>;
    } else if (daysOverdue <= 30) {
      return <Badge className="bg-red-500">Overdue</Badge>;
    } else {
      return <Badge className="bg-red-700">Severely Overdue</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="super_admin">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading defaulters...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            Loan Defaulters
          </h1>
          <p className="text-muted-foreground mt-1">
            Borrowers who have crossed maturity date and haven't repaid their loans
          </p>
        </div>

        {/* Summary Statistics */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>Total Defaulters</span>
                </div>
                <p className="text-3xl font-bold text-red-600">{defaulters.length}</p>
                <p className="text-xs text-muted-foreground">Active defaulting loans</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IndianRupee className="h-4 w-4 text-orange-600" />
                  <span>Total Amount Due</span>
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(totalDefaultedAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Principal: {formatCurrency(totalPrincipal)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IndianRupee className="h-4 w-4 text-red-600" />
                  <span>Interest Pending</span>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(totalInterest)}
                </p>
                <p className="text-xs text-muted-foreground">Accumulated interest</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gray-50/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span>Avg Days Overdue</span>
                </div>
                <p className="text-3xl font-bold text-gray-600">{avgDaysOverdue}</p>
                <p className="text-xs text-muted-foreground">Average delay</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Defaulters List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Defaulting Loans
            </CardTitle>
            <CardDescription>
              Detailed list of all loans that have crossed their maturity date
            </CardDescription>
          </CardHeader>
          <CardContent>
            {defaulters.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-16 w-16 text-green-500 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">No Defaulters Found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  All loans are being repaid on time! 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {defaulters.map((trip) => (
                  <Card key={trip.id} className="border-red-200 bg-red-50/20">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header with severity badge */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                <TruckIcon className="h-5 w-5 text-red-600" />
                                {trip.origin} → {trip.destination}
                              </h3>
                              {getSeverityBadge(trip.daysOverdue)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Trip ID: {trip.id} • {trip.loadType}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-600">
                              {formatCurrency(trip.totalAmountDue)}
                            </p>
                            <p className="text-xs text-muted-foreground">Amount Due</p>
                          </div>
                        </div>

                        {/* Borrower Information */}
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Borrower Details
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Name</p>
                              <p className="font-medium">{trip.loadOwnerName}</p>
                            </div>
                            {trip.borrowerCompany && (
                              <div>
                                <p className="text-sm text-muted-foreground">Company</p>
                                <p className="font-medium flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {trip.borrowerCompany}
                                </p>
                              </div>
                            )}
                            {trip.borrowerEmail && (
                              <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{trip.borrowerEmail}</p>
                              </div>
                            )}
                            {trip.borrowerPhone && (
                              <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {trip.borrowerPhone}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Loan Details */}
                        <div className="grid md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Principal</p>
                            <p className="font-semibold">{formatCurrency(trip.amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Interest Rate</p>
                            <p className="font-semibold">{trip.interestRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Interest Due</p>
                            <p className="font-semibold text-orange-600">
                              {formatCurrency(trip.interestAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Maturity Date</p>
                            <p className="font-semibold flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {trip.maturityDate.toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Days Overdue</p>
                            <p className="font-semibold text-red-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {trip.daysOverdue} days
                            </p>
                          </div>
                        </div>

                        {/* Lender Information */}
                        {trip.lenderName && (
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200">
                            <p className="text-xs text-muted-foreground">Lender</p>
                            <p className="font-medium">{trip.lenderName}</p>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>
                            Funded: {trip.fundedAt ? new Date(trip.fundedAt).toLocaleDateString() : 'N/A'}
                          </p>
                          {trip.completedAt && (
                            <p>
                              Completed: {new Date(trip.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Defaulters;
