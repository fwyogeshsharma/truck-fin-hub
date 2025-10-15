import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KYCData, DocumentInfo, IdentityDocuments } from '@/lib/kyc-types';
import { useToast } from '@/hooks/use-toast';
import { kycService } from '@/lib/kyc-service';
import { Upload, CheckCircle2, Loader2, FileText } from 'lucide-react';

interface IdentityDocumentsFormProps {
  kycData: KYCData;
  onComplete: (data: Partial<KYCData>) => void;
  onBack: () => void;
}

const IdentityDocumentsForm = ({ kycData, onComplete, onBack }: IdentityDocumentsFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  const [formData, setFormData] = useState<IdentityDocuments>(
    kycData.identityDocuments || {
      pan: {
        documentType: 'pan',
        documentNumber: '',
        verificationStatus: 'pending',
        uploadedAt: new Date().toISOString(),
      },
      aadhaar: {
        documentType: 'aadhaar',
        documentNumber: '',
        verificationStatus: 'pending',
        uploadedAt: new Date().toISOString(),
      },
      photo: {
        documentType: 'photo',
        documentNumber: 'N/A',
        verificationStatus: 'pending',
        uploadedAt: new Date().toISOString(),
      },
      additionalDocs: [],
    }
  );

  const handleFileUpload = async (
    field: 'pan' | 'aadhaar' | 'photo',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please upload a file smaller than 5MB',
      });
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload JPG, PNG, or PDF files only',
      });
      return;
    }

    setLoading(true);
    try {
      const filePath = await kycService.uploadDocument(file, field);
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          documentFile: filePath,
        },
      }));
      toast({
        title: 'File Uploaded',
        description: `${field.toUpperCase()} document uploaded successfully`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload document',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentNumberChange = (field: 'pan' | 'aadhaar', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        documentNumber: value.toUpperCase(),
      },
    }));
  };

  const verifyPAN = async () => {
    if (!formData.pan.documentNumber) {
      toast({
        variant: 'destructive',
        title: 'PAN Required',
        description: 'Please enter PAN number',
      });
      return;
    }

    setVerifying('pan');
    try {
      const result = await kycService.verifyPAN(formData.pan.documentNumber);
      setFormData((prev) => ({
        ...prev,
        pan: {
          ...prev.pan,
          verificationStatus: result.valid ? 'verified' : 'failed',
          verificationDetails: result.message,
        },
      }));
      toast({
        title: result.valid ? 'PAN Verified' : 'Verification Failed',
        description: result.message,
        variant: result.valid ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Could not verify PAN',
      });
    } finally {
      setVerifying(null);
    }
  };

  const verifyAadhaar = async () => {
    if (!formData.aadhaar.documentNumber) {
      toast({
        variant: 'destructive',
        title: 'Aadhaar Required',
        description: 'Please enter Aadhaar number',
      });
      return;
    }

    setVerifying('aadhaar');
    try {
      const result = await kycService.verifyAadhaar(formData.aadhaar.documentNumber);
      setFormData((prev) => ({
        ...prev,
        aadhaar: {
          ...prev.aadhaar,
          verificationStatus: result.valid ? 'verified' : 'failed',
          verificationDetails: result.message,
        },
      }));
      toast({
        title: result.valid ? 'Aadhaar Verified' : 'Verification Failed',
        description: result.message,
        variant: result.valid ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'Could not verify Aadhaar',
      });
    } finally {
      setVerifying(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.pan.documentNumber || !formData.pan.documentFile) {
      toast({
        variant: 'destructive',
        title: 'PAN Required',
        description: 'Please upload PAN card and enter PAN number',
      });
      return;
    }

    if (!formData.aadhaar.documentNumber || !formData.aadhaar.documentFile) {
      toast({
        variant: 'destructive',
        title: 'Aadhaar Required',
        description: 'Please upload Aadhaar card and enter Aadhaar number',
      });
      return;
    }

    if (!formData.photo.documentFile) {
      toast({
        variant: 'destructive',
        title: 'Photo Required',
        description: 'Please upload a recent photograph',
      });
      return;
    }

    if (formData.pan.verificationStatus !== 'verified') {
      toast({
        variant: 'destructive',
        title: 'PAN Not Verified',
        description: 'Please verify your PAN before proceeding',
      });
      return;
    }

    if (formData.aadhaar.verificationStatus !== 'verified') {
      toast({
        variant: 'destructive',
        title: 'Aadhaar Not Verified',
        description: 'Please verify your Aadhaar before proceeding',
      });
      return;
    }

    onComplete({ identityDocuments: formData });
    toast({
      title: 'Documents Saved',
      description: 'Identity documents verified and saved',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Documents</CardTitle>
        <CardDescription>Upload and verify your identity documents (PAN and Aadhaar are mandatory)</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PAN Card */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">PAN Card</h3>
              {formData.pan.verificationStatus === 'verified' && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pan-number">
                  PAN Number <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="pan-number"
                    placeholder="ABCDE1234F"
                    value={formData.pan.documentNumber}
                    onChange={(e) => handleDocumentNumberChange('pan', e.target.value)}
                    maxLength={10}
                    required
                  />
                  <Button
                    type="button"
                    onClick={verifyPAN}
                    disabled={verifying === 'pan' || formData.pan.verificationStatus === 'verified'}
                    variant="outline"
                  >
                    {verifying === 'pan' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                  </Button>
                </div>
                {formData.pan.verificationDetails && (
                  <p className="text-sm text-muted-foreground">{formData.pan.verificationDetails}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan-upload">
                  Upload PAN Card <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pan-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('pan', e)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('pan-upload')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.pan.documentFile ? 'Change File' : 'Upload File'}
                  </Button>
                </div>
                {formData.pan.documentFile && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    <span>File uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Aadhaar Card */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Aadhaar Card</h3>
              {formData.aadhaar.verificationStatus === 'verified' && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aadhaar-number">
                  Aadhaar Number <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="aadhaar-number"
                    placeholder="XXXX XXXX XXXX"
                    value={formData.aadhaar.documentNumber}
                    onChange={(e) => handleDocumentNumberChange('aadhaar', e.target.value.replace(/\s/g, ''))}
                    maxLength={12}
                    required
                  />
                  <Button
                    type="button"
                    onClick={verifyAadhaar}
                    disabled={verifying === 'aadhaar' || formData.aadhaar.verificationStatus === 'verified'}
                    variant="outline"
                  >
                    {verifying === 'aadhaar' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                  </Button>
                </div>
                {formData.aadhaar.verificationDetails && (
                  <p className="text-sm text-muted-foreground">{formData.aadhaar.verificationDetails}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaar-upload">
                  Upload Aadhaar Card <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="aadhaar-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload('aadhaar', e)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('aadhaar-upload')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.aadhaar.documentFile ? 'Change File' : 'Upload File'}
                  </Button>
                </div>
                {formData.aadhaar.documentFile && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    <span>File uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Photograph */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Recent Photograph</h3>
            <div className="space-y-2">
              <Label htmlFor="photo-upload">
                Upload Photo <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('photo', e)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  className="w-full md:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {formData.photo.documentFile ? 'Change Photo' : 'Upload Photo'}
                </Button>
              </div>
              {formData.photo.documentFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileText className="h-4 w-4" />
                  <span>Photo uploaded</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload a recent passport-size photograph with white background
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save & Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default IdentityDocumentsForm;
