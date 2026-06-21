import { vi, describe, it, expect, beforeEach } from 'vitest';
import { StatisticalAnalysisEngine } from '../domain/analytics/StatisticalAnalysisEngine';
import { DataAnalyticsOrchestrator } from '../domain/analytics/DataAnalyticsOrchestrator';
import { getDatabase } from '../data/database';

// Mock getDatabase
vi.mock('../data/database', () => {
  const mockFetch = vi.fn();
  const mockQuery = vi.fn(() => ({
    fetch: mockFetch,
  }));
  const mockGet = vi.fn(() => ({
    query: mockQuery,
  }));
  const mockDb = {
    get: mockGet,
  };
  return {
    getDatabase: vi.fn(async () => mockDb),
    getDatabaseInstance: vi.fn(() => mockDb),
  };
});

describe('Offline-First Advanced Analytics Tests', () => {
  describe('StatisticalAnalysisEngine', () => {
    
    it('should calculate correct metrics for a basic dataset', () => {
      const data = [10, 20, 30, 40, 50];
      const metrics = StatisticalAnalysisEngine.calculateMetrics(data);

      expect(metrics.mean).toBe(30);
      expect(metrics.median).toBe(30);
      expect(metrics.min).toBe(10);
      expect(metrics.max).toBe(50);
      expect(metrics.range).toBe(40);
      expect(metrics.count).toBe(5);
      expect(metrics.percentiles.p25).toBe(20);
      expect(metrics.percentiles.p50).toBe(30);
      expect(metrics.percentiles.p75).toBe(40);
      expect(metrics.percentiles.p90).toBe(50);
    });

    it('should calculate mode correctly', () => {
      const data = [1, 2, 2, 3, 3, 3, 4];
      const metrics = StatisticalAnalysisEngine.calculateMetrics(data);
      expect(metrics.mode).toBe(3);
    });

    it('should throw error for empty dataset', () => {
      expect(() => StatisticalAnalysisEngine.calculateMetrics([])).toThrow();
    });

    it('should analyze increasing, decreasing, and stable trends', () => {
      const increasingData = [10, 12, 14, 16, 18, 20];
      const decreasingData = [20, 18, 16, 14, 12, 10];
      const stableData = [15, 15, 15, 15, 15, 15];

      const incTrend = StatisticalAnalysisEngine.analyzeTrend(increasingData, '2026-06-01', '2026-06-06');
      expect(incTrend.trend).toBe('increasing');
      expect(incTrend.slope).toBeGreaterThan(0.1);
      expect(incTrend.confidence).toBeCloseTo(1.0);

      const decTrend = StatisticalAnalysisEngine.analyzeTrend(decreasingData, '2026-06-01', '2026-06-06');
      expect(decTrend.trend).toBe('decreasing');
      expect(decTrend.slope).toBeLessThan(-0.1);

      const stabTrend = StatisticalAnalysisEngine.analyzeTrend(stableData, '2026-06-01', '2026-06-06');
      expect(stabTrend.trend).toBe('stable');
      expect(Math.abs(stabTrend.slope)).toBeLessThanOrEqual(0.1);
    });

    it('should recognize cyclical, periodic, and anomaly patterns', () => {
      // Cyclic pattern: Peaks and troughs
      const cyclicData = [10, 20, 10, 5, 10, 20, 10, 5];
      const cyclicPattern = StatisticalAnalysisEngine.recognizePatterns(cyclicData);
      expect(cyclicPattern.patternType).toBe('cyclic');
      expect(cyclicPattern.frequency).toBeDefined();

      // Anomaly pattern: A huge outlier
      const anomalyData = [10, 11, 10, 12, 100, 11, 12, 10];
      const anomalyPattern = StatisticalAnalysisEngine.recognizePatterns(anomalyData);
      expect(anomalyPattern.patternType).toBe('anomaly');
      expect(anomalyPattern.anomalyIndices).toContain(4);
    });

    it('should analyze correlation between two datasets', () => {
      const data1 = [1, 2, 3, 4, 5];
      const data2 = [2, 4, 6, 8, 10]; // Perfect positive correlation

      const correlation = StatisticalAnalysisEngine.analyzeCorrelation(data1, data2);
      expect(correlation.correlation).toBeCloseTo(1.0);
      expect(correlation.relationship).toBe('positive');
      expect(correlation.significance).toBe('high');
    });

    it('should throw error for mismatched correlation dataset lengths', () => {
      expect(() => StatisticalAnalysisEngine.analyzeCorrelation([1, 2], [1, 2, 3])).toThrow();
    });
  });

  describe('DataAnalyticsOrchestrator', () => {
    let mockDb: any;

    beforeEach(async () => {
      mockDb = await getDatabase();
      vi.clearAllMocks();
    });

    it('should generate complete statistical report successfully', async () => {
      // Setup mocked fetch returns
      const mockVitals = [
        { id: '1', bmi: 22, weightKg: 70 },
        { id: '2', bmi: 22.5, weightKg: 71 },
        { id: '3', bmi: 23, weightKg: 72 },
        { id: '4', bmi: 22.8, weightKg: 71.5 },
      ];
      
      const mockNutrition = [
        { id: '1', targetCalories: 2000, proteinTarget: 100 },
        { id: '2', targetCalories: 2100, proteinTarget: 105 },
        { id: '3', targetCalories: 2050, proteinTarget: 102 },
        { id: '4', targetCalories: 2080, proteinTarget: 104 },
      ];

      const mockMetrics = [
        { id: '1', bmi: 22, weightKg: 70 },
        { id: '2', bmi: 22.5, weightKg: 71 },
        { id: '3', bmi: 23, weightKg: 72 },
        { id: '4', bmi: 22.8, weightKg: 71.5 },
      ];

      // Setup the db.get().query().fetch mock return values sequentially
      const mockGet = mockDb.get as any;
      mockGet.mockImplementation((table: string) => {
        let records: any[] = [];
        if (table === 'vitals_records') records = mockVitals;
        else if (table === 'nutritional_plans') records = mockNutrition;
        else if (table === 'patient_weight_logs') records = mockMetrics;
        
        return {
          query: vi.fn(() => ({
            fetch: vi.fn(async () => records),
          })),
        };
      });

      const filter = {
        startDate: '2026-06-01',
        endDate: '2026-06-05',
      };

      const report = await DataAnalyticsOrchestrator.generateStatisticalReport('patient-123', filter);

      expect(report.patientId).toBe('patient-123');
      expect(report.metrics.vitals).toBeDefined();
      expect(report.metrics.nutrition).toBeDefined();
      expect(report.metrics.metrics).toBeDefined();
      
      expect(report.trends).toHaveLength(2);
      expect(report.patterns).toHaveLength(2);
      expect(report.correlations).toHaveLength(1);
      expect(report.insights.length).toBeGreaterThan(0);
    });

    it('should throw error when no data is found', async () => {
      const mockGet = mockDb.get as any;
      mockGet.mockImplementation(() => ({
        query: vi.fn(() => ({
          fetch: vi.fn(async () => []),
        })),
      }));

      await expect(
        DataAnalyticsOrchestrator.generateStatisticalReport('patient-123', {})
      ).rejects.toThrow('No data found for patient');
    });
  });
});
