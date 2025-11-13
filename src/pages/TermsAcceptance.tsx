import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Shield, AlertCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const TermsAcceptance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAccepted, setIsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    if (!isAccepted) {
      toast({
        variant: "destructive",
        title: "Terms not accepted",
        description: "Please accept the terms and conditions to continue",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Mark user as having accepted terms
      const user = auth.getCurrentUser();
      if (user) {
        await auth.acceptTerms(user.id);

        toast({
          title: "Terms accepted",
          description: "Proceeding to role selection",
        });

        navigate("/select-role");
      } else {
        // User not logged in, redirect to auth
        navigate("/auth");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to accept terms",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    toast({
      title: "Terms declined",
      description: "You must accept the terms to use LogiFin",
    });
    // Optionally, redirect back to auth or landing page
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logiFin.png" alt="LogiFin" className="h-8" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Terms & Conditions</h1>
          <p className="text-lg text-muted-foreground">
            Please review and accept our terms to continue using LogiFin
          </p>
        </div>

        <ScrollArea className="h-[60vh] rounded-lg border border-border p-6 mb-6 bg-card">
          <div className="space-y-8">
            {/* Platform Fees */}
            <Card className="border-primary/30">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  Platform Fees
                </h2>
                <div className="space-y-4">
                  <div className="border-b border-border pb-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-foreground">Load Providers</span>
                      <span className="text-lg font-bold text-primary">0.5%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Of financed amount</p>
                  </div>
                  <div className="border-b border-border pb-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-foreground">Vehicle Providers</span>
                      <span className="text-lg font-bold text-secondary">0.5%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Of transaction value</p>
                  </div>
                  <div className="pb-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-foreground">Lenders</span>
                      <span className="text-lg font-bold text-accent">0.5%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Of returns earned</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-primary/5 rounded-md">
                  <p className="text-xs text-muted-foreground">
                    * Fees are deducted at the time of transaction or repayment
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Investment Terms */}
            <Card className="border-primary/30">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4 text-primary">Investment Terms</h2>
                <ul className="space-y-3">
                  {[
                    { title: "Minimum Investment", value: "₹10,000" },
                    { title: "Maximum Investment", value: "₹1.5Lakhs per trip" },
                    { title: "Expected Returns", value: "12-18% annually" },
                    { title: "Investment Duration", value: "30-90 days" },
                    { title: "Risk Category", value: "Medium-High" },
                    { title: "Repayment", value: "Automatic on trip completion" },
                  ].map((term) => (
                    <li key={term.title} className="flex items-start gap-2 pb-2 border-b border-border last:border-0">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm font-semibold block">{term.title}</span>
                        <span className="text-xs text-muted-foreground">{term.value}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h2 className="font-bold text-xl text-destructive">Important Notice</h2>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-destructive font-bold text-lg">•</span>
                        <span className="leading-relaxed">
                          <strong>Investment Risk:</strong> All investments are subject to market risks.
                          Please read all terms and conditions carefully before investing. Past performance
                          is not indicative of future results.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive font-bold text-lg">•</span>
                        <span className="leading-relaxed">
                          <strong>No Guaranteed Returns:</strong> Returns are indicative and not guaranteed.
                          Actual returns may vary based on trip completion, market conditions, and other factors
                          beyond LogiFin's control.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive font-bold text-lg">•</span>
                        <span className="leading-relaxed">
                          <strong>Agreement to Terms:</strong> By using LogiFin, you agree to our terms of
                          service, privacy policy, and acknowledge the risks associated with logistics financing.
                          You confirm that you have the legal capacity to enter into this agreement.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive font-bold text-lg">•</span>
                        <span className="leading-relaxed">
                          <strong>Fee Modifications:</strong> LogiFin reserves the right to modify platform
                          fees with 30 days prior notice to users. Continued use of the platform after such
                          modifications constitutes acceptance of the new fees.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive font-bold text-lg">•</span>
                        <span className="leading-relaxed">
                          <strong>KYC & Compliance:</strong> All transactions are subject to KYC (Know Your Customer)
                          verification and compliance with applicable Indian regulations including RBI guidelines,
                          Prevention of Money Laundering Act (PMLA), and other relevant laws.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive font-bold text-lg">•</span>
                        <span className="leading-relaxed">
                          <strong>Platform Liability:</strong> LogiFin acts as a facilitator and marketplace.
                          We are not responsible for the conduct of load owners, vehicle providers, or lenders,
                          nor for any losses incurred due to trip failures, delays, or defaults.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive font-bold text-lg">•</span>
                        <span className="leading-relaxed">
                          <strong>Dispute Resolution:</strong> Any disputes arising from the use of LogiFin
                          shall be subject to the exclusive jurisdiction of courts in [Your City], India,
                          and shall be governed by Indian law.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Acceptance Section */}
        <div className="space-y-6">
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={isAccepted}
                  onCheckedChange={(checked) => setIsAccepted(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-relaxed cursor-pointer"
                  >
                    I have read, understood, and agree to all the terms and conditions, platform fees,
                    investment terms, and important notices mentioned above. I acknowledge that I am
                    accepting these terms voluntarily and understand the risks involved in using LogiFin's services.
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={handleDecline}
              disabled={isLoading}
              className="sm:w-48"
            >
              Decline
            </Button>
            <Button
              size="lg"
              onClick={handleAccept}
              disabled={!isAccepted || isLoading}
              className="bg-gradient-primary sm:w-48"
            >
              {isLoading ? "Processing..." : "Accept & Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAcceptance;
