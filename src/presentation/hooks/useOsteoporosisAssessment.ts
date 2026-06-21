import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { OsteoporosisAssessment } from '../../domain/types/osteoporosis';

export function useOsteoporosisAssessment(patientId: string) {
  const [assessment, setAssessment] = useState<OsteoporosisAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAssessment = useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const results = await db.get('osteoporosis_assessments')
        .query(Q.where('patient_id', patientId))
        .fetch();
      if (results.length > 0) {
        const record = results[results.length - 1] as any;
        setAssessment(record.toDomain());
      } else {
        setAssessment(null);
      }
    } catch (err) {
      console.error('[useOsteoporosisAssessment] Load failed:', err);
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
        const collection = db.get('osteoporosis_assessments');
        const existing = await collection
          .query(Q.where('patient_id', patientId))
          .fetch();

        const copyFields = (record: any) => {
          record.patientId = patientId;
          record.femoralNeckTScore = Number(data.femoralNeckTScore ?? 0);
          record.lumbarSpineTScore = Number(data.lumbarSpineTScore ?? 0);
          record.overallTScore = Number(data.overallTScore ?? 0);
          record.femoralNeckZScore = Number(data.femoralNeckZScore ?? 0);
          record.lumbarZScore = Number(data.lumbarZScore ?? 0);
          record.overallZScore = Number(data.overallZScore ?? 0);
          record.boneDensityUnit = data.boneDensityUnit ?? 'g/cm²';
          record.classification = data.classification ?? 'normal';
          record.fractureRisk = data.fractureRisk ?? 'low';
          record.serumCalcium = Number(data.serumCalcium ?? 0);
          record.calciumIntake = Number(data.calciumIntake ?? 0);
          record.calciumStatus = data.calciumStatus ?? 'adequate';
          record.vitaminD25OH = Number(data.vitaminD25OH ?? 0);
          record.vitaminDStatus = data.vitaminDStatus ?? 'normal';
          record.serumPhosphorus = Number(data.serumPhosphorus ?? 0);
          record.serumMagnesium = Number(data.serumMagnesium ?? 0);
          record.serumPTH = Number(data.serumPTH ?? 0);
          record.urinaryCalcium = Number(data.urinaryCalcium ?? 0);
          record.p1NP = Number(data.p1NP ?? 0);
          record.dPyrid = Number(data.dPyrid ?? 0);
          record.age = Number(data.age ?? 0);
          record.gender = data.gender ?? 'female';
          record.weight = Number(data.weight ?? 0);
          record.height = Number(data.height ?? 0);
          record.bmi = Number(data.bmi ?? 0);
          record.hasFamilyHistory = !!data.hasFamilyHistory;
          record.hasEarlyMenopause = !!data.hasEarlyMenopause;
          record.isPostmenopausal = !!data.isPostmenopausal;
          record.yearsPostMenopause = Number(data.yearsPostMenopause ?? 0);
          record.hasSmoking = !!data.hasSmoking;
          record.smokingCigarettesPerDay = Number(data.smokingCigarettesPerDay ?? 0);
          record.hasAlcoholUse = !!data.hasAlcoholUse;
          record.alcoholUnitsPerWeek = Number(data.alcoholUnitsPerWeek ?? 0);
          record.hasLowPhysicalActivity = !!data.hasLowPhysicalActivity;
          record.hasFallHistory = !!data.hasFallHistory;
          record.hasHipFracture = !!data.hasHipFracture;
          record.hasVertebralFracture = !!data.hasVertebralFracture;
          record.hasOtherFracture = !!data.hasOtherFracture;
          record.hasGlucocorticoids = !!data.hasGlucocorticoids;
          record.glucocorticoidDose = Number(data.glucocorticoidDose ?? 0);
          record.glucocorticoidDuration = Number(data.glucocorticoidDuration ?? 0);
          record.hasThyroidMedication = !!data.hasThyroidMedication;
          record.hasAnticoagulants = !!data.hasAnticoagulants;
          record.hasAromataseInhibitors = !!data.hasAromataseInhibitors;
          record.hasProtonInhibitors = !!data.hasProtonInhibitors;
          record.hasHyperthyroidism = !!data.hasHyperthyroidism;
          record.hasHyperparathyroidism = !!data.hasHyperparathyroidism;
          record.hasCKD = !!data.hasCKD;
          record.hasGIDisease = !!data.hasGIDisease;
          record.hasRheumatoidArthritis = !!data.hasRheumatoidArthritis;
          record.hasDiabetes = !!data.hasDiabetes;
          record.dietaryPattern = data.dietaryPattern ?? 'regular';
          record.dairyConsumption = Number(data.dairyConsumption ?? 0);
          record.isVegetarian = !!data.isVegetarian;
          record.isVegan = !!data.isVegan;
          record.hasBackPain = !!data.hasBackPain;
          record.hasLostHeight = !!data.hasLostHeight;
          record.heightLost = Number(data.heightLost ?? 0);
          record.hasKyphosis = !!data.hasKyphosis;
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
      console.error('[useOsteoporosisAssessment] Save failed:', err);
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
