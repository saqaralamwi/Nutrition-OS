import { Patient, CreatePatientInput } from '../entities/Patient';
import { IPatientRepository } from '../repositories/IPatientRepository';

export interface ValidationError {
  field: string;
  message: string;
}

export class AddPatientUseCase {
  constructor(private repository: IPatientRepository) {}

  validate(input: CreatePatientInput): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!input.fullName || input.fullName.trim().length < 3) {
      errors.push({ field: 'fullName', message: 'الاسم يجب أن يكون 3 أحرف على الأقل' });
    }
    if (input.fullName && input.fullName.length > 100) {
      errors.push({ field: 'fullName', message: 'الاسم يجب أن لا يتجاوز 100 حرف' });
    }

    if (input.age === undefined || input.age === null || isNaN(input.age)) {
      errors.push({ field: 'age', message: 'العمر مطلوب' });
    } else if (input.age < 0 || input.age > 120) {
      errors.push({ field: 'age', message: 'العمر يجب أن يكون بين 0 و 120' });
    }

    if (!input.gender) {
      errors.push({ field: 'gender', message: 'يرجى اختيار الجنس' });
    }

    if (!input.department) {
      errors.push({ field: 'department', message: 'يرجى اختيار القسم' });
    }

    if (!input.patientType) {
      errors.push({ field: 'patientType', message: 'يرجى اختيار نوع المريض' });
    }

    return errors;
  }

  async execute(input: CreatePatientInput): Promise<Patient> {
    const validationErrors = this.validate(input);
    if (validationErrors.length > 0) {
      throw { type: 'VALIDATION_ERROR', errors: validationErrors };
    }

    return this.repository.create(input);
  }
}
