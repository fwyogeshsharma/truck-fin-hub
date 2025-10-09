import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { getReportsByRole, reportConfigs } from '@/config/reportConfigs';
import { reportService } from '@/services/reportService';
import { ReportData, ReportFilter, ReportType } from '@/types/reports';
import {
  Package, DollarSign, PieChart, TrendingUp, Briefcase, Shield, BarChart3,
  TruckIcon, Wallet, Award, LayoutDashboard, Users, ArrowLeftRight, FileCheck,
  Receipt, Calculator, Download, FileText, Calendar, Filter as FilterIcon,
  Search, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/currency';
import { TableAdvancedFilter, type TableFilter } from '@/components/TableAdvancedFilter';

// Icon mapping
const iconMap: Record<string, any> = {
  Package, DollarSign, PieChart, TrendingUp, Briefcase, Shield, BarChart3,
  TruckIcon, Wallet, Award, LayoutDashboard, Users, ArrowLeftRight, FileCheck,
  Receipt, Calculator,
};

const Reports = () => {
  const user = auth.getCurrentUser();
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [filter, setFilter] = useState<ReportFilter>({
    period: 'monthly',
  });
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<TableFilter>({});

  if (!user) {
    return <div>Please login to view reports</div>;
  }

  const availableReports = getReportsByRole(user.role);
  const categories = Array.from(new Set(availableReports.map(r => r.category)));

  const filteredReports = activeCategory === 'all'
    ? availableReports
    : availableReports.filter(r => r.category === activeCategory);

  const handleGenerateReport = (type: ReportType) => {
    const report = reportService.generateReport(type, filter, user.id);
    setSelectedReport(report);
  };

  const handleDownloadPDF = () => {
    if (!selectedReport) return;
    alert('PDF download functionality will be implemented soon!');
  };

  const handleDownloadExcel = () => {
    if (!selectedReport) return;
    alert('Excel download functionality will be implemented soon!');
  };

  const getFilteredAndSortedDetails = () => {
    if (!selectedReport) return [];

    let filtered = [...selectedReport.details];

    // Apply global search filter
    if (tableFilter.searchTerm) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(tableFilter.searchTerm!.toLowerCase())
        )
      );
    }

    // Apply column-specific filters
    if (tableFilter.columns) {
      Object.entries(tableFilter.columns).forEach(([column, filterValue]) => {
        if (filterValue === undefined) return;

        // Handle min/max filters for numbers
        if (column.endsWith('_min')) {
          const baseColumn = column.replace('_min', '');
          filtered = filtered.filter((row) => {
            const value = row[baseColumn];
            return typeof value === 'number' && value >= (filterValue as number);
          });
        } else if (column.endsWith('_max')) {
          const baseColumn = column.replace('_max', '');
          filtered = filtered.filter((row) => {
            const value = row[baseColumn];
            return typeof value === 'number' && value <= (filterValue as number);
          });
        } else {
          // Handle exact match or text search
          filtered = filtered.filter((row) =>
            String(row[column]).toLowerCase().includes(String(filterValue).toLowerCase())
          );
        }
      });
    }

    // Apply sorting
    if (tableFilter.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[tableFilter.sortBy!];
        const bValue = b[tableFilter.sortBy!];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return tableFilter.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();

        if (tableFilter.sortOrder === 'asc') {
          return aString.localeCompare(bString);
        } else {
          return bString.localeCompare(aString);
        }
      });
    }

    return filtered;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return DollarSign;
      case 'operational': return Package;
      case 'performance': return TrendingUp;
      case 'compliance': return Shield;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'text-green-600 bg-green-50 border-green-200';
      case 'operational': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'performance': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'compliance': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <DashboardLayout role={user.role}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Generate detailed reports and insights for your business
          </p>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="operational">Operational</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value={activeCategory} className="mt-6">
            {/* Available Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredReports.map((report) => {
                const Icon = iconMap[report.icon] || FileText;
                const CategoryIcon = getCategoryIcon(report.category);

                return (
                  <Card key={report.type} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{report.title}</CardTitle>
                          </div>
                        </div>
                        <Badge variant="outline" className={getCategoryColor(report.category)}>
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {report.category}
                        </Badge>
                      </div>
                      <CardDescription className="mt-2">
                        {report.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Key Metrics:</p>
                          <div className="flex flex-wrap gap-1">
                            {report.dataPoints.slice(0, 3).map((point) => (
                              <Badge key={point} variant="secondary" className="text-xs">
                                {point}
                              </Badge>
                            ))}
                            {report.dataPoints.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{report.dataPoints.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleGenerateReport(report.type)}
                          className="w-full"
                          size="sm"
                        >
                          Generate Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Generated Report Display */}
        {selectedReport && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedReport.title}</CardTitle>
                  <CardDescription>
                    Generated on {new Date(selectedReport.generatedAt).toLocaleString()} •
                    Period: {selectedReport.period}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedReport.summary.trends?.map((trend, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{trend.label}</p>
                        <p className="text-2xl font-bold mt-1">{trend.value}</p>
                        {trend.change !== undefined && (
                          <p className={`text-sm mt-1 ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.change >= 0 ? '↑' : '↓'} {Math.abs(trend.change)}%
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Details Table */}
              {selectedReport.details.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Details</h3>
                    <TableAdvancedFilter
                      columns={Object.keys(selectedReport.details[0])}
                      filter={tableFilter}
                      onFilterChange={setTableFilter}
                      data={selectedReport.details}
                    />
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(selectedReport.details[0]).map((key) => (
                              <th
                                key={key}
                                className="text-left p-3 text-sm font-medium"
                              >
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredAndSortedDetails().length > 0 ? (
                            getFilteredAndSortedDetails().map((row, idx) => (
                              <tr key={idx} className="border-t hover:bg-muted/30 transition-colors">
                                {Object.values(row).map((value: any, vidx) => (
                                  <td key={vidx} className="p-3 text-sm">
                                    {typeof value === 'number' && value > 1000
                                      ? formatCurrency(value)
                                      : value}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={Object.keys(selectedReport.details[0]).length}
                                className="p-8 text-center text-muted-foreground"
                              >
                                No results found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Showing {getFilteredAndSortedDetails().length} of {selectedReport.details.length} records
                  </div>
                </div>
              )}

              {/* Charts */}
              {selectedReport.charts && selectedReport.charts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Visual Analytics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.charts.map((chart, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <CardTitle className="text-base">{chart.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                            <div className="text-center">
                              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Chart: {chart.type}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Install chart library for visualization
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
