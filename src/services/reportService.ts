import { ReportData, ReportFilter, ReportType, ChartData } from '@/types/reports';
import { formatCurrency } from '@/lib/currency';

// Sample data generator for reports
export const reportService = {
  // Generate report based on type and filters
  generateReport(type: ReportType, filter: ReportFilter, userId: string): ReportData {
    const reportGenerators: Record<ReportType, () => ReportData> = {
      // Load Owner Reports
      trip_summary: () => this.generateTripSummary(filter),
      funding_analysis: () => this.generateFundingAnalysis(filter),
      cost_breakdown: () => this.generateCostBreakdown(filter),
      trip_performance: () => this.generateTripPerformance(filter),

      // Lender Reports
      portfolio_summary: () => this.generatePortfolioSummary(filter),
      returns_analysis: () => this.generateReturnsAnalysis(filter),
      risk_assessment: () => this.generateRiskAssessment(filter),
      investment_performance: () => this.generateInvestmentPerformance(filter),

      // Transporter Reports
      delivery_summary: () => this.generateDeliverySummary(filter),
      earnings_report: () => this.generateEarningsReport(filter),
      performance_metrics: () => this.generatePerformanceMetrics(filter),

      // Admin Reports
      platform_overview: () => this.generatePlatformOverview(filter),
      user_analytics: () => this.generateUserAnalytics(filter),
      transaction_summary: () => this.generateTransactionSummary(filter),
      kyc_status_report: () => this.generateKYCStatusReport(filter),

      // Common Reports
      wallet_statement: () => this.generateWalletStatement(filter, userId),
      tax_summary: () => this.generateTaxSummary(filter, userId),
    };

    return reportGenerators[type]();
  },

  // Load Owner Reports
  generateTripSummary(filter: ReportFilter): ReportData {
    return {
      id: `report_${Date.now()}`,
      type: 'trip_summary',
      title: 'Trip Summary Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 45,
        totalAmount: 6750000,
        averageAmount: 150000,
        growth: 15.5,
        trends: [
          { label: 'Total Trips', value: 45, change: 12 },
          { label: 'Funded', value: 38, change: 8 },
          { label: 'Completed', value: 32, change: 10 },
          { label: 'In Progress', value: 6 },
          { label: 'Pending Funding', value: 7, change: -5 },
        ],
      },
      details: [
        { date: '2025-01-05', tripId: 'TRP001', route: 'Mumbai → Delhi', amount: 150000, status: 'Completed', fundedBy: 'ABC Finance' },
        { date: '2025-01-08', tripId: 'TRP002', route: 'Delhi → Bangalore', amount: 180000, status: 'In Progress', fundedBy: 'XYZ Capital' },
        { date: '2025-01-12', tripId: 'TRP003', route: 'Chennai → Hyderabad', amount: 120000, status: 'Completed', fundedBy: 'PQR Investments' },
        { date: '2025-01-15', tripId: 'TRP004', route: 'Kolkata → Mumbai', amount: 200000, status: 'In Progress', fundedBy: 'LMN Fund' },
        { date: '2025-01-18', tripId: 'TRP005', route: 'Pune → Ahmedabad', amount: 95000, status: 'Pending', fundedBy: '-' },
      ],
      charts: [
        {
          type: 'bar',
          title: 'Trips by Month',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Number of Trips',
              data: [12, 15, 18, 22, 20, 25],
              backgroundColor: 'rgba(14, 165, 233, 0.7)',
              borderColor: 'rgba(14, 165, 233, 1)',
            }],
          },
        },
        {
          type: 'pie',
          title: 'Trip Status Distribution',
          data: {
            labels: ['Completed', 'In Progress', 'Pending Funding'],
            datasets: [{
              label: 'Trips',
              data: [32, 6, 7],
              backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            }],
          },
        },
      ],
    };
  },

  generateFundingAnalysis(filter: ReportFilter): ReportData {
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

  generateCostBreakdown(filter: ReportFilter): ReportData {
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

  generateTripPerformance(filter: ReportFilter): ReportData {
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
  generatePortfolioSummary(filter: ReportFilter): ReportData {
    return {
      id: `report_${Date.now()}`,
      type: 'portfolio_summary',
      title: 'Investment Portfolio Summary',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 28,
        totalAmount: 4200000,
        averageAmount: 150000,
        growth: 22.5,
        trends: [
          { label: 'Total Invested', value: formatCurrency(4200000), change: 22 },
          { label: 'Active Investments', value: 15 },
          { label: 'Completed', value: 13 },
          { label: 'Portfolio Value', value: formatCurrency(4530000), change: 7.8 },
          { label: 'Expected Returns', value: formatCurrency(525000) },
        ],
      },
      details: [
        { borrower: 'Varun Beverages', amount: 200000, interestRate: 12, status: 'Active', maturityDate: '2025-02-15', expectedReturn: 204000 },
        { borrower: 'Emami Ltd', amount: 150000, interestRate: 11.5, status: 'Active', maturityDate: '2025-02-20', expectedReturn: 151437 },
        { borrower: 'Greenply Industries', amount: 180000, interestRate: 13, status: 'Completed', maturityDate: '2025-01-10', actualReturn: 183900 },
        { borrower: 'Berger Paints', amount: 220000, interestRate: 12.5, status: 'Active', maturityDate: '2025-02-25', expectedReturn: 224583 },
      ],
      charts: [
        {
          type: 'pie',
          title: 'Portfolio Allocation',
          data: {
            labels: ['Active (54%)', 'Completed (46%)'],
            datasets: [{
              label: 'Investments',
              data: [2268000, 1932000],
              backgroundColor: ['#3b82f6', '#10b981'],
            }],
          },
        },
        {
          type: 'bar',
          title: 'Monthly Investment Volume',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Investment Amount (₹)',
              data: [450000, 620000, 780000, 850000, 920000, 1050000],
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
            }],
          },
        },
      ],
    };
  },

  generateReturnsAnalysis(filter: ReportFilter): ReportData {
    return {
      id: `report_${Date.now()}`,
      type: 'returns_analysis',
      title: 'Returns Analysis Report',
      generatedAt: new Date().toISOString(),
      period: filter.period,
      startDate: filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: filter.endDate || new Date().toISOString(),
      summary: {
        totalCount: 13,
        totalAmount: 231500,
        averageAmount: 17807,
        growth: 28.3,
        trends: [
          { label: 'Total Returns', value: formatCurrency(231500), change: 28 },
          { label: 'Average ROI', value: '12.8%' },
          { label: 'Interest Income', value: formatCurrency(231500) },
          { label: 'Principal Recovered', value: formatCurrency(1932000) },
          { label: 'Annualized Return', value: '15.6%' },
        ],
      },
      details: [
        { investment: 'TRP001', principal: 150000, returns: 18000, roi: 12, duration: 30, completedDate: '2025-01-10' },
        { investment: 'TRP003', principal: 120000, returns: 15600, roi: 13, duration: 30, completedDate: '2025-01-15' },
        { investment: 'TRP007', principal: 180000, returns: 22500, roi: 12.5, duration: 30, completedDate: '2025-01-20' },
        { investment: 'TRP009', principal: 95000, returns: 11875, roi: 12.5, duration: 30, completedDate: '2025-01-25' },
      ],
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

  generateRiskAssessment(filter: ReportFilter): ReportData {
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

  generateInvestmentPerformance(filter: ReportFilter): ReportData {
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
  generateDeliverySummary(filter: ReportFilter): ReportData {
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

  generateEarningsReport(filter: ReportFilter): ReportData {
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

  generatePerformanceMetrics(filter: ReportFilter): ReportData {
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
  generatePlatformOverview(filter: ReportFilter): ReportData {
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

  generateUserAnalytics(filter: ReportFilter): ReportData {
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

  generateTransactionSummary(filter: ReportFilter): ReportData {
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

  generateKYCStatusReport(filter: ReportFilter): ReportData {
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
  generateWalletStatement(filter: ReportFilter, userId: string): ReportData {
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

  generateTaxSummary(filter: ReportFilter, userId: string): ReportData {
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
