import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class GeneticProfile extends Model {
  static table = 'genetic_profiles';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('gene') gene?: string;
  @field('variant') variant?: string;
  @field('genotype') genotype?: string;
  @field('phenotype') phenotype?: string;
  @field('nutrition_implication') nutritionImplication?: string;
  @field('evidence_level') evidenceLevel?: string;
  @field('source') source?: string;
  @field('notes') notes?: string;
  @field('mthfr') mthfr?: string;
  @field('mthfr_ar') mthfrAr?: string;
  @field('apoe') apoe?: string;
  @field('apoe_ar') apoeAr?: string;
  @field('tcf7l2') tcf7l2?: string;
  @field('tcf7l2_ar') tcf7l2Ar?: string;
  @field('pparg') pparg?: string;
  @field('pparg_ar') ppargAr?: string;
  @field('lct') lct?: string;
  @field('lct_ar') lctAr?: string;
  @field('amy1') amy1?: string;
  @field('amy1_ar') amy1Ar?: string;
  @field('fat_intake') fatIntake?: string;
  @field('fat_intake_ar') fatIntakeAr?: string;
  @field('carb_intake') carbIntake?: string;
  @field('carb_intake_ar') carbIntakeAr?: string;
  @field('folate_supplement') folateSupplement?: boolean;
  @field('lactose_free') lactoseFree?: boolean;
  @field('starch_restriction') starchRestriction?: boolean;
  @field('test_provider') testProvider?: string;
  @field('test_provider_ar') testProviderAr?: string;
  @date('test_date') testDate?: Date;
  @field('sync_status') syncState?: string;
  @field('sync_status_ar') syncStatusAr?: string;
  @date('sync_at') syncAt?: Date;
  @field('sync_error') syncError?: string;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
