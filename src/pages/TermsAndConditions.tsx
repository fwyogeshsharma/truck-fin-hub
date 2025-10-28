import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Shield, AlertCircle, Info } from "lucide-react";
import Footer from "@/components/Footer";

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              <h1 className="text-2xl font-bold">Terms and Conditions</h1>
              <p className="text-sm text-muted-foreground">Last updated: October 28, 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              Welcome to LogiFin. By accessing and using our platform, you agree to be bound by these Terms and Conditions.
              Please read them carefully before using our services.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">

          {/* 1. Acceptance of Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                By registering for, accessing, or using LogiFin services, you acknowledge that you have read, understood,
                and agree to be bound by these Terms and Conditions, as well as our Privacy Policy and Cookie Policy.
              </p>
              <p>
                If you do not agree with any part of these terms, you must not use our platform.
              </p>
            </CardContent>
          </Card>

          {/* 2. User Eligibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. User Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>To use LogiFin, you must:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </CardContent>
          </Card>

          {/* 3. User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. User Accounts and Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>LogiFin offers different user roles:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Load Owners:</strong> Entities seeking financing for transportation needs</li>
                <li><strong>Lenders:</strong> Individuals or entities providing financing to load owners</li>
                <li><strong>Transporters:</strong> Service providers who accept and complete trips</li>
              </ul>
              <p className="mt-4">You are responsible for:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Ensuring all information provided is accurate and up-to-date</li>
              </ul>
            </CardContent>
          </Card>

          {/* 4. Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">4. Platform Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>LogiFin provides a platform that:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Connects load owners with lenders for trip financing</li>
                <li>Facilitates investment opportunities in logistics financing</li>
                <li>Enables transporters to accept and complete trips</li>
                <li>Processes payments and manages escrow accounts</li>
                <li>Provides document management and verification services</li>
              </ul>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded mt-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  <strong>Important:</strong> LogiFin acts as a facilitator and is not a party to the financial transactions
                  between users. We do not guarantee the performance or creditworthiness of any user.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 5. Financial Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">5. Financial Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <h4 className="font-semibold text-foreground">5.1 Wallet and Payments</h4>
              <ul className="list-disc list-inside space-y-2">
                <li>All transactions must be conducted through the platform wallet</li>
                <li>You must maintain sufficient balance for transactions</li>
                <li>Funds may be locked or escrowed during pending transactions</li>
                <li>Platform fees apply to certain transactions as disclosed</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">5.2 Loans and Investments</h4>
              <ul className="list-disc list-inside space-y-2">
                <li>Interest rates and terms are agreed upon between lenders and borrowers</li>
                <li>Loan repayment is the sole responsibility of the borrower</li>
                <li>Lenders assume the risk of non-repayment</li>
                <li>All parties must honor their financial commitments</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">5.3 Escrow Services</h4>
              <ul className="list-disc list-inside space-y-2">
                <li>Funds are held in escrow until transaction conditions are met</li>
                <li>Escrow release is subject to platform verification</li>
                <li>Disputed transactions may result in temporary fund holds</li>
              </ul>
            </CardContent>
          </Card>

          {/* 6. User Obligations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">6. User Obligations and Conduct</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>Users agree to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide accurate and truthful information</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not engage in fraudulent or deceptive practices</li>
                <li>Honor all financial commitments made on the platform</li>
                <li>Upload genuine and authentic documents</li>
                <li>Respect the rights and privacy of other users</li>
                <li>Not use the platform for illegal activities</li>
                <li>Not attempt to manipulate or abuse platform features</li>
              </ul>
            </CardContent>
          </Card>

          {/* 7. KYC and Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">7. KYC and Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                All users must complete Know Your Customer (KYC) verification as required by applicable laws and regulations.
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li>You must submit valid identification and business documents</li>
                <li>We reserve the right to verify all submitted information</li>
                <li>Failure to complete KYC may result in restricted platform access</li>
                <li>We may request additional verification at any time</li>
                <li>Fraudulent documents will result in immediate account termination</li>
              </ul>
            </CardContent>
          </Card>

          {/* 8. Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">8. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                All content, features, and functionality on LogiFin, including but not limited to text, graphics, logos,
                software, and design, are owned by LogiFin or its licensors and are protected by intellectual property laws.
              </p>
              <p className="mt-3">You may not:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Copy, modify, or distribute our content without permission</li>
                <li>Use our trademarks or branding without authorization</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Create derivative works based on our platform</li>
              </ul>
            </CardContent>
          </Card>

          {/* 9. Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">9. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm space-y-2">
                  <p>
                    <strong>To the maximum extent permitted by law:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>LogiFin is not liable for any losses arising from user transactions</li>
                    <li>We do not guarantee uninterrupted or error-free service</li>
                    <li>We are not responsible for third-party actions or failures</li>
                    <li>Users assume all risks associated with their use of the platform</li>
                    <li>Our total liability shall not exceed the fees paid by you in the past 12 months</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 10. Indemnification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">10. Indemnification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                You agree to indemnify and hold harmless LogiFin, its affiliates, officers, directors, employees, and agents
                from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li>Your use or misuse of the platform</li>
                <li>Your violation of these Terms and Conditions</li>
                <li>Your violation of any laws or regulations</li>
                <li>Your violation of any rights of third parties</li>
                <li>Any fraudulent or deceptive conduct</li>
              </ul>
            </CardContent>
          </Card>

          {/* 11. Termination */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">11. Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>We may suspend or terminate your account immediately if you:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Violate these Terms and Conditions</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Fail to honor financial commitments</li>
                <li>Provide false or misleading information</li>
                <li>Abuse or manipulate platform features</li>
              </ul>
              <p className="mt-4">
                Upon termination, you must settle all outstanding obligations. We reserve the right to withhold funds
                pending resolution of any disputes.
              </p>
            </CardContent>
          </Card>

          {/* 12. Dispute Resolution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">12. Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                In case of disputes between users, LogiFin may assist in mediation but is not obligated to resolve disputes.
              </p>
              <p className="mt-3">
                Any disputes arising from these terms shall be governed by the laws of India and subject to the exclusive
                jurisdiction of courts in Jaipur, Rajasthan.
              </p>
            </CardContent>
          </Card>

          {/* 13. Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">13. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately
                upon posting on the platform. Your continued use of the platform constitutes acceptance of the modified terms.
              </p>
              <p className="mt-3">
                We will notify users of significant changes via email or platform notifications.
              </p>
            </CardContent>
          </Card>

          {/* 14. Privacy and Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">14. Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and
                protect your personal information.
              </p>
              <p className="mt-3">
                By using LogiFin, you consent to our collection and use of information as described in the Privacy Policy.
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => navigate('/privacy-policy')}
              >
                Read our Privacy Policy →
              </Button>
            </CardContent>
          </Card>

          {/* 15. Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">15. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                For questions or concerns regarding these Terms and Conditions, please contact us:
              </p>
              <div className="mt-4 space-y-2">
                <p><strong>Email:</strong> support@rollingradius.com</p>
                <p><strong>Phone:</strong> +91 90248-22434</p>
                <p><strong>Address:</strong><br/>
                  121 - 122, Metropolis Tower<br/>
                  Purani Chungi, Ajmer Road<br/>
                  Jaipur-302019<br/>
                  Rajasthan, India
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acknowledgment */}
          <Card className="border-2 border-primary/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Acknowledgment</h3>
                  <p className="text-sm text-muted-foreground">
                    By using LogiFin, you acknowledge that you have read, understood, and agree to be bound by these
                    Terms and Conditions. If you have any questions, please contact our support team before using the platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;
