import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date' | 'range';
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

interface AdvancedFilterProps {
  filters: FilterConfig[];
  onFilterChange: (filters: Record<string, any>) => void;
  currentFilters: Record<string, any>;
  onClearFilters: () => void;
}

/**
 * AdvancedFilter Component
 *
 * Reusable filter component with slide-out panel
 * Supports text, select, number, date, and range filters
 */
const AdvancedFilter = ({
  filters,
  onFilterChange,
  currentFilters,
  onClearFilters,
}: AdvancedFilterProps) => {
  const [localFilters, setLocalFilters] = useState<Record<string, any>>(currentFilters);
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (filterId: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterId]: value,
    }));
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters();
    setIsOpen(false);
  };

  const activeFilterCount = Object.values(currentFilters).filter(v =>
    v !== null && v !== undefined && v !== ''
  ).length;

  const renderFilterInput = (filter: FilterConfig) => {
    const value = localFilters[filter.id] || '';

    switch (filter.type) {
      case 'text':
        return (
          <div key={filter.id} className="space-y-2">
            <Label htmlFor={filter.id}>{filter.label}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id={filter.id}
                type="text"
                placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
                value={value}
                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={filter.id} className="space-y-2">
            <Label htmlFor={filter.id}>{filter.label}</Label>
            <Select
              value={value}
              onValueChange={(val) => handleFilterChange(filter.id, val)}
            >
              <SelectTrigger id={filter.id}>
                <SelectValue placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'number':
        return (
          <div key={filter.id} className="space-y-2">
            <Label htmlFor={filter.id}>{filter.label}</Label>
            <Input
              id={filter.id}
              type="number"
              placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
              value={value}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              min={filter.min}
              max={filter.max}
            />
          </div>
        );

      case 'date':
        return (
          <div key={filter.id} className="space-y-2">
            <Label htmlFor={filter.id}>{filter.label}</Label>
            <Input
              id={filter.id}
              type="date"
              value={value}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            />
          </div>
        );

      case 'range':
        return (
          <div key={filter.id} className="space-y-2">
            <Label>{filter.label}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`${filter.id}-min`} className="text-xs text-muted-foreground">
                  Min
                </Label>
                <Input
                  id={`${filter.id}-min`}
                  type="number"
                  placeholder="Min"
                  value={localFilters[`${filter.id}_min`] || ''}
                  onChange={(e) => handleFilterChange(`${filter.id}_min`, e.target.value)}
                  min={filter.min}
                />
              </div>
              <div>
                <Label htmlFor={`${filter.id}-max`} className="text-xs text-muted-foreground">
                  Max
                </Label>
                <Input
                  id={`${filter.id}-max`}
                  type="number"
                  placeholder="Max"
                  value={localFilters[`${filter.id}_max`] || ''}
                  onChange={(e) => handleFilterChange(`${filter.id}_max`, e.target.value)}
                  max={filter.max}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="ml-1 px-1.5 min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Filter and refine your results based on specific criteria
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {filters.map((filter) => renderFilterInput(filter))}
        </div>

        <SheetFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear All
          </Button>
          <Button onClick={handleApplyFilters} className="bg-gradient-primary gap-2">
            <Filter className="h-4 w-4" />
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFilter;
