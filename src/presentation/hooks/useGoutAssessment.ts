import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { GoutAssessment } from '../../domain/types/gout';

export function useGoutAssessment(patientId: string) {
  const [assessment, setAssessment] = useState<GoutAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAssessment = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const results = await db.get('gout_assessments')
        .query(Q.where('patient_id', patientId))
        .fetch();
      if (results.length > 0) {
        const record = results[results.length - 1] as any;
        setAssessment(record.toDomain());
      } else {
        setAssessment(null);
      }
    } catch (err) {
      console.error('[useGoutAssessment] Load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  const saveAssessment = async (data: any) => {
    try {
      const db = await getDatabase();
      await db.write(async () => {
        const collection = db.get('gout_assessments');
        const existing = await collection
          .query(Q.where('patient_id', patientId))
          .fetch();

        const copyFields = (record: any) => {
          record.patientId = patientId;
          record.serumUricAcid = Number(data.serumUricAcid ?? 0);
          record.uricAcidUnit = data.uricAcidUnit ?? 'mg/dL';
          record.uricAcidStatus = data.uricAcidStatus ?? 'unknown';
          record.urinaryUricAcid = Number(data.urinaryUricAcid ?? 0);
          record.severity = data.severity ?? 'none';
          record.stage = data.stage ?? 'unknown';
          record.flareFrequency = Number(data.flareFrequency ?? 0);
          record.lastFlareDate = data.lastFlareDate ?? '';
          record.averageFlareDuration = Number(data.averageFlareDuration ?? 0);
          record.hasChronicPain = !!data.hasChronicPain;
          record.affectedJoints = JSON.stringify(data.affectedJoints ?? []);
          record.hasTophi = !!data.hasTophi;
          record.tophiLocation = JSON.stringify(data.tophiLocation ?? []);
          record.age = Number(data.age ?? 0);
          record.gender = data.gender ?? 'unknown';
          record.weight = Number(data.weight ?? 0);
          record.height = Number(data.height ?? 0);
          record.bmi = Number(data.bmi ?? 0);
          record.hasObesity = !!data.hasObesity;
          record.hasMetabolicSyndrome = !!data.hasMetabolicSyndrome;
          record.hasDiabetes = !!data.hasDiabetes;
          record.hasCKD = !!data.hasCKD;
          record.hasHTN = !!data.hasHTN;
          record.hasDyslipidemia = !!data.hasDyslipidemia;
          record.hasSmoking = !!data.hasSmoking;
          record.hasAlcoholUse = !!data.hasAlcoholUse;
          record.alcoholType = data.alcoholType ?? '';
          record.alcoholUnitsPerWeek = Number(data.alcoholUnitsPerWeek ?? 0);
          record.hasDiuretics = !!data.hasDiuretics;
          record.hasAspirin = !!data.hasAspirin;
          record.hasNiacin = !!data.hasNiacin;
          record.hasCyclosporine = !!data.hasCyclosporine;
          record.hasLevodopa = !!data.hasLevodopa;
          record.dietaryPattern = data.dietaryPattern ?? 'regular';
          record.avgPurineIntake = Number(data.avgPurineIntake ?? 0);
          record.purineIntakeLevel = data.purineIntakeLevel ?? 'moderate';
          record.meatConsumption = Number(data.meatConsumption ?? 0);
          record.seafoodConsumption = Number(data.seafoodConsumption ?? 0);
          record.dairyConsumption = Number(data.dairyConsumption ?? 0);
          record.vegetableConsumption = Number(data.vegetableConsumption ?? 0);
          record.fruitConsumption = Number(data.fruitConsumption ?? 0);
          record.hasHighPurineFoods = !!data.hasHighPurineFoods;
          record.highPurineFoodsConsumed = JSON.stringify(data.highPurineFoodsConsumed ?? []);
          record.hasAcutePain = !!data.hasAcutePain;
          record.painSeverity = Number(data.painSeverity ?? 0);
          record.hasSwelling = !!data.hasSwelling;
          record.hasRedness = !!data.hasRedness;
          record.hasWarmth = !!data.hasWarmth;
          record.hasLimitedMobility = !!data.hasLimitedMobility;
          record.hasKidneyStones = !!data.hasKidneyStones;
          record.hasJointDamage = !!data.hasJointDamage;
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
      await loadAssessment();
    } catch (err) {
      console.error('[useGoutAssessment] Save failed:', err);
      throw err;
    }
  };

  return {
    assessment,
    isLoading,
    createAssessment: saveAssessment,
    updateAssessment: saveAssessment,
    reload: loadAssessment,
  };
}
