import { useEffect, useState } from 'react';
import { validateLabMetrics, ClinicalAlert } from '../../utils/clinicalAlertsEngine';
import { getDatabase } from '../../data/database';
import { Q } from '@nozbe/watermelondb';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Custom React hook to query the latest database laboratory results for a patient
 * and return evaluated clinical guidance alerts.
 *
 * @param patientId The unique database identifier of the patient
 */
export default function useClinicalAlerts(patientId: string): {
  alerts: ClinicalAlert[];
  loading: boolean;
} {
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { thresholdUrea, thresholdCreatinine, thresholdPotassium, thresholdSodium } = useSettingsStore();

  useEffect(() => {
    let active = true;

    async function fetchAlerts() {
      try {
        setLoading(true);
        const db = await getDatabase();
        
        // Fetch lab results and records with safe any casting to avoid type compile conflicts
        const labs = (await db.get('lab_results').query(Q.where('patient_id', patientId)).fetch()) as any[];
        const records = (await db.get('laboratory_records').query(Q.where('patient_id', patientId)).fetch()) as any[];

        if (!active) return;

        const compiledLabs: any = {
          urea: undefined,
          creatinine: undefined,
          potassium: undefined,
          sodium: undefined,
          albumin: undefined,
          hba1c: undefined,
          randomBloodSugar: undefined,
        };

        // Sort laboratory_records by testDate descending
        const sortedRecords = [...records].sort((a: any, b: any) => {
          const dateA = a.testDate ? new Date(a.testDate).getTime() : 0;
          const dateB = b.testDate ? new Date(b.testDate).getTime() : 0;
          return dateB - dateA;
        });

        for (const rec of sortedRecords) {
          if (compiledLabs.albumin === undefined && rec.albumin !== undefined && rec.albumin !== null) {
            compiledLabs.albumin = rec.albumin;
          }
          if (compiledLabs.creatinine === undefined && rec.creatinine !== undefined && rec.creatinine !== null) {
            compiledLabs.creatinine = rec.creatinine;
          }
          if (compiledLabs.urea === undefined && rec.urea !== undefined && rec.urea !== null) {
            compiledLabs.urea = rec.urea;
          }
          if (compiledLabs.potassium === undefined && rec.potassium !== undefined && rec.potassium !== null) {
            compiledLabs.potassium = rec.potassium;
          }
          if (compiledLabs.sodium === undefined && rec.sodium !== undefined && rec.sodium !== null) {
            compiledLabs.sodium = rec.sodium;
          }
          if (compiledLabs.hba1c === undefined && rec.hba1c !== undefined && rec.hba1c !== null) {
            compiledLabs.hba1c = rec.hba1c;
          }
          if (compiledLabs.randomBloodSugar === undefined && rec.bloodGlucose !== undefined && rec.bloodGlucose !== null) {
            compiledLabs.randomBloodSugar = rec.bloodGlucose;
          }
        }

        // Sort generic lab_results by testDate descending
        const sortedLabs = [...labs].sort((a: any, b: any) => {
          const dateA = a.testDate ? new Date(a.testDate).getTime() : 0;
          const dateB = b.testDate ? new Date(b.testDate).getTime() : 0;
          return dateB - dateA;
        });

        sortedLabs.forEach((l: any) => {
          const name = (l.testName || '').toLowerCase().trim();
          const val = l.resultValue;
          if (val === undefined || val === null || isNaN(Number(val))) return;

          if (name.includes('albumin') || name.includes('ألبومين') || name === 'alb') {
            if (compiledLabs.albumin === undefined) compiledLabs.albumin = val;
          } else if (name.includes('creatinine') || name.includes('كرياتينين') || name === 'cr' || name === 'creat') {
            if (compiledLabs.creatinine === undefined) compiledLabs.creatinine = val;
          } else if (name.includes('urea') || name.includes('يوريا')) {
            if (compiledLabs.urea === undefined) compiledLabs.urea = val;
          } else if (name.includes('potassium') || name.includes('بوتاسيوم') || name === 'k') {
            if (compiledLabs.potassium === undefined) compiledLabs.potassium = val;
          } else if (name.includes('sodium') || name.includes('صوديوم') || name === 'na') {
            if (compiledLabs.sodium === undefined) compiledLabs.sodium = val;
          } else if (name.includes('hba1c') || name.includes('التراكمي') || name.includes('a1c')) {
            if (compiledLabs.hba1c === undefined) compiledLabs.hba1c = val;
          } else if (name.includes('sugar') || name.includes('glucose') || name.includes('سكر') || name.includes('جلوكوز')) {
            if (compiledLabs.randomBloodSugar === undefined) compiledLabs.randomBloodSugar = val;
          }
        });

        const validatedAlerts = validateLabMetrics(compiledLabs, {
          thresholdUrea,
          thresholdCreatinine,
          thresholdPotassium,
          thresholdSodium,
        });
        setAlerts(validatedAlerts);
      } catch (error) {
        console.error('Error fetching clinical alerts in hook:', error);
        setAlerts([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchAlerts();

    return () => {
      active = false;
    };
  }, [patientId, thresholdUrea, thresholdCreatinine, thresholdPotassium, thresholdSodium]);

  return { alerts, loading };
}
