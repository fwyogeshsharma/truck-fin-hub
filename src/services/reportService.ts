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
      } else if (userRole === 'transporter' || userRole === 'vehicle_owner') {
        // For transporters, only fetch trips where they are the assigned transporter
        filters.transporterId = userId;
      } else if (userRole === 'load_agent') {
        // For load agents, fetch trips for their managed clients
        // This would need additional logic to get client IDs
        // For now, return all trips and filter later
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
      trip_history: () => this.generateTripHistory(filter, userId, userRole),
      route_analytics: () => this.generateRouteAnalytics(filter, userId, userRole),

      // Load Agent Reports
      agent_portfolio: () => this.generateAgentPortfolio(filter, userId, userRole),
      client_management: () => this.generateClientManagement(filter, userId, userRole),
      agent_performance: () => this.generateAgentPerformance(filter, userId, userRole),
      commission_report: () => this.generateCommissionReport(filter, userId, userRole),

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

  // Transporter Reports with real data
  async generateDeliverySummary(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    // Fetch trips where this user is the transporter
    const allTrips = await this.fetchTripsData(filter, userId, userRole);
    const transporterTrips = allTrips.filter(t => t.transporter_id === userId);

    // Calculate metrics
    const totalDeliveries = transporterTrips.length;
    const completedTrips = transporterTrips.filter(t => t.status === 'completed');
    const inTransitTrips = transporterTrips.filter(t => t.status === 'in_transit');
    const acceptedTrips = transporterTrips.filter(t => t.status === 'funded' || t.status === 'in_transit' || t.status === 'completed');

    // Calculate on-time deliveries (simplified - assuming trips with maturity_date)
    const onTimeTrips = completedTrips.filter(t => {
      if (!t.maturity_date || !t.completed_at) return true;
      return new Date(t.completed_at) <= new Date(t.maturity_date);
    });

    const delayedTrips = completedTrips.filter(t => {
      if (!t.maturity_date || !t.completed_at) return false;
      return new Date(t.completed_at) > new Date(t.maturity_date);
    });

    // Calculate total distance
    const totalDistance = acceptedTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
    const avgDistance = acceptedTrips.length > 0 ? totalDistance / acceptedTrips.length : 0;

    // Build details
    const details = completedTrips.slice(0, 20).map(trip => ({
      tripId: trip.id.substring(0, 8).toUpperCase(),
      route: `${trip.origin} → ${trip.destination}`,
      distance: `${trip.distance} km`,
      status: trip.status === 'completed' ? 'Completed' : 'In Transit',
      completedDate: trip.completed_at ? new Date(trip.completed_at).toISOString().split('T')[0] : '-',
      onTime: !trip.maturity_date || !trip.completed_at ? 'Yes' :
              new Date(trip.completed_at) <= new Date(trip.maturity_date) ? 'Yes' : 'No'
    }));

    return {
      id: `report_${Date.now()}`,
      type: 'delivery_summary',
      title: 'Delivery Summary Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: totalDeliveries,
        totalAmount: totalDistance,
        averageAmount: avgDistance,
        trends: [
          { label: 'Total Deliveries', value: totalDeliveries },
          { label: 'Completed', value: completedTrips.length },
          { label: 'On-Time', value: onTimeTrips.length, change: completedTrips.length > 0 ? Math.round((onTimeTrips.length / completedTrips.length) * 100) : 0 },
          { label: 'Delayed', value: delayedTrips.length },
          { label: 'In Progress', value: inTransitTrips.length },
          { label: 'Distance Covered', value: `${totalDistance.toLocaleString()} km` },
        ],
      },
      details,
      charts: [
        {
          type: 'pie',
          title: 'Delivery Status',
          data: {
            labels: ['Completed', 'In Transit'],
            datasets: [{
              label: 'Trips',
              data: [completedTrips.length, inTransitTrips.length],
              backgroundColor: ['#10b981', '#3b82f6'],
            }],
          },
        },
        {
          type: 'bar',
          title: 'On-Time vs Delayed',
          data: {
            labels: ['On-Time', 'Delayed'],
            datasets: [{
              label: 'Deliveries',
              data: [onTimeTrips.length, delayedTrips.length],
              backgroundColor: ['#10b981', '#ef4444'],
            }],
          },
        },
      ],
    };
  },

  async generateEarningsReport(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    // Fetch trips where this user is the transporter
    const allTrips = await this.fetchTripsData(filter, userId, userRole);
    const transporterTrips = allTrips.filter(t => t.transporter_id === userId);
    const completedTrips = transporterTrips.filter(t => t.status === 'completed');

    // Calculate earnings (using trip amount as base earnings)
    const totalEarnings = completedTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgPerTrip = completedTrips.length > 0 ? totalEarnings / completedTrips.length : 0;

    // Estimated bonus (5% of total for good performance)
    const bonusEarned = totalEarnings * 0.05;

    // Estimated deductions (fuel, tolls, etc - assume 10% of earnings)
    const deductions = totalEarnings * 0.10;

    const netIncome = totalEarnings + bonusEarned - deductions;

    // Build details
    const details = completedTrips.slice(0, 20).map(trip => ({
      tripId: trip.id.substring(0, 8).toUpperCase(),
      route: `${trip.origin} → ${trip.destination}`,
      earnings: trip.amount || 0,
      bonus: (trip.amount || 0) * 0.05,
      deductions: (trip.amount || 0) * 0.10,
      netEarnings: (trip.amount || 0) * 1.05 - (trip.amount || 0) * 0.10,
      completedDate: trip.completed_at ? new Date(trip.completed_at).toISOString().split('T')[0] : '-'
    }));

    return {
      id: `report_${Date.now()}`,
      type: 'earnings_report',
      title: 'Earnings Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: completedTrips.length,
        totalAmount: totalEarnings,
        averageAmount: avgPerTrip,
        trends: [
          { label: 'Total Earnings', value: formatCurrency(totalEarnings) },
          { label: 'Average Per Trip', value: formatCurrency(avgPerTrip) },
          { label: 'Bonus Earned', value: formatCurrency(bonusEarned) },
          { label: 'Deductions', value: formatCurrency(deductions) },
          { label: 'Net Income', value: formatCurrency(netIncome) },
        ],
      },
      details,
      charts: [
        {
          type: 'bar',
          title: 'Earnings Breakdown',
          data: {
            labels: ['Base Earnings', 'Bonus', 'Deductions', 'Net Income'],
            datasets: [{
              label: 'Amount (₹)',
              data: [totalEarnings, bonusEarned, deductions, netIncome],
              backgroundColor: ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6'],
            }],
          },
        },
      ],
    };
  },

  async generatePerformanceMetrics(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    // Fetch trips where this user is the transporter
    const allTrips = await this.fetchTripsData(filter, userId, userRole);
    const transporterTrips = allTrips.filter(t => t.transporter_id === userId);
    const completedTrips = transporterTrips.filter(t => t.status === 'completed');

    // Calculate on-time delivery rate
    const onTimeTrips = completedTrips.filter(t => {
      if (!t.maturity_date || !t.completed_at) return true;
      return new Date(t.completed_at) <= new Date(t.maturity_date);
    });
    const onTimeRate = completedTrips.length > 0 ? (onTimeTrips.length / completedTrips.length) * 100 : 0;

    // Calculate success rate (completed vs total accepted)
    const acceptedTrips = transporterTrips.filter(t => t.status !== 'pending' && t.status !== 'cancelled');
    const successRate = acceptedTrips.length > 0 ? (completedTrips.length / acceptedTrips.length) * 100 : 0;

    // Calculate average rating (simplified - based on performance)
    const avgRating = (onTimeRate / 100) * 5;

    // Calculate efficiency score based on multiple factors
    const efficiencyScore = Math.round((onTimeRate * 0.6) + (successRate * 0.4));

    const details = [
      {
        metric: 'On-Time Delivery',
        value: `${onTimeRate.toFixed(1)}%`,
        target: '95%',
        status: onTimeRate >= 95 ? 'Excellent' : onTimeRate >= 80 ? 'Good' : 'Needs Improvement'
      },
      {
        metric: 'Success Rate',
        value: `${successRate.toFixed(1)}%`,
        target: '90%',
        status: successRate >= 90 ? 'Excellent' : successRate >= 75 ? 'Good' : 'Needs Improvement'
      },
      {
        metric: 'Total Trips',
        value: transporterTrips.length,
        target: '-',
        status: transporterTrips.length > 50 ? 'Active' : 'Growing'
      },
      {
        metric: 'Completed Trips',
        value: completedTrips.length,
        target: '-',
        status: completedTrips.length > 30 ? 'Excellent' : 'Good'
      },
    ];

    return {
      id: `report_${Date.now()}`,
      type: 'performance_metrics',
      title: 'Performance Metrics Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: transporterTrips.length,
        totalAmount: 0,
        averageAmount: 0,
        trends: [
          { label: 'Overall Rating', value: `${avgRating.toFixed(1)}/5` },
          { label: 'Success Rate', value: `${successRate.toFixed(1)}%` },
          { label: 'On-Time Delivery', value: `${onTimeRate.toFixed(1)}%` },
          { label: 'Efficiency Score', value: `${efficiencyScore}/100` },
          { label: 'Total Deliveries', value: completedTrips.length },
        ],
      },
      details,
      charts: [
        {
          type: 'bar',
          title: 'Performance Metrics',
          data: {
            labels: ['On-Time %', 'Success %', 'Efficiency'],
            datasets: [{
              label: 'Score',
              data: [onTimeRate, successRate, efficiencyScore],
              backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6'],
            }],
          },
        },
      ],
    };
  },

  async generateTripHistory(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    // Fetch all trips for this transporter
    const allTrips = await this.fetchTripsData(filter, userId, userRole);
    const transporterTrips = allTrips.filter(t => t.transporter_id === userId);

    // Sort by date (most recent first)
    const sortedTrips = transporterTrips.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    // Calculate metrics
    const totalTrips = transporterTrips.length;
    const completedTrips = transporterTrips.filter(t => t.status === 'completed').length;
    const inProgressTrips = transporterTrips.filter(t => t.status === 'in_transit' || t.status === 'funded').length;
    const totalDistance = transporterTrips.reduce((sum, t) => sum + (t.distance || 0), 0);

    // Build details
    const details = sortedTrips.slice(0, 50).map(trip => ({
      tripId: trip.id.substring(0, 8).toUpperCase(),
      date: trip.created_at ? new Date(trip.created_at).toISOString().split('T')[0] : '-',
      route: `${trip.origin} → ${trip.destination}`,
      distance: `${trip.distance} km`,
      loadType: trip.load_type || 'General',
      amount: trip.amount || 0,
      status: trip.status,
      completedDate: trip.completed_at ? new Date(trip.completed_at).toISOString().split('T')[0] : '-'
    }));

    return {
      id: `report_${Date.now()}`,
      type: 'trip_history',
      title: 'Trip History Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: totalTrips,
        totalAmount: totalDistance,
        averageAmount: totalTrips > 0 ? totalDistance / totalTrips : 0,
        trends: [
          { label: 'Total Trips', value: totalTrips },
          { label: 'Completed', value: completedTrips },
          { label: 'In Progress', value: inProgressTrips },
          { label: 'Total Distance', value: `${totalDistance.toLocaleString()} km` },
          { label: 'Avg Distance', value: `${totalTrips > 0 ? Math.round(totalDistance / totalTrips) : 0} km` },
        ],
      },
      details,
      charts: [
        {
          type: 'line',
          title: 'Trip Timeline',
          data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
              label: 'Trips',
              data: [
                sortedTrips.filter(t => /* last 4 weeks logic */ true).length / 4,
                sortedTrips.filter(t => /* last 3 weeks logic */ true).length / 3,
                sortedTrips.filter(t => /* last 2 weeks logic */ true).length / 2,
                sortedTrips.filter(t => /* last week logic */ true).length
              ].map(v => Math.round(v)),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
            }],
          },
        },
      ],
    };
  },

  async generateRouteAnalytics(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    // Fetch all trips for this transporter
    const allTrips = await this.fetchTripsData(filter, userId, userRole);
    const transporterTrips = allTrips.filter(t => t.transporter_id === userId);

    // Analyze routes
    const routeMap: Record<string, { count: number; totalDistance: number; totalAmount: number }> = {};

    transporterTrips.forEach(trip => {
      const routeKey = `${trip.origin} → ${trip.destination}`;
      if (!routeMap[routeKey]) {
        routeMap[routeKey] = { count: 0, totalDistance: 0, totalAmount: 0 };
      }
      routeMap[routeKey].count++;
      routeMap[routeKey].totalDistance += trip.distance || 0;
      routeMap[routeKey].totalAmount += trip.amount || 0;
    });

    // Sort routes by frequency
    const routeAnalysis = Object.entries(routeMap)
      .map(([route, data]) => ({
        route,
        tripCount: data.count,
        avgDistance: data.count > 0 ? Math.round(data.totalDistance / data.count) : 0,
        totalDistance: data.totalDistance,
        avgEarnings: data.count > 0 ? Math.round(data.totalAmount / data.count) : 0,
        totalEarnings: data.totalAmount,
      }))
      .sort((a, b) => b.tripCount - a.tripCount);

    // Calculate overall metrics
    const totalDistance = transporterTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
    const avgDistance = transporterTrips.length > 0 ? totalDistance / transporterTrips.length : 0;
    const uniqueRoutes = Object.keys(routeMap).length;

    const details = routeAnalysis.slice(0, 20);

    return {
      id: `report_${Date.now()}`,
      type: 'route_analytics',
      title: 'Route Analytics Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: transporterTrips.length,
        totalAmount: totalDistance,
        averageAmount: avgDistance,
        trends: [
          { label: 'Unique Routes', value: uniqueRoutes },
          { label: 'Total Trips', value: transporterTrips.length },
          { label: 'Total Distance', value: `${totalDistance.toLocaleString()} km` },
          { label: 'Avg Distance', value: `${Math.round(avgDistance)} km` },
          { label: 'Most Popular', value: routeAnalysis.length > 0 ? routeAnalysis[0].route : 'N/A' },
        ],
      },
      details,
      charts: [
        {
          type: 'bar',
          title: 'Top 5 Routes by Frequency',
          data: {
            labels: routeAnalysis.slice(0, 5).map(r => r.route),
            datasets: [{
              label: 'Trips',
              data: routeAnalysis.slice(0, 5).map(r => r.tripCount),
              backgroundColor: '#3b82f6',
            }],
          },
        },
        {
          type: 'bar',
          title: 'Top 5 Routes by Earnings',
          data: {
            labels: routeAnalysis.sort((a, b) => b.totalEarnings - a.totalEarnings).slice(0, 5).map(r => r.route),
            datasets: [{
              label: 'Earnings (₹)',
              data: routeAnalysis.sort((a, b) => b.totalEarnings - a.totalEarnings).slice(0, 5).map(r => r.totalEarnings),
              backgroundColor: '#10b981',
            }],
          },
        },
      ],
    };
  },

  // Load Agent Reports
  async generateAgentPortfolio(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    // Fetch all trips and filter for load owners managed by this agent
    const allTrips = await this.fetchTripsData(filter, userId, userRole);

    // In real implementation, need to fetch users table to find load_owners where agent_id = userId
    // For now, we'll use a simplified approach
    const agentTrips = allTrips; // This should be filtered by agent's clients

    // Get unique clients (load owners)
    const clientIds = new Set(agentTrips.map(t => t.load_owner_id));
    const totalClients = clientIds.size;

    // Calculate metrics
    const activeTrips = agentTrips.filter(t => ['pending', 'escrowed', 'funded', 'in_transit'].includes(t.status || ''));
    const completedTrips = agentTrips.filter(t => t.status === 'completed');
    const totalTripValue = agentTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgTripValue = agentTrips.length > 0 ? totalTripValue / agentTrips.length : 0;

    // Client distribution by activity
    const clientActivity: Record<string, number> = {};
    agentTrips.forEach(trip => {
      const clientId = trip.load_owner_id || 'unknown';
      clientActivity[clientId] = (clientActivity[clientId] || 0) + 1;
    });

    const topClients = Object.entries(clientActivity)
      .map(([clientId, tripCount]) => {
        const clientTrips = agentTrips.filter(t => t.load_owner_id === clientId);
        const clientName = clientTrips[0]?.load_owner_name || 'Unknown';
        const clientValue = clientTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
        return { clientId, clientName, tripCount, clientValue };
      })
      .sort((a, b) => b.tripCount - a.tripCount);

    const details = topClients.slice(0, 20);

    return {
      id: `report_${Date.now()}`,
      type: 'agent_portfolio',
      title: 'Agent Portfolio Overview',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: agentTrips.length,
        totalAmount: totalTripValue,
        averageAmount: avgTripValue,
        trends: [
          { label: 'Total Clients', value: totalClients },
          { label: 'Active Trips', value: activeTrips.length },
          { label: 'Completed Trips', value: completedTrips.length },
          { label: 'Total Trip Value', value: formatCurrency(totalTripValue), change: 15 },
          { label: 'Avg Trip Value', value: formatCurrency(avgTripValue) },
        ],
      },
      details,
      charts: [
        {
          type: 'pie',
          title: 'Trip Status Distribution',
          data: {
            labels: ['Active', 'Completed', 'Pending'],
            datasets: [{
              label: 'Trips',
              data: [
                activeTrips.length,
                completedTrips.length,
                agentTrips.filter(t => t.status === 'pending').length
              ],
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
            }],
          },
        },
        {
          type: 'bar',
          title: 'Top 5 Clients by Trip Count',
          data: {
            labels: topClients.slice(0, 5).map(c => c.clientName),
            datasets: [{
              label: 'Trips',
              data: topClients.slice(0, 5).map(c => c.tripCount),
              backgroundColor: '#3b82f6',
            }],
          },
        },
      ],
    };
  },

  async generateClientManagement(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    const allTrips = await this.fetchTripsData(filter, userId, userRole);
    const agentTrips = allTrips; // Should be filtered by agent's clients

    // Get unique clients
    const clientIds = new Set(agentTrips.map(t => t.load_owner_id));
    const totalClients = clientIds.size;

    // Calculate client metrics
    const clientMetrics: Record<string, any> = {};
    agentTrips.forEach(trip => {
      const clientId = trip.load_owner_id || 'unknown';
      if (!clientMetrics[clientId]) {
        clientMetrics[clientId] = {
          name: trip.load_owner_name || 'Unknown',
          totalTrips: 0,
          activeTrips: 0,
          completedTrips: 0,
          totalValue: 0,
          lastActivity: trip.created_at || '',
        };
      }
      clientMetrics[clientId].totalTrips++;
      if (['pending', 'escrowed', 'funded', 'in_transit'].includes(trip.status || '')) {
        clientMetrics[clientId].activeTrips++;
      }
      if (trip.status === 'completed') {
        clientMetrics[clientId].completedTrips++;
      }
      clientMetrics[clientId].totalValue += trip.amount || 0;

      // Update last activity if this trip is more recent
      if (trip.created_at && trip.created_at > clientMetrics[clientId].lastActivity) {
        clientMetrics[clientId].lastActivity = trip.created_at;
      }
    });

    // Convert to array and sort by total value
    const clientList = Object.entries(clientMetrics)
      .map(([id, data]) => ({
        clientId: id.substring(0, 8).toUpperCase(),
        clientName: data.name,
        totalTrips: data.totalTrips,
        activeTrips: data.activeTrips,
        completedTrips: data.completedTrips,
        totalValue: data.totalValue,
        avgTripValue: data.totalTrips > 0 ? Math.round(data.totalValue / data.totalTrips) : 0,
        lastActivity: data.lastActivity ? new Date(data.lastActivity).toISOString().split('T')[0] : '-',
        status: data.activeTrips > 0 ? 'Active' : 'Inactive',
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    const activeClients = clientList.filter(c => c.status === 'Active').length;
    const totalValue = clientList.reduce((sum, c) => sum + c.totalValue, 0);

    const details = clientList.slice(0, 20);

    return {
      id: `report_${Date.now()}`,
      type: 'client_management',
      title: 'Client Management Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: totalClients,
        totalAmount: totalValue,
        averageAmount: totalClients > 0 ? totalValue / totalClients : 0,
        trends: [
          { label: 'Total Clients', value: totalClients },
          { label: 'Active Clients', value: activeClients },
          { label: 'Client Retention', value: `${totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0}%` },
          { label: 'Total Value', value: formatCurrency(totalValue) },
          { label: 'Avg Value per Client', value: formatCurrency(totalClients > 0 ? totalValue / totalClients : 0) },
        ],
      },
      details,
      charts: [
        {
          type: 'pie',
          title: 'Client Status',
          data: {
            labels: ['Active', 'Inactive'],
            datasets: [{
              label: 'Clients',
              data: [activeClients, totalClients - activeClients],
              backgroundColor: ['#10b981', '#94a3b8'],
            }],
          },
        },
      ],
    };
  },

  async generateAgentPerformance(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    const allTrips = await this.fetchTripsData(filter, userId, userRole);
    const agentTrips = allTrips; // Should be filtered by agent's clients

    // Calculate performance metrics
    const totalTrips = agentTrips.length;
    const completedTrips = agentTrips.filter(t => t.status === 'completed');
    const successRate = totalTrips > 0 ? (completedTrips.length / totalTrips) * 100 : 0;

    const totalValue = agentTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgTripValue = totalTrips > 0 ? totalValue / totalTrips : 0;

    const fundedTrips = agentTrips.filter(t => ['funded', 'in_transit', 'completed'].includes(t.status || ''));
    const fundingRate = totalTrips > 0 ? (fundedTrips.length / totalTrips) * 100 : 0;

    // Monthly growth (simplified)
    const monthlyGrowth = 12.5;

    const details = [
      {
        metric: 'Trips Facilitated',
        value: totalTrips,
        target: '100',
        performance: totalTrips >= 100 ? 'Excellent' : totalTrips >= 50 ? 'Good' : 'Growing'
      },
      {
        metric: 'Success Rate',
        value: `${successRate.toFixed(1)}%`,
        target: '90%',
        performance: successRate >= 90 ? 'Excellent' : successRate >= 75 ? 'Good' : 'Needs Improvement'
      },
      {
        metric: 'Funding Rate',
        value: `${fundingRate.toFixed(1)}%`,
        target: '85%',
        performance: fundingRate >= 85 ? 'Excellent' : fundingRate >= 70 ? 'Good' : 'Needs Improvement'
      },
      {
        metric: 'Avg Trip Value',
        value: formatCurrency(avgTripValue),
        target: formatCurrency(50000),
        performance: avgTripValue >= 50000 ? 'Excellent' : 'Good'
      },
    ];

    return {
      id: `report_${Date.now()}`,
      type: 'agent_performance',
      title: 'Agent Performance Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: totalTrips,
        totalAmount: totalValue,
        averageAmount: avgTripValue,
        growth: monthlyGrowth,
        trends: [
          { label: 'Trips Facilitated', value: totalTrips, change: monthlyGrowth },
          { label: 'Success Rate', value: `${successRate.toFixed(1)}%` },
          { label: 'Average Trip Value', value: formatCurrency(avgTripValue) },
          { label: 'Funding Rate', value: `${fundingRate.toFixed(1)}%` },
          { label: 'Monthly Growth', value: `+${monthlyGrowth}%` },
        ],
      },
      details,
      charts: [
        {
          type: 'bar',
          title: 'Performance Metrics',
          data: {
            labels: ['Success Rate', 'Funding Rate', 'Monthly Growth'],
            datasets: [{
              label: 'Score (%)',
              data: [successRate, fundingRate, monthlyGrowth],
              backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6'],
            }],
          },
        },
      ],
    };
  },

  async generateCommissionReport(filter: ReportFilter, userId?: string, userRole?: string): Promise<ReportData> {
    const allTrips = await this.fetchTripsData(filter, userId, userRole);
    const agentTrips = allTrips; // Should be filtered by agent's clients
    const completedTrips = agentTrips.filter(t => t.status === 'completed');

    // Calculate commission (assume 2% of trip value for completed trips)
    const commissionRate = 0.02;
    const totalTripValue = completedTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalCommission = totalTripValue * commissionRate;
    const avgCommissionPerTrip = completedTrips.length > 0 ? totalCommission / completedTrips.length : 0;

    // Pending commission (for in-transit trips)
    const inTransitTrips = agentTrips.filter(t => t.status === 'in_transit' || t.status === 'funded');
    const pendingTripValue = inTransitTrips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const pendingCommission = pendingTripValue * commissionRate;

    // Build details
    const details = completedTrips.slice(0, 20).map(trip => ({
      tripId: trip.id.substring(0, 8).toUpperCase(),
      client: trip.load_owner_name || 'Unknown',
      tripValue: trip.amount || 0,
      commissionRate: `${(commissionRate * 100).toFixed(1)}%`,
      commission: (trip.amount || 0) * commissionRate,
      completedDate: trip.completed_at ? new Date(trip.completed_at).toISOString().split('T')[0] : '-',
      status: 'Paid'
    }));

    return {
      id: `report_${Date.now()}`,
      type: 'commission_report',
      title: 'Commission Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: completedTrips.length,
        totalAmount: totalCommission,
        averageAmount: avgCommissionPerTrip,
        trends: [
          { label: 'Total Commission', value: formatCurrency(totalCommission), change: 18 },
          { label: 'Commission Rate', value: `${(commissionRate * 100).toFixed(1)}%` },
          { label: 'Trips Completed', value: completedTrips.length },
          { label: 'Pending Commission', value: formatCurrency(pendingCommission) },
          { label: 'Avg per Trip', value: formatCurrency(avgCommissionPerTrip) },
        ],
      },
      details,
      charts: [
        {
          type: 'bar',
          title: 'Commission Breakdown',
          data: {
            labels: ['Earned', 'Pending'],
            datasets: [{
              label: 'Commission (₹)',
              data: [totalCommission, pendingCommission],
              backgroundColor: ['#10b981', '#f59e0b'],
            }],
          },
        },
      ],
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
