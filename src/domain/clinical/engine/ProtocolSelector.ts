import { Patient } from '../../entities/Patient';
import { ClinicalProtocol, PatientCategory } from '../types';
import { ProtocolRegistry } from '../protocols/ProtocolRegistry';

export class ProtocolSelector {
  static select(patient: Patient, weightKg: number, age: number): ClinicalProtocol {
    const category = this.matchCategory(patient, age);
    return ProtocolRegistry.get(category);
  }

  static matchCategory(patient: Patient, age: number): PatientCategory {
    const diagnosis = (patient.primaryDiagnosis || '').toLowerCase();
    const department = (patient.department || '').toLowerCase();

    if (department === 'icu' || department === 'critical-care' || diagnosis.includes('icu') || diagnosis.includes('ventilat') || diagnosis.includes('sepsis') || diagnosis.includes('trauma')) {
      if (diagnosis.includes('sepsis') || diagnosis.includes('تسمم')) return 'sepsis';
      if (diagnosis.includes('trauma') || diagnosis.includes('صدمة') || diagnosis.includes('حروق')) return 'trauma';
      if (department === 'icu' || department === 'critical-care' || diagnosis.includes('ventilat') || diagnosis.includes('جهاز')) {
        return 'icu_ventilated';
      }
      return 'icu_non_ventilated';
    }

    if (diagnosis.includes('diabetes') || diagnosis.includes('سكري') || department === 'diabetes') {
      if (diagnosis.includes('type 1') || diagnosis.includes('t1d') || diagnosis.includes('نوع 1')) return 'diabetes_t1';
      return 'diabetes_t2';
    }

    if (diagnosis.includes('ckd') || diagnosis.includes('kidney') || diagnosis.includes('كلية') || diagnosis.includes('كلى') || diagnosis.includes('renal') || diagnosis.includes('فشل كلوي')) {
      if (diagnosis.includes('dialysis') || diagnosis.includes('ديال') || diagnosis.includes('غسيل')) return 'ckd_dialysis';
      return 'ckd_nondialysis';
    }

    if (diagnosis.includes('heart') || diagnosis.includes('cardiovascular') || diagnosis.includes('قلب') || diagnosis.includes('coronary') || diagnosis.includes('atherosclero')) {
      return 'cardiovascular';
    }

    if (diagnosis.includes('hypertension') || diagnosis.includes('ضغط') || diagnosis.includes('h tn')) {
      return 'hypertension';
    }

    if (diagnosis.includes('obesity') || diagnosis.includes('obese') || diagnosis.includes('سمنة') || diagnosis.includes('زيادة وزن') || diagnosis.includes('overweight')) {
      return 'obesity_loss';
    }

    if (diagnosis.includes('underweight') || diagnosis.includes('نحافة') || diagnosis.includes('نقص وزن') || diagnosis.includes('انخفاض الوزن')) {
      return 'underweight_gain';
    }

    if (age <= 1) return 'infant';
    if (age <= 3) return 'toddler';
    if (age <= 12) return 'child';
    if (age <= 18) return 'adolescent';

    if (department === 'obgyn' || department === 'pregnancy' || diagnosis.includes('pregnancy') || diagnosis.includes('حمل') || diagnosis.includes('lactation') || diagnosis.includes('رضاعة') || diagnosis.includes('نفاس')) {
      if (diagnosis.includes('lactation') || diagnosis.includes('رضاعة') || diagnosis.includes('نفاس')) return 'lactation';
      if (diagnosis.includes('high risk') || diagnosis.includes('خطورة') || diagnosis.includes('تسمم حمل') || diagnosis.includes('preeclamp')) return 'pregnancy_high_risk';
      return 'pregnancy_normal';
    }

    if (department === 'sports' || department === 'nutrition_sports') {
      if (diagnosis.includes('endurance') || diagnosis.includes('تحمل') || diagnosis.includes('ماراثون')) return 'endurance_athlete';
      if (diagnosis.includes('strength') || diagnosis.includes('قوة') || diagnosis.includes('building') || diagnosis.includes('كمال')) return 'strength_athlete';
      return 'recreational_athlete';
    }

    if (diagnosis.includes('liver') || diagnosis.includes('كبد') || diagnosis.includes('hepatic') || diagnosis.includes('cirrhosis') || diagnosis.includes('تشمع')) {
      return 'liver_disease';
    }

    if (diagnosis.includes('gi') || diagnosis.includes('gastro') || diagnosis.includes('هضمي') || diagnosis.includes('colitis') || diagnosis.includes('crohn') || diagnosis.includes('قرحة') || diagnosis.includes('ulcer')) {
      return 'gastrointestinal';
    }

    if (diagnosis.includes('respiratory') || diagnosis.includes('رئة') || diagnosis.includes('copd') || diagnosis.includes('asthma') || diagnosis.includes('ربو') || diagnosis.includes('pulmonary')) {
      return 'respiratory_disease';
    }

    if (diagnosis.includes('cancer') || diagnosis.includes('tumor') || diagnosis.includes('سرطان') || diagnosis.includes('ورم') || diagnosis.includes('oncology') || diagnosis.includes('leukaemia') || diagnosis.includes('lymphoma')) {
      return 'oncology';
    }

    if (diagnosis.includes('transplant') || diagnosis.includes('زرع') || diagnosis.includes('زراعة')) {
      return 'transplant';
    }

    if (diagnosis.includes('autoim') || diagnosis.includes('lupus') || diagnosis.includes('rheumatoid') || diagnosis.includes('مناعي') || diagnosis.includes('ذئبة') || diagnosis.includes('روماتويد')) {
      return 'autoimmune';
    }

    if (age >= 65) return 'healthy_elderly';
    return 'healthy_adult';
  }
}
