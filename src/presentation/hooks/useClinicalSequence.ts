import { useMemo } from 'react';
import { combineLatest, Observable, of } from 'rxjs';
import { map, catchError, startWith, debounceTime } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';
import { watchRecord, watchQuery } from '../../data/database/observe';
import { useObservable } from './useObservable';

export type StepStatus = 'complete' | 'current' | 'locked';

export interface ClinicalStep {
  id: string;
  titleAr: string;
  descriptionAr: string;
  status: StepStatus;
  route: string;
  isCompleted: boolean;
}

export interface ClinicalSequence {
  steps: ClinicalStep[];
  isComplete: boolean;
  nextRequiredRoute: string | null;
  isLoading: boolean;
}

export function useClinicalSequence(patientId: string, isFollowUp: boolean = false): ClinicalSequence {
  const sequence$ = useMemo(() => {
    if (isFollowUp) {
      return of({
        steps: [
          {
            id: 'monitoring',
            titleAr: 'المتابعة والتقييم (Monitoring)',
            descriptionAr: 'متابعة الحالة وتقييم التقدم',
            status: 'current' as StepStatus,
            route: `/patient/${patientId}/monitoring`,
            isCompleted: false,
          },
        ],
        isComplete: false,
        nextRequiredRoute: `/patient/${patientId}/monitoring`,
        isLoading: false,
      });
    }

    const patient$ = watchRecord<any>('patients', patientId).pipe(
      catchError(() => of(null)),
      startWith(null)
    );

    const vitals$ = watchQuery<any>(db =>
      db.get('vitals_records').query(
        Q.where('patient_id', patientId),
        Q.sortBy('record_date', Q.desc),
        Q.take(1)
      )
    ).pipe(
      map(rows => rows[0] || null),
      catchError(() => of(null)),
      startWith(null)
    );

    const labs$ = watchQuery<any>(db =>
      db.get('laboratory_results').query(
        Q.where('patient_id', patientId),
        Q.take(1)
      )
    ).pipe(
      map(rows => rows.length > 0),
      catchError(() => of(false)),
      startWith(false)
    );

    const medications$ = watchQuery<any>(db =>
      db.get('medications').query(
        Q.where('patient_id', patientId),
        Q.take(1)
      )
    ).pipe(
      map(rows => rows.length > 0),
      catchError(() => of(false)),
      startWith(false)
    );

    const socialHistory$ = watchQuery<any>(db =>
      db.get('social_histories').query(
        Q.where('patient_id', patientId),
        Q.take(1)
      )
    ).pipe(
      map(rows => rows.length > 0),
      catchError(() => of(false)),
      startWith(false)
    );

    const history$ = watchQuery<any>(db =>
      db.get('patient_dietary_history_sessions').query(
        Q.where('patient_id', patientId),
        Q.take(1)
      )
    ).pipe(
      map(rows => rows.length > 0),
      catchError(() => of(false)),
      startWith(false)
    );

    const screening$ = watchQuery<any>(db =>
      db.get('calculations').query(
        Q.where('patient_id', patientId),
        Q.where('calculation_type', Q.oneOf(['nrs_2002', 'stamp'])),
      )
    ).pipe(
      map(rows => rows.length > 0),
      catchError(() => of(false)),
      startWith(false)
    );

    const intervention$ = watchQuery<any>(db =>
      db.get('interventions').query(
        Q.where('patient_id', patientId),
        Q.where('status', 'active'),
        Q.take(1)
      )
    ).pipe(
      map(rows => rows.length > 0),
      catchError(() => of(false)),
      startWith(false)
    );

    return combineLatest([patient$, vitals$, labs$, history$, screening$, intervention$, medications$, socialHistory$]).pipe(
      debounceTime(100),
      map(([patient, vitals, hasLabs, hasHistory, hasScreening, hasIntervention, hasMeds, hasSocialHistory]) => {
        if (!patient) return { steps: [], isComplete: false, nextRequiredRoute: null, isLoading: true };

        const steps: ClinicalStep[] = [];
        let firstIncompleteFound = false;
        let nextRequiredRoute: string | null = null;

        // Step 1: Anthropometrics & Vitals (Assessment - A)
        const step1Completed = !!(vitals?.weightKg || vitals?.weight);
        steps.push({
          id: 'vitals',
          titleAr: 'القياسات الجسمية (Anthropometrics)',
          descriptionAr: 'تسجيل الوزن والطول والعلامات الحيوية',
          isCompleted: step1Completed,
          status: step1Completed ? 'complete' : 'current',
          route: `/patient/${patientId}/physical-exam`,
        });
        if (!step1Completed) {
          firstIncompleteFound = true;
          nextRequiredRoute = `/patient/${patientId}/physical-exam`;
        }

        // Step 2: Labs & Medications (Assessment - A)
        const step2Completed = hasLabs && hasMeds;
        steps.push({
          id: 'labs',
          titleAr: 'الفحوصات والأدوية (Labs & Medications)',
          descriptionAr: 'مراجعة الفحوصات المخبرية والأدوية',
          isCompleted: step2Completed,
          status: step2Completed ? 'complete' : (firstIncompleteFound ? 'locked' : 'current'),
          route: `/patient/${patientId}/laboratory`,
        });
        if (!step2Completed && !firstIncompleteFound) {
          firstIncompleteFound = true;
          nextRequiredRoute = `/patient/${patientId}/laboratory`;
        }

        // Step 3: Social History & Lifestyle (Assessment - A)
        const step3Completed = hasSocialHistory;
        steps.push({
          id: 'social',
          titleAr: 'التاريخ الاجتماعي ونمط الحياة (Social History & Lifestyle)',
          descriptionAr: 'تسجيل التاريخ الاجتماعي والنشاط البدني والعادات',
          isCompleted: step3Completed,
          status: step3Completed ? 'complete' : (firstIncompleteFound ? 'locked' : 'current'),
          route: `/patient/${patientId}/social-history`,
        });
        if (!step3Completed && !firstIncompleteFound) {
          firstIncompleteFound = true;
          nextRequiredRoute = `/patient/${patientId}/social-history`;
        }

        // Step 4: Dietary History & Screening (Assessment + Diagnosis - D)
        const step4Completed = hasHistory && hasScreening;
        steps.push({
          id: 'dietary_history',
          titleAr: 'التاريخ التغذوي والفرز (Dietary History & Screening)',
          descriptionAr: 'إكمال التاريخ التغذوي وفحص الخطر',
          isCompleted: step4Completed,
          status: step4Completed ? 'complete' : (firstIncompleteFound ? 'locked' : 'current'),
          route: `/patient/${patientId}/medical-history`,
        });
        if (!step4Completed && !firstIncompleteFound) {
          firstIncompleteFound = true;
          nextRequiredRoute = `/patient/${patientId}/medical-history`;
        }

        // Step 5: Medical Diagnosis (Diagnosis - D)
        const step5Completed = !!patient.primaryDiagnosis;
        steps.push({
          id: 'diagnosis',
          titleAr: 'التشخيص الطبي (Medical Diagnosis)',
          descriptionAr: 'تحديد التشخيص الطبي والتغذوي',
          isCompleted: step5Completed,
          status: step5Completed ? 'complete' : (firstIncompleteFound ? 'locked' : 'current'),
          route: `/patient/${patientId}/screening`,
        });
        if (!step5Completed && !firstIncompleteFound) {
          firstIncompleteFound = true;
          nextRequiredRoute = `/patient/${patientId}/screening`;
        }

        // Step 6: Specialized Pathway (Intervention - I)
        const step6Completed = hasIntervention;
        steps.push({
          id: 'intervention',
          titleAr: 'المسار السريري المخصص (Specialized Pathway)',
          descriptionAr: 'وضع خطة التدخل واختيار المسار السريري',
          isCompleted: step6Completed,
          status: step6Completed ? 'complete' : (firstIncompleteFound ? 'locked' : 'current'),
          route: `/patient/${patientId}/intervention`,
        });
        if (!step6Completed && !firstIncompleteFound) {
          firstIncompleteFound = true;
          nextRequiredRoute = `/patient/${patientId}/intervention`;
        }

        // Step 7: Planning & Final Report (Monitoring - M)
        const step7Completed = false;
        steps.push({
          id: 'monitoring',
          titleAr: 'التخطيط والتقرير (Planning & Final Report)',
          descriptionAr: 'إعداد التقرير النهائي وخطة المتابعة',
          isCompleted: step7Completed,
          status: step7Completed ? 'complete' : (firstIncompleteFound ? 'locked' : 'current'),
          route: `/patient/${patientId}/monitoring`,
        });
        if (!step7Completed && !firstIncompleteFound) {
          firstIncompleteFound = true;
          nextRequiredRoute = `/patient/${patientId}/monitoring`;
        }

        return {
          steps,
          isComplete: steps.slice(0, 6).every(s => s.isCompleted),
          nextRequiredRoute,
          isLoading: false,
        };
      })
    );
  }, [patientId, isFollowUp]);

  return useObservable(sequence$, { steps: [], isComplete: false, nextRequiredRoute: null, isLoading: true });
}
