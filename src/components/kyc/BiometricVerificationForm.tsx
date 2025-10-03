import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KYCData, BiometricVerification, VideoKYC } from '@/lib/kyc-types';
import { useToast } from '@/hooks/use-toast';
import { Camera, Video, CheckCircle2, AlertCircle } from 'lucide-react';

interface BiometricVerificationFormProps {
  kycData: KYCData;
  onComplete: (data: Partial<KYCData>) => void;
  onBack: () => void;
}

const BiometricVerificationForm = ({ kycData, onComplete, onBack }: BiometricVerificationFormProps) => {
  const { toast } = useToast();
  const [biometricData, setBiometricData] = useState<BiometricVerification>(
    kycData.biometricVerification || {
      aadhaarXmlVerified: false,
      aadhaarOtpVerified: false,
    }
  );

  const [videoKYCData, setVideoKYCData] = useState<VideoKYC>(
    kycData.videoKYC || {
      completed: false,
    }
  );

  const handleAadhaarOTPVerification = () => {
    // Simulated OTP verification
    toast({
      title: 'OTP Sent',
      description: 'OTP sent to your Aadhaar-linked mobile number',
    });

    setTimeout(() => {
      setBiometricData((prev) => ({
        ...prev,
        aadhaarOtpVerified: true,
        verificationTimestamp: new Date().toISOString(),
      }));
      toast({
        title: 'Aadhaar Verified',
        description: 'Aadhaar OTP verification successful',
      });
    }, 2000);
  };

  const handleVideoKYC = () => {
    // Simulated Video KYC
    toast({
      title: 'Starting Video KYC',
      description: 'Please ensure good lighting and show your face clearly',
    });

    setTimeout(() => {
      setVideoKYCData({
        completed: true,
        faceMatchScore: 98.5,
        livenessDetected: true,
        geoLocation: { latitude: 28.7041, longitude: 77.1025 },
        verificationTimestamp: new Date().toISOString(),
      });
      toast({
        title: 'Video KYC Completed',
        description: 'Face match successful with 98.5% accuracy',
      });
    }, 3000);
  };

  const handleSubmit = () => {
    onComplete({
      biometricVerification: biometricData,
      videoKYC: videoKYCData,
    });
    toast({
      title: 'Verification Complete',
      description: 'Biometric verification completed',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biometric & Video KYC Verification</CardTitle>
        <CardDescription>Complete Aadhaar-based verification and Video KYC (Optional but recommended)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Aadhaar OTP Verification */}
        <div className="p-4 border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Aadhaar OTP Verification</h3>
                <p className="text-sm text-muted-foreground">Verify using Aadhaar OTP</p>
              </div>
            </div>
            {biometricData.aadhaarOtpVerified && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          </div>

          {!biometricData.aadhaarOtpVerified ? (
            <Button onClick={handleAadhaarOTPVerification}>Send OTP to Aadhaar Mobile</Button>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Verified on {new Date(biometricData.verificationTimestamp!).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Video KYC */}
        <div className="p-4 border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Video KYC</h3>
                <p className="text-sm text-muted-foreground">Face match and liveness detection</p>
              </div>
            </div>
            {videoKYCData.completed && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          </div>

          {!videoKYCData.completed ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div>
                  <p>Requirements for Video KYC:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Well-lit environment</li>
                    <li>Clear face visibility</li>
                    <li>Original documents in hand</li>
                    <li>Stable internet connection</li>
                  </ul>
                </div>
              </div>
              <Button onClick={handleVideoKYC}>Start Video KYC</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Completed on {new Date(videoKYCData.verificationTimestamp!).toLocaleString()}</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Face Match Score: {videoKYCData.faceMatchScore}%</p>
                <p>Liveness: {videoKYCData.livenessDetected ? 'Detected' : 'Not Detected'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleSubmit}>Continue</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BiometricVerificationForm;
