import * as math from 'mathjs';
import { StatisticalMetrics, TrendAnalysis, PatternRecognition, CorrelationAnalysis, TrendType } from '../types/analytics';

export class StatisticalAnalysisEngine {
  
  /**
   * Calculate statistical metrics for a dataset
   * @param data - Array of numbers
   * @returns Statistical metrics
   */
  static calculateMetrics(data: number[]): StatisticalMetrics {
    if (data.length === 0) {
      throw new Error('Cannot calculate metrics for empty dataset');
    }

    const mean = math.mean(data) as unknown as number;
    const median = math.median(data) as unknown as number;
    const stdDev = math.std(data) as unknown as number;
    const variance = math.variance(data) as unknown as number;
    const min = math.min(data) as unknown as number;
    const max = math.max(data) as unknown as number;
    
    // Calculate mode
    const mode = this.calculateMode(data);
    
    // Calculate percentiles
    const sorted = [...data].sort((a, b) => a - b);
    const p25 = sorted[Math.floor(sorted.length * 0.25)];
    const p50 = sorted[Math.floor(sorted.length * 0.50)];
    const p75 = sorted[Math.floor(sorted.length * 0.75)];
    const p90 = sorted[Math.floor(sorted.length * 0.90)];

    return {
      mean,
      median,
      mode,
      stdDev,
      variance,
      min,
      max,
      range: max - min,
      count: data.length,
      percentiles: {
        p25,
        p50,
        p75,
        p90,
      },
    };
  }

  /**
   * Calculate mode of dataset
   */
  private static calculateMode(data: number[]): number {
    const frequency = new Map<number, number>();
    
    for (const value of data) {
      frequency.set(value, (frequency.get(value) || 0) + 1);
    }
    
    let maxFreq = 0;
    let mode = data[0] || 0;
    
    for (const [value, freq] of frequency.entries()) {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = value;
      }
    }
    
    return mode;
  }

  /**
   * Analyze trend in dataset
   * @param data - Array of numbers
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Trend analysis
   */
  static analyzeTrend(
    data: number[],
    startDate: string,
    endDate: string
  ): TrendAnalysis {
    if (data.length < 2) {
      throw new Error('Cannot analyze trend for dataset with less than 2 points');
    }

    // Create x values (time indices)
    const x = data.map((_, index) => index);
    
    // Calculate linear regression using local Least Squares method
    const regression = this.calculateLinearRegression(x, data);
    
    const slope = regression.slope;
    const rSquared = regression.r2;
    
    // Determine trend type
    const trend = this.determineTrendType(data, slope, rSquared);
    
    // Generate predictions
    const predictions = x.map(xi => slope * xi + regression.intercept);
    
    // Calculate confidence (based on r-squared)
    const confidence = rSquared;

    return {
      metric: 'trend',
      trend,
      slope,
      rSquared,
      confidence,
      startDate,
      endDate,
      dataPoints: data,
      predictions,
    };
  }

  /**
   * Determine trend type
   */
  private static determineTrendType(
    data: number[],
    slope: number,
    rSquared: number
  ): TrendType {
    const coefficientOfVariation = rSquared;
    
    if (coefficientOfVariation < 0.3) {
      return 'fluctuating';
    }
    
    if (slope > 0.1 && coefficientOfVariation >= 0.3) {
      return 'increasing';
    }
    
    if (slope < -0.1 && coefficientOfVariation >= 0.3) {
      return 'decreasing';
    }
    
    if (Math.abs(slope) <= 0.1 && coefficientOfVariation >= 0.3) {
      return 'stable';
    }
    
    // Check for seasonal pattern
    if (this.hasSeasonalPattern(data)) {
      return 'seasonal';
    }
    
    return 'fluctuating';
  }

  /**
   * Check for seasonal pattern
   */
  private static hasSeasonalPattern(data: number[]): boolean {
    if (data.length < 8) return false;
    
    // Simple seasonal detection (check for repeating pattern)
    const windowSize = Math.floor(data.length / 4);
    
    if (windowSize < 2) return false;
    
    let matches = 0;
    for (let i = 0; i < windowSize; i++) {
      if (Math.abs(data[i] - data[i + windowSize]) < Math.abs(data[i]) * 0.1) {
        matches++;
      }
    }
    
    return matches > windowSize * 0.7;
  }

  /**
   * Recognize patterns in dataset
   * @param data - Array of numbers
   * @returns Pattern recognition result
   */
  static recognizePatterns(data: number[]): PatternRecognition {
    if (data.length < 4) {
      throw new Error('Cannot recognize patterns for dataset with less than 4 points');
    }

    // Detect anomalies/outliers
    const mean = math.mean(data) as unknown as number;
    const stdDev = math.std(data) as unknown as number;
    const threshold = 2 * stdDev;
    
    const anomalyIndices: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i] - mean) > threshold) {
        anomalyIndices.push(i);
      }
    }
    
    // Determine pattern type
    let patternType: PatternRecognition['patternType'] = 'anomaly';
    
    if (anomalyIndices.length === 0) {
      // Check for cyclic pattern
      if (this.hasCyclicPattern(data)) {
        patternType = 'cyclic';
      } else if (this.hasPeriodicPattern(data)) {
        patternType = 'periodic';
      } else {
        patternType = 'anomaly';
      }
    } else {
      patternType = anomalyIndices.length > data.length * 0.2 ? 'outlier' : 'anomaly';
    }
    
    // Calculate confidence
    const confidence = 1 - (anomalyIndices.length / data.length);
    
    // Generate description
    const description = this.generatePatternDescription(patternType, anomalyIndices, data);

    return {
      patternType,
      confidence,
      frequency: patternType === 'cyclic' || patternType === 'periodic' 
        ? this.calculateFrequency(data) 
        : undefined,
      anomalyIndices,
      description,
    };
  }

  /**
   * Check for cyclic pattern
   */
  private static hasCyclicPattern(data: number[]): boolean {
    if (data.length < 6) return false;
    
    // Check for peaks and troughs
    let peaks = 0;
    let troughs = 0;
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks++;
      }
      if (data[i] < data[i - 1] && data[i] < data[i + 1]) {
        troughs++;
      }
    }
    
    return peaks >= 2 && troughs >= 1;
  }

  /**
   * Check for periodic pattern
   */
  private static hasPeriodicPattern(data: number[]): boolean {
    if (data.length < 8) return false;
    
    // Simple periodicity check (compare segments)
    const segmentSize = Math.floor(data.length / 2);
    
    let correlation = 0;
    for (let i = 0; i < segmentSize; i++) {
      correlation += Math.abs(data[i] - data[i + segmentSize]);
    }
    
    const meanVal = math.mean(data) as number;
    return meanVal === 0 ? correlation < 1 : correlation < segmentSize * meanVal * 0.2;
  }

  /**
   * Calculate frequency for cyclic/periodic pattern
   */
  private static calculateFrequency(data: number[]): number {
    if (data.length < 4) return 0;
    
    let peaks = 0;
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks++;
      }
    }
    
    return peaks > 0 ? data.length / peaks : 0;
  }

  /**
   * Generate pattern description
   */
  private static generatePatternDescription(
    patternType: PatternRecognition['patternType'],
    anomalyIndices: number[],
    data: number[]
  ): string {
    if (patternType === 'cyclic') {
      const frequency = this.calculateFrequency(data);
      return `Cyclic pattern detected with frequency of approximately ${frequency.toFixed(1)} data points per cycle.`;
    }
    
    if (patternType === 'periodic') {
      return 'Periodic pattern detected with regular intervals.';
    }
    
    if (patternType === 'outlier') {
      return `${anomalyIndices.length} outliers detected in the dataset (${((anomalyIndices.length / data.length) * 100).toFixed(1)}% of data).`;
    }
    
    if (anomalyIndices.length > 0) {
      return `${anomalyIndices.length} anomalies detected at indices: ${anomalyIndices.join(', ')}.`;
    }
    
    return 'No significant pattern detected. Data appears random.';
  }

  /**
   * Analyze correlation between two datasets
   * @param data1 - First array of numbers
   * @param data2 - Second array of numbers
   * @returns Correlation analysis
   */
  static analyzeCorrelation(data1: number[], data2: number[]): CorrelationAnalysis {
    if (data1.length !== data2.length) {
      throw new Error('Datasets must have same length');
    }
    
    if (data1.length < 2) {
      throw new Error('Cannot analyze correlation for dataset with less than 2 points');
    }

    // Calculate Pearson correlation locally
    const correlation = this.calculatePearsonCorrelation(data1, data2);
    
    // Calculate p-value
    const n = data1.length;
    let pValue = 0.5;
    if (Math.abs(correlation) > 0.9) {
      pValue = 0.001;
    } else {
      const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation || 1));
      pValue = this.calculatePValue(t, n - 2);
    }
    
    // Determine significance
    const significance = pValue < 0.01 ? 'high' : pValue < 0.05 ? 'moderate' : 'low';
    
    // Determine relationship
    const relationship = correlation > 0.3 ? 'positive' : correlation < -0.3 ? 'negative' : 'none';

    return {
      metric1: 'dataset1',
      metric2: 'dataset2',
      correlation,
      pValue,
      significance,
      relationship,
      dataPoints1: data1,
      dataPoints2: data2,
    };
  }

  /**
   * Calculate p-value (simplified t-distribution)
   */
  private static calculatePValue(t: number, df: number): number {
    const absT = Math.abs(t);
    
    if (absT > 3) {
      return 0.001;
    }
    
    if (absT > 2.5) {
      return 0.01;
    }
    
    if (absT > 2) {
      return 0.05;
    }
    
    if (absT > 1.5) {
      return 0.1;
    }
    
    return 0.5;
  }

  /**
   * Calculate linear regression using Least Squares Method
   */
  private static calculateLinearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    const n = x.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
      sumYY += y[i] * y[i];
    }
    
    const numSlope = n * sumXY - sumX * sumY;
    const denSlope = n * sumXX - sumX * sumX;
    
    const slope = denSlope === 0 ? 0 : numSlope / denSlope;
    const intercept = (sumY - slope * sumX) / n;
    
    const meanY = sumY / n;
    let ssTot = 0;
    let ssRes = 0;
    
    for (let i = 0; i < n; i++) {
      const predY = slope * x[i] + intercept;
      ssTot += (y[i] - meanY) * (y[i] - meanY);
      ssRes += (y[i] - predY) * (y[i] - predY);
    }
    
    const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
    
    return { slope, intercept, r2 };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private static calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
      sumYY += y[i] * y[i];
    }
    
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    if (den === 0) return 0;
    return num / den;
  }
}
