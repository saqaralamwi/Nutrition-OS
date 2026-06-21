import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { PreloadTask } from '../types/offline';
import { smartCacheManager } from './SmartCacheManager';

export class DataPreloader {
  private tasks: Map<string, PreloadTask> = new Map();

  /**
   * Initialize preloader
   */
  async initialize(): Promise<void> {
    console.log('[DataPreloader] Preloader initialized');
  }

  /**
   * Add preload task
   */
  async addTask(task: PreloadTask): Promise<void> {
    this.tasks.set(task.id, task);
    console.log(`[DataPreloader] Task added: ${task.id}`);
  }

  /**
   * Preload patient data
   */
  async preloadPatientData(patientId: string): Promise<void> {
    try {
      console.log(`[DataPreloader] Preloading patient data for ${patientId}`);
      
      const db = await getDatabase();
      
      // Preload vitals records
      const vitalsCollection = db.get('vitals_records');
      const vitalsQuery = vitalsCollection.query(
        Q.where('patient_id', patientId)
      );
      const vitals = await vitalsQuery.fetch();
      
      // Cache vitals
      await smartCacheManager.set(`patient-${patientId}-vitals`, vitals);
      
      // Preload nutrition plans (table 'nutritional_plans')
      let nutrition: any[] = [];
      try {
        const nutritionCollection = db.get('nutritional_plans');
        const nutritionQuery = nutritionCollection.query(
          Q.where('patient_id', patientId)
        );
        nutrition = await nutritionQuery.fetch();
        await smartCacheManager.set(`patient-${patientId}-nutrition`, nutrition);
      } catch (err: any) {
        console.log(`[DataPreloader] Preload nutritional_plans failed: ${err.message}`);
      }
      
      // Preload patient metrics (table 'patient_weight_logs')
      let metrics: any[] = [];
      try {
        const metricsCollection = db.get('patient_weight_logs');
        const metricsQuery = metricsCollection.query(
          Q.where('patient_id', patientId)
        );
        metrics = await metricsQuery.fetch();
        await smartCacheManager.set(`patient-${patientId}-metrics`, metrics);
      } catch (err: any) {
        console.log(`[DataPreloader] Preload patient_weight_logs failed: ${err.message}`);
      }
      
      console.log(`[DataPreloader] Patient data preloaded for ${patientId}`);
      console.log(`  Vitals: ${vitals.length} records`);
      console.log(`  Nutrition: ${nutrition.length} records`);
      console.log(`  Metrics: ${metrics.length} records`);
    } catch (err: any) {
      console.error(`[DataPreloader] Preload patient data failed for ${patientId}:`, err);
      throw new Error(`Failed to preload patient data: ${err.message}`);
    }
  }

  /**
   * Preload pathway data
   */
  async preloadPathwayData(pathwayId: string): Promise<void> {
    try {
      console.log(`[DataPreloader] Preloading pathway data for ${pathwayId}`);
      
      const db = await getDatabase();
      
      // Preload gateways
      let gateways: any[] = [];
      try {
        const gatewayCollection = db.get('gateways');
        const gatewayQuery = gatewayCollection.query(
          Q.where('pathway_id', pathwayId)
        );
        gateways = await gatewayQuery.fetch();
        await smartCacheManager.set(`pathway-${pathwayId}-gateways`, gateways);
      } catch (err: any) {
        console.log(`[DataPreloader] gateways collection not found, skipping: ${err.message}`);
      }
      
      // Preload assessments
      let assessments: any[] = [];
      try {
        const assessmentCollection = db.get('assessments');
        const assessmentQuery = assessmentCollection.query(
          Q.where('pathway_id', pathwayId)
        );
        assessments = await assessmentQuery.fetch();
        await smartCacheManager.set(`pathway-${pathwayId}-assessments`, assessments);
      } catch (err: any) {
        console.log(`[DataPreloader] assessments collection not found, skipping: ${err.message}`);
      }
      
      console.log(`[DataPreloader] Pathway data preloaded for ${pathwayId}`);
      console.log(`  Gateways: ${gateways.length} records`);
      console.log(`  Assessments: ${assessments.length} records`);
    } catch (err: any) {
      console.error(`[DataPreloader] Preload pathway data failed for ${pathwayId}:`, err);
      throw new Error(`Failed to preload pathway data: ${err.message}`);
    }
  }

  /**
   * Preload all data (full preload)
   */
  async preloadAllData(): Promise<void> {
    try {
      console.log('[DataPreloader] Preloading all data...');
      
      const db = await getDatabase();
      
      // Preload all collections
      const collections = [
        'patients',
        'vitals_records',
        'nutritional_plans',
        'patient_weight_logs',
        'gateways',
        'assessments',
      ];
      
      for (const collectionName of collections) {
        try {
          const collection = db.get(collectionName);
          const records = await collection.query().fetch();
          
          await smartCacheManager.set(collectionName, records);
          
          console.log(`[DataPreloader] Preloaded ${collectionName}: ${records.length} records`);
        } catch (err: any) {
          console.log(`[DataPreloader] Preload ${collectionName} failed or skipped: ${err.message}`);
        }
      }
      
      console.log('[DataPreloader] All data preloaded');
    } catch (err: any) {
      console.error('[DataPreloader] Preload all data failed:', err);
      throw new Error('Failed to preload all data: ' + err.message);
    }
  }

  /**
   * Get all tasks
   */
  getTasks(): PreloadTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Dispose preloader
   */
  async dispose(): Promise<void> {
    this.tasks.clear();
    console.log('[DataPreloader] Preloader disposed');
  }
}

// Singleton instance
export const dataPreloader = new DataPreloader();
