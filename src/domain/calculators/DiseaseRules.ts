import { DiseaseAdjustment } from '../entities/DiseaseRule';
import { DepartmentPlannerRegistry, PlannerPatient } from './DepartmentPlannerRegistry';

const diseaseKeywordMap: { keywords: string[]; department: string }[] = [
  { keywords: ['سكري', 'diabetes', 'DM', 'type 1', 'type 2', 't1d', 't2d'], department: 'diabetes' },
  { keywords: ['ضغط', 'hypertension', 'HTN', 'ارتفاع ضغط'], department: 'default' },
  { keywords: ['سمنة', 'obesity', 'obese', 'زيادة وزن'], department: 'default' },
  { keywords: ['فشل كلوي', 'renal', 'kidney', 'CKD', 'nephro'], department: 'nephrology' },
  { keywords: ['أمراض كبد', 'liver', 'hepatic', 'cirrhosis'], department: 'default' },
];

function diagnosisToPatient(diagnosis: string, weightKg: number): PlannerPatient {
  return {
    id: '',
    fileNumber: '',
    fullName: '',
    age: 40,
    dateOfBirth: null,
    gender: 'male',
    nationalId: null,
    nationality: null,
    phoneNumber: null,
    department: '',
    bedNumber: null,
    admissionDate: new Date().toISOString(),
    referringPhysician: null,
    primaryDiagnosis: diagnosis,
    patientType: 'inpatient',
    status: 'active',
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    weight_kg: weightKg,
    height_cm: 170,
    activity_factor: 1.2,
    stress_factor: 1.0,
  };
}

export function getDiseaseAdjustments(
  diagnosis: string,
  totalCalories: number,
  weightKg: number
): DiseaseAdjustment {
  const lowerDiagnosis = diagnosis.toLowerCase();
  const matchedDepartment = diseaseKeywordMap.find((entry) =>
    entry.keywords.some((kw) => lowerDiagnosis.includes(kw.toLowerCase()))
  );

  const patient = diagnosisToPatient(diagnosis, weightKg);
  const planner = matchedDepartment
    ? DepartmentPlannerRegistry.getPlanner(matchedDepartment.department)
    : DepartmentPlannerRegistry.getPlanner('default');

  const plan = {
    patient,
    calories: totalCalories,
    protein_g: planner.calculateProtein(patient),
    carbs_g: planner.calculateCarbs(patient, totalCalories),
    fat_g: planner.calculateFat(patient, totalCalories),
    totalCalories,
  };

  const validation = planner.validatePlan(plan);
  const considerations = planner.getSpecialConsiderations(patient);

  const recommendations = [
    ...(considerations.length > 0 ? considerations : ['اتباع نظام غذائي متوازن', 'تناول وجبات منتظمة']),
  ];
  const restrictions = validation.errors.concat(validation.warnings);

  const protein_g = planner.calculateProtein(patient);
  const carbs_g = planner.calculateCarbs(patient, totalCalories);
  const fat_g = planner.calculateFat(patient, totalCalories);

  return {
    calorieAdjustment: 0,
    recommendations,
    restrictions,
    proteinPerKg: weightKg > 0 ? Math.round((protein_g / weightKg) * 10) / 10 : undefined,
    carbsPercentage: totalCalories > 0 ? Math.round((carbs_g * 4 / totalCalories) * 100) : undefined,
    fatPercentage: totalCalories > 0 ? Math.round((fat_g * 9 / totalCalories) * 100) : undefined,
  };
}
