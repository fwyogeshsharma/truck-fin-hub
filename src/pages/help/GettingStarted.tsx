import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, UserPlus, LogIn, TruckIcon, Wallet, FileText, Shield, CheckCircle2, Info } from "lucide-react";
import Footer from "@/components/Footer";

const GettingStarted = () => {
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
              <h1 className="text-2xl font-bold">Getting Started with LogiFin</h1>
              <p className="text-sm text-muted-foreground">Your complete guide to begin using the platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-6 w-6 text-primary" />
              Welcome to LogiFin
            </CardTitle>
            <CardDescription>
              LogiFin is a comprehensive logistics financing platform connecting transporters, lenders, and load owners
              for seamless trip financing and investment opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <TruckIcon className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold mb-1">Transporters</h3>
                <p className="text-sm text-muted-foreground">Get financing for trips and manage repayments</p>
              </div>
              <div className="p-4 border rounded-lg">
                <Wallet className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold mb-1">Lenders</h3>
                <p className="text-sm text-muted-foreground">Invest in trips and earn returns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Start in 5 Steps</CardTitle>
            <CardDescription>Follow these steps to get started on LogiFin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Create Your Account
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Visit the registration page and fill in your details including name, email, phone number, password,
                    company name, and select your role (Transporter/Lender).
                  </p>
                  <Button size="sm" onClick={() => navigate('/auth')}>Go to Registration</Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Wait for Approval
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your account will be pending approval. An admin will review and approve your account within 1-2 business days.
                    You'll receive a notification once approved.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Login to Your Dashboard
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Once approved, login with your credentials. You'll be directed to your role-specific dashboard
                    where you can access all features.
                  </p>
                  <Button size="sm" onClick={() => navigate('/auth')}>Go to Login</Button>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Complete Your Profile & KYC
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Complete your profile information and submit KYC documents for verification. This helps build trust
                    and enables full access to platform features. Lenders will also complete a financial questionnaire.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <TruckIcon className="h-5 w-5" />
                    Start Using the Platform
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You're all set! Transporters can create trips and manage financing, while Lenders can browse investment opportunities and fund trips.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-Specific Guides */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Role-Specific Quick Guides</CardTitle>
            <CardDescription>Detailed instructions based on your role</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">

              {/* Transporter Guide */}
              <AccordionItem value="transporter">
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center gap-2">
                    <TruckIcon className="h-5 w-5 text-blue-600" />
                    Transporter Guide
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-semibold mb-2">Creating a Trip Financing Request</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Click "Create Trip" from your dashboard</li>
                      <li>Fill in trip details: Origin, Destination, Load Type, Weight, Distance</li>
                      <li>Enter Requested Amount, Expected Interest Rate, and Maturity Days</li>
                      <li>Submit - Your trip will be visible to lenders for bidding</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Managing Loan Repayment</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Go to "Pending Repayments" tab on your dashboard</li>
                      <li>View repayment details: Principal, Interest, Total, Days to maturity</li>
                      <li>Click "Repay Loan" and confirm payment</li>
                      <li>Rate your lender after successful repayment</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Trip Status Flow</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li><strong>Pending:</strong> Awaiting lender bids</li>
                      <li><strong>Funded:</strong> Lender approved, money escrowed</li>
                      <li><strong>In Transit:</strong> Transporter is delivering</li>
                      <li><strong>Completed:</strong> Delivery completed, awaiting repayment</li>
                      <li><strong>Repaid:</strong> Loan fully repaid</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Lender Guide */}
              <AccordionItem value="lender">
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    Lender Guide
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-semibold mb-2">Financial Questionnaire (First-Time)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      On first login, complete your financial profile including Annual Income, Investable Surplus,
                      Investment Experience, Risk Appetite, Investment Horizon, and Maximum Investment Per Deal.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Making an Investment</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Navigate to "Investment Opportunities"</li>
                      <li>Browse available trips and review details</li>
                      <li>Click on a trip to see full information including borrower details</li>
                      <li>Enter your investment amount and interest rate</li>
                      <li>Review expected returns and submit your bid</li>
                      <li>Wait for borrower approval - your funds will be escrowed</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Investment Status</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li><strong>Escrowed (Pending Bids):</strong> Funds locked, awaiting borrower's allotment decision</li>
                      <li><strong>Active Investments:</strong> Borrower confirmed, trip in progress, track documents</li>
                      <li><strong>Completed:</strong> Trip repaid, returns credited to wallet</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Returns Calculation</h4>
                    <p className="text-sm text-muted-foreground">
                      Expected Return = Investment Amount × (Interest Rate / 365) × Maturity Days / 100
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </CardContent>
        </Card>

        {/* Common Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Common Features for All Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <Wallet className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold mb-2">Wallet Management</h3>
                <p className="text-sm text-muted-foreground">
                  All users have wallets to view balance, see locked/escrowed amounts, add funds, and track transaction history.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <Shield className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold mb-2">Security Features</h3>
                <p className="text-sm text-muted-foreground">
                  Use strong passwords, enable two-factor authentication, complete KYC verification, and keep your profile updated.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TruckIcon className="h-5 w-5 text-blue-600" />
                  For Transporters
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    Request realistic financing amounts
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    Repay on time to build good credit
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    Provide accurate trip information
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    Upload documents promptly
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    Maintain sufficient wallet balance
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  For Lenders
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    Diversify across multiple transporters
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    Review transporter history before investing
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    Set competitive interest rates
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    Monitor document uploads
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Need More Help */}
        <Card>
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto py-4 justify-start" onClick={() => navigate('/help/user-manual')}>
                <div className="text-left">
                  <div className="font-semibold flex items-center gap-2 mb-1">
                    <FileText className="h-5 w-5" />
                    User Manual
                  </div>
                  <div className="text-sm text-muted-foreground">Comprehensive guide to all features</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-4 justify-start" onClick={() => navigate('/help/faq')}>
                <div className="text-left">
                  <div className="font-semibold flex items-center gap-2 mb-1">
                    <Info className="h-5 w-5" />
                    FAQs
                  </div>
                  <div className="text-sm text-muted-foreground">Frequently asked questions</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      <Footer />
    </div>
  );
};

export default GettingStarted;
