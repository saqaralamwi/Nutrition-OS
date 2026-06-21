import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import { BoneDensityClassification, FractureRiskLevel, CalciumStatus, VitaminDStatus, OsteoporosisAssessment as IOsteoporosisAssessment } from '../../domain/types/osteoporosis';

export default class OsteoporosisAssessment extends Model {
  static table = 'osteoporosis_assessments';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;

  // Bone density scores
  @field('femoral_neck_t_score') femoralNeckTScore!: number;
  @field('lumbar_spine_t_score') lumbarSpineTScore!: number;
  @field('overall_t_score') overallTScore!: number;
  @field('femoral_neck_z_score') femoralNeckZScore!: number;
  @field('lumbar_z_score') lumbarZScore!: number;
  @field('overall_z_score') overallZScore!: number;
  @field('bone_density_unit') boneDensityUnit!: 'g/cm²';
  @field('classification') classification!: BoneDensityClassification;
  @field('fracture_risk') fractureRisk!: FractureRiskLevel;

  // Calcium status
  @field('serum_calcium') serumCalcium!: number;
  @field('calcium_intake') calciumIntake!: number;
  @field('calcium_status') calciumStatus!: CalciumStatus;

  // Vitamin D status
  @field('vitamin_d25oh') vitaminD25OH!: number;
  @field('vitamin_d_status') vitaminDStatus!: VitaminDStatus;

  // Additional labs
  @field('serum_phosphorus') serumPhosphorus!: number;
  @field('serum_magnesium') serumMagnesium!: number;
  @field('serum_pth') serumPTH!: number;
  @field('urinary_calcium') urinaryCalcium!: number;
  @field('p1np') p1NP!: number;
  @field('d_pyrid') dPyrid!: number;

  // Demographics
  @field('age') age!: number;
  @field('gender') gender!: 'male' | 'female';
  @field('weight') weight!: number;
  @field('height') height!: number;
  @field('bmi') bmi!: number;

  // Risk factors
  @field('has_family_history') hasFamilyHistory!: boolean;
  @field('has_early_menopause') hasEarlyMenopause!: boolean;
  @field('is_postmenopausal') isPostmenopausal!: boolean;
  @field('years_post_menopause') yearsPostMenopause!: number;
  @field('has_smoking') hasSmoking!: boolean;
  @field('smoking_cigarettes_per_day') smokingCigarettesPerDay!: number;
  @field('has_alcohol_use') hasAlcoholUse!: boolean;
  @field('alcohol_units_per_week') alcoholUnitsPerWeek!: number;
  @field('has_low_physical_activity') hasLowPhysicalActivity!: boolean;
  @field('has_fall_history') hasFallHistory!: boolean;
  @field('has_hip_fracture') hasHipFracture!: boolean;
  @field('has_vertebral_fracture') hasVertebralFracture!: boolean;
  @field('has_other_fracture') hasOtherFracture!: boolean;
  @field('has_glucocorticoids') hasGlucocorticoids!: boolean;
  @field('glucocorticoid_dose') glucocorticoidDose!: number;
  @field('glucocorticoid_duration') glucocorticoidDuration!: number;
  @field('has_thyroid_medication') hasThyroidMedication!: boolean;
  @field('has_anticoagulants') hasAnticoagulants!: boolean;
  @field('has_aromatase_inhibitors') hasAromataseInhibitors!: boolean;
  @field('has_proton_inhibitors') hasProtonInhibitors!: boolean;
  @field('has_hyperthyroidism') hasHyperthyroidism!: boolean;
  @field('has_hyperparathyroidism') hasHyperparathyroidism!: boolean;
  @field('has_ckd') hasCKD!: boolean;
  @field('has_gi_disease') hasGIDisease!: boolean;
  @field('has_rheumatoid_arthritis') hasRheumatoidArthritis!: boolean;
  @field('has_diabetes') hasDiabetes!: boolean;

  // Dietary assessment
  @field('dietary_pattern') dietaryPattern!: 'regular' | 'vegetarian' | 'vegan' | 'restricted';
  @field('dairy_consumption') dairyConsumption!: number;
  @field('is_vegetarian') isVegetarian!: boolean;
  @field('is_vegan') isVegan!: boolean;

  // Clinical symptoms
  @field('has_back_pain') hasBackPain!: boolean;
  @field('has_lost_height') hasLostHeight!: boolean;
  @field('height_lost') heightLost!: number;
  @field('has_kyphosis') hasKyphosis!: boolean;

  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;

  toDomain(): IOsteoporosisAssessment {
    return {
      id: this.id,
      patientId: this.patientId,
      femoralNeckTScore: this.femoralNeckTScore,
      lumbarSpineTScore: this.lumbarSpineTScore,
      overallTScore: this.overallTScore,
      femoralNeckZScore: this.femoralNeckZScore,
      lumbarZScore: this.lumbarZScore,
      overallZScore: this.overallZScore,
      boneDensityUnit: this.boneDensityUnit,
      classification: this.classification,
      fractureRisk: this.fractureRisk,
      serumCalcium: this.serumCalcium,
      calciumIntake: this.calciumIntake,
      calciumStatus: this.calciumStatus,
      vitaminD25OH: this.vitaminD25OH,
      vitaminDStatus: this.vitaminDStatus,
      serumPhosphorus: this.serumPhosphorus,
      serumMagnesium: this.serumMagnesium,
      serumPTH: this.serumPTH,
      urinaryCalcium: this.urinaryCalcium,
      p1NP: this.p1NP,
      dPyrid: this.dPyrid,
      age: this.age,
      gender: this.gender,
      weight: this.weight,
      height: this.height,
      bmi: this.bmi,
      hasFamilyHistory: this.hasFamilyHistory,
      hasEarlyMenopause: this.hasEarlyMenopause,
      isPostmenopausal: this.isPostmenopausal,
      yearsPostMenopause: this.yearsPostMenopause,
      hasSmoking: this.hasSmoking,
      smokingCigarettesPerDay: this.smokingCigarettesPerDay,
      hasAlcoholUse: this.hasAlcoholUse,
      alcoholUnitsPerWeek: this.alcoholUnitsPerWeek,
      hasLowPhysicalActivity: this.hasLowPhysicalActivity,
      hasFallHistory: this.hasFallHistory,
      hasHipFracture: this.hasHipFracture,
      hasVertebralFracture: this.hasVertebralFracture,
      hasOtherFracture: this.hasOtherFracture,
      hasGlucocorticoids: this.hasGlucocorticoids,
      glucocorticoidDose: this.glucocorticoidDose,
      glucocorticoidDuration: this.glucocorticoidDuration,
      hasThyroidMedication: this.hasThyroidMedication,
      hasAnticoagulants: this.hasAnticoagulants,
      hasAromataseInhibitors: this.hasAromataseInhibitors,
      hasProtonInhibitors: this.hasProtonInhibitors,
      hasHyperthyroidism: this.hasHyperthyroidism,
      hasHyperparathyroidism: this.hasHyperparathyroidism,
      hasCKD: this.hasCKD,
      hasGIDisease: this.hasGIDisease,
      hasRheumatoidArthritis: this.hasRheumatoidArthritis,
      hasDiabetes: this.hasDiabetes,
      dietaryPattern: this.dietaryPattern,
      dairyConsumption: this.dairyConsumption,
      isVegetarian: this.isVegetarian,
      isVegan: this.isVegan,
      hasBackPain: this.hasBackPain,
      hasLostHeight: this.hasLostHeight,
      heightLost: this.heightLost,
      hasKyphosis: this.hasKyphosis,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
