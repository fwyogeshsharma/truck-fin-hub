import { ReportConfig } from '@/types/reports';

export const reportConfigs: Record<string, ReportConfig> = {
  // Load Owner Reports
  trip_summary: {
    type: 'trip_summary',
    title: 'Trip Summary Report',
    description: 'Overview of all trips, funding status, and completion rates',
    roles: ['load_owner', 'admin', 'super_admin'],
    icon: 'Package',
    category: 'operational',
    dataPoints: ['Total Trips', 'Funded Trips', 'Completed Trips', 'Pending Trips', 'Total Funding Received'],
  },

  funding_analysis: {
    type: 'funding_analysis',
    title: 'Funding Analysis',
    description: 'Detailed analysis of funding sources, interest rates, and payment terms',
    roles: ['load_owner', 'admin'],
    icon: 'DollarSign',
    category: 'financial',
    dataPoints: ['Total Borrowed', 'Average Interest Rate', 'Total Interest Paid', 'Active Loans', 'Repayment Schedule'],
  },

  cost_breakdown: {
    type: 'cost_breakdown',
    title: 'Cost Breakdown',
    description: 'Breakdown of trip costs, fuel, tolls, and other expenses',
    roles: ['load_owner', 'admin'],
    icon: 'PieChart',
    category: 'financial',
    dataPoints: ['Fuel Costs', 'Toll Charges', 'Labor Costs', 'Financing Costs', 'Other Expenses'],
  },

  trip_performance: {
    type: 'trip_performance',
    title: 'Trip Performance Metrics',
    description: 'Performance indicators including on-time delivery and profitability',
    roles: ['load_owner', 'admin'],
    icon: 'TrendingUp',
    category: 'performance',
    dataPoints: ['On-Time Delivery %', 'Average Trip Duration', 'Profit Margin', 'Customer Satisfaction'],
  },

  // Lender Reports
  portfolio_summary: {
    type: 'portfolio_summary',
    title: 'Investment Portfolio Summary',
    description: 'Complete overview of your investment portfolio and allocation',
    roles: ['lender', 'admin', 'super_admin'],
    icon: 'Briefcase',
    category: 'financial',
    dataPoints: ['Total Invested', 'Active Investments', 'Completed Investments', 'Portfolio Value', 'Asset Allocation'],
  },

  returns_analysis: {
    type: 'returns_analysis',
    title: 'Returns Analysis',
    description: 'Detailed analysis of returns, ROI, and income generated',
    roles: ['lender', 'admin'],
    icon: 'TrendingUp',
    category: 'financial',
    dataPoints: ['Total Returns', 'Average ROI', 'Interest Income', 'Principal Recovered', 'Outstanding Amount'],
  },

  risk_assessment: {
    type: 'risk_assessment',
    title: 'Risk Assessment Report',
    description: 'Risk analysis of your portfolio by borrower, trip type, and region',
    roles: ['lender', 'admin'],
    icon: 'Shield',
    category: 'compliance',
    dataPoints: ['Risk Distribution', 'Default Rate', 'Concentration Risk', 'Credit Quality', 'Diversification Score'],
  },

  investment_performance: {
    type: 'investment_performance',
    title: 'Investment Performance',
    description: 'Track performance metrics and compare against benchmarks',
    roles: ['lender', 'admin'],
    icon: 'BarChart3',
    category: 'performance',
    dataPoints: ['YTD Returns', 'Monthly Performance', 'Best Performers', 'Underperformers', 'Benchmark Comparison'],
  },

  // Transporter Reports
  delivery_summary: {
    type: 'delivery_summary',
    title: 'Delivery Summary',
    description: 'Summary of deliveries completed, pending, and delayed',
    roles: ['transporter', 'admin'],
    icon: 'TruckIcon',
    category: 'operational',
    dataPoints: ['Total Deliveries', 'On-Time Deliveries', 'Delayed Deliveries', 'Distance Covered', 'Fuel Efficiency'],
  },

  earnings_report: {
    type: 'earnings_report',
    title: 'Earnings Report',
    description: 'Detailed breakdown of earnings from deliveries',
    roles: ['transporter', 'admin'],
    icon: 'Wallet',
    category: 'financial',
    dataPoints: ['Total Earnings', 'Average Per Trip', 'Bonus Earned', 'Deductions', 'Net Income'],
  },

  performance_metrics: {
    type: 'performance_metrics',
    title: 'Performance Metrics',
    description: 'Key performance indicators and ratings',
    roles: ['transporter', 'admin'],
    icon: 'Award',
    category: 'performance',
    dataPoints: ['Overall Rating', 'Delivery Success Rate', 'Customer Reviews', 'Efficiency Score', 'Safety Record'],
  },

  // Admin Reports
  platform_overview: {
    type: 'platform_overview',
    title: 'Platform Overview',
    description: 'High-level overview of entire platform activity',
    roles: ['admin', 'super_admin'],
    icon: 'LayoutDashboard',
    category: 'operational',
    dataPoints: ['Total Users', 'Active Trips', 'Total GMV', 'Platform Revenue', 'Growth Metrics'],
  },

  user_analytics: {
    type: 'user_analytics',
    title: 'User Analytics',
    description: 'User acquisition, retention, and engagement metrics',
    roles: ['admin', 'super_admin'],
    icon: 'Users',
    category: 'operational',
    dataPoints: ['New Users', 'Active Users', 'User Retention', 'Churn Rate', 'Engagement Score'],
  },

  transaction_summary: {
    type: 'transaction_summary',
    title: 'Transaction Summary',
    description: 'All financial transactions across the platform',
    roles: ['admin', 'super_admin'],
    icon: 'ArrowLeftRight',
    category: 'financial',
    dataPoints: ['Total Transactions', 'Transaction Volume', 'Average Transaction Size', 'Payment Methods', 'Failed Transactions'],
  },

  kyc_status_report: {
    type: 'kyc_status_report',
    title: 'KYC Status Report',
    description: 'KYC verification status across all users',
    roles: ['admin', 'super_admin'],
    icon: 'FileCheck',
    category: 'compliance',
    dataPoints: ['Pending KYC', 'Approved KYC', 'Rejected KYC', 'Verification Time', 'Document Quality'],
  },

  // Common Reports
  wallet_statement: {
    type: 'wallet_statement',
    title: 'Wallet Statement',
    description: 'Complete statement of all wallet transactions',
    roles: ['load_owner', 'lender', 'transporter', 'admin'],
    icon: 'Receipt',
    category: 'financial',
    dataPoints: ['Opening Balance', 'Credits', 'Debits', 'Closing Balance', 'Transaction History'],
  },

  tax_summary: {
    type: 'tax_summary',
    title: 'Tax Summary',
    description: 'Tax-related summary for the financial year',
    roles: ['load_owner', 'lender', 'transporter', 'admin'],
    icon: 'Calculator',
    category: 'compliance',
    dataPoints: ['Taxable Income', 'TDS Deducted', 'GST Collected', 'Tax Liability', 'Form 26AS Data'],
  },
};

// Get reports by role
export const getReportsByRole = (role: string): ReportConfig[] => {
  return Object.values(reportConfigs).filter(config => config.roles.includes(role));
};

// Get reports by category
export const getReportsByCategory = (role: string, category: string): ReportConfig[] => {
  return Object.values(reportConfigs).filter(
    config => config.roles.includes(role) && config.category === category
  );
};
