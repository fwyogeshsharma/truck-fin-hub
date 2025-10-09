import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface TableFilter {
  searchTerm?: string;
  columns?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface TableAdvancedFilterProps {
  columns: string[];
  filter: TableFilter;
  onFilterChange: (filter: TableFilter) => void;
  data: any[];
}

export const TableAdvancedFilter = ({ columns, filter, onFilterChange, data }: TableAdvancedFilterProps) => {
  const [open, setOpen] = useState(false);
  const [localFilter, setLocalFilter] = useState<TableFilter>(filter);

  // Get unique values for each column (for dropdown filters)
  const getUniqueValues = (columnKey: string) => {
    const values = new Set<string>();
    data.forEach(row => {
      const value = row[columnKey];
      if (value !== undefined && value !== null) {
        values.add(String(value));
      }
    });
    return Array.from(values).slice(0, 50); // Limit to 50 unique values
  };

  // Detect column type
  const getColumnType = (columnKey: string): 'number' | 'text' | 'date' => {
    const sampleValue = data.find(row => row[columnKey] !== undefined && row[columnKey] !== null)?.[columnKey];
    if (typeof sampleValue === 'number') return 'number';
    if (sampleValue instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(String(sampleValue))) return 'date';
    return 'text';
  };

  const handleApply = () => {
    onFilterChange(localFilter);
    setOpen(false);
  };

  const handleReset = () => {
    const resetFilter: TableFilter = {};
    setLocalFilter(resetFilter);
    onFilterChange(resetFilter);
  };

  const setColumnFilter = (column: string, value: any) => {
    setLocalFilter(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [column]: value || undefined,
      },
    }));
  };

  const activeFiltersCount = Object.keys(localFilter).filter(
    key => {
      if (key === 'columns') {
        return Object.values(localFilter.columns || {}).some(v => v !== undefined);
      }
      return localFilter[key as keyof TableFilter] !== undefined;
    }
  ).length + (localFilter.columns ? Object.values(localFilter.columns).filter(v => v).length - 1 : 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filter
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Table Filters
          </DialogTitle>
          <DialogDescription>
            Filter and sort the table data by any column
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Global Search */}
          <div>
            <Label htmlFor="searchTerm">Global Search</Label>
            <Input
              id="searchTerm"
              type="text"
              placeholder="Search across all columns..."
              value={localFilter.searchTerm || ''}
              onChange={(e) => setLocalFilter({ ...localFilter, searchTerm: e.target.value || undefined })}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Search for any value across all columns
            </p>
          </div>

          {/* Sorting */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sortBy">Sort By Column</Label>
              <Select
                value={localFilter.sortBy || 'none'}
                onValueChange={(value) => setLocalFilter({ ...localFilter, sortBy: value === 'none' ? undefined : value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="No Sorting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Sorting</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Select
                value={localFilter.sortOrder || 'asc'}
                onValueChange={(value) => setLocalFilter({ ...localFilter, sortOrder: value as 'asc' | 'desc' })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Ascending" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Column-specific Filters */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Filter by Column</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {columns.map((column) => {
                const columnType = getColumnType(column);
                const uniqueValues = getUniqueValues(column);

                return (
                  <div key={column}>
                    <Label htmlFor={`filter-${column}`} className="text-xs">
                      {column.charAt(0).toUpperCase() + column.slice(1)}
                    </Label>

                    {columnType === 'number' ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={localFilter.columns?.[`${column}_min`] || ''}
                          onChange={(e) => setColumnFilter(`${column}_min`, e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-1/2"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={localFilter.columns?.[`${column}_max`] || ''}
                          onChange={(e) => setColumnFilter(`${column}_max`, e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-1/2"
                        />
                      </div>
                    ) : uniqueValues.length > 0 && uniqueValues.length <= 20 ? (
                      <Select
                        value={localFilter.columns?.[column] || 'all'}
                        onValueChange={(value) => setColumnFilter(column, value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={`All ${column}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All {column}</SelectItem>
                          {uniqueValues.map((val) => (
                            <SelectItem key={val} value={val}>
                              {val}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`filter-${column}`}
                        type="text"
                        placeholder={`Filter by ${column}...`}
                        value={localFilter.columns?.[column] || ''}
                        onChange={(e) => setColumnFilter(column, e.target.value || undefined)}
                        className="mt-1"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
