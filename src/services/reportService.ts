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

    const totalBorrowed = fundedTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgAmount = fundedTrips.length > 0 ? totalBorrowed / fundedTrips.length : 0;
    const avgInterestRate = fundedTrips.length > 0
      ? fundedTrips.reduce((sum, t) => sum + (t.interest_rate || 12), 0) / fundedTrips.length
      : 12.5;

    // Calculate total interest paid (from completed trips)
    const completedFundedTrips = fundedTrips.filter(t => t.status === 'completed');
    const totalInterestPaid = completedFundedTrips.reduce((sum, t) => {
      const amount = t.amount || 0;
      const rate = (t.interest_rate || 12) / 100;
      const days = t.maturity_days || 30;
      return sum + (amount * rate * days / 365);
    }, 0);

    // Calculate active and repaid loans
    const activeLoans = fundedTrips.filter(t => ['funded', 'in_transit', 'escrowed'].includes(t.status));
    const repaidLoans = completedFundedTrips;

    // Build details from real funded trips
    const details = fundedTrips.slice(0, 20).map(trip => {
      const amount = trip.amount || 0;
      const rate = (trip.interest_rate || 12) / 100;
      const days = trip.maturity_days || 30;
      const interest = amount * rate * days / 365;
      const outstanding = trip.status === 'completed' ? 0 : amount + interest;

      return {
        lender: trip.lender_name || 'Unknown Lender',
        amount,
        interestRate: trip.interest_rate || 12,
        tenure: trip.maturity_days || 30,
        status: trip.status === 'completed' ? 'Repaid' : 'Active',
        outstanding
      };
    });

    // Calculate weekly funding trend (last 4 weeks)
    const weeklyFunding: number[] = [];
    const weekLabels: string[] = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      weekLabels.push(`Week ${4 - i}`);

      const weekTrips = fundedTrips.filter(t => {
        const createdDate = new Date(t.created_at);
        return createdDate >= weekStart && createdDate < weekEnd;
      });

      const weekTotal = weekTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
      weeklyFunding.push(weekTotal);
    }

    // Calculate interest rate distribution
    const rateRanges = ['10-11%', '11-12%', '12-13%', '13-14%', '14-15%'];
    const rateCounts = [0, 0, 0, 0, 0];

    fundedTrips.forEach(t => {
      const rate = t.interest_rate || 12;
      if (rate >= 10 && rate < 11) rateCounts[0]++;
      else if (rate >= 11 && rate < 12) rateCounts[1]++;
      else if (rate >= 12 && rate < 13) rateCounts[2]++;
      else if (rate >= 13 && rate < 14) rateCounts[3]++;
      else if (rate >= 14 && rate <= 15) rateCounts[4]++;
    });

    return {
      id: `report_${Date.now()}`,
      type: 'funding_analysis',
      title: 'Funding Analysis Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: fundedTrips.length,
        totalAmount: totalBorrowed,
        averageAmount: avgAmount,
        growth: 18.2,
        trends: [
          { label: 'Total Borrowed', value: formatCurrency(totalBorrowed), change: 18 },
          { label: 'Avg Interest Rate', value: `${avgInterestRate.toFixed(1)}%`, change: -0.5 },
          { label: 'Total Interest Paid', value: formatCurrency(totalInterestPaid) },
          { label: 'Active Loans', value: activeLoans.length },
          { label: 'Repaid Loans', value: repaidLoans.length },
        ],
      },
      details,
      charts: [
        {
          type: 'line',
          title: 'Funding Trend (Last 4 Weeks)',
          data: {
            labels: weekLabels,
            datasets: [{
              label: 'Funding Amount (₹)',
              data: weeklyFunding,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
            }],
          },
        },
        {
          type: 'bar',
          title: 'Interest Rate Distribution',
          data: {
            labels: rateRanges,
            datasets: [{
              label: 'Number of Loans',
              data: rateCounts,
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
            }],
          },
        },
      ],
    };
  },

  async generateCostBreakdown(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    const trips = await this.fetchTripsData(filter, userId, userRole);
    const totalTrips = trips.length;

    // Calculate costs based on real trip data
    // Assuming typical cost structure for logistics:
    // - Fuel: 35-40% of trip amount
    // - Labor: 20-25% of trip amount
    // - Tolls: 15-20% of trip amount
    // - Financing: Interest paid on funded trips
    // - Others: 3-5% for maintenance and misc

    const totalRevenue = trips.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Fuel costs (estimated at 38% of revenue)
    const fuelCosts = totalRevenue * 0.38;

    // Labor costs (estimated at 22% of revenue)
    const laborCosts = totalRevenue * 0.22;

    // Toll charges (estimated at 18% of revenue)
    const tollCosts = totalRevenue * 0.18;

    // Financing costs (actual interest from funded trips)
    const fundedTrips = trips.filter(t => t.lender_id && t.status === 'completed');
    const financingCosts = fundedTrips.reduce((sum, t) => {
      const amount = t.amount || 0;
      const rate = (t.interest_rate || 12) / 100;
      const days = t.maturity_days || 30;
      return sum + (amount * rate * days / 365);
    }, 0);

    // Other expenses (estimated at 4% of revenue)
    const otherCosts = totalRevenue * 0.04;

    // Total costs
    const totalCosts = fuelCosts + laborCosts + tollCosts + financingCosts + otherCosts;
    const avgCostPerTrip = totalTrips > 0 ? totalCosts / totalTrips : 0;

    // Calculate percentages
    const fuelPercentage = totalCosts > 0 ? (fuelCosts / totalCosts) * 100 : 0;
    const laborPercentage = totalCosts > 0 ? (laborCosts / totalCosts) * 100 : 0;
    const tollPercentage = totalCosts > 0 ? (tollCosts / totalCosts) * 100 : 0;
    const financingPercentage = totalCosts > 0 ? (financingCosts / totalCosts) * 100 : 0;
    const otherPercentage = totalCosts > 0 ? (otherCosts / totalCosts) * 100 : 0;

    return {
      id: `report_${Date.now()}`,
      type: 'cost_breakdown',
      title: 'Cost Breakdown Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: totalTrips,
        totalAmount: totalCosts,
        averageAmount: avgCostPerTrip,
        trends: [
          { label: 'Fuel Costs', value: formatCurrency(fuelCosts), change: 5 },
          { label: 'Toll Charges', value: formatCurrency(tollCosts) },
          { label: 'Labor Costs', value: formatCurrency(laborCosts) },
          { label: 'Financing Costs', value: formatCurrency(financingCosts) },
          { label: 'Other Expenses', value: formatCurrency(otherCosts) },
        ],
      },
      details: [
        {
          category: 'Fuel',
          subcategory: 'Diesel',
          amount: fuelCosts,
          percentage: parseFloat(fuelPercentage.toFixed(1)),
          trips: totalTrips
        },
        {
          category: 'Tolls',
          subcategory: 'Highway Tolls',
          amount: tollCosts,
          percentage: parseFloat(tollPercentage.toFixed(1)),
          trips: totalTrips
        },
        {
          category: 'Labor',
          subcategory: 'Driver Salaries',
          amount: laborCosts,
          percentage: parseFloat(laborPercentage.toFixed(1)),
          trips: totalTrips
        },
        {
          category: 'Financing',
          subcategory: 'Interest Payments',
          amount: financingCosts,
          percentage: parseFloat(financingPercentage.toFixed(1)),
          trips: fundedTrips.length
        },
        {
          category: 'Others',
          subcategory: 'Maintenance & Misc',
          amount: otherCosts,
          percentage: parseFloat(otherPercentage.toFixed(1)),
          trips: totalTrips
        },
      ],
      charts: [
        {
          type: 'pie',
          title: 'Cost Distribution',
          data: {
            labels: [
              `Fuel (${fuelPercentage.toFixed(1)}%)`,
              `Labor (${laborPercentage.toFixed(1)}%)`,
              `Tolls (${tollPercentage.toFixed(1)}%)`,
              `Financing (${financingPercentage.toFixed(1)}%)`,
              `Others (${otherPercentage.toFixed(1)}%)`
            ],
            datasets: [{
              label: 'Costs',
              data: [fuelCosts, laborCosts, tollCosts, financingCosts, otherCosts],
              backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
            }],
          },
        },
      ],
    };
  },

  async generateTripPerformance(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    const trips = await this.fetchTripsData(filter, userId, userRole);
    const totalTrips = trips.length;
    const completedTrips = trips.filter(t => t.status === 'completed');

    // Calculate performance metrics
    const totalRevenue = trips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgRevenue = totalTrips > 0 ? totalRevenue / totalTrips : 0;

    // Calculate costs (using same logic as cost breakdown)
    const totalCosts = totalRevenue * 0.38 + totalRevenue * 0.22 + totalRevenue * 0.18 + totalRevenue * 0.04;
    const fundedTrips = trips.filter(t => t.lender_id && t.status === 'completed');
    const financingCosts = fundedTrips.reduce((sum, t) => {
      const amount = t.amount || 0;
      const rate = (t.interest_rate || 12) / 100;
      const days = t.maturity_days || 30;
      return sum + (amount * rate * days / 365);
    }, 0);
    const totalCostsWithFinancing = totalCosts + financingCosts;

    // Calculate profit margin
    const totalProfit = totalRevenue - totalCostsWithFinancing;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Calculate on-time delivery (assuming trips completed within maturity date are on-time)
    const onTimeTrips = completedTrips.filter(t => {
      if (!t.maturity_date || !t.completed_at) return true;
      const maturityDate = new Date(t.maturity_date);
      const completedDate = new Date(t.completed_at);
      return completedDate <= maturityDate;
    });
    const onTimePercentage = completedTrips.length > 0
      ? (onTimeTrips.length / completedTrips.length) * 100
      : 0;

    // Calculate average trip duration
    const tripsWithDuration = completedTrips.filter(t => t.created_at && t.completed_at);
    const avgDurationDays = tripsWithDuration.length > 0
      ? tripsWithDuration.reduce((sum, t) => {
          const start = new Date(t.created_at);
          const end = new Date(t.completed_at!);
          const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / tripsWithDuration.length
      : 0;

    // Performance details
    const details = [
      {
        metric: 'On-Time Delivery Rate',
        value: `${onTimePercentage.toFixed(1)}%`,
        target: '90%',
        status: onTimePercentage >= 90 ? 'Excellent' : onTimePercentage >= 85 ? 'Good' : 'Needs Improvement'
      },
      {
        metric: 'Average Trip Duration',
        value: `${avgDurationDays.toFixed(1)} days`,
        target: '2 days',
        status: avgDurationDays <= 2 ? 'Excellent' : avgDurationDays <= 3 ? 'Good' : 'Fair'
      },
      {
        metric: 'Profit Margin',
        value: `${profitMargin.toFixed(1)}%`,
        target: '15%',
        status: profitMargin >= 15 ? 'Excellent' : profitMargin >= 10 ? 'Good' : 'Fair'
      },
      {
        metric: 'Trip Success Rate',
        value: `${completedTrips.length > 0 ? ((completedTrips.length / totalTrips) * 100).toFixed(1) : 0}%`,
        target: '95%',
        status: completedTrips.length >= totalTrips * 0.95 ? 'Excellent' : 'Good'
      },
      {
        metric: 'Average Revenue per Trip',
        value: formatCurrency(avgRevenue),
        target: formatCurrency(150000),
        status: avgRevenue >= 150000 ? 'Excellent' : 'Good'
      },
    ];

    // Calculate weekly performance trends (last 4 weeks)
    const weeklyOnTime: number[] = [];
    const weeklyProfitMargin: number[] = [];
    const weekLabels: string[] = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      weekLabels.push(`Week ${4 - i}`);

      const weekCompletedTrips = completedTrips.filter(t => {
        const completedDate = t.completed_at ? new Date(t.completed_at) : null;
        return completedDate && completedDate >= weekStart && completedDate < weekEnd;
      });

      const weekOnTimeTrips = weekCompletedTrips.filter(t => {
        if (!t.maturity_date || !t.completed_at) return true;
        const maturityDate = new Date(t.maturity_date);
        const completedDate = new Date(t.completed_at);
        return completedDate <= maturityDate;
      });

      const weekOnTimePercent = weekCompletedTrips.length > 0
        ? (weekOnTimeTrips.length / weekCompletedTrips.length) * 100
        : 0;

      weeklyOnTime.push(parseFloat(weekOnTimePercent.toFixed(1)));
      weeklyProfitMargin.push(parseFloat(profitMargin.toFixed(1))); // Using overall profit margin as approximation
    }

    return {
      id: `report_${Date.now()}`,
      type: 'trip_performance',
      title: 'Trip Performance Metrics',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: totalTrips,
        totalAmount: totalRevenue,
        averageAmount: avgRevenue,
        trends: [
          { label: 'On-Time Delivery', value: `${onTimePercentage.toFixed(1)}%`, change: 3 },
          { label: 'Avg Trip Duration', value: `${avgDurationDays.toFixed(1)} days` },
          { label: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`, change: 2 },
          { label: 'Completed Trips', value: completedTrips.length },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
        ],
      },
      details,
      charts: [
        {
          type: 'line',
          title: 'Performance Trend (Last 4 Weeks)',
          data: {
            labels: weekLabels,
            datasets: [
              {
                label: 'On-Time %',
                data: weeklyOnTime,
                borderColor: '#10b981',
              },
              {
                label: 'Profit Margin %',
                data: weeklyProfitMargin,
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
    // Fetch real trips data for this lender
    const trips = await this.fetchTripsData(filter, userId, userRole);
    const lenderTrips = trips.filter(t => t.lender_id === userId);

    // Calculate risk metrics
    const totalAmount = lenderTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const activeTrips = lenderTrips.filter(t => ['funded', 'in_transit', 'escrowed'].includes(t.status));
    const completedTrips = lenderTrips.filter(t => t.status === 'completed');
    const delayedTrips = lenderTrips.filter(t => {
      if (!t.maturity_date) return false;
      const maturityDate = new Date(t.maturity_date);
      return maturityDate < new Date() && t.status !== 'completed';
    });

    // Calculate default rate
    const defaultRate = lenderTrips.length > 0 ? (delayedTrips.length / lenderTrips.length) * 100 : 0;

    // Calculate borrower concentration
    const borrowerAmounts: Record<string, number> = {};
    lenderTrips.forEach(t => {
      const borrowerId = t.load_owner_id || 'unknown';
      borrowerAmounts[borrowerId] = (borrowerAmounts[borrowerId] || 0) + (t.amount || 0);
    });
    const maxBorrowerExposure = totalAmount > 0
      ? Math.max(...Object.values(borrowerAmounts)) / totalAmount * 100
      : 0;

    // Calculate average maturity days
    const avgMaturityDays = lenderTrips.length > 0
      ? lenderTrips.reduce((sum, t) => sum + (t.maturity_days || 30), 0) / lenderTrips.length
      : 30;

    // Determine overall risk score based on metrics
    let overallRisk = 'Low';
    if (defaultRate > 5 || maxBorrowerExposure > 40) {
      overallRisk = 'High';
    } else if (defaultRate > 2 || maxBorrowerExposure > 25) {
      overallRisk = 'Medium';
    }

    // Calculate diversification score (1-10)
    const uniqueBorrowers = Object.keys(borrowerAmounts).length;
    const diversificationScore = Math.min(10, uniqueBorrowers * 2);

    // Risk categorization (simplified)
    const lowRiskAmount = completedTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const mediumRiskAmount = activeTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const highRiskAmount = delayedTrips.reduce((sum, t) => sum + (t.amount || 0), 0);

    const details = [
      {
        category: 'Borrower Concentration',
        risk: maxBorrowerExposure > 30 ? 'High' : maxBorrowerExposure > 20 ? 'Medium' : 'Low',
        exposure: `${maxBorrowerExposure.toFixed(1)}%`,
        recommendation: maxBorrowerExposure > 30 ? 'Reduce concentration' : 'Well diversified'
      },
      {
        category: 'Default Risk',
        risk: defaultRate > 5 ? 'High' : defaultRate > 2 ? 'Medium' : 'Low',
        exposure: `${defaultRate.toFixed(1)}%`,
        recommendation: defaultRate > 5 ? 'Review overdue loans' : 'Low default rate'
      },
      {
        category: 'Portfolio Diversification',
        risk: uniqueBorrowers < 3 ? 'High' : uniqueBorrowers < 5 ? 'Medium' : 'Low',
        exposure: `${uniqueBorrowers} borrowers`,
        recommendation: uniqueBorrowers < 5 ? 'Increase diversification' : 'Good distribution'
      },
      {
        category: 'Tenor Risk',
        risk: avgMaturityDays > 60 ? 'Medium' : 'Low',
        exposure: `Avg ${Math.round(avgMaturityDays)} days`,
        recommendation: avgMaturityDays > 60 ? 'Monitor long-term loans' : 'Short-term focus is safe'
      },
    ];

    return {
      id: `report_${Date.now()}`,
      type: 'risk_assessment',
      title: 'Risk Assessment Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: lenderTrips.length,
        totalAmount: totalAmount,
        averageAmount: lenderTrips.length > 0 ? totalAmount / lenderTrips.length : 0,
        trends: [
          { label: 'Overall Risk Score', value: overallRisk },
          { label: 'Default Rate', value: `${defaultRate.toFixed(1)}%` },
          { label: 'Max Borrower Exposure', value: `${maxBorrowerExposure.toFixed(1)}%` },
          { label: 'Unique Borrowers', value: uniqueBorrowers },
          { label: 'Diversification Score', value: `${diversificationScore}/10` },
        ],
      },
      details,
      charts: [
        {
          type: 'pie',
          title: 'Risk Distribution',
          data: {
            labels: [
              `Low Risk (${completedTrips.length})`,
              `Medium Risk (${activeTrips.length})`,
              `High Risk (${delayedTrips.length})`
            ],
            datasets: [{
              label: 'Portfolio',
              data: [lowRiskAmount, mediumRiskAmount, highRiskAmount],
              backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            }],
          },
        },
      ],
    };
  },

  async generateInvestmentPerformance(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    // Fetch real trips data for this lender
    const trips = await this.fetchTripsData(filter, userId, userRole);
    const lenderTrips = trips.filter(t => t.lender_id === userId);

    // Calculate performance metrics
    const totalInvested = lenderTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const completedTrips = lenderTrips.filter(t => t.status === 'completed');

    // Calculate total returns from completed trips
    const totalReturns = completedTrips.reduce((sum, t) => {
      const amount = t.amount || 0;
      const rate = (t.interest_rate || 12) / 100;
      const days = t.maturity_days || 30;
      return sum + (amount * rate * days / 365);
    }, 0);

    const totalPrincipal = completedTrips.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate YTD returns (annualized from completed trips)
    const ytdReturn = totalPrincipal > 0 ? (totalReturns / totalPrincipal) * 100 : 0;
    const annualizedYTD = ytdReturn * (365 / 30); // Approximate annualization

    // Calculate monthly average
    const avgMonthlyReturn = ytdReturn;

    // Find best performing investment
    let bestROI = 0;
    completedTrips.forEach(t => {
      const roi = ((t.interest_rate || 12) * (t.maturity_days || 30)) / 365;
      if (roi > bestROI) bestROI = roi;
    });

    // Calculate hit rate (successful completions vs total)
    const hitRate = lenderTrips.length > 0
      ? (completedTrips.length / lenderTrips.length) * 100
      : 0;

    // Benchmark returns (assumed market average)
    const benchmarkMonthly = 10;
    const benchmarkYTD = 12;

    // Calculate performance metrics
    const details = [
      {
        metric: 'YTD Return',
        value: `${annualizedYTD.toFixed(1)}%`,
        benchmark: `${benchmarkYTD}%`,
        performance: annualizedYTD > benchmarkYTD ? 'Outperforming' : 'Underperforming'
      },
      {
        metric: 'Monthly Return',
        value: `${avgMonthlyReturn.toFixed(1)}%`,
        benchmark: `${benchmarkMonthly}%`,
        performance: avgMonthlyReturn > benchmarkMonthly ? 'Outperforming' : 'Underperforming'
      },
      {
        metric: 'Success Rate',
        value: `${hitRate.toFixed(1)}%`,
        benchmark: '85%',
        performance: hitRate > 85 ? 'Excellent' : hitRate > 70 ? 'Good' : 'Needs Improvement'
      },
      {
        metric: 'Total Investments',
        value: lenderTrips.length,
        benchmark: '-',
        performance: lenderTrips.length > 10 ? 'Active' : 'Growing'
      },
    ];

    // Calculate monthly performance trend (last 6 months)
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyPerformance: number[] = [];
    const monthLabels: string[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(monthNames[d.getMonth()]);

      // Calculate cumulative returns up to this month
      const tripsUpToMonth = completedTrips.filter(t => {
        const completedDate = t.completed_at ? new Date(t.completed_at) : null;
        return completedDate && completedDate <= d;
      });

      const returnsUpToMonth = tripsUpToMonth.reduce((sum, t) => {
        const amount = t.amount || 0;
        const rate = (t.interest_rate || 12) / 100;
        const days = t.maturity_days || 30;
        return sum + (amount * rate * days / 365);
      }, 0);

      const principalUpToMonth = tripsUpToMonth.reduce((sum, t) => sum + (t.amount || 0), 0);
      const roiUpToMonth = principalUpToMonth > 0 ? (returnsUpToMonth / principalUpToMonth) * 100 * (365 / 30) : 0;

      monthlyPerformance.push(parseFloat(roiUpToMonth.toFixed(1)));
    }

    return {
      id: `report_${Date.now()}`,
      type: 'investment_performance',
      title: 'Investment Performance Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: lenderTrips.length,
        totalAmount: totalInvested,
        averageAmount: lenderTrips.length > 0 ? totalInvested / lenderTrips.length : 0,
        growth: annualizedYTD,
        trends: [
          { label: 'YTD Returns', value: `${annualizedYTD.toFixed(1)}%`, change: annualizedYTD - benchmarkYTD },
          { label: 'Monthly Avg', value: `${avgMonthlyReturn.toFixed(1)}%` },
          { label: 'Best Performer', value: `${bestROI.toFixed(1)}% ROI` },
          { label: 'Success Rate', value: `${hitRate.toFixed(1)}%` },
          { label: 'Total Returns', value: formatCurrency(totalReturns) },
        ],
      },
      details,
      charts: [
        {
          type: 'line',
          title: 'Performance Trend (Annualized)',
          data: {
            labels: monthLabels,
            datasets: [
              {
                label: 'Your Portfolio',
                data: monthlyPerformance,
                borderColor: '#10b981',
              },
              {
                label: 'Benchmark',
                data: Array(6).fill(benchmarkYTD),
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
