import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";

const GettingStarted = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-3xl">Getting Started with LogiFin</CardTitle>
                <CardDescription>Learn how to use LogiFin platform effectively</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Welcome to LogiFin!</h2>
              <p className="text-muted-foreground">
                LogiFin is a comprehensive logistics financing platform that connects transporters, lenders,
                and load owners for seamless trip financing and investment opportunities.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">Quick Start Guide</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">1. Create Your Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Sign up with your email and complete the registration process.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">2. Select Your Role</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose whether you're a Transporter, Lender, or Load Owner.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">3. Complete KYC</h4>
                    <p className="text-sm text-muted-foreground">
                      Submit your KYC documents for verification to access all features.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">4. Start Using the Platform</h4>
                    <p className="text-sm text-muted-foreground">
                      Create trips, make investments, or manage your logistics financing.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">Need More Help?</h3>
              <p className="text-muted-foreground mb-4">
                Check out our detailed user manual or contact our support team at{" "}
                <a href="mailto:support@logifin.com" className="text-primary hover:underline">
                  support@logifin.com
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default GettingStarted;
