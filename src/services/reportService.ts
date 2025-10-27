import { ReportData, ReportFilter, ReportType, ChartData } from '@/types/reports';
import { formatCurrency } from '@/lib/currency';
import { tripsAPI } from '@/api/trips';
import { db } from '@/lib/db';

// Sample data generator for reports with real data integration
export const reportService = {
  // Helper function to fetch real trips data
  async fetchTripsData(filter: ReportFilter, userId?: string, userRole?: string): Promise<any[]> {
    try {
      // Fetch trips from the database
      const filters: any = {};
      if (filter.status) filters.status = filter.status;

      // Filter by user role
      if (userRole === 'load_owner') {
        filters.loadOwnerId = userId;
      } else if (userRole === 'lender') {
        filters.lenderId = userId;
      }

      const trips = await tripsAPI.getAll(filters);
      return trips || [];
    } catch (error) {
      console.error('Error fetching trips data:', error);
      return [];
    }
  },

  // Helper to calculate aggregated metrics from real trips data
  calculateTripMetrics(trips: any[]) {
    const totalTrips = trips.length;
    const fundedTrips = trips.filter(t => t.status === 'funded' || t.status === 'in_transit' || t.status === 'completed').length;
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const inProgressTrips = trips.filter(t => t.status === 'in_transit' || t.status === 'funded').length;
    const pendingTrips = trips.filter(t => t.status === 'pending' || t.status === 'escrowed').length;

    const totalAmount = trips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgAmount = totalTrips > 0 ? totalAmount / totalTrips : 0;

    return {
      totalTrips,
      fundedTrips,
      completedTrips,
      inProgressTrips,
      pendingTrips,
      totalAmount,
      avgAmount
    };
  },

  // Generate report based on type and filters
  async generateReport(type: ReportType, filter: ReportFilter, userId: string, userRole?: string): Promise<ReportData> {
    const reportGenerators: Record<ReportType, () => Promise<ReportData>> = {
      // Load Owner Reports
      trip_summary: () => this.generateTripSummary(filter, userId, userRole),
      funding_analysis: () => this.generateFundingAnalysis(filter, userId, userRole),
      cost_breakdown: () => this.generateCostBreakdown(filter, userId, userRole),
      trip_performance: () => this.generateTripPerformance(filter, userId, userRole),

      // Lender Reports
      portfolio_summary: () => this.generatePortfolioSummary(filter, userId, userRole),
      returns_analysis: () => this.generateReturnsAnalysis(filter, userId, userRole),
      risk_assessment: () => this.generateRiskAssessment(filter, userId, userRole),
      investment_performance: () => this.generateInvestmentPerformance(filter, userId, userRole),

      // Transporter Reports
      delivery_summary: () => this.generateDeliverySummary(filter, userId, userRole),
      earnings_report: () => this.generateEarningsReport(filter, userId, userRole),
      performance_metrics: () => this.generatePerformanceMetrics(filter, userId, userRole),

      // Admin Reports
      platform_overview: () => this.generatePlatformOverview(filter),
      user_analytics: () => this.generateUserAnalytics(filter),
      transaction_summary: () => this.generateTransactionSummary(filter),
      kyc_status_report: () => this.generateKYCStatusReport(filter),

      // Common Reports
      wallet_statement: () => this.generateWalletStatement(filter, userId),
      tax_summary: () => this.generateTaxSummary(filter, userId),
    };

    return await reportGenerators[type]();
  },

  // Load Owner Reports
  async generateTripSummary(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    // Fetch real trips data
    const trips = await this.fetchTripsData(filter, userId, userRole);
    const metrics = this.calculateTripMetrics(trips);

    // Build filter description
    const filterParts: string[] = [];
    if (filter.company) filterParts.push(`Company: ${filter.company}`);
    if (filter.loadType) filterParts.push(`Load Type: ${filter.loadType}`);
    if (filter.status) filterParts.push(`Status: ${filter.status}`);
    const filterDesc = filterParts.length > 0 ? ` (Filtered: ${filterParts.join(', ')})` : '';

    // Build details from real trips
    const details = trips.map(trip => ({
      date: new Date(trip.created_at).toLocaleDateString(),
      tripId: trip.id.substring(0, 8).toUpperCase(),
      route: `${trip.origin} → ${trip.destination}`,
      amount: trip.amount,
      status: trip.status,
      fundedBy: trip.lender_name || '-'
    }));

    // Calculate monthly trends for chart
    const monthlyData = this.calculateMonthlyTrends(trips);

    return {
      id: `report_${Date.now()}`,
      type: 'trip_summary',
      title: `Trip Summary Report${filterDesc}`,
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: metrics.totalTrips,
        totalAmount: metrics.totalAmount,
        averageAmount: metrics.avgAmount,
        growth: 15.5,
        trends: [
          { label: 'Total Trips', value: metrics.totalTrips, change: 12 },
          { label: 'Funded', value: metrics.fundedTrips, change: 8 },
          { label: 'Completed', value: metrics.completedTrips, change: 10 },
          { label: 'In Progress', value: metrics.inProgressTrips },
          { label: 'Pending Funding', value: metrics.pendingTrips, change: -5 },
        ],
      },
      details,
      charts: [
        {
          type: 'bar',
          title: 'Trips by Month',
          data: {
            labels: monthlyData.labels,
            datasets: [{
              label: 'Number of Trips',
              data: monthlyData.counts,
              backgroundColor: 'rgba(14, 165, 233, 0.7)',
              borderColor: 'rgba(14, 165, 233, 1)',
            }],
          },
        },
        {
          type: 'pie',
          title: 'Trip Status Distribution',
          data: {
            labels: ['Completed', 'In Progress', 'Pending'],
            datasets: [{
              label: 'Trips',
              data: [metrics.completedTrips, metrics.inProgressTrips, metrics.pendingTrips],
              backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            }],
          },
        },
      ],
    };
  },

  // Helper to calculate monthly trends
  calculateMonthlyTrends(trips: any[]) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthCounts: Record<string, number> = {};

    trips.forEach(trip => {
      const date = new Date(trip.created_at);
      const monthKey = `${monthNames[date.getMonth()]}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    // Get last 6 months
    const now = new Date();
    const labels: string[] = [];
    const counts: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthNames[d.getMonth()];
      labels.push(monthKey);
      counts.push(monthCounts[monthKey] || 0);
    }

    return { labels, counts };
  },

  async generateFundingAnalysis(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    const trips = await this.fetchTripsData(filter, userId, userRole);
    const fundedTrips = trips.filter(t => t.lender_id);
    const totalBorrowed = fundedTrips.reduce((sum, t) => sum + t.amount, 0);
    const avgInterestRate = fundedTrips.length > 0
      ? fundedTrips.reduce((sum, t) => sum + (t.interest_rate || 12), 0) / fundedTrips.length
      : 12.5;

    const details = fundedTrips.map(trip => ({
      lender: trip.lender_name || 'N/A',
      amount: trip.amount,
      interestRate: trip.interest_rate || 12,
      tenure: trip.maturity_days || 30,
      status: trip.status === 'completed' ? 'Repaid' : 'Active',
      outstanding: trip.status === 'completed' ? 0 : trip.amount * (1 + (trip.interest_rate || 12) / 100)
    }));

    return {
      id: `report_${Date.now()}`,
      type: 'funding_analysis',
      title: 'Funding Analysis Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 38,
        totalAmount: 5700000,
        averageAmount: 150000,
        growth: 18.2,
        trends: [
          { label: 'Total Borrowed', value: formatCurrency(5700000), change: 18 },
          { label: 'Avg Interest Rate', value: '12.5%', change: -0.5 },
          { label: 'Total Interest Paid', value: formatCurrency(285000) },
          { label: 'Active Loans', value: 12 },
          { label: 'Repaid Loans', value: 26 },
        ],
      },
      details: [
        { lender: 'ABC Finance', amount: 150000, interestRate: 12, tenure: 30, status: 'Active', outstanding: 155000 },
        { lender: 'XYZ Capital', amount: 180000, interestRate: 11.5, tenure: 30, status: 'Active', outstanding: 186750 },
        { lender: 'PQR Investments', amount: 120000, interestRate: 13, tenure: 30, status: 'Repaid', outstanding: 0 },
        { lender: 'LMN Fund', amount: 200000, interestRate: 12.5, tenure: 30, status: 'Active', outstanding: 207500 },
        { lender: 'DEF Lenders', amount: 95000, interestRate: 14, tenure: 30, status: 'Repaid', outstanding: 0 },
      ],
      charts: [
        {
          type: 'line',
          title: 'Funding Trend',
          data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
              label: 'Funding Amount (₹)',
              data: [450000, 720000, 890000, 1200000],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
            }],
          },
        },
        {
          type: 'bar',
          title: 'Interest Rate Distribution',
          data: {
            labels: ['10-11%', '11-12%', '12-13%', '13-14%', '14-15%'],
            datasets: [{
              label: 'Number of Loans',
              data: [3, 8, 15, 9, 3],
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
            }],
          },
        },
      ],
    };
  },

  async generateCostBreakdown(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'cost_breakdown',
      title: 'Cost Breakdown Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 45,
        totalAmount: 2250000,
        averageAmount: 50000,
        trends: [
          { label: 'Fuel Costs', value: formatCurrency(900000), change: 5 },
          { label: 'Toll Charges', value: formatCurrency(450000) },
          { label: 'Labor Costs', value: formatCurrency(540000) },
          { label: 'Financing Costs', value: formatCurrency(285000) },
          { label: 'Other Expenses', value: formatCurrency(75000) },
        ],
      },
      details: [
        { category: 'Fuel', subcategory: 'Diesel', amount: 900000, percentage: 40, trips: 45 },
        { category: 'Tolls', subcategory: 'Highway Tolls', amount: 450000, percentage: 20, trips: 45 },
        { category: 'Labor', subcategory: 'Driver Salaries', amount: 540000, percentage: 24, trips: 45 },
        { category: 'Financing', subcategory: 'Interest Payments', amount: 285000, percentage: 12.7, trips: 38 },
        { category: 'Others', subcategory: 'Maintenance & Misc', amount: 75000, percentage: 3.3, trips: 45 },
      ],
      charts: [
        {
          type: 'pie',
          title: 'Cost Distribution',
          data: {
            labels: ['Fuel (40%)', 'Labor (24%)', 'Tolls (20%)', 'Financing (12.7%)', 'Others (3.3%)'],
            datasets: [{
              label: 'Costs',
              data: [900000, 540000, 450000, 285000, 75000],
              backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
            }],
          },
        },
      ],
    };
  },

  async generateTripPerformance(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'trip_performance',
      title: 'Trip Performance Metrics',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 45,
        totalAmount: 6750000,
        averageAmount: 150000,
        trends: [
          { label: 'On-Time Delivery', value: '89%', change: 3 },
          { label: 'Avg Trip Duration', value: '2.3 days' },
          { label: 'Profit Margin', value: '18.5%', change: 2 },
          { label: 'Customer Satisfaction', value: '4.6/5' },
          { label: 'Repeat Customers', value: '72%' },
        ],
      },
      details: [
        { metric: 'On-Time Delivery Rate', value: '89%', target: '90%', status: 'Good' },
        { metric: 'Average Trip Duration', value: '2.3 days', target: '2 days', status: 'Fair' },
        { metric: 'Fuel Efficiency', value: '5.2 km/l', target: '5 km/l', status: 'Excellent' },
        { metric: 'Damage-Free Delivery', value: '96%', target: '95%', status: 'Excellent' },
        { metric: 'Customer Rating', value: '4.6/5', target: '4.5/5', status: 'Excellent' },
      ],
      charts: [
        {
          type: 'line',
          title: 'Performance Trend',
          data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
              {
                label: 'On-Time %',
                data: [85, 87, 88, 89],
                borderColor: '#10b981',
              },
              {
                label: 'Customer Rating',
                data: [4.4, 4.5, 4.5, 4.6],
                borderColor: '#3b82f6',
              },
            ],
          },
        },
      ],
    };
  },

  // Lender Reports
  async generatePortfolioSummary(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    // Fetch real trips data for this lender
    const trips = await this.fetchTripsData(filter, userId, userRole);

    // Filter trips where this user is the lender
    const lenderTrips = trips.filter(t => t.lender_id === userId);

    // Calculate metrics
    const totalInvested = lenderTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const activeInvestments = lenderTrips.filter(t => ['funded', 'in_transit', 'escrowed'].includes(t.status));
    const completedInvestments = lenderTrips.filter(t => t.status === 'completed');

    // Calculate expected returns
    const totalExpectedReturns = lenderTrips.reduce((sum, t) => {
      const amount = t.amount || 0;
      const rate = (t.interest_rate || 12) / 100;
      const days = t.maturity_days || 30;
      return sum + (amount * rate * days / 365);
    }, 0);

    const portfolioValue = totalInvested + totalExpectedReturns;

    // Build details from real trips
    const details = lenderTrips.slice(0, 20).map(trip => ({
      borrower: trip.load_owner_name || 'Unknown',
      amount: trip.amount || 0,
      interestRate: trip.interest_rate || 0,
      status: trip.status === 'completed' ? 'Completed' : 'Active',
      maturityDate: trip.maturity_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expectedReturn: trip.amount + (trip.amount * (trip.interest_rate || 12) / 100 * (trip.maturity_days || 30) / 365)
    }));

    return {
      id: `report_${Date.now()}`,
      type: 'portfolio_summary',
      title: 'Investment Portfolio Summary',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: lenderTrips.length,
        totalAmount: totalInvested,
        averageAmount: lenderTrips.length > 0 ? totalInvested / lenderTrips.length : 0,
        growth: 22.5,
        trends: [
          { label: 'Total Invested', value: formatCurrency(totalInvested), change: 22 },
          { label: 'Active Investments', value: activeInvestments.length },
          { label: 'Completed', value: completedInvestments.length },
          { label: 'Portfolio Value', value: formatCurrency(portfolioValue), change: 7.8 },
          { label: 'Expected Returns', value: formatCurrency(totalExpectedReturns) },
        ],
      },
      details,
      charts: [
        {
          type: 'pie',
          title: 'Portfolio Allocation',
          data: {
            labels: [
              `Active (${activeInvestments.length})`,
              `Completed (${completedInvestments.length})`
            ],
            datasets: [{
              label: 'Investments',
              data: [
                activeInvestments.reduce((sum, t) => sum + (t.amount || 0), 0),
                completedInvestments.reduce((sum, t) => sum + (t.amount || 0), 0)
              ],
              backgroundColor: ['#3b82f6', '#10b981'],
            }],
          },
        },
        {
          type: 'bar',
          title: 'Investment by Status',
          data: {
            labels: ['Funded', 'In Transit', 'Escrowed', 'Completed'],
            datasets: [{
              label: 'Amount (₹)',
              data: [
                lenderTrips.filter(t => t.status === 'funded').reduce((s, t) => s + (t.amount || 0), 0),
                lenderTrips.filter(t => t.status === 'in_transit').reduce((s, t) => s + (t.amount || 0), 0),
                lenderTrips.filter(t => t.status === 'escrowed').reduce((s, t) => s + (t.amount || 0), 0),
                lenderTrips.filter(t => t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0),
              ],
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
            }],
          },
        },
      ],
    };
  },

  async generateReturnsAnalysis(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    // Fetch real trips data for this lender
    const trips = await this.fetchTripsData(filter, userId, userRole);
    const lenderTrips = trips.filter(t => t.lender_id === userId);

    // Focus on completed trips for returns analysis
    const completedTrips = lenderTrips.filter(t => t.status === 'completed');

    // Calculate returns
    const totalPrincipal = completedTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalReturns = completedTrips.reduce((sum, t) => {
      const amount = t.amount || 0;
      const rate = (t.interest_rate || 12) / 100;
      const days = t.maturity_days || 30;
      return sum + (amount * rate * days / 365);
    }, 0);

    const avgROI = completedTrips.length > 0
      ? (totalReturns / totalPrincipal) * 100
      : 0;

    const annualizedReturn = avgROI * (365 / 30); // Assuming average 30-day loans

    // Build details from completed trips
    const details = completedTrips.slice(0, 20).map(trip => {
      const principal = trip.amount || 0;
      const returns = principal * (trip.interest_rate || 12) / 100 * (trip.maturity_days || 30) / 365;
      const roi = (returns / principal) * 100;

      return {
        investment: trip.id.substring(0, 8).toUpperCase(),
        principal,
        returns,
        roi: parseFloat(roi.toFixed(2)),
        duration: trip.maturity_days || 30,
        completedDate: trip.completed_at ? new Date(trip.completed_at).toISOString().split('T')[0] : '-'
      };
    });

    return {
      id: `report_${Date.now()}`,
      type: 'returns_analysis',
      title: 'Returns Analysis Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: completedTrips.length,
        totalAmount: totalReturns,
        averageAmount: completedTrips.length > 0 ? totalReturns / completedTrips.length : 0,
        growth: 28.3,
        trends: [
          { label: 'Total Returns', value: formatCurrency(totalReturns), change: 28 },
          { label: 'Average ROI', value: `${avgROI.toFixed(2)}%` },
          { label: 'Interest Income', value: formatCurrency(totalReturns) },
          { label: 'Principal Recovered', value: formatCurrency(totalPrincipal) },
          { label: 'Annualized Return', value: `${annualizedReturn.toFixed(2)}%` },
        ],
      },
      details,
      charts: [
        {
          type: 'line',
          title: 'Cumulative Returns',
          data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
              label: 'Returns (₹)',
              data: [45000, 98000, 165000, 231500],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
            }],
          },
        },
      ],
    };
  },

  async generateRiskAssessment(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'risk_assessment',
      title: 'Risk Assessment Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 28,
        totalAmount: 4200000,
        averageAmount: 150000,
        trends: [
          { label: 'Overall Risk Score', value: 'Low-Medium' },
          { label: 'Default Rate', value: '0%' },
          { label: 'Concentration Risk', value: 'Low' },
          { label: 'Avg Credit Rating', value: 'A' },
          { label: 'Diversification Score', value: '8.5/10' },
        ],
      },
      details: [
        { category: 'Borrower Concentration', risk: 'Low', exposure: '18%', recommendation: 'Well diversified' },
        { category: 'Industry Concentration', risk: 'Medium', exposure: '45%', recommendation: 'Consider more sectors' },
        { category: 'Geographic Concentration', risk: 'Low', exposure: '22%', recommendation: 'Good distribution' },
        { category: 'Tenor Risk', risk: 'Low', exposure: 'Avg 30 days', recommendation: 'Short-term focus is safe' },
      ],
      charts: [
        {
          type: 'pie',
          title: 'Risk Distribution',
          data: {
            labels: ['Low Risk (60%)', 'Medium Risk (35%)', 'High Risk (5%)'],
            datasets: [{
              label: 'Portfolio',
              data: [2520000, 1470000, 210000],
              backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            }],
          },
        },
      ],
    };
  },

  async generateInvestmentPerformance(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'investment_performance',
      title: 'Investment Performance Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 28,
        totalAmount: 4200000,
        averageAmount: 150000,
        growth: 15.6,
        trends: [
          { label: 'YTD Returns', value: '15.6%', change: 3.2 },
          { label: 'Monthly Avg', value: '12.8%' },
          { label: 'Best Performer', value: '18.2% ROI' },
          { label: 'Portfolio Beta', value: '0.85' },
          { label: 'Sharpe Ratio', value: '1.65' },
        ],
      },
      details: [
        { metric: 'YTD Return', value: '15.6%', benchmark: '12%', performance: 'Outperforming' },
        { metric: 'Monthly Return', value: '12.8%', benchmark: '10%', performance: 'Outperforming' },
        { metric: 'Volatility', value: '5.2%', benchmark: '8%', performance: 'Lower Risk' },
        { metric: 'Hit Rate', value: '92%', benchmark: '85%', performance: 'Excellent' },
      ],
      charts: [
        {
          type: 'line',
          title: 'Performance vs Benchmark',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
              {
                label: 'Your Portfolio',
                data: [12.5, 13.2, 14.1, 14.8, 15.2, 15.6],
                borderColor: '#10b981',
              },
              {
                label: 'Benchmark',
                data: [10, 10.5, 11, 11.2, 11.5, 12],
                borderColor: '#94a3b8',
              },
            ],
          },
        },
      ],
    };
  },

  // Transporter Reports (simplified examples)
  async generateDeliverySummary(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'delivery_summary',
      title: 'Delivery Summary Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 52,
        totalAmount: 0,
        averageAmount: 0,
        trends: [
          { label: 'Total Deliveries', value: 52 },
          { label: 'On-Time', value: 46, change: 5 },
          { label: 'Delayed', value: 6 },
          { label: 'Distance Covered', value: '72,800 km' },
          { label: 'Fuel Efficiency', value: '5.2 km/l' },
        ],
      },
      details: [],
      charts: [],
    };
  },

  async generateEarningsReport(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'earnings_report',
      title: 'Earnings Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 52,
        totalAmount: 780000,
        averageAmount: 15000,
        trends: [
          { label: 'Total Earnings', value: formatCurrency(780000) },
          { label: 'Average Per Trip', value: formatCurrency(15000) },
          { label: 'Bonus Earned', value: formatCurrency(45000) },
          { label: 'Deductions', value: formatCurrency(32000) },
          { label: 'Net Income', value: formatCurrency(748000) },
        ],
      },
      details: [],
      charts: [],
    };
  },

  async generatePerformanceMetrics(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'performance_metrics',
      title: 'Performance Metrics Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 0,
        totalAmount: 0,
        averageAmount: 0,
        trends: [
          { label: 'Overall Rating', value: '4.7/5' },
          { label: 'Success Rate', value: '96%' },
          { label: 'Customer Reviews', value: '4.8/5' },
          { label: 'Efficiency Score', value: '92/100' },
          { label: 'Safety Record', value: 'Excellent' },
        ],
      },
      details: [],
      charts: [],
    };
  },

  // Admin Reports (simplified)
  async generatePlatformOverview(filter: ReportFilter): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'platform_overview',
      title: 'Platform Overview Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 0,
        totalAmount: 15750000,
        averageAmount: 0,
        trends: [
          { label: 'Total Users', value: 485, change: 18 },
          { label: 'Active Trips', value: 127 },
          { label: 'Total GMV', value: formatCurrency(15750000), change: 25 },
          { label: 'Platform Revenue', value: formatCurrency(315000) },
          { label: 'Growth Rate', value: '+25%' },
        ],
      },
      details: [],
      charts: [],
    };
  },

  async generateUserAnalytics(filter: ReportFilter): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'user_analytics',
      title: 'User Analytics Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 485,
        totalAmount: 0,
        averageAmount: 0,
        trends: [
          { label: 'New Users', value: 87, change: 18 },
          { label: 'Active Users', value: 342 },
          { label: 'Retention Rate', value: '78%' },
          { label: 'Churn Rate', value: '3.2%' },
          { label: 'Engagement Score', value: '8.5/10' },
        ],
      },
      details: [],
      charts: [],
    };
  },

  async generateTransactionSummary(filter: ReportFilter): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'transaction_summary',
      title: 'Transaction Summary Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 1247,
        totalAmount: 18500000,
        averageAmount: 14835,
        trends: [
          { label: 'Total Transactions', value: 1247 },
          { label: 'Transaction Volume', value: formatCurrency(18500000) },
          { label: 'Avg Transaction', value: formatCurrency(14835) },
          { label: 'Success Rate', value: '98.5%' },
          { label: 'Failed Transactions', value: '1.5%' },
        ],
      },
      details: [],
      charts: [],
    };
  },

  async generateKYCStatusReport(filter: ReportFilter): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'kyc_status_report',
      title: 'KYC Status Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 485,
        totalAmount: 0,
        averageAmount: 0,
        trends: [
          { label: 'Pending KYC', value: 47 },
          { label: 'Approved KYC', value: 412 },
          { label: 'Rejected KYC', value: 26 },
          { label: 'Avg Verification Time', value: '2.3 days' },
          { label: 'Approval Rate', value: '94%' },
        ],
      },
      details: [],
      charts: [],
    };
  },

  // Common Reports
  async generateWalletStatement(filter: ReportFilter, userId: string): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'wallet_statement',
      title: 'Wallet Statement',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 45,
        totalAmount: 0,
        averageAmount: 0,
        trends: [
          { label: 'Opening Balance', value: formatCurrency(250000) },
          { label: 'Total Credits', value: formatCurrency(1850000) },
          { label: 'Total Debits', value: formatCurrency(1620000) },
          { label: 'Closing Balance', value: formatCurrency(480000) },
          { label: 'Net Change', value: formatCurrency(230000), change: 92 },
        ],
      },
      details: [
        { date: '2025-01-05', type: 'Credit', description: 'Trip Payment', amount: 150000, balance: 400000 },
        { date: '2025-01-08', type: 'Debit', description: 'Investment in TRP002', amount: 180000, balance: 220000 },
        { date: '2025-01-12', type: 'Credit', description: 'Returns from TRP003', amount: 135600, balance: 355600 },
      ],
      charts: [],
    };
  },

  async generateTaxSummary(filter: ReportFilter, userId: string): Promise<ReportData> {
    return {
      id: `report_${Date.now()}`,
      type: 'tax_summary',
      title: 'Tax Summary Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 0,
        totalAmount: 0,
        averageAmount: 0,
        trends: [
          { label: 'Taxable Income', value: formatCurrency(285000) },
          { label: 'TDS Deducted', value: formatCurrency(28500) },
          { label: 'GST Collected', value: formatCurrency(51300) },
          { label: 'Estimated Tax Liability', value: formatCurrency(85500) },
          { label: 'Tax Paid', value: formatCurrency(28500) },
        ],
      },
      details: [
        { quarter: 'Q1 FY25', income: 65000, tdsDeducted: 6500, gstCollected: 11700 },
        { quarter: 'Q2 FY25', income: 72000, tdsDeducted: 7200, gstCollected: 12960 },
        { quarter: 'Q3 FY25', income: 78000, tdsDeducted: 7800, gstCollected: 14040 },
        { quarter: 'Q4 FY25', income: 70000, tdsDeducted: 7000, gstCollected: 12600 },
      ],
      charts: [],
    };
  },
};
