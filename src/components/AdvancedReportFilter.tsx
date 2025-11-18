import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReportFilter } from '@/types/reports';
import { Filter, X, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdvancedReportFilterProps {
  filter: ReportFilter;
  onFilterChange: (filter: ReportFilter) => void;
}

export const AdvancedReportFilter = ({ filter, onFilterChange }: AdvancedReportFilterProps) => {
  const [open, setOpen] = useState(false);
  const [localFilter, setLocalFilter] = useState<ReportFilter>(filter);

  const handleApply = () => {
    onFilterChange(localFilter);
    setOpen(false);
  };

  const handleReset = () => {
    const resetFilter: ReportFilter = { period: 'monthly' };
    setLocalFilter(resetFilter);
    onFilterChange(resetFilter);
  };

  const activeFiltersCount = Object.keys(filter).filter(
    key => filter[key as keyof ReportFilter] !== undefined && key !== 'period'
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Report Filters
          </DialogTitle>
          <DialogDescription>
            Configure detailed filters for your report generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={localFilter.startDate || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, startDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={localFilter.endDate || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, endDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Amount Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Trip Value Range (₹)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amountMin">Minimum Amount</Label>
                <Input
                  id="amountMin"
                  type="number"
                  placeholder="0"
                  value={localFilter.amountMin || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, amountMin: parseFloat(e.target.value) || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="amountMax">Maximum Amount</Label>
                <Input
                  id="amountMax"
                  type="number"
                  placeholder="10000000"
                  value={localFilter.amountMax || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, amountMax: parseFloat(e.target.value) || undefined })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Distance & Weight */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Distance & Weight Range</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="distanceMin">Min Distance (km)</Label>
                <Input
                  id="distanceMin"
                  type="number"
                  placeholder="0"
                  value={localFilter.distanceMin || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, distanceMin: parseFloat(e.target.value) || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="distanceMax">Max Distance (km)</Label>
                <Input
                  id="distanceMax"
                  type="number"
                  placeholder="5000"
                  value={localFilter.distanceMax || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, distanceMax: parseFloat(e.target.value) || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="weightMin">Min Weight (kg)</Label>
                <Input
                  id="weightMin"
                  type="number"
                  placeholder="0"
                  value={localFilter.weightMin || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, weightMin: parseFloat(e.target.value) || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="weightMax">Max Weight (kg)</Label>
                <Input
                  id="weightMax"
                  type="number"
                  placeholder="50000"
                  value={localFilter.weightMax || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, weightMax: parseFloat(e.target.value) || undefined })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Location Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  type="text"
                  placeholder="Enter origin city"
                  value={localFilter.origin || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, origin: e.target.value || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  type="text"
                  placeholder="Enter destination city"
                  value={localFilter.destination || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, destination: e.target.value || undefined })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Company Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Company Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="clientCompany">Client Company</Label>
                <Input
                  id="clientCompany"
                  type="text"
                  placeholder="Enter client company name"
                  value={localFilter.clientCompany || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, clientCompany: e.target.value || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="senderCompany">Sender Company</Label>
                <Input
                  id="senderCompany"
                  type="text"
                  placeholder="Enter sender company"
                  value={localFilter.senderCompany || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, senderCompany: e.target.value || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="receiverCompany">Receiver Company</Label>
                <Input
                  id="receiverCompany"
                  type="text"
                  placeholder="Enter receiver company"
                  value={localFilter.receiverCompany || ''}
                  onChange={(e) => setLocalFilter({ ...localFilter, receiverCompany: e.target.value || undefined })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Risk & Interest Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Risk & Interest Rate</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="riskLevel">Risk Level</Label>
                <Select
                  value={localFilter.riskLevel || 'all'}
                  onValueChange={(value) => setLocalFilter({ ...localFilter, riskLevel: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Risk Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interestRateMin">Min Interest Rate (%)</Label>
                  <Input
                    id="interestRateMin"
                    type="number"
                    placeholder="0"
                    value={localFilter.interestRateMin || ''}
                    onChange={(e) => setLocalFilter({ ...localFilter, interestRateMin: parseFloat(e.target.value) || undefined })}
                    className="mt-1"
                    min="0"
                    max="20"
                    step="0.5"
                  />
                </div>
                <div>
                  <Label htmlFor="interestRateMax">Max Interest Rate (%)</Label>
                  <Input
                    id="interestRateMax"
                    type="number"
                    placeholder="20"
                    value={localFilter.interestRateMax || ''}
                    onChange={(e) => setLocalFilter({ ...localFilter, interestRateMax: parseFloat(e.target.value) || undefined })}
                    className="mt-1"
                    min="0"
                    max="20"
                    step="0.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grouping & Sorting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data Grouping & Sorting</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="groupBy">Group By</Label>
                <Select
                  value={localFilter.groupBy || 'none'}
                  onValueChange={(value) => setLocalFilter({ ...localFilter, groupBy: value === 'none' ? undefined : value as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="No Grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="day">By Day</SelectItem>
                    <SelectItem value="week">By Week</SelectItem>
                    <SelectItem value="month">By Month</SelectItem>
                    <SelectItem value="company">By Company</SelectItem>
                    <SelectItem value="loadType">By Load Type</SelectItem>
                    <SelectItem value="status">By Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sortBy">Sort By</Label>
                <Select
                  value={localFilter.sortBy || 'date'}
                  onValueChange={(value) => setLocalFilter({ ...localFilter, sortBy: value as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="weight">Weight</SelectItem>
                    <SelectItem value="returns">Returns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Select
                  value={localFilter.sortOrder || 'desc'}
                  onValueChange={(value) => setLocalFilter({ ...localFilter, sortOrder: value as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Descending" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            <X className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
