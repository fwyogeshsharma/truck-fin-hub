import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TruckIcon, Wallet, UserCircle, FileText, Shield, Mail, Phone, BookOpen, Star, IndianRupee } from "lucide-react";
import Footer from "@/components/Footer";

const UserManual = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">LogiFin User Manual</h1>
              <p className="text-sm text-muted-foreground">Complete guide to all platform features</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <Tabs defaultValue="transporter" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transporter">Transporter</TabsTrigger>
            <TabsTrigger value="lender">Lender</TabsTrigger>
            <TabsTrigger value="common">Common Features</TabsTrigger>
          </TabsList>

          {/* TRANSPORTER TAB */}
          <TabsContent value="transporter" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                  Transporter Guide
                </CardTitle>
                <CardDescription>
                  Complete guide for transporters who need financing for their transportation business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">

                  {/* Dashboard Overview */}
                  <AccordionItem value="dashboard">
                    <AccordionTrigger>Dashboard Overview</AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <p>Your dashboard displays:</p>
                      <ul className="list-disc list-inside space-y-2">
                        <li><strong>Active Trips:</strong> Currently funded trips</li>
                        <li><strong>Total Financed:</strong> Total amount you've borrowed</li>
                        <li><strong>Pending Requests:</strong> Trips awaiting funding</li>
                        <li><strong>Wallet Balance:</strong> Available funds and locked amounts</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Creating Trip */}
                  <AccordionItem value="create-trip">
                    <AccordionTrigger>Creating a Trip Financing Request</AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <ol className="list-decimal list-inside space-y-3">
                        <li><strong>Click "Create Trip"</strong> from your dashboard</li>
                        <li><strong>Fill Trip Details:</strong>
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>Origin and Destination</li>
                            <li>Load Type (e.g., Electronics, Perishables, Construction Materials)</li>
                            <li>Weight (in kg)</li>
                            <li>Distance (in km)</li>
                            <li>Requested Amount</li>
                            <li>Expected Interest Rate</li>
                            <li>Maturity Days (loan duration)</li>
                          </ul>
                        </li>
                        <li><strong>Submit:</strong> Trip will be visible to lenders for bidding</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Trip Status */}
                  <AccordionItem value="trip-status">
                    <AccordionTrigger>Understanding Trip Status</AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <ul className="space-y-3">
                        <li><strong className="text-yellow-600">Pending:</strong> Awaiting lender bids</li>
                        <li><strong className="text-blue-600">Funded:</strong> Lender approved, money escrowed</li>
                        <li><strong className="text-purple-600">In Transit:</strong> Transporter is delivering</li>
                        <li><strong className="text-green-600">Completed:</strong> Delivery completed, awaiting repayment</li>
                        <li><strong className="text-green-700">Repaid:</strong> Loan fully repaid</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Loan Repayment */}
                  <AccordionItem value="repayment">
                    <AccordionTrigger>Loan Repayment Process</AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <ol className="list-decimal list-inside space-y-3">
                        <li>Go to <strong>"Pending Repayments"</strong> tab on your dashboard</li>
                        <li><strong>View Repayment Details:</strong>
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>Principal amount</li>
                            <li>Interest amount</li>
                            <li>Total repayment</li>
                            <li>Days to maturity</li>
                            <li>Overdue status (if applicable)</li>
                          </ul>
                        </li>
                        <li>Click <strong>"Repay Loan"</strong> button</li>
                        <li>Confirm payment from your wallet</li>
                        <li><strong>Rate Your Lender:</strong> After repayment, provide a 5-star rating and optional review</li>
                      </ol>
                      <p className="mt-4"><strong>Interest Calculation:</strong></p>
                      <p className="bg-muted p-3 rounded">Interest = (Principal × Interest Rate × Maturity Days) / (365 × 100)</p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Rating System */}
                  <AccordionItem value="rating">
                    <AccordionTrigger>Rating Your Lender</AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <p>After successful repayment, you can rate your lender:</p>
                      <ul className="space-y-2">
                        <li>⭐ <strong>1 Star - Poor:</strong> Not satisfied with the experience</li>
                        <li>⭐⭐ <strong>2 Stars - Fair:</strong> Below expectations</li>
                        <li>⭐⭐⭐ <strong>3 Stars - Good:</strong> Met expectations</li>
                        <li>⭐⭐⭐⭐ <strong>4 Stars - Very Good:</strong> Exceeded expectations</li>
                        <li>⭐⭐⭐⭐⭐ <strong>5 Stars - Excellent:</strong> Outstanding experience</li>
                      </ul>
                      <p className="mt-4">You can also write an optional review to share your experience.</p>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LENDER TAB */}
          <TabsContent value="lender" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-6 w-6 text-green-600" />
                  Lender Guide
                </CardTitle>
                <CardDescription>
                  Complete guide for lenders who want to invest in trips and earn returns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">

                  {/* Dashboard */}
                  <AccordionItem value="dashboard">
                    <AccordionTrigger>Dashboard Overview</AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <p>Your lender dashboard displays:</p>
                      <ul className="list-disc list-inside space-y-2">
                        <li><strong>Total Invested:</strong> Amount currently invested</li>
                        <li><strong>Escrowed Amount:</strong> Bids awaiting borrower confirmation</li>
                        <li><strong>Active Investments:</strong> Confirmed investments in progress</li>
                        <li><strong>Total Returns:</strong> Interest earned from completed investments</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Financial Questionnaire */}
                  <AccordionItem value="questionnaire">
                    <AccordionTrigger>Financial Questionnaire (First-Time Users)</AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <p>On your first login, you'll complete a financial profile questionnaire:</p>
                      <ul className="list-disc list-inside space-y-2">
                        <li><strong>Annual Income:</strong> Your yearly income</li>
                        <li><strong>Investable Surplus:</strong> Amount available for investment</li>
                        <li><strong>Investment Experience:</strong> Your experience level (Beginner/Intermediate/Expert)</li>
                        <li><strong>Risk Appetite:</strong> Conservative, Moderate, or Aggressive</li>
                        <li><strong>Investment Horizon:</strong> Short-term (0-1 year), Medium-term (1-3 years), or Long-term (3+ years)</li>
                        <li><strong>Maximum Investment Per Deal:</strong> Your upper limit per trip</li>
                      </ul>
                      <p className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                        This helps the platform recommend suitable investment opportunities tailored to your profile.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Finding Opportunities */}
                  <AccordionItem value="opportunities">
                    <AccordionTrigger>Finding Investment Opportunities</AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <ol className="list-decimal list-inside space-y-3">
                        <li>Navigate to <strong>"Investment Opportunities"</strong> page</li>
                        <li>Browse available trips with details including:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>Trip route (Origin → Destination)</li>
                            <li>Load type and weight</li>
                            <li>Distance</li>
                            <li>Borrower company information</li>
                            <li>Loan terms (amount, maturity days)</li>
                            <li>Recommended interest rates</li>
                          </ul>
                        </li>
                        <li>Use filters to find trips matching your criteria</li>
                        <li>Click on trips to view detailed company information for both Load Owner and Borrower</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Making Investment */}
                  <AccordionItem value="invest">
                    <AccordionTrigger>Making an Investment</AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <ol className="list-decimal list-inside space-y-3">
                        <li>Select a trip you want to invest in</li>
                        <li>Review all trip and borrower details carefully</li>
                        <li>Click <strong>"Invest"</strong> or <strong>"Bid Now"</strong></li>
                        <li>Enter your investment details:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>Investment amount (must be from your wallet balance)</li>
                            <li>Interest rate (you can offer your own rate)</li>
                          </ul>
                        </li>
                        <li>Review expected returns calculation</li>
                        <li>Submit your bid</li>
                        <li>Your funds will be escrowed while awaiting borrower's approval</li>
                      </ol>
                      <p className="mt-4 bg-muted p-3 rounded">
                        <strong>Expected Return Formula:</strong><br/>
                        Return = Investment Amount × (Interest Rate / 365) × Maturity Days / 100
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Investment Status */}
                  <AccordionItem value="status">
                    <AccordionTrigger>Investment Status & Tracking</AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Escrowed (Pending Bids)</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Your funds are locked and reserved</li>
                            <li>Awaiting borrower's allotment decision</li>
                            <li>Shown in "Pending Bids" section</li>
                            <li>You can withdraw bid if borrower hasn't confirmed yet</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Active Investments</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Borrower has confirmed your investment</li>
                            <li>Trip is in progress</li>
                            <li>You can view document upload progress</li>
                            <li>Track maturity countdown</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Completed Investments</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Trip completed and loan repaid</li>
                            <li>Returns (principal + interest) credited to your wallet</li>
                            <li>Visible in investment history</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Document Tracking */}
                  <AccordionItem value="documents">
                    <AccordionTrigger>Viewing & Tracking Documents</AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <p>For active investments, you can track document uploads:</p>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Go to "My Active Investments" section</li>
                        <li>Click <strong>"View Documents"</strong> on an investment</li>
                        <li>Track progress of document uploads:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li><strong>E-Way Bill:</strong> Electronic waybill for goods transport</li>
                            <li><strong>Bilty:</strong> Consignment note/lorry receipt</li>
                            <li><strong>Advance Invoice:</strong> Initial invoice</li>
                            <li><strong>POD (Proof of Delivery):</strong> Delivery confirmation</li>
                            <li><strong>Final Invoice:</strong> Final billing document</li>
                            <li><strong>RC Copy:</strong> Vehicle registration certificate</li>
                          </ul>
                        </li>
                        <li>Click <strong>"View"</strong> to open documents in a dialog</li>
                        <li>Click <strong>"Download"</strong> to save documents locally</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>


          {/* COMMON FEATURES TAB */}
          <TabsContent value="common" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Common Features for All Users</CardTitle>
                <CardDescription>
                  Features available to all platform users regardless of role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">

                  {/* Wallet */}
                  <AccordionItem value="wallet">
                    <AccordionTrigger className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Wallet Management
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <p>All users have a wallet to manage funds:</p>
                      <ul className="space-y-2 list-disc list-inside">
                        <li><strong>Available Balance:</strong> Money you can use for transactions</li>
                        <li><strong>Locked Amount:</strong> Funds temporarily reserved (e.g., escrowed bids)</li>
                        <li><strong>Add Money:</strong> Click "Add Money" button to deposit funds</li>
                        <li><strong>Withdraw:</strong> Transfer funds to your linked bank account</li>
                        <li><strong>Transaction History:</strong> View all deposits, investments, repayments, and withdrawals</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Profile */}
                  <AccordionItem value="profile">
                    <AccordionTrigger className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5" />
                      Profile Management
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <p>Manage your profile and account settings:</p>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Click on your profile icon/name</li>
                        <li>Navigate to Profile page</li>
                        <li>Update information:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>Personal details (name, email, phone)</li>
                            <li>Company information</li>
                            <li>Profile picture</li>
                          </ul>
                        </li>
                        <li>Security settings:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>Change password</li>
                            <li>Enable two-factor authentication</li>
                            <li>Manage login sessions</li>
                          </ul>
                        </li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  {/* KYC */}
                  <AccordionItem value="kyc">
                    <AccordionTrigger className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      KYC Verification
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <p>Complete KYC verification to access full platform features:</p>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Navigate to KYC page from your dashboard</li>
                        <li>Upload required documents:
                          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>Aadhaar Card</li>
                            <li>PAN Card</li>
                            <li>Business registration documents</li>
                            <li>Bank account proof</li>
                            <li>GST certificate (if applicable)</li>
                          </ul>
                        </li>
                        <li>Submit for admin review</li>
                        <li>Wait for approval (typically 1-3 business days)</li>
                        <li>Receive notification once verified</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Security */}
                  <AccordionItem value="security">
                    <AccordionTrigger className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security & Privacy
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-muted-foreground">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Security Best Practices</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Never share your password with anyone</li>
                            <li>Use a unique, strong password (mix of letters, numbers, symbols)</li>
                            <li>Enable two-factor authentication</li>
                            <li>Log out from shared or public devices</li>
                            <li>Verify all transaction details before confirming</li>
                            <li>Report suspicious activity immediately</li>
                            <li>Keep your contact information current</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Privacy</h4>
                          <p>Your data is protected and never shared with third parties without consent. Review our Privacy Policy for details.</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Support Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact Support
                </h3>
                <p className="text-sm text-muted-foreground">Email: support@rollingradius.com</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +91 90248-22434
                </p>
                <p className="text-xs text-muted-foreground">
                  Support Hours: Mon-Fri 9:00 AM - 6:00 PM IST, Sat 10:00 AM - 4:00 PM IST
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Additional Resources
                </h3>
                <div className="space-y-2">
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/help/getting-started')}>
                    Getting Started Guide
                  </Button>
                  <br/>
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/help/faq')}>
                    Frequently Asked Questions
                  </Button>
                  <br/>
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/terms')}>
                    Terms & Conditions
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <Footer />
    </div>
  );
};

export default UserManual;
