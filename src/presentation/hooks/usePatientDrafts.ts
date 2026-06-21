import { useMemo } from 'react';
import { combineLatest, Observable, of } from 'rxjs';
import { map, catchError, debounceTime } from 'rxjs/operators';
import { Q } from '@nozbe/watermelondb';
import { watchQuery } from '../../data/database/observe';
import { useObservable } from './useObservable';
import { DraftInfo } from '../../data/repositories/DraftRepository';

const DRAFT_TABLE_CONFIG = [
  {
    table: 'anemia_assessments',
    screenKey: 'anemia-assessment',
    label: 'تقييم فقر الدم',
    moduleRoute: 'anemia-assessment',
  },
  {
    table: 'cardiovascular_assessments',
    screenKey: 'cardio-assessment',
    label: 'تقييم القلب والأوعية',
    moduleRoute: 'cardio-assessment',
  },
  {
    table: 'calculations',
    screenKey: 'calculations',
    label: 'حسابات الطاقة',
    moduleRoute: 'calculations',
  },
] as const;

interface DraftsSnapshot {
  infos: DraftInfo[];
  hasAnyDraft: boolean;
}

function buildDraftsStream(patientId: string): Observable<DraftsSnapshot> {
  const streams = DRAFT_TABLE_CONFIG.map(({ table, screenKey, label, moduleRoute }) => {
    const queryFactory = (db: any) => {
      const conditions: any[] = [Q.where('patient_id', patientId)];
      if (table === 'calculations') {
        conditions.push(Q.where('calculation_type', 'calculation_inputs'));
      }
      conditions.push(Q.sortBy('created_at', Q.desc));
      return db.get(table).query(...conditions);
    };

    return watchQuery<any>(queryFactory).pipe(
      map((records) => ({
        screenKey,
        label,
        moduleRoute,
        lastSavedAt: records.length > 0
          ? Math.max(...records.map((r: any) => {
              const ts = r._raw?.recorded_at ?? r._raw?.created_at ?? 0;
              return Number(ts);
            }))
          : null,
        hasDraft: records.length > 0,
      })),
      catchError(() => of({ screenKey, label, moduleRoute, lastSavedAt: null, hasDraft: false } as DraftInfo)),
    );
  });

  return combineLatest(streams).pipe(
    debounceTime(50),
    map((infos) => ({
      infos,
      hasAnyDraft: infos.some((d) => d.hasDraft),
    })),
  );
}

export function usePatientDrafts(patientId: string): DraftsSnapshot {
  const stream$ = useMemo(() => buildDraftsStream(patientId), [patientId]);
  return useObservable<DraftsSnapshot>(stream$, { infos: [], hasAnyDraft: false });
}
