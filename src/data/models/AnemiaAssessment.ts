import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import { AnemiaAssessment as IAnemiaAssessment, AnemiaSeverity, AnemiaType, IronStatus, B12Status, FolateStatus } from '../../domain/types/anemia';

export default class AnemiaAssessment extends Model {
  static table = 'anemia_assessments';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;

  // Hemoglobin levels
  @field('hemoglobin') hemoglobin!: number;
  @field('hemoglobin_unit') hemoglobinUnit!: 'g/dL' | 'g/L';

  // Anemia classification
  @field('severity') severity!: AnemiaSeverity;
  @field('anemia_type') anemiaType!: AnemiaType;

  // Iron status
  @field('serum_iron') serumIron!: number;
  @field('tibc') tibc!: number;
  @field('ferritin') ferritin!: number;
  @field('transferrin_saturation') transferrinSaturation!: number;
  @field('iron_status') ironStatus!: IronStatus;

  // B12 status
  @field('vitamin_b12') vitaminB12!: number;
  @field('b12_status') b12Status!: B12Status;

  // Folate status
  @field('serum_folate') serumFolate!: number;
  @field('folate_status') folateStatus!: FolateStatus;

  // Additional labs
  @field('mcv') mcv!: number;
  @field('mch') mch!: number;
  @field('mchc') mchc!: number;
  @field('rdw') rdw!: number;

  // RBC indices
  @field('reticulocyte_count') reticulocyteCount!: number;
  @field('leukocyte_count') leukocyteCount!: number;
  @field('platelet_count') plateletCount!: number;

  // Clinical symptoms
  @field('has_fatigue') hasFatigue!: boolean;
  @field('has_weakness') hasWeakness!: boolean;
  @field('has_dyspnea') hasDyspnea!: boolean;
  @field('has_palpitations') hasPalpitations!: boolean;
  @field('has_headache') hasHeadache!: boolean;
  @field('has_dizziness') hasDizziness!: boolean;
  @field('has_cold_intolerance') hasColdIntolerance!: boolean;
  @field('has_pallor') hasPallor!: boolean;
  @field('has_koilonychia') hasKoilonychia!: boolean;
  @field('has_glossitis') hasGlossitis!: boolean;

  // Risk factors
  @field('has_menstruation') hasMenstruation!: boolean;
  @field('is_pregnant') isPregnant!: boolean;
  @field('is_lactating') isLactating!: boolean;
  @field('has_gi_bleeding') hasGIBleeding!: boolean;
  @field('has_chronic_disease') hasChronicDisease!: boolean;
  @field('is_vegetarian') isVegetarian!: boolean;
  @field('is_vegan') isVegan!: boolean;
  @field('has_malnutrition') hasMalnutrition!: boolean;

  // Dietary assessment
  @field('avg_iron_intake') avgIronIntake!: number;
  @field('avg_b12_intake') avgB12Intake!: number;
  @field('avg_folate_intake') avgFolateIntake!: number;
  @field('dietary_pattern') dietaryPattern!: 'regular' | 'vegetarian' | 'vegan' | 'restricted';

  @field('created_at') createdAt!: string;
  @field('updated_at') updatedAt!: string;

  toDomain(): IAnemiaAssessment {
    return {
      id: this.id,
      patientId: this.patientId,
      hemoglobin: this.hemoglobin,
      hemoglobinUnit: this.hemoglobinUnit,
      severity: this.severity,
      anemiaType: this.anemiaType,
      serumIron: this.serumIron,
      tibc: this.tibc,
      ferritin: this.ferritin,
      transferrinSaturation: this.transferrinSaturation,
      ironStatus: this.ironStatus,
      vitaminB12: this.vitaminB12,
      b12Status: this.b12Status,
      serumFolate: this.serumFolate,
      folateStatus: this.folateStatus,
      mcv: this.mcv,
      mch: this.mch,
      mchc: this.mchc,
      rdw: this.rdw,
      reticulocyteCount: this.reticulocyteCount,
      leukocyteCount: this.leukocyteCount,
      plateletCount: this.plateletCount,
      hasFatigue: this.hasFatigue,
      hasWeakness: this.hasWeakness,
      hasDyspnea: this.hasDyspnea,
      hasPalpitations: this.hasPalpitations,
      hasHeadache: this.hasHeadache,
      hasDizziness: this.hasDizziness,
      hasColdIntolerance: this.hasColdIntolerance,
      hasPallor: this.hasPallor,
      hasKoilonychia: this.hasKoilonychia,
      hasGlossitis: this.hasGlossitis,
      hasMenstruation: this.hasMenstruation,
      isPregnant: this.isPregnant,
      isLactating: this.isLactating,
      hasGIBleeding: this.hasGIBleeding,
      hasChronicDisease: this.hasChronicDisease,
      isVegetarian: this.isVegetarian,
      isVegan: this.isVegan,
      hasMalnutrition: this.hasMalnutrition,
      avgIronIntake: this.avgIronIntake,
      avgB12Intake: this.avgB12Intake,
      avgFolateIntake: this.avgFolateIntake,
      dietaryPattern: this.dietaryPattern,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
