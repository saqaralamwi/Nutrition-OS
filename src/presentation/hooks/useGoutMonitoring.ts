import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { GoutMonitoring } from '../../domain/types/gout';

export function useGoutMonitoring(patientId: string) {
  const [monitoring, setMonitoring] = useState<GoutMonitoring | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMonitoring = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const results = await db.get('gout_monitoring')
        .query(Q.where('patient_id', patientId))
        .fetch();
      if (results.length > 0) {
        const record = results[results.length - 1] as any;
        setMonitoring(record.toDomain());
      } else {
        setMonitoring(null);
      }
    } catch (err) {
      console.error('[useGoutMonitoring] Load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadMonitoring();
  }, [loadMonitoring]);

  const saveMonitoring = async (data: any) => {
    try {
      const db = await getDatabase();
      await db.write(async () => {
        const collection = db.get('gout_monitoring');
        const existing = await collection
          .query(Q.where('patient_id', patientId))
          .fetch();

        const copyFields = (record: any) => {
          record.patientId = patientId;
          record.planId = data.planId ?? '';
          record.followUpDate = data.followUpDate ?? '';
          record.serumUricAcid = Number(data.serumUricAcid ?? 0);
          record.urinaryUricAcid = Number(data.urinaryUricAcid ?? 0);
          record.hasFlare = !!data.hasFlare;
          record.flareDate = data.flareDate ?? '';
          record.flareSeverity = data.flareSeverity ?? 'none';
          record.flareDuration = Number(data.flareDuration ?? 0);
          record.affectedJoints = JSON.stringify(data.affectedJoints ?? []);
          record.painSeverity = Number(data.painSeverity ?? 0);
          record.hasSwelling = !!data.hasSwelling;
          record.hasTophi = !!data.hasTophi;
          record.tophiSize = Number(data.tophiSize ?? 0);
          record.weight = Number(data.weight ?? 0);
          record.weightChange = Number(data.weightChange ?? 0);
          record.adherenceToDiet = Number(data.adherenceToDiet ?? 0);
          record.adherenceToMedication = Number(data.adherenceToMedication ?? 0);
          record.adherenceToFluids = Number(data.adherenceToFluids ?? 0);
          record.hasMedicationSideEffects = !!data.hasMedicationSideEffects;
          record.sideEffectSeverity = data.sideEffectSeverity ?? 'none';
          record.isImproving = !!data.isImproving;
          record.uricAcidChange = Number(data.uricAcidChange ?? 0);
          record.flareReduction = Number(data.flareReduction ?? 0);
          record.improvementPercentage = Number(data.improvementPercentage ?? 0);
          record.nextFollowUpDate = data.nextFollowUpDate ?? '';
        };

        if (existing.length > 0) {
          await existing[0].update((record: any) => {
            copyFields(record);
            record.updatedAt = new Date().toISOString();
          });
        } else {
          await collection.create((record: any) => {
            copyFields(record);
            record.createdAt = new Date().toISOString();
            record.updatedAt = new Date().toISOString();
          });
        }
      });
      await loadMonitoring();
    } catch (err) {
      console.error('[useGoutMonitoring] Save failed:', err);
      throw err;
    }
  };

  return {
    monitoring,
    isLoading,
    createMonitoring: saveMonitoring,
    updateMonitoring: saveMonitoring,
    reload: loadMonitoring,
  };
}
