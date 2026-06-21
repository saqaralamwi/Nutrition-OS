// Chart types
export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'area' 
  | 'radar'
  | 'scatter'
  | 'heatmap';

// Trend types
export type TrendType = 
  | 'increasing' 
  | 'decreasing' 
  | 'stable' 
  | 'fluctuating'
  | 'seasonal';

// Statistical metrics
export interface StatisticalMetrics {
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  count: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

// Trend analysis result
export interface TrendAnalysis {
  metric: string;
  trend: TrendType;
  slope: number;
  rSquared: number;
  confidence: number;
  startDate: string;
  endDate: string;
  dataPoints: number[];
  predictions: number[];
}

// Pattern recognition result
export interface PatternRecognition {
  patternType: 'cyclic' | 'periodic' | 'anomaly' | 'outlier';
  confidence: number;
  frequency?: number;
  anomalyIndices: number[];
  description: string;
}

// Correlation analysis result
export interface CorrelationAnalysis {
  metric1: string;
  metric2: string;
  correlation: number; // -1 to 1
  pValue: number;
  significance: 'low' | 'moderate' | 'high';
  relationship: 'positive' | 'negative' | 'none';
  dataPoints1: number[];
  dataPoints2: number[];
}

// Chart data point
export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number; // For dual-axis charts
  color?: string;
}

// Complete chart configuration
export interface ChartConfig {
  id: string;
  title: string;
  description: string;
  type: ChartType;
  xAxis: {
    label: string;
    dataKey: string;
  };
  yAxis: {
    label: string;
    dataKey: string;
    min?: number;
    max?: number;
  };
  data: ChartDataPoint[];
  colors: string[];
  legend: boolean;
  tooltip: boolean;
  grid: boolean;
}

// Statistical report
export interface StatisticalReport {
  id: string;
  title: string;
  patientId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    [key: string]: StatisticalMetrics;
  };
  trends: TrendAnalysis[];
  patterns: PatternRecognition[];
  correlations: CorrelationAnalysis[];
  insights: string[];
  createdAt: string;
  updatedAt: string;
}

// Dashboard widget
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'trend' | 'alert';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: ChartConfig | StatisticalMetrics | TrendAnalysis;
  color: string;
  isCollapsed: boolean;
}

// Dashboard configuration
export interface DashboardConfig {
  id: string;
  title: string;
  description: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'flexible';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Analytics filter
export interface AnalyticsFilter {
  patientId?: string;
  startDate?: string;
  endDate?: string;
  metricTypes?: string[];
  pathways?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
