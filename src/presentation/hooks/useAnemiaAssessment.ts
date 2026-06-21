import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { AnemiaAssessment } from '../../domain/types/anemia';

export function useAnemiaAssessment(patientId: string) {
  const [assessment, setAssessment] = useState<AnemiaAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAssessment = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const results = await db.get('anemia_assessments')
        .query(Q.where('patient_id', patientId))
        .fetch();
      if (results.length > 0) {
        const record = results[results.length - 1] as any; // latest assessment
        setAssessment(record.toDomain());
      } else {
        setAssessment(null);
      }
    } catch (err) {
      console.error('[useAnemiaAssessment] Load failed:', err);
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
        const collection = db.get('anemia_assessments');
        const existing = await collection
          .query(Q.where('patient_id', patientId))
          .fetch();
        
        const copyFields = (record: any) => {
          record.patientId = patientId;
          record.hemoglobin = Number(data.hemoglobin ?? 0);
          record.hemoglobinUnit = data.hemoglobinUnit ?? 'g/dL';
          record.severity = data.severity ?? 'none';
          record.anemiaType = data.anemiaType ?? 'unknown';
          record.serumIron = Number(data.serumIron ?? 0);
          record.tibc = Number(data.tibc ?? 0);
          record.ferritin = Number(data.ferritin ?? 0);
          record.transferrinSaturation = Number(data.transferrinSaturation ?? 0);
          record.ironStatus = data.ironStatus ?? 'normal';
          record.vitaminB12 = Number(data.vitaminB12 ?? 0);
          record.b12Status = data.b12Status ?? 'normal';
          record.serumFolate = Number(data.serumFolate ?? 0);
          record.folateStatus = data.folateStatus ?? 'normal';
          record.mcv = Number(data.mcv ?? 0);
          record.mch = Number(data.mch ?? 0);
          record.mchc = Number(data.mchc ?? 0);
          record.rdw = Number(data.rdw ?? 0);
          record.reticulocyteCount = Number(data.reticulocyteCount ?? 0);
          record.leukocyteCount = Number(data.leukocyteCount ?? 0);
          record.plateletCount = Number(data.plateletCount ?? 0);
          record.hasFatigue = !!data.hasFatigue;
          record.hasWeakness = !!data.hasWeakness;
          record.hasDyspnea = !!data.hasDyspnea;
          record.hasPalpitations = !!data.hasPalpitations;
          record.hasHeadache = !!data.hasHeadache;
          record.hasDizziness = !!data.hasDizziness;
          record.hasColdIntolerance = !!data.hasColdIntolerance;
          record.hasPallor = !!data.hasPallor;
          record.hasKoilonychia = !!data.hasKoilonychia;
          record.hasGlossitis = !!data.hasGlossitis;
          record.hasMenstruation = !!data.hasMenstruation;
          record.isPregnant = !!data.isPregnant;
          record.isLactating = !!data.isLactating;
          record.hasGIBleeding = !!data.hasGIBleeding;
          record.hasChronicDisease = !!data.hasChronicDisease;
          record.isVegetarian = !!data.isVegetarian;
          record.isVegan = !!data.isVegan;
          record.hasMalnutrition = !!data.hasMalnutrition;
          record.avgIronIntake = Number(data.avgIronIntake ?? 0);
          record.avgB12Intake = Number(data.avgB12Intake ?? 0);
          record.avgFolateIntake = Number(data.avgFolateIntake ?? 0);
          record.dietaryPattern = data.dietaryPattern ?? 'regular';
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
      console.error('[useAnemiaAssessment] Save failed:', err);
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
