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
    requestedAmount: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      requestedAmount: parseFloat(formData.requestedAmount),
    });

    toast({
      title: "Trip created successfully!",
      description: "Your financing request is now live for lenders",
    });

    navigate('/dashboard/load_owner');
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
                  <Input
                    id="origin"
                    name="origin"
                    placeholder="e.g., Mumbai, Maharashtra"
                    value={formData.origin}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Destination City</Label>
                  <Input
                    id="destination"
                    name="destination"
                    placeholder="e.g., Delhi, NCR"
                    value={formData.destination}
                    onChange={handleChange}
                    required
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

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Total Invoice Amount (₹)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="e.g., 350000"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestedAmount">Financing Requested (₹)</Label>
                  <Input
                    id="requestedAmount"
                    name="requestedAmount"
                    type="number"
                    placeholder="e.g., 280000 (80% of invoice)"
                    value={formData.requestedAmount}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Usually 70-80% of invoice value</p>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Financing Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Invoice Amount:</p>
                    <p className="font-medium">₹{formData.amount ? parseFloat(formData.amount).toLocaleString('en-IN') : '0'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Financing Requested:</p>
                    <p className="font-medium">₹{formData.requestedAmount ? parseFloat(formData.requestedAmount).toLocaleString('en-IN') : '0'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Financing %:</p>
                    <p className="font-medium">
                      {formData.amount && formData.requestedAmount
                        ? ((parseFloat(formData.requestedAmount) / parseFloat(formData.amount)) * 100).toFixed(1)
                        : '0'}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expected Interest Range:</p>
                    <p className="font-medium">10-18% per trip</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-gradient-primary flex-1">
                  Submit Financing Request
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard/load_owner')}>
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
