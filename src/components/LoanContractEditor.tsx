import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, Upload, Save, Eye, Info, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoanContractEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (contract: LoanContract) => void;
  tripAmount: number;
  interestRate: number;
  maturityDays: number;
  lenderId: string;
}

export interface LoanContract {
  termsAndConditions: string;
  interestRateClause: string;
  repaymentClause: string;
  latePaymentClause: string;
  defaultClause: string;
  customClauses: string[];
  customTerms?: string; // Optional custom terms added by lender
  lenderSignature: string; // Base64 image
  saveAsTemplate: boolean;
  templateName?: string;
}

const LoanContractEditor = ({
  open,
  onClose,
  onSave,
  tripAmount,
  interestRate,
  maturityDays,
  lenderId,
}: LoanContractEditorProps) => {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('terms');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const [customTerms, setCustomTerms] = useState<string>('');

  const [contract, setContract] = useState<LoanContract>({
    termsAndConditions: `THREE-PARTY LOAN AGREEMENT

This Loan Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString()} between the Lender, the Borrower, and LogiFin (Platform) for the purpose of financing a transportation trip.

PARTIES TO THIS AGREEMENT:
1. LENDER ("First Party"): The party providing the loan funds
2. BORROWER ("Second Party"): The party receiving the loan funds (Load Agent/Transporter)
3. LOGIFIN ("Third Party/Platform"): Digital platform facilitating this transaction as an INTERMEDIARY ONLY

LOAN DETAILS:
- Loan Amount: ₹${tripAmount.toLocaleString()}
- Interest Rate: ${interestRate}% per annum
- Maturity Period: ${maturityDays} days
- Repayment Date: ${new Date(Date.now() + maturityDays * 24 * 60 * 60 * 1000).toLocaleDateString()}

PURPOSE:
The loan is provided specifically for financing a transportation trip as detailed in the trip document referenced in this agreement.

⚠️ IMPORTANT DISCLAIMER - PLATFORM LIABILITY:
LogiFin acts solely as a digital intermediary platform connecting lenders and borrowers. LogiFin:
• IS NOT a party to the financial transaction between Lender and Borrower
• DOES NOT provide investment advice or guarantee any returns
• IS NOT responsible for any financial losses, defaults, or disputes
• DOES NOT verify creditworthiness or guarantee loan repayment
• Acts only as a technology platform facilitating peer-to-peer lending

This contract is EXCLUSIVELY between the LENDER and BORROWER. Any legal disputes, claims, or litigation arising from this agreement shall be between the Lender and Borrower only. LogiFin shall NOT be made a party to any legal proceedings, arbitration, or dispute resolution related to this loan agreement.

The Lender and Borrower acknowledge that they enter into this agreement at their own risk and discretion, and LogiFin bears no liability for the performance or non-performance of obligations under this contract.`,

    interestRateClause: `INTEREST RATE CLAUSE:

1. The Borrower agrees to pay interest at a rate of ${interestRate}% per annum on the principal loan amount of ₹${tripAmount.toLocaleString()}.

2. Interest shall be calculated on a daily basis from the date of disbursement until the date of full repayment.

3. The total interest payable at maturity (${maturityDays} days) will be ₹${((tripAmount * interestRate * maturityDays) / 36500).toFixed(2)}.

4. Interest rate is fixed and shall not be subject to change during the loan term.`,

    repaymentClause: `REPAYMENT CLAUSE:

1. The Borrower shall repay the full loan amount of ₹${tripAmount.toLocaleString()} plus accrued interest within ${maturityDays} days from the date of disbursement.

2. Total repayment amount: ₹${(tripAmount + (tripAmount * interestRate * maturityDays) / 36500).toFixed(2)}

3. Repayment shall be made in full upon completion of the trip or on the maturity date, whichever is earlier.

4. Early repayment is permitted without penalty.

5. Repayment shall be made through the platform's designated payment method.`,

    latePaymentClause: `LATE PAYMENT CLAUSE:

1. If the Borrower fails to make payment by the due date, a late payment fee of 2% of the outstanding amount shall be charged for each week of delay.

2. Additional interest at 1.5x the original rate (${(interestRate * 1.5).toFixed(2)}%) shall accrue on overdue amounts.

3. The Lender reserves the right to initiate recovery proceedings after 7 days of payment default.

4. All costs associated with collection efforts shall be borne by the Borrower.`,

    defaultClause: `DEFAULT CLAUSE:

1. The Borrower shall be considered in default if:
   a) Payment is not received within 15 days after the due date
   b) The Borrower provides false or misleading information
   c) The trip is cancelled without valid reason
   d) The Borrower becomes insolvent or files for bankruptcy

2. Upon default, the entire outstanding amount becomes immediately due and payable.

3. The Lender may pursue legal remedies including but not limited to:
   - Filing a civil suit for recovery
   - Reporting to credit bureaus
   - Seeking attachment of assets

4. The Borrower shall be liable for all legal costs and attorney fees incurred in collection efforts.

5. DISPUTE RESOLUTION AND LEGAL PROCEEDINGS:
   Any disputes, claims, or legal proceedings arising from this loan agreement shall be EXCLUSIVELY between the LENDER (First Party) and BORROWER (Second Party) only.

   LogiFin (Third Party/Platform) shall NOT be:
   - Named as a defendant or respondent in any legal proceedings
   - Held liable for any losses, defaults, or damages
   - Required to provide testimony or documentation beyond platform transaction records
   - Responsible for enforcement of this contract

   Both Lender and Borrower explicitly agree to indemnify and hold harmless LogiFin, its officers, employees, and affiliates from any claims, demands, or legal actions related to this loan agreement.`,

    customClauses: [],
    lenderSignature: '',
    saveAsTemplate: false,
  });

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
        setContract(prev => ({ ...prev, lenderSignature: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!contract.lenderSignature) {
      toast({
        variant: 'destructive',
        title: 'Signature Required',
        description: 'Please upload your signature before proceeding',
      });
      return;
    }

    if (saveAsTemplate && !templateName) {
      toast({
        variant: 'destructive',
        title: 'Template Name Required',
        description: 'Please provide a name for your template',
      });
      return;
    }

    const finalContract = {
      ...contract,
      customTerms: customTerms.trim() || undefined,
      saveAsTemplate,
      templateName: saveAsTemplate ? templateName : undefined,
    };

    onSave(finalContract);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            Loan Contract Agreement
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Review and customize the loan terms. Your signature is required to proceed with the bid.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4 sm:space-y-6">
          <div className="border-b pb-1">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 h-auto p-1 bg-muted/50">
              <TabsTrigger value="terms" className="text-xs sm:text-sm h-8 sm:h-9">Terms</TabsTrigger>
              <TabsTrigger value="interest" className="text-xs sm:text-sm h-8 sm:h-9">Interest</TabsTrigger>
              <TabsTrigger value="repayment" className="text-xs sm:text-sm h-8 sm:h-9">Repayment</TabsTrigger>
              <TabsTrigger value="penalties" className="text-xs sm:text-sm h-8 sm:h-9">Penalties</TabsTrigger>
              <TabsTrigger value="custom" className="text-xs sm:text-sm h-8 sm:h-9">Custom</TabsTrigger>
              <TabsTrigger value="signature" className="text-xs sm:text-sm h-8 sm:h-9">Signature</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="terms" className="space-y-4 mt-0">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>General Terms and Conditions</Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Read-Only</span>
              </div>
              <Textarea
                value={contract.termsAndConditions}
                readOnly
                rows={12}
                className="mt-2 font-mono text-sm bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Standard terms are automatically generated. Use the "Custom" tab to add additional clauses.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="interest" className="space-y-4 mt-0">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Interest Rate Clause</Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Read-Only</span>
              </div>
              <Textarea
                value={contract.interestRateClause}
                readOnly
                rows={12}
                className="mt-2 font-mono text-sm bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Interest terms are automatically calculated based on your bid. Use the "Custom" tab to add additional clauses.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="repayment" className="space-y-4 mt-0">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Repayment Terms</Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Read-Only</span>
              </div>
              <Textarea
                value={contract.repaymentClause}
                readOnly
                rows={12}
                className="mt-2 font-mono text-sm bg-muted/50 cursor-not-allowed"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Late Payment Clause</Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Read-Only</span>
              </div>
              <Textarea
                value={contract.latePaymentClause}
                readOnly
                rows={8}
                className="mt-2 font-mono text-sm bg-muted/50 cursor-not-allowed"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Default Clause</Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Read-Only</span>
              </div>
              <Textarea
                value={contract.defaultClause}
                readOnly
                rows={10}
                className="mt-2 font-mono text-sm bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Standard repayment and penalty clauses. Use the "Custom" tab to add your own specific terms.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="penalties" className="space-y-4 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Summary of Penalties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Late Payment Fee:</div>
                  <div>2% per week on outstanding amount</div>

                  <div className="font-medium">Additional Interest:</div>
                  <div>{(interestRate * 1.5).toFixed(2)}% per annum on overdue</div>

                  <div className="font-medium">Grace Period:</div>
                  <div>7 days before recovery proceedings</div>

                  <div className="font-medium">Default Period:</div>
                  <div>15 days after due date</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Custom Terms & Conditions
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent ml-auto">
                        <Info className="h-5 w-5 text-blue-600 hover:text-blue-700 cursor-pointer" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] max-h-[600px] overflow-hidden" align="start" side="bottom">
                      <div className="space-y-4 flex flex-col max-h-[580px]">
                        <div className="flex-shrink-0">
                          <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Types of Clauses You Can Add
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Customize your loan contract with additional terms specific to your requirements
                          </p>
                        </div>

                        <div className="space-y-3 overflow-y-auto pr-2 flex-1" style={{ maxHeight: '380px' }}>
                          {/* Payment Related Clauses */}
                          <div className="border-l-2 border-blue-500 pl-3">
                            <p className="font-semibold text-sm text-blue-700">💰 Payment & Transaction Clauses</p>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                              <li>• Preferred payment methods (UPI, Bank Transfer, Cheque)</li>
                              <li>• Partial payment terms and schedules</li>
                              <li>• Payment confirmation requirements</li>
                              <li>• Bank account details for transactions</li>
                              <li>• Payment receipt acknowledgment terms</li>
                            </ul>
                          </div>

                          {/* Communication Clauses */}
                          <div className="border-l-2 border-green-500 pl-3">
                            <p className="font-semibold text-sm text-green-700">📞 Communication & Updates</p>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                              <li>• Required frequency of trip status updates</li>
                              <li>• Contact person details and backup contacts</li>
                              <li>• Preferred communication channels (phone, email, WhatsApp)</li>
                              <li>• Response time expectations for queries</li>
                              <li>• Emergency notification procedures</li>
                            </ul>
                          </div>

                          {/* Documentation Clauses */}
                          <div className="border-l-2 border-purple-500 pl-3">
                            <p className="font-semibold text-sm text-purple-700">📄 Documentation Requirements</p>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                              <li>• Mandatory documents (Bilty, E-Way Bill, POD, Invoice)</li>
                              <li>• Document submission timelines</li>
                              <li>• Photo/video proof requirements at checkpoints</li>
                              <li>• Original document collection terms</li>
                              <li>• Digital document acceptance criteria</li>
                            </ul>
                          </div>

                          {/* Security & Collateral */}
                          <div className="border-l-2 border-orange-500 pl-3">
                            <p className="font-semibold text-sm text-orange-700">🔒 Security & Collateral</p>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                              <li>• Additional security deposit requirements</li>
                              <li>• Post-dated cheques as security</li>
                              <li>• Vehicle RC or other document as collateral</li>
                              <li>• Guarantor requirements and details</li>
                              <li>• Bank guarantee specifications</li>
                            </ul>
                          </div>

                          {/* Trip Specific Terms */}
                          <div className="border-l-2 border-red-500 pl-3">
                            <p className="font-semibold text-sm text-red-700">🚚 Trip-Specific Conditions</p>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                              <li>• GPS tracking requirements and sharing</li>
                              <li>• Specific route or highway preferences</li>
                              <li>• Loading/unloading supervision terms</li>
                              <li>• Temperature control or special handling requirements</li>
                              <li>• Maximum transit time limitations</li>
                              <li>• Stop-over restrictions or permissions</li>
                            </ul>
                          </div>

                          {/* Insurance & Liability */}
                          <div className="border-l-2 border-yellow-600 pl-3">
                            <p className="font-semibold text-sm text-yellow-700">🛡️ Insurance & Liability</p>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                              <li>• Goods insurance coverage requirements</li>
                              <li>• Vehicle insurance verification</li>
                              <li>• Liability in case of damage or loss</li>
                              <li>• Accident reporting procedures</li>
                              <li>• Insurance claim process and timelines</li>
                            </ul>
                          </div>

                          {/* Dispute Resolution */}
                          <div className="border-l-2 border-indigo-500 pl-3">
                            <p className="font-semibold text-sm text-indigo-700">⚖️ Dispute Resolution</p>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                              <li>• Jurisdiction for legal proceedings</li>
                              <li>• Arbitration clause and arbiter selection</li>
                              <li>• Mediation requirements before litigation</li>
                              <li>• Governing law specification</li>
                              <li>• Legal notice period and format</li>
                            </ul>
                          </div>

                          {/* Early Termination */}
                          <div className="border-l-2 border-pink-500 pl-3">
                            <p className="font-semibold text-sm text-pink-700">🔄 Early Termination & Amendments</p>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                              <li>• Trip cancellation terms and penalties</li>
                              <li>• Early loan closure procedures</li>
                              <li>• Conditions for contract amendment</li>
                              <li>• Refund policy for cancelled trips</li>
                              <li>• Mutual consent requirements for changes</li>
                            </ul>
                          </div>

                          {/* Force Majeure */}
                          <div className="border-l-2 border-gray-500 pl-3">
                            <p className="font-semibold text-sm text-gray-700">⚠️ Force Majeure & Special Conditions</p>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                              <li>• Natural disaster or emergency provisions</li>
                              <li>• Government restrictions or lockdown terms</li>
                              <li>• Strike or civil unrest contingencies</li>
                              <li>• Vehicle breakdown handling procedures</li>
                              <li>• Unforeseen delay notification requirements</li>
                            </ul>
                          </div>
                        </div>

                        <div className="border-t pt-3 flex-shrink-0 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-2">⚠️ What NOT to Include:</p>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                              <li>Terms that contradict standard clauses</li>
                              <li>Illegal or unenforceable conditions</li>
                              <li>Discriminatory or unfair terms</li>
                              <li>Personal information of third parties without consent</li>
                            </ul>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-xs font-semibold text-blue-900 mb-1">💡 Pro Tip:</p>
                            <p className="text-xs text-blue-800">
                              Be specific and clear. Use bullet points or numbered lists for multiple conditions.
                              Keep it professional and legally sound. When in doubt, consult a legal advisor.
                            </p>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customTerms">Additional Clauses (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Add any specific terms or conditions you want to include in this loan agreement. Click the info icon above for ideas and examples.
                  </p>
                  <Textarea
                    id="customTerms"
                    value={customTerms}
                    onChange={(e) => setCustomTerms(e.target.value)}
                    placeholder="Enter additional terms, special conditions, or specific requirements...

Examples:
• Payment method preferences
• Communication protocols
• Trip-specific requirements
• Special collateral arrangements
• Any other custom conditions"
                    rows={15}
                    className="mt-2 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    These custom terms will be included in the final contract along with the standard clauses.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signature" className="space-y-4 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Lender Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="signature">Upload Your Signature</Label>
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
                    <Button variant="outline" onClick={() => document.getElementById('signature')?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                    <Input
                      id="signature"
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
                  <div className="border rounded p-4 bg-white">
                    <Label>Signature Preview:</Label>
                    <img src={signaturePreview} alt="Signature" className="mt-2 max-h-32 border" />
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Checkbox
                    id="saveTemplate"
                    checked={saveAsTemplate}
                    onCheckedChange={(checked) => setSaveAsTemplate(checked as boolean)}
                  />
                  <Label htmlFor="saveTemplate" className="cursor-pointer">
                    Save this contract as a template for future bids
                  </Label>
                </div>

                {saveAsTemplate && (
                  <div>
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      placeholder="e.g., Standard 30-day Loan Contract"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm touch-target"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-primary w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm touch-target"
          >
            <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Save & Proceed with Bid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoanContractEditor;
