import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/auth";
import { data } from "@/lib/data";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { CityCombobox } from "@/components/CityCombobox";

const CreateTrip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    distance: "",
    loadType: "",
    weight: "",
    amount: "",
  });

  const [ewayBillFile, setEwayBillFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCityChange = (field: 'origin' | 'destination', value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10 MB limit)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: "E-Way bill file size must be less than 10 MB",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
      setEwayBillFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create trip first
      const trip = await data.createTrip({
        loadOwnerId: user?.id || 'lo1',
        loadOwnerName: user?.name || 'Load Provider',
        origin: formData.origin,
        destination: formData.destination,
        distance: parseFloat(formData.distance),
        loadType: formData.loadType,
        weight: parseFloat(formData.weight),
        amount: parseFloat(formData.amount),
      });

      // If eWay bill is uploaded, convert to Base64 and save it
      if (ewayBillFile && trip) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64String = reader.result as string;
            console.log('📤 Uploading eWay bill for trip:', trip.id);
            console.log('📄 File size:', base64String.length, 'characters');

            // Update trip with eWay bill document
            await data.updateTrip(trip.id, {
              documents: {
                ewaybill: base64String,
              },
            });

            console.log('✅ eWay bill uploaded successfully');

            // Verify the document was saved by fetching the trip again
            const verifyTrip = await data.getTrip(trip.id);
            if (verifyTrip?.documents?.ewaybill) {
              console.log('✅ Verified: eWay bill is saved in database');
            } else {
              console.warn('⚠️  Warning: eWay bill might not be saved correctly');
            }

            toast({
              title: "Trip created successfully!",
              description: "Your financing request with e-Way bill is now live for lenders",
            });

            navigate('/dashboard/load_owner');
          } catch (error) {
            console.error('❌ Error uploading eWay bill:', error);
            toast({
              title: "Trip created, but eWay bill upload failed",
              description: "You can upload the eWay bill later from the trip details",
              variant: "destructive",
            });
            navigate('/dashboard/load_owner');
          } finally {
            setIsSubmitting(false);
          }
        };

        reader.onerror = () => {
          toast({
            title: "Trip created, but eWay bill upload failed",
            description: "You can upload the eWay bill later from the trip details",
            variant: "destructive",
          });
          navigate('/dashboard/load_owner');
          setIsSubmitting(false);
        };

        reader.readAsDataURL(ewayBillFile);
      } else {
        toast({
          title: "Trip created successfully!",
          description: "Your financing request is now live for lenders",
        });
        navigate('/dashboard/load_owner');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      toast({
        title: "Error creating trip",
        description: "Please try again",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="load_owner">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Trip</CardTitle>
            <CardDescription>Request invoice financing for your logistics trip</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin City</Label>
                  <CityCombobox
                    id="origin"
                    value={formData.origin}
                    onChange={(value) => handleCityChange('origin', value)}
                    placeholder="Select origin city..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Destination City</Label>
                  <CityCombobox
                    id="destination"
                    value={formData.destination}
                    onChange={(value) => handleCityChange('destination', value)}
                    placeholder="Select destination city..."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input
                    id="distance"
                    name="distance"
                    type="number"
                    placeholder="e.g., 1400"
                    value={formData.distance}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Load Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    placeholder="e.g., 15000"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loadType">Load Type</Label>
                <Input
                  id="loadType"
                  name="loadType"
                  placeholder="e.g., Electronics, Textiles, Machinery"
                  value={formData.loadType}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Trip Value (₹)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="e.g., 25000"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-muted-foreground">Enter trip value</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ewayBill">E-Way Bill (Optional)</Label>
                <Input
                  id="ewayBill"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                />
                {ewayBillFile && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    ✓ {ewayBillFile.name} ({(ewayBillFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload your e-Way bill document (JPG, PNG, or PDF - max 10 MB)
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Financing Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Trip Value:</p>
                    <p className="font-medium">₹{formData.amount ? parseFloat(formData.amount).toLocaleString('en-IN') : '0'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expected Interest Range:</p>
                    <p className="font-medium">10-18% per trip</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-gradient-primary flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Trip...' : 'Submit Financing Request'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard/load_owner')} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateTrip;
