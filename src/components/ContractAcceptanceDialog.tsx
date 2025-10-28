import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toTitleCase } from '@/lib/utils';

interface ContractAcceptanceDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: (borrowerSignature: string) => void;
  contract: {
    lenderName: string;
    lenderSignature: string;
    termsAndConditions: string;
    interestRateClause: string;
    repaymentClause: string;
    latePaymentClause: string;
    defaultClause: string;
    tripAmount: number;
    interestRate: number;
    maturityDays: number;
  };
  loading?: boolean;
}

const ContractAcceptanceDialog = ({
  open,
  onClose,
  onAccept,
  contract,
  loading = false,
}: ContractAcceptanceDialogProps) => {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('overview');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>('');
  const [borrowerSignature, setBorrowerSignature] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const totalRepayment = contract.tripAmount + (contract.tripAmount * contract.interestRate * contract.maturityDays) / 36500;

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Signature image must be less than 2MB',
        });
        return;
      }

      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSignaturePreview(base64);
        setBorrowerSignature(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAccept = () => {
    if (!termsAccepted) {
      toast({
        variant: 'destructive',
        title: 'Terms Not Accepted',
        description: 'Please read and accept the terms and conditions',
      });
      return;
    }

    if (!borrowerSignature) {
      toast({
        variant: 'destructive',
        title: 'Signature Required',
        description: 'Please upload your signature to accept the contract',
      });
      return;
    }

    onAccept(borrowerSignature);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-primary" />
            Loan Contract Review & Acceptance
          </DialogTitle>
          <DialogDescription>
            Please carefully review all terms and conditions before accepting this loan agreement from {toTitleCase(contract.lenderName)}.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900 dark:text-yellow-100">Important Notice</p>
              <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                By accepting this contract, you are entering into a legally binding agreement. Please read all terms carefully before signing.
              </p>
            </div>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="terms">Terms</TabsTrigger>
            <TabsTrigger value="interest">Interest</TabsTrigger>
            <TabsTrigger value="repayment">Repayment</TabsTrigger>
            <TabsTrigger value="penalties">Penalties</TabsTrigger>
            <TabsTrigger value="accept">Accept</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Loan Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Loan Amount</Label>
                      <p className="text-2xl font-bold text-primary">₹{contract.tripAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Interest Rate</Label>
                      <p className="text-xl font-semibold">{contract.interestRate}% per annum</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Loan Period</Label>
                      <p className="text-xl font-semibold">{contract.maturityDays} days</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Total Interest</Label>
                      <p className="text-xl font-semibold text-orange-600">
                        ₹{((contract.tripAmount * contract.interestRate * contract.maturityDays) / 36500).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Repayment</Label>
                      <p className="text-2xl font-bold text-red-600">₹{totalRepayment.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Due Date</Label>
                      <p className="text-xl font-semibold">
                        {new Date(Date.now() + contract.maturityDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Lender:</strong> {toTitleCase(contract.lenderName)}
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-100 mt-1">
                    <strong>Contract Date:</strong> {new Date().toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle>General Terms and Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded">
                    {contract.termsAndConditions}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interest">
            <Card>
              <CardHeader>
                <CardTitle>Interest Rate Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded">
                    {contract.interestRateClause}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="repayment">
            <Card>
              <CardHeader>
                <CardTitle>Repayment Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded">
                    {contract.repaymentClause}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="penalties">
            <Card>
              <CardHeader>
                <CardTitle>Late Payment & Default Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Late Payment Penalties</Label>
                  <ScrollArea className="h-[180px] pr-4 mt-2">
                    <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded">
                      {contract.latePaymentClause}
                    </pre>
                  </ScrollArea>
                </div>

                <div>
                  <Label className="text-base font-semibold">Default Consequences</Label>
                  <ScrollArea className="h-[180px] pr-4 mt-2">
                    <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded">
                      {contract.defaultClause}
                    </pre>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accept" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lender's Signature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded p-4 bg-white dark:bg-muted">
                  <Label className="text-sm text-muted-foreground">Signed by: {toTitleCase(contract.lenderName)}</Label>
                  {contract.lenderSignature && (
                    <img src={contract.lenderSignature} alt="Lender Signature" className="mt-2 max-h-24 border" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Signature (Borrower)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="borrowerSignature">Upload Your Signature</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Button variant="outline" onClick={() => document.getElementById('borrowerSignature')?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                    <Input
                      id="borrowerSignature"
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                    {signatureFile && (
                      <span className="text-sm text-muted-foreground">{signatureFile.name}</span>
                    )}
                  </div>
                </div>

                {signaturePreview && (
                  <div className="border rounded p-4 bg-white dark:bg-muted">
                    <Label>Your Signature Preview:</Label>
                    <img src={signaturePreview} alt="Borrower Signature" className="mt-2 max-h-24 border" />
                  </div>
                )}

                <div className="flex items-start space-x-3 pt-4 border-t">
                  <Checkbox
                    id="acceptTerms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  />
                  <Label htmlFor="acceptTerms" className="cursor-pointer text-sm leading-relaxed">
                    I have read, understood, and agree to all the terms and conditions of this loan agreement. I acknowledge that this is a legally binding contract and I am responsible for repaying the loan amount of <strong>₹{totalRepayment.toFixed(2)}</strong> by <strong>{new Date(Date.now() + contract.maturityDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>.
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Reject Contract
          </Button>
          <Button
            onClick={handleAccept}
            disabled={loading || !termsAccepted || !borrowerSignature}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Allotment...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Sign Contract & Allot Trip
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractAcceptanceDialog;
