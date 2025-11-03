import { useState, useEffect } from 'react';
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
  Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Sparkles, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
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
import ReportChart from '@/components/ReportChart';

// Icon mapping
const iconMap: Record<string, any> = {
  Package, DollarSign, PieChart, TrendingUp, Briefcase, Shield, BarChart3,
  TruckIcon, Wallet, Award, LayoutDashboard, Users, ArrowLeftRight, FileCheck,
  Receipt, Calculator,
};

const Reports = () => {
  const user = auth.getCurrentUser();
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filter, setFilter] = useState<ReportFilter>({
    period: 'monthly',
  });
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<TableFilter>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  if (!user) {
    return <div>Please login to view reports</div>;
  }

  const availableReports = getReportsByRole(user.role);
  const categories = Array.from(new Set(availableReports.map(r => r.category)));

  const filteredReports = activeCategory === 'all'
    ? availableReports
    : availableReports.filter(r => r.category === activeCategory);

  const handleGenerateReport = async (type: ReportType) => {
    setIsGenerating(true);
    try {
      const report = await reportService.generateReport(type, filter, user.id, user.role);
      setSelectedReport(report);
      setCurrentPage(1); // Reset to first page
      setTableFilter({}); // Clear filters
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
    if (!selectedReport) return { data: [], total: 0 };

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

    const total = filtered.length;

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return { data: paginatedData, total };
  };

  const filteredDetails = getFilteredAndSortedDetails();
  const totalPages = Math.ceil(filteredDetails.total / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tableFilter, itemsPerPage]);

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
      case 'financial': return 'text-green-700 bg-green-100 border-green-300 dark:text-green-400 dark:bg-green-950 dark:border-green-800';
      case 'operational': return 'text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800';
      case 'performance': return 'text-purple-700 bg-purple-100 border-purple-300 dark:text-purple-400 dark:bg-purple-950 dark:border-purple-800';
      case 'compliance': return 'text-orange-700 bg-orange-100 border-orange-300 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800';
      default: return 'text-gray-700 bg-gray-100 border-gray-300 dark:text-gray-400 dark:bg-gray-900 dark:border-gray-700';
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
          <div className="w-full overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="w-full sm:w-auto inline-flex min-w-full sm:min-w-0">
              <TabsTrigger value="all" className="text-xs sm:text-sm flex-1 sm:flex-none">All Reports</TabsTrigger>
              <TabsTrigger value="financial" className="text-xs sm:text-sm flex-1 sm:flex-none">Financial</TabsTrigger>
              <TabsTrigger value="operational" className="text-xs sm:text-sm flex-1 sm:flex-none">Operational</TabsTrigger>
              <TabsTrigger value="performance" className="text-xs sm:text-sm flex-1 sm:flex-none">Performance</TabsTrigger>
              <TabsTrigger value="compliance" className="text-xs sm:text-sm flex-1 sm:flex-none">Compliance</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeCategory} className="mt-6">
            {/* Available Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredReports.map((report) => {
                const Icon = iconMap[report.icon] || FileText;
                const CategoryIcon = getCategoryIcon(report.category);

                return (
                  <Card
                    key={report.type}
                    className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 relative overflow-hidden flex flex-col"
                  >
                    {/* Background gradient effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <CardHeader className="relative p-3 sm:p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="p-2 sm:p-3 bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/10 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm shrink-0">
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm sm:text-base group-hover:text-primary transition-colors truncate">
                              {report.title}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge variant="outline" className={`${getCategoryColor(report.category)} font-medium text-xs shrink-0 self-start`}>
                          <CategoryIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          <span className="truncate">{report.category}</span>
                        </Badge>
                      </div>
                      <CardDescription className="mt-2 sm:mt-3 text-xs sm:text-sm">
                        {report.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative flex-1 flex flex-col p-3 sm:p-4 md:p-6">
                      <div className="flex-1 space-y-2 sm:space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5 sm:mb-2">Key Metrics:</p>
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
                      </div>
                      <Button
                        onClick={() => handleGenerateReport(report.type)}
                        className="w-full mt-2 sm:mt-3 h-9 sm:h-8 touch-target"
                        size="sm"
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                            <span className="text-xs sm:text-sm">Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            <span className="text-xs sm:text-sm">Generate Report</span>
                          </>
                        )}
                      </Button>
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
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg md:text-xl truncate">{selectedReport.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Generated on {new Date(selectedReport.generatedAt).toLocaleString()} •
                    Period: {selectedReport.period}
                  </CardDescription>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="h-8 sm:h-9 text-xs sm:text-sm touch-target">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadExcel} className="h-8 sm:h-9 text-xs sm:text-sm touch-target">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Excel</span>
                    <span className="sm:hidden">XLS</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
              {/* Summary Section */}
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="text-base sm:text-lg font-semibold">Key Metrics</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {selectedReport.summary.trends?.map((trend, idx) => (
                    <Card key={idx} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
                      <CardContent className="p-3 sm:p-4 md:p-5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 sm:mb-2 truncate">
                          {trend.label}
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
                          {trend.value}
                        </p>
                        {trend.change !== undefined && (
                          <div className="mt-2 sm:mt-3 flex items-center gap-1 flex-wrap">
                            <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                              trend.change >= 0
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {trend.change >= 0 ? (
                                <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                              ) : (
                                <ArrowDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                              )}
                              {Math.abs(trend.change)}%
                            </span>
                            <span className="text-xs text-muted-foreground">vs last period</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Details Table */}
              {selectedReport.details.length > 0 && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <h3 className="text-base sm:text-lg font-semibold">Detailed Data</h3>
                    </div>
                    <TableAdvancedFilter
                      columns={Object.keys(selectedReport.details[0])}
                      filter={tableFilter}
                      onFilterChange={setTableFilter}
                      data={selectedReport.details}
                    />
                  </div>
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-muted/50 to-muted">
                          <tr>
                            {Object.keys(selectedReport.details[0]).map((key) => (
                              <th
                                key={key}
                                className="text-left p-4 text-sm font-semibold text-foreground border-b"
                              >
                                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDetails.data.length > 0 ? (
                            filteredDetails.data.map((row, idx) => (
                              <tr
                                key={idx}
                                className="border-b last:border-b-0 hover:bg-primary/5 transition-colors duration-150"
                              >
                                {Object.values(row).map((value: any, vidx) => (
                                  <td key={vidx} className="p-4 text-sm">
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
                                className="p-12 text-center"
                              >
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                  <Search className="h-12 w-12 mb-3 opacity-30" />
                                  <p className="font-medium">No results found</p>
                                  <p className="text-sm mt-1">Try adjusting your filters</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination Controls */}
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    {/* Results Info */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
                      <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                        Showing{' '}
                        <span className="font-medium text-foreground">
                          {filteredDetails.total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                        </span>
                        {' '}-{' '}
                        <span className="font-medium text-foreground">
                          {Math.min(currentPage * itemsPerPage, filteredDetails.total)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium text-foreground">{filteredDetails.total}</span>
                        {' '}records
                      </div>

                      {/* Items per page selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">Rows:</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => setItemsPerPage(Number(value))}
                        >
                          <SelectTrigger className="w-[60px] sm:w-[70px] h-8 sm:h-9 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 touch-target"
                      >
                        <ChevronsLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 touch-target"
                      >
                        <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="h-8 w-8 p-0 text-xs sm:text-sm touch-target"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="h-8 w-8 p-0 touch-target"
                      >
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="h-8 w-8 p-0 touch-target"
                      >
                        <ChevronsRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts */}
              {selectedReport.charts && selectedReport.charts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Visual Analytics</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedReport.charts.map((chart, idx) => (
                      <Card key={idx} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                          <CardTitle className="text-base flex items-center gap-2">
                            <PieChart className="h-4 w-4" />
                            {chart.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="h-80">
                            <ReportChart chart={chart} />
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
