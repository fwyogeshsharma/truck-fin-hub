import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, Upload, CheckCircle, AlertTriangle, Download, Info, CheckCircle2 } from 'lucide-react';
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
    customTerms?: string;
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
          description: 'Signature image must be less than 2 MB',
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
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Loan Contract Review & Acceptance
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Please carefully review all terms and conditions before accepting this loan agreement from {toTitleCase(contract.lenderName)}.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div className="text-xs sm:text-sm">
              <p className="font-semibold text-yellow-900 dark:text-yellow-100">Important Notice</p>
              <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                By accepting this contract, you are entering into a legally binding agreement. Please read all terms carefully before signing.
              </p>
            </div>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className={`grid w-full gap-1 ${contract.customTerms ? 'grid-cols-3 sm:grid-cols-7' : 'grid-cols-3 sm:grid-cols-6'}`}>
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="terms" className="text-xs sm:text-sm">Terms</TabsTrigger>
            <TabsTrigger value="interest" className="text-xs sm:text-sm">Interest</TabsTrigger>
            <TabsTrigger value="repayment" className="text-xs sm:text-sm">Repayment</TabsTrigger>
            <TabsTrigger value="penalties" className="text-xs sm:text-sm">Penalties</TabsTrigger>
            {contract.customTerms && <TabsTrigger value="custom" className="text-xs sm:text-sm">Custom</TabsTrigger>}
            <TabsTrigger value="accept" className="text-xs sm:text-sm">Accept</TabsTrigger>
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
                  <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                    <strong>Contract Date:</strong> {new Date().toLocaleDateString()}
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Contract Type:</strong> Three-Party Loan Agreement
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader className="bg-purple-50 dark:bg-purple-950/20">
                <CardTitle>Parties to this Agreement</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <div>
                      <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">FIRST PARTY - LENDER</p>
                      <p className="text-sm mt-1">{toTitleCase(contract.lenderName)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Loan Provider (Investor)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <div>
                      <p className="font-semibold text-sm text-green-900 dark:text-green-100">SECOND PARTY - BORROWER</p>
                      <p className="text-sm mt-1">You (Load Agent/Transporter)</p>
                      <p className="text-xs text-muted-foreground mt-1">Loan Recipient</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
                    <span className="bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">THIRD PARTY - LOGIFIN PLATFORM</p>
                      <p className="text-sm mt-1">Digital Intermediary</p>
                      <p className="text-xs text-muted-foreground mt-1">Mediator Only (Not liable for this transaction)</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-3 rounded-lg">
                    <p className="text-xs text-orange-900 dark:text-orange-100">
                      <strong>⚠️ Important:</strong> This loan agreement is exclusively between the Lender (First Party) and Borrower (Second Party). LogiFin serves only as a platform facilitator and assumes no liability for loan performance, defaults, or disputes.
                    </p>
                  </div>
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

          {contract.customTerms && (
            <TabsContent value="custom">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      The lender has added the following custom terms to this agreement. Please review carefully.
                    </p>
                  </div>
                  <ScrollArea className="h-[400px] pr-4">
                    <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded">
                      {contract.customTerms}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="accept" className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">Three-Party Agreement</p>
                  <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                    This is a three-party loan contract. Please review all parties and their roles before signing.
                  </p>
                </div>
              </div>
            </div>

            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  First Party - LENDER
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="font-semibold text-lg">{toTitleCase(contract.lenderName)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Role</Label>
                    <p className="text-sm">Loan Provider (Investor)</p>
                  </div>
                  <div className="border rounded p-4 bg-white dark:bg-muted">
                    <Label className="text-sm text-muted-foreground">Digital Signature</Label>
                    {contract.lenderSignature && (
                      <img src={contract.lenderSignature} alt="Lender Signature" className="mt-2 max-h-24 border" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-950/20">
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Second Party - BORROWER (You)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Role</Label>
                    <p className="text-sm">Loan Recipient (Load Agent/Transporter)</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="borrowerSignature">Upload Your Digital Signature</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-transparent">
                          <Info className="h-4 w-4 text-blue-600 hover:text-blue-700" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-sm">Acceptable Signature Formats</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                We accept the following types of signatures:
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 pl-7">
                            <div className="text-sm">
                              <p className="font-medium">✓ Digital Signature</p>
                              <p className="text-xs text-muted-foreground">Created using signature pad or tablet</p>
                            </div>

                            <div className="text-sm">
                              <p className="font-medium">✓ Scanned Signature</p>
                              <p className="text-xs text-muted-foreground">Clear scan of your handwritten signature on white paper</p>
                            </div>

                            <div className="text-sm">
                              <p className="font-medium">✓ Photo of Signature</p>
                              <p className="text-xs text-muted-foreground">High-quality photo with good lighting and contrast</p>
                            </div>
                          </div>

                          <div className="border-t pt-2 space-y-1">
                            <p className="text-xs font-semibold">Requirements:</p>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                              <li>Image format: JPG, PNG, or similar</li>
                              <li>Maximum file size: 2 MB</li>
                              <li>Clear and legible</li>
                              <li>No background clutter</li>
                              <li>Matches your legal name</li>
                            </ul>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
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
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 dark:border-gray-800">
              <CardHeader className="bg-gray-50 dark:bg-gray-950/20">
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Third Party - LOGIFIN PLATFORM
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Role</Label>
                    <p className="text-sm font-medium">Digital Intermediary Platform (Mediator Only)</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-3 rounded">
                    <p className="text-sm text-orange-900 dark:text-orange-100">
                      <strong>⚠️ Important:</strong> LogiFin is NOT a party to this financial transaction. LogiFin does not guarantee returns, verify creditworthiness, or assume any liability for defaults or disputes. This contract is exclusively between the Lender and Borrower.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="acceptTerms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  />
                  <Label htmlFor="acceptTerms" className="cursor-pointer text-sm leading-relaxed">
                    I have read, understood, and agree to all the terms and conditions of this <strong>three-party loan agreement</strong>. I acknowledge that:
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>This is a legally binding contract between me (Borrower) and {toTitleCase(contract.lenderName)} (Lender)</li>
                      <li>I am responsible for repaying <strong>₹{totalRepayment.toFixed(2)}</strong> by <strong>{new Date(Date.now() + contract.maturityDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong></li>
                      <li>LogiFin is only a platform facilitator and bears no liability for this transaction</li>
                      <li>Any legal disputes will be between me and the Lender only, excluding LogiFin</li>
                    </ul>
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm touch-target"
          >
            Reject Contract
          </Button>
          <Button
            onClick={handleAccept}
            disabled={loading || !termsAccepted || !borrowerSignature}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm touch-target"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="truncate">Processing Allotment...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="truncate">Sign Contract & Allot Trip</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractAcceptanceDialog;
