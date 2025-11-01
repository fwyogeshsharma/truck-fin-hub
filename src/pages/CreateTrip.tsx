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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCityChange = (field: 'origin' | 'destination', value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trip = data.createTrip({
      loadOwnerId: user?.id || 'lo1',
      loadOwnerName: user?.name || 'Load Provider',
      origin: formData.origin,
      destination: formData.destination,
      distance: parseFloat(formData.distance),
      loadType: formData.loadType,
      weight: parseFloat(formData.weight),
      amount: parseFloat(formData.amount),
    });

    toast({
      title: "Trip created successfully!",
      description: "Your financing request is now live for lenders",
    });

    navigate('/dashboard/load_owner');
  };

  return (
    <DashboardLayout role="load_owner">
      <div className="max-w-3xl mx-auto mobile-container">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="responsive-heading-3">Create New Trip</CardTitle>
            <CardDescription className="text-sm">Request invoice financing for your logistics trip</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="mobile-section-spacing">
              {/* City Selection - Mobile optimized */}
              <div className="mobile-form-grid">
                <div className="space-y-2">
                  <Label htmlFor="origin" className="text-sm sm:text-base">Origin City</Label>
                  <CityCombobox
                    id="origin"
                    value={formData.origin}
                    onChange={(value) => handleCityChange('origin', value)}
                    placeholder="Select origin city..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination" className="text-sm sm:text-base">Destination City</Label>
                  <CityCombobox
                    id="destination"
                    value={formData.destination}
                    onChange={(value) => handleCityChange('destination', value)}
                    placeholder="Select destination city..."
                  />
                </div>
              </div>

              {/* Distance and Weight - Mobile optimized */}
              <div className="mobile-form-grid">
                <div className="space-y-2">
                  <Label htmlFor="distance" className="text-sm sm:text-base">Distance (km)</Label>
                  <Input
                    id="distance"
                    name="distance"
                    type="number"
                    placeholder="e.g., 1400"
                    value={formData.distance}
                    onChange={handleChange}
                    required
                    className="touch-target"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm sm:text-base">Load Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    placeholder="e.g., 15000"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                    className="touch-target"
                  />
                </div>
              </div>

              {/* Load Type - Full width */}
              <div className="space-y-2">
                <Label htmlFor="loadType" className="text-sm sm:text-base">Load Type</Label>
                <Input
                  id="loadType"
                  name="loadType"
                  placeholder="e.g., Electronics, Textiles, Machinery"
                  value={formData.loadType}
                  onChange={handleChange}
                  required
                  className="touch-target"
                />
              </div>

              {/* Trip Value */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm sm:text-base">Trip Value (₹)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="e.g., 25000"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="touch-target"
                />
                <p className="text-xs text-muted-foreground">Enter trip value</p>
              </div>

              {/* Financing Summary - Mobile optimized */}
              <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm sm:text-base">Financing Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm">Trip Value:</p>
                    <p className="font-medium text-sm sm:text-base">₹{formData.amount ? parseFloat(formData.amount).toLocaleString('en-IN') : '0'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs sm:text-sm">Expected Interest Range:</p>
                    <p className="font-medium text-sm sm:text-base">10-18% per trip</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Mobile optimized */}
              <div className="mobile-action-group">
                <Button type="submit" className="bg-gradient-primary mobile-button touch-target">
                  Submit Financing Request
                </Button>
                <Button type="button" variant="outline" className="mobile-button touch-target" onClick={() => navigate('/dashboard/load_owner')}>
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
