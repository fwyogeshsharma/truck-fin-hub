import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import {
  Sun,
  Moon,
  Monitor,
  Sparkles,
  RotateCcw,
  Save,
  Palette,
  FileText,
  Upload,
  Trash2,
  Eye,
  X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/api/client';

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface UploadedContract {
  id: string;
  file: File;
  previewUrl: string;
  loanPercentage: string;
  contractType: '2-party' | '3-party' | '';
  party1Name: string;
  party2Name: string;
  party3Name: string;
  validityDate: string;
  tripStage: string; // Optional
}

const tripStages = [
  { value: '', label: 'None (Optional)' },
  { value: 'pending', label: 'Pending' },
  { value: 'bilty', label: 'Bilty Uploaded' },
  { value: 'advance_invoice', label: 'Advance Invoice' },
  { value: 'pod', label: 'POD (Proof of Delivery)' },
  { value: 'final_invoice', label: 'Final Invoice' },
  { value: 'funded', label: 'Funded/Escrowed' },
  { value: 'completed', label: 'Completed' },
];

const defaultTheme: ThemeSettings = {
  mode: 'light',
  primaryColor: '#084570', // LogiFin Primary
  secondaryColor: '#1D923C', // LogiFin Secondary
  accentColor: '#1D923C', // Same as secondary
};

const presetThemes = [
  {
    name: 'Default (LogiFin)',
    primaryColor: '#084570',
    secondaryColor: '#1D923C',
    accentColor: '#1D923C',
  },
  {
    name: 'Ocean Blue',
    primaryColor: '#0077BE',
    secondaryColor: '#00C9A7',
    accentColor: '#00C9A7',
  },
  {
    name: 'Sunset Orange',
    primaryColor: '#FF6B35',
    secondaryColor: '#F7931E',
    accentColor: '#FFD23F',
  },
  {
    name: 'Forest Green',
    primaryColor: '#2D6A4F',
    secondaryColor: '#52B788',
    accentColor: '#95D5B2',
  },
  {
    name: 'Royal Purple',
    primaryColor: '#6A4C93',
    secondaryColor: '#8B5FBF',
    accentColor: '#C084FC',
  },
  {
    name: 'Crimson Red',
    primaryColor: '#C1121F',
    secondaryColor: '#E63946',
    accentColor: '#F4A261',
  },
];

/**
 * Convert hex color to HSL format for CSS variables
 */
function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

/**
 * Apply theme colors to CSS variables
 */
function applyThemeColors(colors: Omit<ThemeSettings, 'mode'>) {
  const root = document.documentElement;
  const primaryHSL = hexToHSL(colors.primaryColor);
  const secondaryHSL = hexToHSL(colors.secondaryColor);
  const accentHSL = hexToHSL(colors.accentColor);

  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--secondary', secondaryHSL);
  root.style.setProperty('--accent', accentHSL);

  // Update primary variations
  const [h, s, l] = primaryHSL.split(' ');
  const lightness = parseInt(l);
  root.style.setProperty('--primary-light', `${h} ${s} ${Math.min(lightness + 15, 95)}%`);
  root.style.setProperty('--primary-dark', `${h} ${s} ${Math.max(lightness - 6, 5)}%`);

  // Update ring and sidebar colors
  root.style.setProperty('--ring', primaryHSL);
  root.style.setProperty('--sidebar-primary', primaryHSL);
  root.style.setProperty('--sidebar-ring', primaryHSL);

  // Update gradients
  const primaryHue = h;
  root.style.setProperty(
    '--gradient-primary',
    `linear-gradient(135deg, hsl(${primaryHSL}) 0%, hsl(${Number(primaryHue) - 20} 70% 55%) 100%)`
  );
  root.style.setProperty(
    '--gradient-hero',
    `linear-gradient(135deg, hsl(${primaryHSL}) 0%, hsl(${secondaryHSL}) 100%)`
  );
}

/**
 * Apply dark/light mode
 */
function applyThemeMode(mode: 'light' | 'dark' | 'system') {
  const root = document.documentElement;

  if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', mode === 'dark');
  }
}

const Settings = () => {
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [isSaving, setIsSaving] = useState(false);

  // Contract management state
  const [contracts, setContracts] = useState<UploadedContract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-settings');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setTheme(parsed);
        applyThemeColors(parsed);
        applyThemeMode(parsed.mode);
      } catch (error) {
        console.error('Failed to load saved theme:', error);
      }
    }
  }, []);

  const handleThemeChange = (updates: Partial<ThemeSettings>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);

    // Apply immediately for preview
    if ('mode' in updates) {
      applyThemeMode(newTheme.mode);
    } else {
      applyThemeColors(newTheme);
    }
  };

  const handlePresetSelect = (preset: typeof presetThemes[0]) => {
    handleThemeChange({
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
    });
  };

  const handleReset = () => {
    setTheme(defaultTheme);
    applyThemeColors(defaultTheme);
    applyThemeMode(defaultTheme.mode);
    localStorage.removeItem('theme-settings');

    toast({
      title: 'Theme reset',
      description: 'Theme has been reset to default settings.',
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Save to localStorage
      localStorage.setItem('theme-settings', JSON.stringify(theme));

      // Save to database (if API exists)
      try {
        await apiClient.post('/theme', {
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          accent_color: theme.accentColor,
          mode: theme.mode,
        });
      } catch (apiError) {
        console.log('API save failed, using localStorage only:', apiError);
      }

      toast({
        title: 'Theme saved!',
        description: 'Your theme preferences have been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save theme settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Contract handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newContracts: UploadedContract[] = [];

    Array.from(files).forEach((file) => {
      // Only accept PDF, images, and documents
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: `${file.name} is not a supported format. Please upload PDF or image files.`,
        });
        return;
      }

      const id = `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);

      newContracts.push({
        id,
        file,
        previewUrl,
        loanPercentage: '',
        contractType: '',
        party1Name: '',
        party2Name: '',
        party3Name: '',
        validityDate: '',
        tripStage: '',
      });
    });

    setContracts([...contracts, ...newContracts]);

    toast({
      title: 'Contracts uploaded',
      description: `${newContracts.length} contract(s) added successfully.`,
    });
  };

  const handleContractUpdate = (id: string, field: keyof UploadedContract, value: string) => {
    setContracts(contracts.map((contract) =>
      contract.id === id ? { ...contract, [field]: value } : contract
    ));
  };

  const handleDeleteContract = (id: string) => {
    const contract = contracts.find((c) => c.id === id);
    if (contract) {
      URL.revokeObjectURL(contract.previewUrl);
    }
    setContracts(contracts.filter((c) => c.id !== id));

    toast({
      title: 'Contract deleted',
      description: 'Contract has been removed.',
    });
  };

  const handleSaveContracts = async () => {
    // Validate contracts
    const invalidContracts = contracts.filter(
      (c) => !c.loanPercentage || !c.contractType || !c.party1Name || !c.party2Name || !c.validityDate ||
      (c.contractType === '3-party' && !c.party3Name)
    );

    if (invalidContracts.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Incomplete information',
        description: 'Please fill in all required fields for all contracts.',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Here you would upload to your API
      // For now, we'll save to localStorage
      const contractsData = contracts.map((contract) => ({
        id: contract.id,
        fileName: contract.file.name,
        fileSize: contract.file.size,
        fileType: contract.file.type,
        loanPercentage: contract.loanPercentage,
        contractType: contract.contractType,
        party1Name: contract.party1Name,
        party2Name: contract.party2Name,
        party3Name: contract.party3Name,
        validityDate: contract.validityDate,
        tripStage: contract.tripStage,
        uploadedAt: new Date().toISOString(),
      }));

      localStorage.setItem('uploaded-contracts', JSON.stringify(contractsData));

      toast({
        title: 'Contracts saved!',
        description: `${contracts.length} contract(s) saved successfully.`,
      });
    } catch (error) {
      console.error('Error saving contracts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save contracts.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout role={user?.role || 'lender'}>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your application preferences and configurations
          </p>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="agreements" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Agreements</span>
            </TabsTrigger>
            <TabsTrigger value="other" className="gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Other</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6 mt-6">
            {/* Theme Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Display Mode
                </CardTitle>
                <CardDescription>
                  Choose how the application should appear
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange({ mode: 'light' })}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all hover:border-primary ${
                      theme.mode === 'light' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Sun className="h-6 w-6" />
                    <span className="font-medium">Light</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange({ mode: 'dark' })}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all hover:border-primary ${
                      theme.mode === 'dark' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Moon className="h-6 w-6" />
                    <span className="font-medium">Dark</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange({ mode: 'system' })}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all hover:border-primary ${
                      theme.mode === 'system' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Monitor className="h-6 w-6" />
                    <span className="font-medium">System</span>
                  </button>
                </div>

                {theme.mode === 'system' && (
                  <p className="text-sm text-muted-foreground">
                    The theme will automatically switch based on your device settings
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Theme Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Theme Presets
                </CardTitle>
                <CardDescription>
                  Quick theme presets to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {presetThemes.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary transition-all text-left"
                    >
                      <div className="flex gap-1">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: preset.secondaryColor }}
                        />
                      </div>
                      <span className="text-sm font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Theme'}
              </Button>
              <Button onClick={handleReset} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </TabsContent>

          {/* Upload Agreement Tab */}
          <TabsContent value="agreements" className="space-y-6 mt-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Contracts
                </CardTitle>
                <CardDescription>
                  Upload multiple contract documents and fill in the required details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* File Upload Area */}
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <Input
                      type="file"
                      id="contract-upload"
                      multiple
                      accept=".pdf,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="contract-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, PNG, JPG (Multiple files supported)
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="mt-2">
                        Select Files
                      </Button>
                    </label>
                  </div>

                  {/* Uploaded Contracts Count */}
                  {contracts.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {contracts.length} contract(s) uploaded
                        </span>
                      </div>
                      <Button
                        onClick={handleSaveContracts}
                        disabled={isSaving || contracts.length === 0}
                        size="sm"
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save All Contracts'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contracts List */}
            {contracts.map((contract, index) => (
              <Card key={contract.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Contract {index + 1}: {contract.file.name}
                      </CardTitle>
                      <CardDescription>
                        {(contract.file.size / 1024).toFixed(2)} KB • {contract.file.type}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(contract.previewUrl, '_blank')}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteContract(contract.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Loan Percentage */}
                    <div className="space-y-2">
                      <Label htmlFor={`loan-${contract.id}`}>
                        Loan Percentage <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id={`loan-${contract.id}`}
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={contract.loanPercentage}
                          onChange={(e) =>
                            handleContractUpdate(contract.id, 'loanPercentage', e.target.value)
                          }
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                    </div>

                    {/* Contract Type */}
                    <div className="space-y-2">
                      <Label htmlFor={`type-${contract.id}`}>
                        Contract Type <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={contract.contractType}
                        onValueChange={(value: '2-party' | '3-party') =>
                          handleContractUpdate(contract.id, 'contractType', value)
                        }
                      >
                        <SelectTrigger id={`type-${contract.id}`}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2-party">2-Party Contract</SelectItem>
                          <SelectItem value="3-party">3-Party Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Party 1 Name */}
                    <div className="space-y-2">
                      <Label htmlFor={`party1-${contract.id}`}>
                        Party 1 Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`party1-${contract.id}`}
                        placeholder="Enter party 1 name"
                        value={contract.party1Name}
                        onChange={(e) =>
                          handleContractUpdate(contract.id, 'party1Name', e.target.value)
                        }
                      />
                    </div>

                    {/* Party 2 Name */}
                    <div className="space-y-2">
                      <Label htmlFor={`party2-${contract.id}`}>
                        Party 2 Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`party2-${contract.id}`}
                        placeholder="Enter party 2 name"
                        value={contract.party2Name}
                        onChange={(e) =>
                          handleContractUpdate(contract.id, 'party2Name', e.target.value)
                        }
                      />
                    </div>

                    {/* Party 3 Name (conditional) */}
                    {contract.contractType === '3-party' && (
                      <div className="space-y-2">
                        <Label htmlFor={`party3-${contract.id}`}>
                          Party 3 Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`party3-${contract.id}`}
                          placeholder="Enter party 3 name"
                          value={contract.party3Name}
                          onChange={(e) =>
                            handleContractUpdate(contract.id, 'party3Name', e.target.value)
                          }
                        />
                      </div>
                    )}

                    {/* Validity Date */}
                    <div className="space-y-2">
                      <Label htmlFor={`validity-${contract.id}`}>
                        Contract Validity Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`validity-${contract.id}`}
                        type="date"
                        value={contract.validityDate}
                        onChange={(e) =>
                          handleContractUpdate(contract.id, 'validityDate', e.target.value)
                        }
                      />
                    </div>

                    {/* Trip Stage (Optional) */}
                    <div className="space-y-2">
                      <Label htmlFor={`stage-${contract.id}`}>
                        Preferred Loan Stage <span className="text-muted-foreground">(Optional)</span>
                      </Label>
                      <Select
                        value={contract.tripStage}
                        onValueChange={(value) =>
                          handleContractUpdate(contract.id, 'tripStage', value)
                        }
                      >
                        <SelectTrigger id={`stage-${contract.id}`}>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {tripStages.map((stage) => (
                            <SelectItem key={stage.value} value={stage.value}>
                              {stage.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Select the trip stage at which the loan should be disbursed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State */}
            {contracts.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-2">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      No contracts uploaded yet. Upload your first contract to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Other Settings Tab */}
          <TabsContent value="other" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Other Settings</CardTitle>
                <CardDescription>
                  Additional application settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Additional settings will be added here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
