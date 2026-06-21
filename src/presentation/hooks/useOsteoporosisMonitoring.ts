import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { OsteoporosisMonitoring } from '../../domain/types/osteoporosis';

export function useOsteoporosisMonitoring(patientId: string) {
  const [monitoringList, setMonitoringList] = useState<OsteoporosisMonitoring[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMonitoring = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const results = await db.get('osteoporosis_monitoring')
        .query(Q.where('patient_id', patientId), Q.sortBy('follow_up_date', Q.desc))
        .fetch();
      setMonitoringList(results.map((r: any) => r.toDomain()));
    } catch (err) {
      console.error('[useOsteoporosisMonitoring] Load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadMonitoring();
  }, [loadMonitoring]);

  const addMonitoring = async (data: any) => {
    try {
      const db = await getDatabase();
      await db.write(async () => {
        const collection = db.get('osteoporosis_monitoring');
        await collection.create((record: any) => {
          record.patientId = patientId;
          record.planId = data.planId || '';
          record.followUpDate = data.followUpDate || new Date().toISOString().split('T')[0];
          record.femoralNeckTScore = Number(data.femoralNeckTScore ?? 0);
          record.lumbarSpineTScore = Number(data.lumbarSpineTScore ?? 0);
          record.overallTScore = Number(data.overallTScore ?? 0);
          record.weight = Number(data.weight ?? 0);
          record.height = Number(data.height ?? 0);
          record.bmi = Number(data.bmi ?? 0);
          record.vitaminD25OH = Number(data.vitaminD25OH ?? 0);
          record.serumCalcium = Number(data.serumCalcium ?? 0);
          record.hasNewFracture = !!data.hasNewFracture;
          record.fractureType = data.fractureType ?? null;
          record.backPainImprovement = data.backPainImprovement ?? 'none';
          record.physicalActivityImprovement = data.physicalActivityImprovement ?? 'none';
          record.adherenceToSupplements = !!data.adherenceToSupplements;
          record.adherenceToExercise = !!data.adherenceToExercise;
          record.adherenceToDiet = !!data.adherenceToDiet;
          record.isImproving = !!data.isImproving;
          record.boneDensityChange = Number(data.boneDensityChange ?? 0);
          record.improvementPercentage = Number(data.improvementPercentage ?? 0);
          record.nextFollowUpDate = data.nextFollowUpDate || '';
          record.createdAt = new Date().toISOString();
          record.updatedAt = new Date().toISOString();
        });
      });
      await loadMonitoring();
    } catch (err) {
      console.error('[useOsteoporosisMonitoring] Add failed:', err);
      throw err;
    }
  };

  const deleteMonitoring = async (id: string) => {
    try {
      const db = await getDatabase();
      await db.write(async () => {
        const record = await db.get('osteoporosis_monitoring').find(id);
        await record.destroyPermanently();
      });
      await loadMonitoring();
    } catch (err) {
      console.error('[useOsteoporosisMonitoring] Delete failed:', err);
      throw err;
    }
  };

  return {
    monitoringList,
    isLoading,
    addMonitoring,
    deleteMonitoring,
    reload: loadMonitoring,
  };
}
