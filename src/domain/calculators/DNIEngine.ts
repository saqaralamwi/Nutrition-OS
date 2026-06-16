import type { PatientProfile } from '../../data/types/meal_planner';
import type { DrugNutrientInteractionRecord } from '../repositories/IDrugNutrientInteractionRepository';
import type {
  DrugNutrientInteraction,
  DNIResult,
  DNISeverity,
  DNIInteractionType,
} from '../../data/types/dni';

interface KnownDrugEntry {
  drugNameAr: string;
  affectedNutrient: string;
  type: DNIInteractionType;
  severity: DNISeverity;
}

const KNOWN_DRUGS: Record<string, KnownDrugEntry> = {
  warfarin: {
    drugNameAr: 'وارفارين',
    affectedNutrient: 'vitamin_k',
    type: 'CONTRAINDICATION',
    severity: 'CRITICAL',
  },
  metformin: {
    drugNameAr: 'ميتفورمين',
    affectedNutrient: 'vitamin_b12',
    type: 'DEPLETION',
    severity: 'MODERATE',
  },
  'captopril (ace inhibitor)': {
    drugNameAr: 'كابتوبريل (مثبط ACE)',
    affectedNutrient: 'potassium',
    type: 'CONTRAINDICATION',
    severity: 'MODERATE',
  },
  'furosemide (loop diuretic)': {
    drugNameAr: 'فوروسيميد (مدر بول)',
    affectedNutrient: 'potassium',
    type: 'DEPLETION',
    severity: 'MODERATE',
  },
  'omeprazole (proton pump inhibitor)': {
    drugNameAr: 'أوميبرازول (مثبط مضخة البروتون)',
    affectedNutrient: 'vitamin_b12',
    type: 'DEPLETION',
    severity: 'MODERATE',
  },
  levothyroxine: {
    drugNameAr: 'ليفوثيروكسين',
    affectedNutrient: 'calcium',
    type: 'CONTRAINDICATION',
    severity: 'CRITICAL',
  },
  'prednisolone (corticosteroids)': {
    drugNameAr: 'بريدنيزولون (كورتيكوستيرويد)',
    affectedNutrient: 'calcium',
    type: 'DEPLETION',
    severity: 'CRITICAL',
  },
  'ferrous sulfate (iron supplement)': {
    drugNameAr: 'كبريتات الحديد (مكمل حديد)',
    affectedNutrient: 'iron',
    type: 'MONITORING',
    severity: 'MODERATE',
  },
  'atorvastatin (statin)': {
    drugNameAr: 'أتورفاستاتين (ستاتين)',
    affectedNutrient: 'coenzyme_q10',
    type: 'DEPLETION',
    severity: 'MODERATE',
  },
  'alendronate (bisphosphonate)': {
    drugNameAr: 'أليندرونات (بايفوسفونيت)',
    affectedNutrient: 'calcium',
    type: 'CONTRAINDICATION',
    severity: 'CRITICAL',
  },
  'spironolactone (k-sparing diuretic)': {
    drugNameAr: 'سبيرونولاكتون (مدر بول موفر للبوتاسيوم)',
    affectedNutrient: 'potassium',
    type: 'CONTRAINDICATION',
    severity: 'CRITICAL',
  },
  lithium: {
    drugNameAr: 'ليثيوم',
    affectedNutrient: 'sodium',
    type: 'MONITORING',
    severity: 'CRITICAL',
  },
};

export class DNIEngine {
  public static evaluateInteractions(
    activeDrugs: string[],
    currentContraindications: string[],
    masterDniList: DrugNutrientInteraction[],
  ): DNIResult {
    const triggeredInteractions: DrugNutrientInteraction[] = [];
    const updatedSet = new Set(currentContraindications.map((n) => n.toLowerCase()));

    const normalizedDrugs = activeDrugs.map((d) => d.toLowerCase().trim());

    for (const dni of masterDniList) {
      if (normalizedDrugs.includes(dni.drugNameEn.toLowerCase().trim())) {
        triggeredInteractions.push(dni);

        if (dni.severity === 'CRITICAL' && dni.type === 'CONTRAINDICATION') {
          updatedSet.add(dni.affectedNutrient.toLowerCase());
        }
      }
    }

    return {
      updatedContraindicatedNutrients: Array.from(updatedSet),
      triggeredInteractions,
    };
  }

  public static mapFromRepository(
    records: DrugNutrientInteractionRecord[],
  ): DrugNutrientInteraction[] {
    return records.map((r) => {
      const key = r.activeIngredient.toLowerCase().trim();
      const known = KNOWN_DRUGS[key];

      const severity = DNIEngine.normalizeSeverity(r.clinicalSeverity, known?.severity);

      return {
        id: r.id ?? key,
        drugNameEn: r.activeIngredient,
        drugNameAr: known?.drugNameAr ?? r.activeIngredient,
        affectedNutrient: known?.affectedNutrient ?? DNIEngine.inferNutrient(r),
        type: known?.type ?? DNIEngine.inferType(r, severity),
        severity,
        mechanismAr: r.mechanismDescription ?? '',
        recommendationAr: r.dietaryActionRequired ?? '',
      };
    });
  }

  private static normalizeSeverity(
    dbSeverity: string,
    fallback?: DNISeverity,
  ): DNISeverity {
    const s = dbSeverity.toLowerCase().trim();
    if (s === 'high' || s === 'critical') return 'CRITICAL';
    if (s === 'moderate') return 'MODERATE';
    if (s === 'mild') return 'MILD';
    return fallback ?? 'MODERATE';
  }

  private static inferNutrient(record: DrugNutrientInteractionRecord): string {
    const txt = [
      record.mechanismDescription ?? '',
      record.dietaryActionRequired ?? '',
    ]
      .join(' ')
      .toLowerCase();

    if (
      /\bpotassium\b/.test(txt) ||
      /\u0628\u0648\u062A\u0627\u0633\u064A\u0648\u0645/.test(txt)
    ) {
      return 'potassium';
    }
    if (/\bsodium\b/.test(txt)) return 'sodium';
    if (/\bcalcium\b/.test(txt)) return 'calcium';
    if (/\bvitamin\s*b12\b/.test(txt) || /\bb12\b/.test(txt)) return 'vitamin_b12';
    if (/\bvitamin\s*k\b/.test(txt)) return 'vitamin_k';
    if (/\bmagnesium\b/.test(txt)) return 'magnesium';
    if (/\biron\b/.test(txt)) return 'iron';
    if (/\bcoq10\b/.test(txt) || /\bcoenzyme\s*q10\b/.test(txt)) return 'coenzyme_q10';

    return 'general';
  }

  private static inferType(
    record: DrugNutrientInteractionRecord,
    severity: DNISeverity,
  ): DNIInteractionType {
    const txt = [
      record.mechanismDescription ?? '',
      record.dietaryActionRequired ?? '',
    ]
      .join(' ')
      .toLowerCase();

    if (
      /\blimit\b|\bavoid\b|\brestrict\b|\bcontraindicated\b/.test(txt) ||
      severity === 'CRITICAL'
    ) {
      return 'CONTRAINDICATION';
    }
    if (/\bdeplet|\block\b|\bdeficien|\bimpair\b/.test(txt)) {
      return 'DEPLETION';
    }
    return 'MONITORING';
  }

  public static updatePatientProfile(
    profile: PatientProfile,
    dniResult: DNIResult,
  ): PatientProfile {
    return {
      ...profile,
      activeContraindicatedNutrients: dniResult.updatedContraindicatedNutrients,
    };
  }
}
