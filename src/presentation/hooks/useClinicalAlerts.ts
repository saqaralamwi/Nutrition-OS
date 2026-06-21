import { useEffect, useState, useMemo } from 'react';
import { combineLatest, of } from 'rxjs';
import { catchError, switchMap, debounceTime } from 'rxjs/operators';
import { validateLabMetrics, ClinicalAlert } from '../../utils/clinicalAlertsEngine';
import { useSettingsStore } from '../stores/settingsStore';
import {
  observePatientById,
  observeVitalsHistory,
  observeLabResults,
  observeLaboratoryRecords,
  observeIcuAdmissions,
  observeActiveMedications,
} from '../../data/repositories/ReactiveQuery';
import { DrugNutrientEngine } from '../../domain/services/DrugNutrientEngine';

export default function useClinicalAlerts(patientId: string): {
  alerts: ClinicalAlert[];
  loading: boolean;
} {
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const thresholdUrea = useSettingsStore((s) => s.thresholdUrea);
  const thresholdCreatinine = useSettingsStore((s) => s.thresholdCreatinine);
  const thresholdPotassium = useSettingsStore((s) => s.thresholdPotassium);
  const thresholdSodium = useSettingsStore((s) => s.thresholdSodium);

  const combined$ = useMemo(
    () =>
      combineLatest([
        observePatientById(patientId),
        observeVitalsHistory(patientId),
        observeLabResults(patientId),
        observeLaboratoryRecords(patientId),
        observeIcuAdmissions(patientId),
        observeActiveMedications(patientId),
      ]).pipe(
        debounceTime(200),
        catchError((err) => {
          console.error('[useClinicalAlerts] Stream error:', err);
          return of([] as any);
        }),
        switchMap(async ([patient, vitals, labs, records, icuAdmissions, meds]) => {
          if (!patient) return [];

          let patientWeight = 70;
          let patientBmi = 22;
          let weightChangePercent = 0;
          let npoDays = 0;
          let hasMalnutrition = false;

          if (vitals.length > 0) {
            const latestVital = vitals[0];
            patientWeight = latestVital.weightKg || latestVital.weight || 70;
            patientBmi = latestVital.bmiValue || latestVital.bmi || 22;
            if (latestVital.npoStatus) {
              npoDays = latestVital.npoDuration ? parseInt(latestVital.npoDuration) || 1 : 1;
            }
            if (latestVital.malnutritionRisk === 'high' || latestVital.screeningStatus === 'at_risk') hasMalnutrition = true;
            if (latestVital.weightChange3m) weightChangePercent = Math.abs(latestVital.weightChange3m);
          }

          const compiledLabs: any = {};
          [...records, ...labs].forEach((l: any) => {
            const name = (l.testName || l._raw?.test_name || '').toLowerCase();
            const val = l.resultValue || l.albumin || l.creatinine || l.urea || l.potassium || l.sodium;
            if (val === undefined || val === null) return;

            if (name.includes('alb')) compiledLabs.albumin = val;
            else if (name.includes('creat')) compiledLabs.creatinine = val;
            else if (name.includes('urea')) compiledLabs.urea = val;
            else if (name.includes('potass') || name === 'k') compiledLabs.potassium = val;
            else if (name.includes('sod') || name === 'na') compiledLabs.sodium = val;
            else if (name.includes('phos')) compiledLabs.phosphorus = val;
            else if (name.includes('mag')) compiledLabs.magnesium = val;
          });

          const labAlerts = validateLabMetrics(compiledLabs, {
            thresholdUrea, thresholdCreatinine, thresholdPotassium, thresholdSodium
          }, {
            weightKg: patientWeight,
            bmi: patientBmi,
            weightLossPercent: weightChangePercent,
            npoDays,
            hasMalnutrition,
          });

          try {
            const dniMatches = await DrugNutrientEngine.checkInteractions(patientId);
            const dniAlerts: ClinicalAlert[] = dniMatches.map(m => ({
              id: `dni_${m.drugName}_${Date.now()}`,
              type: m.severity === 'critical' ? 'danger' : 'warning',
              category: 'monitoring',
              title: `⚠️ تفاعل دوائي: ${m.drugName}`,
              message: m.mechanism,
              action: m.dietaryActionEn ? 'مطلوب تعديل الحمية' : undefined,
            }));
            return [...labAlerts, ...dniAlerts];
          } catch (dniErr) {
            console.error('[useClinicalAlerts] DNI check failed:', dniErr);
            return labAlerts;
          }
        })
      ),
    [patientId, thresholdUrea, thresholdCreatinine, thresholdPotassium, thresholdSodium]
  );

  useEffect(() => {
    setLoading(true);

    const subscription = combined$.subscribe({
      next: (val) => {
        setAlerts(val);
        setLoading(false);
      },
      error: (err) => {
        console.error('[useClinicalAlerts] Final error:', err);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [combined$]);

  return { alerts, loading };
}
