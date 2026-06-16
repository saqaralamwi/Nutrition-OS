import { ICUAdmission } from '../entities/ICUAdmission';

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export function validateICUAdmission(data: Partial<ICUAdmission>): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.fullName || !data.fullName.trim()) errors.fullName = 'الاسم الكامل مطلوب / Full name is required';
  if (!data.fullNameAr || !data.fullNameAr.trim()) errors.fullNameAr = 'الاسم بالعربية مطلوب / Arabic name is required';
  if (!data.age || data.age < 0 || data.age > 150) errors.age = 'العمر 0-150 سنة / Age must be 0-150';
  if (!data.weightKg || data.weightKg <= 0 || data.weightKg > 500) errors.weightKg = 'الوزن 0.1-500 كغم / Weight 0.1-500 kg';
  if (!data.heightCm || data.heightCm <= 0 || data.heightCm > 250) errors.heightCm = 'الطول 1-250 سم / Height 1-250 cm';
  if (!data.mrn || !data.mrn.trim()) errors.mrn = 'رقم الملف الطبي مطلوب / MRN is required';
  if (!data.admissionDate) errors.admissionDate = 'تاريخ الدخول مطلوب / Admission date is required';
  if (!data.primaryDiagnosis || !data.primaryDiagnosis.trim()) errors.primaryDiagnosis = 'التشخيص الرئيسي مطلوب / Primary diagnosis is required';
  if (!data.primaryDiagnosisAr || !data.primaryDiagnosisAr.trim()) errors.primaryDiagnosisAr = 'التشخيص بالعربية مطلوب / Arabic diagnosis is required';
  if (!data.admissionReason || !data.admissionReason.trim()) errors.admissionReason = 'سبب الدخول مطلوب / Admission reason is required';
  if (!data.admissionReasonAr || !data.admissionReasonAr.trim()) errors.admissionReasonAr = 'سبب الدخول بالعربية مطلوب / Arabic reason is required';

  if (data.heartRate !== null && data.heartRate !== undefined) {
    if (data.heartRate < 20 || data.heartRate > 300) errors.heartRate = 'معدل القلب 20-300 نبضة/دقيقة / HR 20-300 bpm';
  }
  if (data.o2Sat !== null && data.o2Sat !== undefined) {
    if (data.o2Sat < 30 || data.o2Sat > 100) errors.o2Sat = 'التشبع 30-100% / O2 Sat 30-100%';
  }
  if (data.temperature !== null && data.temperature !== undefined) {
    if (data.temperature < 30 || data.temperature > 45) errors.temperature = 'الحرارة 30-45°م / Temp 30-45°C';
  }
  if (data.gcs !== null && data.gcs !== undefined) {
    if (data.gcs < 3 || data.gcs > 15) errors.gcs = 'GCS 3-15';
  }

  if (!data.icuType) errors.icuType = 'نوع ICU مطلوب / ICU type is required';
  if (!data.severityLevel) errors.severityLevel = 'مستوى الشدة مطلوب / Severity is required';

  const immutableKeys: (keyof ICUAdmission)[] = ['id', 'createdAt', 'updatedAt', 'createdBy', 'bmi'];
  for (const key of immutableKeys) {
    if (key in data && (data as any)[key] !== undefined) {
      delete errors[key as string];
    }
  }

  return errors;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function calculateWeightChangePercent(previousKg: number | null, currentKg: number): number | null {
  if (!previousKg || previousKg <= 0) return null;
  return Math.round(((previousKg - currentKg) / previousKg) * 100 * 10) / 10;
}
