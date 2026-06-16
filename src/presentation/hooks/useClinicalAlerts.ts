import { useEffect, useState } from 'react';
import { combineLatest, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { validateLabMetrics, ClinicalAlert } from '../../utils/clinicalAlertsEngine';
import { useSettingsStore } from '../stores/settingsStore';
import {
  observePatientById,
  observeVitalsHistory,
  observeLabResults,
  observeLaboratoryRecords,
  observeIcuAdmissions,
} from '../../data/repositories/ReactiveQuery';

/**
 * Reactive Clinical Alerts Hook.
 * Combined observable stream updates automatically whenever labs, vitals,
 * or patient context change, trigger alert recalculation in real-time.
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
    const combined$ = combineLatest([
      observePatientById(patientId),
      observeVitalsHistory(patientId),
      observeLabResults(patientId),
      observeLaboratoryRecords(patientId),
      observeIcuAdmissions(patientId),
    ]).pipe(
      catchError((err) => {
        console.error('[useClinicalAlerts] Stream error:', err);
        return of([] as any);
      }),
      map(([patient, vitals, labs, records, icuAdmissions]) => {
        if (!patient) {
          return [];
        }

        // Compile patient context for Refeeding Syndrome evaluation
        let patientWeight = 70;
        let patientBmi = 22;
        let weightChangePercent = 0;
        let npoDays = 0;
        let hasMalnutrition = false;

        if (vitals.length > 0) {
          const latestVital = vitals[0];
          if (latestVital.weightKg) patientWeight = latestVital.weightKg;
          else if (latestVital.weight) patientWeight = latestVital.weight;
          
          if (latestVital.bmi) patientBmi = latestVital.bmi;
          if (latestVital.npoStatus || latestVital.npo_status) {
            npoDays = latestVital.npoDuration ? parseInt(latestVital.npoDuration) || 1 : 1;
          }
          if (latestVital.malnutritionRisk === 'high' || latestVital.screeningStatus === 'at_risk') hasMalnutrition = true;
          if (latestVital.weightChange3m) weightChangePercent = Math.abs(latestVital.weightChange3m);
        } else if (icuAdmissions.length > 0) {
          const latestIcu = icuAdmissions[0];
          if (latestIcu.weightKg) patientWeight = latestIcu.weightKg;
          if (latestIcu.bmi) patientBmi = latestIcu.bmi;
          if (latestIcu.weightChangePercent) weightChangePercent = Math.abs(latestIcu.weightChangePercent);
          if (latestIcu.npoStatus || latestIcu.npo_status) {
            npoDays = latestIcu.npoDuration ? parseInt(latestIcu.npoDuration) || 1 : 1;
          }
          if (latestIcu.malnutritionRisk === 'high' || latestIcu.nutritionConcern) hasMalnutrition = true;
        }

        const compiledLabs: any = {
          urea: undefined,
          creatinine: undefined,
          potassium: undefined,
          sodium: undefined,
          albumin: undefined,
          hba1c: undefined,
          randomBloodSugar: undefined,
          phosphorus: undefined,
          magnesium: undefined,
        };

        // Compile structured laboratory records
        for (const rec of records) {
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
          if (compiledLabs.phosphorus === undefined && rec.phosphorus !== undefined && rec.phosphorus !== null) {
            compiledLabs.phosphorus = rec.phosphorus;
          }
        }

        // Compile generic lab results
        labs.forEach((l: any) => {
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
          } else if (name.includes('phosphorus') || name.includes('phosphate') || name.includes('فوسفور') || name.includes('فسفور') || name === 'phos' || name === 'p') {
            if (compiledLabs.phosphorus === undefined) compiledLabs.phosphorus = val;
          } else if (name.includes('magnesium') || name.includes('ماغنسيوم') || name === 'mg') {
            if (compiledLabs.magnesium === undefined) compiledLabs.magnesium = val;
          }
        });

        return validateLabMetrics(compiledLabs, {
          thresholdUrea,
          thresholdCreatinine,
          thresholdPotassium,
          thresholdSodium,
        }, {
          weightKg: patientWeight,
          bmi: patientBmi,
          weightLossPercent: weightChangePercent,
          npoDays,
          hasMalnutrition,
        });
      })
    );

    setLoading(true);
    const subscription = combined$.subscribe({
      next: (val) => {
        setAlerts(val);
        setLoading(false);
      },
      error: (err) => {
        console.error('[useClinicalAlerts] error:', err);
        setLoading(false);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [patientId, thresholdUrea, thresholdCreatinine, thresholdPotassium, thresholdSodium]);

  return { alerts, loading };
}
