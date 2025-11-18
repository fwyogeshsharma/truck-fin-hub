export type ReportType =
  // Load Owner Reports
  | 'trip_summary'
  | 'funding_analysis'
  | 'cost_breakdown'
  | 'trip_performance'

  // Lender Reports
  | 'portfolio_summary'
  | 'returns_analysis'
  | 'risk_assessment'
  | 'investment_performance'

  // Transporter Reports
  | 'delivery_summary'
  | 'earnings_report'
  | 'performance_metrics'
  | 'transporter_loan_trip_report'

  // Load Agent Reports
  | 'load_agent_loan_trip_report'

  // Admin Reports
  | 'platform_overview'
  | 'user_analytics'
  | 'transaction_summary'
  | 'kyc_status_report'

  // Common Reports
  | 'wallet_statement'
  | 'tax_summary';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface ReportConfig {
  type: ReportType;
  title: string;
  description: string;
  roles: string[];
  icon: string;
  category: 'financial' | 'operational' | 'performance' | 'compliance';
  dataPoints: string[];
}

export interface ReportFilter {
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
  status?: string;
  category?: string;
  company?: string;
  loadType?: string;
  // Advanced Filters
  amountMin?: number;
  amountMax?: number;
  distanceMin?: number;
  distanceMax?: number;
  weightMin?: number;
  weightMax?: number;
  origin?: string;
  destination?: string;
  riskLevel?: string;
  interestRateMin?: number;
  interestRateMax?: number;
  userId?: string;
  lenderId?: string;
  transporterId?: string;
  loadOwnerId?: string;
  clientCompany?: string;
  senderCompany?: string;
  receiverCompany?: string;
  groupBy?: 'day' | 'week' | 'month' | 'company' | 'loadType' | 'status';
  sortBy?: 'date' | 'amount' | 'distance' | 'weight' | 'returns';
  sortOrder?: 'asc' | 'desc';
}

export interface ReportData {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  summary: ReportSummary;
  details: any[];
  charts?: ChartData[];
}

export interface ReportSummary {
  totalCount: number;
  totalAmount: number;
  averageAmount: number;
  growth?: number;
  trends?: {
    label: string;
    value: number | string;
    change?: number;
  }[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
    }[];
  };
}
