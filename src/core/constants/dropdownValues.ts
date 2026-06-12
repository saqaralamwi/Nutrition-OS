export const GENDER_OPTIONS = [
  { label: 'ذكر', value: 'male' },
  { label: 'أنثى', value: 'female' },
] as const;

export const DEPARTMENT_OPTIONS = [
  { label: 'عناية مركزة', value: 'ICU' },
  { label: 'داخلي', value: 'Internal' },
  { label: 'جراحي', value: 'Surgical' },
  { label: 'أطفال', value: 'Pediatrics' },
  { label: 'نساء وتوليد', value: 'OB/GYN' },
  { label: 'عيادات خارجية', value: 'Outpatient' },
  { label: 'آخر', value: 'Other' },
] as const;

export const PATIENT_TYPE_OPTIONS = [
  { label: 'داخلي', value: 'inpatient' },
  { label: 'خارجي', value: 'outpatient' },
  { label: 'استشاري', value: 'consultation' },
] as const;

export const STATUS_OPTIONS = [
  { label: 'نشط', value: 'active' },
  { label: 'منتهي', value: 'discharged' },
  { label: 'متابعة', value: 'follow-up' },
] as const;
