import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { StatisticalAnalysisEngine } from './StatisticalAnalysisEngine';
import { 
  StatisticalReport,
  TrendAnalysis,
  PatternRecognition,
  CorrelationAnalysis,
  AnalyticsFilter,
} from '../types/analytics';

export class DataAnalyticsOrchestrator {
  
  /**
   * Generate complete statistical report for patient
   * @param patientId - Patient ID
   * @param filter - Analytics filter
   * @returns Statistical report
   */
  static async generateStatisticalReport(
    patientId: string,
    filter: AnalyticsFilter
  ): Promise<StatisticalReport> {
    
    try {
      console.log('[DataAnalyticsOrchestrator] Generating statistical report...');
      
      // Fetch patient data from WatermelonDB
      const vitalsData = await this.fetchVitalsData(patientId, filter);
      const nutritionData = await this.fetchNutritionData(patientId, filter);
      const metricsData = await this.fetchMetricsData(patientId, filter);
      
      if (vitalsData.length === 0 && nutritionData.length === 0) {
        throw new Error('No data found for patient');
      }

      // Calculate statistical metrics
      const metrics: { [key: string]: any } = {};
      
      if (vitalsData.length > 0) {
        metrics.vitals = StatisticalAnalysisEngine.calculateMetrics(vitalsData);
      }
      
      if (nutritionData.length > 0) {
        metrics.nutrition = StatisticalAnalysisEngine.calculateMetrics(nutritionData);
      }
      
      if (metricsData.length > 0) {
        metrics.metrics = StatisticalAnalysisEngine.calculateMetrics(metricsData);
      }

      // Analyze trends
      const trends: TrendAnalysis[] = [];
      
      if (vitalsData.length >= 2 && filter.startDate && filter.endDate) {
        trends.push(
          StatisticalAnalysisEngine.analyzeTrend(
            vitalsData,
            filter.startDate,
            filter.endDate
          )
        );
      }
      
      if (nutritionData.length >= 2 && filter.startDate && filter.endDate) {
        trends.push(
          StatisticalAnalysisEngine.analyzeTrend(
            nutritionData,
            filter.startDate,
            filter.endDate
          )
        );
      }

      // Recognize patterns
      const patterns: PatternRecognition[] = [];
      
      if (vitalsData.length >= 4) {
        patterns.push(
          StatisticalAnalysisEngine.recognizePatterns(vitalsData)
        );
      }
      
      if (nutritionData.length >= 4) {
        patterns.push(
          StatisticalAnalysisEngine.recognizePatterns(nutritionData)
        );
      }

      // Analyze correlations
      const correlations: CorrelationAnalysis[] = [];
      
      if (vitalsData.length >= 2 && nutritionData.length >= 2) {
        // Ensure same length
        const minLength = Math.min(vitalsData.length, nutritionData.length);
        correlations.push(
          StatisticalAnalysisEngine.analyzeCorrelation(
            vitalsData.slice(0, minLength),
            nutritionData.slice(0, minLength)
          )
        );
      }

      // Generate insights
      const insights = this.generateInsights(metrics, trends, patterns, correlations);

      const report: StatisticalReport = {
        id: `report-${patientId}-${Date.now()}`,
        title: `Statistical Report for Patient ${patientId}`,
        patientId,
        period: {
          startDate: filter.startDate || new Date().toISOString(),
          endDate: filter.endDate || new Date().toISOString(),
        },
        metrics,
        trends,
        patterns,
        correlations,
        insights,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('[DataAnalyticsOrchestrator] Report generated successfully');
      return report;
    } catch (err: any) {
      console.error('[DataAnalyticsOrchestrator] Generate report failed:', err);
      throw new Error('Failed to generate statistical report: ' + err.message);
    }
  }

  /**
   * Fetch vitals data from WatermelonDB
   */
  private static async fetchVitalsData(
    patientId: string,
    filter: AnalyticsFilter
  ): Promise<number[]> {
    try {
      const db = await getDatabase();
      const collection = db.get('vitals_records');
      
      const query = collection.query(
        Q.where('patient_id', patientId)
      );
      
      const records = await query.fetch();
      
      // Extract values (e.g., BMI, weight, etc.)
      const values = records.map(record => {
        const r = record as any;
        return r.bmi || r.weightKg || r.weight || 0;
      });
      
      return values;
    } catch (err) {
      console.error('[DataAnalyticsOrchestrator] Fetch vitals failed:', err);
      return [];
    }
  }

  /**
   * Fetch nutrition data from WatermelonDB
   */
  private static async fetchNutritionData(
    patientId: string,
    filter: AnalyticsFilter
  ): Promise<number[]> {
    try {
      const db = await getDatabase();
      const collection = db.get('nutritional_plans');
      
      const query = collection.query(
        Q.where('patient_id', patientId)
      );
      
      const records = await query.fetch();
      
      // Extract values (e.g., calorie target, protein target, etc.)
      const values = records.map(record => {
        const r = record as any;
        return r.targetCalories || r.proteinTarget || 0;
      });
      
      return values;
    } catch (err) {
      console.error('[DataAnalyticsOrchestrator] Fetch nutrition failed:', err);
      return [];
    }
  }

  /**
   * Fetch metrics data from WatermelonDB
   */
  private static async fetchMetricsData(
    patientId: string,
    filter: AnalyticsFilter
  ): Promise<number[]> {
    try {
      const db = await getDatabase();
      const collection = db.get('patient_weight_logs');
      
      const query = collection.query(
        Q.where('patient_id', patientId)
      );
      
      const records = await query.fetch();
      
      // Extract values
      const values = records.map(record => {
        const r = record as any;
        return r.bmi || r.weightKg || 0;
      });
      
      return values;
    } catch (err) {
      console.error('[DataAnalyticsOrchestrator] Fetch metrics failed:', err);
      return [];
    }
  }

  /**
   * Generate insights from analysis results
   */
  private static generateInsights(
    metrics: any,
    trends: TrendAnalysis[],
    patterns: PatternRecognition[],
    correlations: CorrelationAnalysis[]
  ): string[] {
    const insights: string[] = [];
    
    // Trend insights
    for (const trend of trends) {
      if (trend.trend === 'increasing') {
        insights.push(`Metric is showing increasing trend (slope: ${trend.slope.toFixed(2)}, confidence: ${trend.confidence.toFixed(2)}).`);
      } else if (trend.trend === 'decreasing') {
        insights.push(`Metric is showing decreasing trend (slope: ${trend.slope.toFixed(2)}, confidence: ${trend.confidence.toFixed(2)}).`);
      } else if (trend.trend === 'stable') {
        insights.push(`Metric is stable over time.`);
      }
    }
    
    // Pattern insights
    for (const pattern of patterns) {
      insights.push(pattern.description);
    }
    
    // Correlation insights
    for (const correlation of correlations) {
      if (correlation.relationship === 'positive') {
        insights.push(`Strong positive correlation between metrics (r=${correlation.correlation.toFixed(2)}).`);
      } else if (correlation.relationship === 'negative') {
        insights.push(`Strong negative correlation between metrics (r=${correlation.correlation.toFixed(2)}).`);
      }
    }
    
    if (insights.length === 0) {
      insights.push('No significant insights detected. Continue monitoring.');
    }
    
    return insights;
  }
}
