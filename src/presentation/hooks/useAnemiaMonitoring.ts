import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { AnemiaMonitoring } from '../../domain/types/anemia';

export function useAnemiaMonitoring(patientId: string) {
  const [monitoringList, setMonitoringList] = useState<AnemiaMonitoring[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMonitoring = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const results = await db.get('anemia_monitoring')
        .query(Q.where('patient_id', patientId), Q.sortBy('follow_up_date', Q.desc))
        .fetch();
      setMonitoringList(results.map((r: any) => r.toDomain()));
    } catch (err) {
      console.error('[useAnemiaMonitoring] Load failed:', err);
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
        const collection = db.get('anemia_monitoring');
        await collection.create((record: any) => {
          record.patientId = patientId;
          record.planId = data.planId || '';
          record.followUpDate = data.followUpDate || new Date().toISOString().split('T')[0];
          record.hemoglobin = Number(data.hemoglobin ?? 0);
          record.ferritin = Number(data.ferritin ?? 0);
          record.serumIron = Number(data.serumIron ?? 0);
          record.vitaminB12 = Number(data.vitaminB12 ?? 0);
          record.serumFolate = Number(data.serumFolate ?? 0);
          record.mcv = Number(data.mcv ?? 0);
          record.fatigueImprovement = data.fatigueImprovement ?? 'none';
          record.weaknessImprovement = data.weaknessImprovement ?? 'none';
          record.adherenceToSupplements = !!data.adherenceToSupplements;
          record.adherenceToDiet = !!data.adherenceToDiet;
          record.hasGISideEffects = !!data.hasGISideEffects;
          record.sideEffectSeverity = data.sideEffectSeverity ?? 'none';
          record.isImproving = !!data.isImproving;
          record.recoveryPercentage = Number(data.recoveryPercentage ?? 0);
          record.nextFollowUpDate = data.nextFollowUpDate || '';
          record.createdAt = new Date().toISOString();
          record.updatedAt = new Date().toISOString();
        });
      });
      await loadMonitoring();
    } catch (err) {
      console.error('[useAnemiaMonitoring] Add failed:', err);
      throw err;
    }
  };

  const deleteMonitoring = async (id: string) => {
    try {
      const db = await getDatabase();
      await db.write(async () => {
        const record = await db.get('anemia_monitoring').find(id);
        await record.destroyPermanently();
      });
      await loadMonitoring();
    } catch (err) {
      console.error('[useAnemiaMonitoring] Delete failed:', err);
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
