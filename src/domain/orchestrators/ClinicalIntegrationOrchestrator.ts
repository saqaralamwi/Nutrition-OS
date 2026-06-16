import type { ICalculatedMetabolicTargets } from '../calculators/DietaryIntakeAnalyzerEngine';
import type { DietaryPatternTag } from '../../data/types/meal_planner';

const r2 = (v: number): number => {
  if (typeof v !== 'number' || isNaN(v) || !isFinite(v) || v < 0) return 0;
  return parseFloat(v.toFixed(2));
};

export interface IBurnAssessmentFragment {
  tbsaPercentage: number;
}

export interface IRespiratoryAssessmentFragment {
  hasCo2Retention: boolean;
}

export interface IRenalAssessmentFragment {
  ckdStage: string;
  measuredUrineOutput: number;
}

export interface IClinicalIntegrationInput {
  patientId: string;
  patientWeightKg: number;
  urineOutputMl?: number;
  hasDialysis?: boolean;
  burnAssessment?: IBurnAssessmentFragment | null;
  respiratoryAssessment?: IRespiratoryAssessmentFragment | null;
  renalAssessment?: IRenalAssessmentFragment | null;
  celiacDiagnosis?: string;
  hasLactoseIntolerance?: boolean;
  milkAllergyType?: string;
  giLossOutputMl24h?: number;
}

export interface IClinicalIntegrationOutput {
  targets: ICalculatedMetabolicTargets;
  conflictResolutionNotes: string[];
}

const BASELINE: ICalculatedMetabolicTargets = {
  calories: 2000,
  protein: 60,
  carbs: 250,
  fat: 65,
  fluidMl: 2000,
};

export class ClinicalIntegrationOrchestrator {
  static fetchAndAggregatePatientTargets(
    input: IClinicalIntegrationInput,
  ): IClinicalIntegrationOutput {
    const notes: string[] = [];

    let calories = BASELINE.calories;
    let protein = BASELINE.protein;
    let carbs = BASELINE.carbs;
    let fat = BASELINE.fat;
    let fluidMl = BASELINE.fluidMl;

    let isHypermetabolic: boolean | undefined;
    let hasCo2Retention: boolean | undefined;
    let renalStage: 'severe_aki_ckd' | undefined;
    let isCeliac: boolean | undefined;
    let hasLactoseIntolerance: boolean | undefined;
    let dietaryPatternTag: DietaryPatternTag | undefined;

    const weight = input.patientWeightKg;

    /* =========================================================
     * MODULE: BURN ASSESSMENT (Phase 11)
     *   - proteinTargetG = weight * 2.0
     *   - isHypermetabolic = true
     *   - dietaryPatternTag = 'hypermetabolic_built'
     * ========================================================= */
    if (input.burnAssessment && input.burnAssessment.tbsaPercentage > 0) {
      const tbsa = input.burnAssessment.tbsaPercentage;
      const proteinFromBurn = r2(weight * 2.0);
      protein = proteinFromBurn;
      isHypermetabolic = true;
      dietaryPatternTag = 'hypermetabolic_built';

      // Curreri-style energy: 25 kcal/kg + 40 kcal/%TBSA (capped at 50)
      const cappedTbsa = Math.min(tbsa, 50);
      calories = r2(25 * weight + 40 * cappedTbsa);
      notes.push(`[Burns] TBSA=${tbsa}% → protein=${proteinFromBurn}g, calories=${calories} kcal, hypermetabolic.`);
    }

    /* =========================================================
     * MODULE: RESPIRATORY COPD / CO2 RETENTION (Phase 12)
     *   - carbs capped at 40% of total calories
     *   - hasCo2Retention = true
     * ========================================================= */
    if (input.respiratoryAssessment?.hasCo2Retention) {
      hasCo2Retention = true;
      const maxCarbKcal = r2(calories * 0.40);
      const maxCarbG = r2(maxCarbKcal / 4);
      if (carbs > maxCarbG) {
        carbs = maxCarbG;
        // Recalculate fat to maintain caloric balance (protein unchanged)
        const proteinKcal = r2(protein * 4);
        const carbKcal = r2(carbs * 4);
        const remainingKcal = r2(calories - proteinKcal - carbKcal);
        fat = r2(Math.max(0, remainingKcal / 9));
      }
      notes.push(`[Respiratory] CO2 retention → carbs capped at ${maxCarbG}g (40% of ${calories} kcal).`);
    }

    /* =========================================================
     * MODULE: CELIAC / GLUTEN (Phase 9)
     *   - isCeliac = true
     * ========================================================= */
    if (input.celiacDiagnosis === 'celiac_disease') {
      isCeliac = true;
      notes.push('[Celiac] Gluten-free filter enabled.');
    }

    /* =========================================================
     * MODULE: LACTOSE INTOLERANCE
     * ========================================================= */
    if (input.hasLactoseIntolerance || input.milkAllergyType === 'lactose_intolerance') {
      hasLactoseIntolerance = true;
      notes.push('[Lactose] Lactose-free filter enabled.');
    }

    /* =========================================================
     * MODULE: RENAL AKI/CKD (Phase 10/14)
     *   - renalStage = 'severe_aki_ckd'
     *   - fluid limit = urineOutput + 500ml
     * ========================================================= */
    let renalActive = false;
    if (input.renalAssessment) {
      const isSevere = ['stage_4', 'stage_5'].includes(input.renalAssessment.ckdStage);
      if (isSevere) {
        renalStage = 'severe_aki_ckd';
        renalActive = true;

        const urineOut = input.renalAssessment.measuredUrineOutput > 0
          ? input.renalAssessment.measuredUrineOutput
          : (input.urineOutputMl ?? 800);

        fluidMl = r2(urineOut + 500);
        notes.push(`[Renal] Stage=${input.renalAssessment.ckdStage} → fluid restricted to ${fluidMl}ml (UOP+500).`);
      }
    }

    /* =========================================================
     * CONFLICT RESOLUTION: BURNS vs RENAL PROTEIN
     *   - High-Output Fistula/Burns demands >1.5g/kg
     *   - Severe AKI requires <0.8g/kg without dialysis
     *   - If on dialysis: enforce High Protein
     *   - If NOT on dialysis: cap at 1.2g/kg
     * ========================================================= */
    if (isHypermetabolic && renalActive) {
      const burnProteinPerKg = r2(protein / weight);
      if (burnProteinPerKg > 1.5) {
        if (input.hasDialysis) {
          notes.push(`[Conflict] Burns(${burnProteinPerKg}g/kg) × Renal(AKI). Dialysis active → enforcing high protein (${protein}g).`);
        } else {
          const capped = r2(1.2 * weight);
          protein = capped;
          notes.push(`[Conflict] Burns(${burnProteinPerKg}g/kg) × Renal(AKI). No dialysis → protein capped at ${capped}g (1.2g/kg) to prevent hyperazotemia.`);
        }
      }
    }

    /* =========================================================
     * HIGH-OUTPUT GI LOSS — FLUID BOOST
     * ========================================================= */
    if (input.giLossOutputMl24h && input.giLossOutputMl24h > 500) {
      const boost = r2(input.giLossOutputMl24h * 0.5);
      fluidMl = r2(fluidMl + boost);
      notes.push(`[GI Loss] High output ${input.giLossOutputMl24h}ml/24h → fluid boosted by ${boost}ml.`);
    }

    return {
      targets: {
        calories: r2(calories),
        protein: r2(protein),
        carbs: r2(carbs),
        fat: r2(fat),
        fluidMl: r2(fluidMl),
        hasCo2Retention,
        renalStage,
        isHypermetabolic,
        isCeliac,
        hasLactoseIntolerance,
        dietaryPatternTag,
      },
      conflictResolutionNotes: notes,
    };
  }
}
