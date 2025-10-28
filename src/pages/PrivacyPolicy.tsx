import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, Database, Cookie, Mail, AlertTriangle } from "lucide-react";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
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
              <h1 className="text-2xl font-bold">Privacy Policy</h1>
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
              <Shield className="h-6 w-6 text-primary" />
              Your Privacy Matters
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              At LogiFin, we are committed to protecting your privacy and ensuring the security of your personal information.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our platform.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">

          {/* 1. Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                1. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">

              <div>
                <h4 className="font-semibold text-foreground mb-2">1.1 Information You Provide</h4>
                <p className="mb-2">When you register and use LogiFin, we collect:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                  <li><strong>Company Information:</strong> Company name, business registration details, GST number</li>
                  <li><strong>KYC Documents:</strong> Aadhaar card, PAN card, business licenses, bank account details</li>
                  <li><strong>Financial Information:</strong> Bank account details, transaction history, wallet balance</li>
                  <li><strong>Profile Information:</strong> Profile picture, address, preferences</li>
                  <li><strong>Transaction Data:</strong> Investment details, loan information, repayment history</li>
                  <li><strong>Documents:</strong> E-Way bills, invoices, proof of delivery, vehicle documents</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">1.2 Information Collected Automatically</h4>
                <p className="mb-2">When you access our platform, we automatically collect:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns</li>
                  <li><strong>Location Data:</strong> Approximate location based on IP address</li>
                  <li><strong>Cookies and Similar Technologies:</strong> See our Cookie Policy for details</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">1.3 Information from Third Parties</h4>
                <p className="mb-2">We may receive information from:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Payment processors and financial institutions</li>
                  <li>Identity verification services</li>
                  <li>Credit bureaus and rating agencies</li>
                  <li>Government databases for KYC verification</li>
                </ul>
              </div>

            </CardContent>
          </Card>

          {/* 2. How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                2. How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Provide Services:</strong> Create and manage your account, process transactions, facilitate financing</li>
                <li><strong>Verify Identity:</strong> Conduct KYC verification, prevent fraud, ensure compliance</li>
                <li><strong>Process Payments:</strong> Handle deposits, withdrawals, escrow services, and transactions</li>
                <li><strong>Communicate:</strong> Send notifications, updates, marketing communications (with consent)</li>
                <li><strong>Improve Platform:</strong> Analyze usage patterns, enhance user experience, develop new features</li>
                <li><strong>Ensure Security:</strong> Detect and prevent fraud, unauthorized access, and security threats</li>
                <li><strong>Legal Compliance:</strong> Comply with laws, regulations, and legal processes</li>
                <li><strong>Customer Support:</strong> Respond to inquiries, resolve disputes, provide assistance</li>
                <li><strong>Risk Assessment:</strong> Evaluate creditworthiness, investment risks, and user behavior</li>
              </ul>
            </CardContent>
          </Card>

          {/* 3. How We Share Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. How We Share Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">

              <p>We may share your information with:</p>

              <div>
                <h4 className="font-semibold text-foreground mb-2">3.1 Other Platform Users</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Company name, ratings, and relevant business information (for transparency)</li>
                  <li>Transaction-specific details necessary for financing arrangements</li>
                  <li>Documents related to specific transactions (as needed)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">3.2 Service Providers</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Payment processors and banking partners</li>
                  <li>KYC and identity verification services</li>
                  <li>Cloud hosting and data storage providers</li>
                  <li>Analytics and marketing service providers</li>
                  <li>Customer support tools</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">3.3 Legal and Regulatory Authorities</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Government agencies and regulators (when required by law)</li>
                  <li>Law enforcement (in response to legal requests)</li>
                  <li>Courts and legal proceedings</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">3.4 Business Transfers</h4>
                <p>
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred to the
                  acquiring entity, subject to the same privacy protections.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded mt-4">
                <p className="text-sm">
                  <strong>We will never sell your personal information to third parties for their marketing purposes.</strong>
                </p>
              </div>

            </CardContent>
          </Card>

          {/* 4. Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5" />
                4. Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Encryption:</strong> All data transmission is encrypted using SSL/TLS protocols</li>
                <li><strong>Secure Storage:</strong> Personal and financial data is encrypted at rest</li>
                <li><strong>Access Controls:</strong> Strict access controls and authentication mechanisms</li>
                <li><strong>Regular Audits:</strong> Security audits and vulnerability assessments</li>
                <li><strong>Secure Infrastructure:</strong> Hosted on secure, reputable cloud platforms</li>
                <li><strong>Password Protection:</strong> Passwords are hashed using industry-standard algorithms</li>
                <li><strong>Two-Factor Authentication:</strong> Available for enhanced account security</li>
              </ul>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded mt-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  While we implement robust security measures, no method of transmission over the internet is 100% secure.
                  You are responsible for maintaining the confidentiality of your account credentials.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 5. Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                5. Cookies and Tracking Technologies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>We use cookies and similar technologies for:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Essential Cookies:</strong> Required for platform functionality (cannot be disabled)</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Understand how users interact with the platform</li>
                <li><strong>Marketing Cookies:</strong> Deliver relevant advertisements (with your consent)</li>
              </ul>
              <p className="mt-4">
                You can manage your cookie preferences through our Cookie Settings. For more details, please read our
                Cookie Policy.
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => navigate('/cookie-policy')}
              >
                Read our Cookie Policy →
              </Button>
            </CardContent>
          </Card>

          {/* 6. Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">6. Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                <li><strong>Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Objection:</strong> Object to certain data processing activities</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for marketing communications</li>
                <li><strong>Complaint:</strong> Lodge a complaint with relevant data protection authorities</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at privacy@rollingradius.com
              </p>
            </CardContent>
          </Card>

          {/* 7. Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">7. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>We retain your data for as long as necessary to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide our services and maintain your account</li>
                <li>Comply with legal, tax, and accounting obligations</li>
                <li>Resolve disputes and enforce our agreements</li>
                <li>Maintain business records and analytics</li>
              </ul>
              <p className="mt-3">
                After account closure, we may retain certain information as required by law or for legitimate business purposes,
                typically for a period of 7 years.
              </p>
            </CardContent>
          </Card>

          {/* 8. Third-Party Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">8. Third-Party Links and Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Our platform may contain links to third-party websites and services. We are not responsible for the privacy
                practices of these third parties. We encourage you to read their privacy policies before providing any information.
              </p>
            </CardContent>
          </Card>

          {/* 9. Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">9. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                LogiFin is not intended for use by individuals under the age of 18. We do not knowingly collect personal
                information from children. If we become aware that we have collected data from a child, we will take steps
                to delete it promptly.
              </p>
            </CardContent>
          </Card>

          {/* 10. International Data Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">10. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Your data may be transferred to and processed in countries other than India. We ensure that such transfers
                comply with applicable data protection laws and that your data receives adequate protection.
              </p>
            </CardContent>
          </Card>

          {/* 11. Changes to Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">11. Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
                We will notify you of significant changes via email or platform notifications. Your continued use of the platform
                after such changes constitutes acceptance of the updated policy.
              </p>
              <p className="mt-3">
                We encourage you to review this Privacy Policy periodically.
              </p>
            </CardContent>
          </Card>

          {/* 12. Contact Us */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                12. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
                please contact us:
              </p>
              <div className="mt-4 space-y-2">
                <p><strong>Privacy Officer</strong></p>
                <p><strong>Email:</strong> privacy@rollingradius.com</p>
                <p><strong>Support Email:</strong> support@rollingradius.com</p>
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

          {/* Consent */}
          <Card className="border-2 border-primary/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Shield className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Your Consent</h3>
                  <p className="text-sm text-muted-foreground">
                    By using LogiFin, you consent to the collection, use, and disclosure of your information as described
                    in this Privacy Policy. If you do not agree with this policy, please do not use our platform.
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

export default PrivacyPolicy;
