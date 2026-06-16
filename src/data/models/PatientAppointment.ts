import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class PatientAppointment extends Model {
  static table = 'patient_appointments';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @date('appointment_date') appointmentDate!: Date;
  @field('appointment_type') appointmentType!: string;
  @field('appointment_type_ar') appointmentTypeAr?: string;
  @field('appointment_time') appointmentTime?: string;
  @field('duration_minutes') durationMinutes?: number;
  @field('duration') duration?: number;
  @field('location') location?: string;
  @field('location_ar') locationAr?: string;
  @field('address') address?: string;
  @field('address_ar') addressAr?: string;
  @field('clinic_name') clinicName?: string;
  @field('clinic_name_ar') clinicNameAr?: string;
  @field('provider_name') providerName?: string;
  @field('provider_name_ar') providerNameAr?: string;
  @field('provider_phone') providerPhone?: string;
  @field('provider_specialty') providerSpecialty?: string;
  @field('provider_specialty_ar') providerSpecialtyAr?: string;
  @field('status') status!: string;
  @field('status_ar') statusAr?: string;
  @field('notes') notes?: string;
  @field('notes_ar') notesAr?: string;
  @field('preparation_instructions') preparationInstructions?: string;
  @field('preparation_instructions_ar') preparationInstructionsAr?: string;
  @field('reminder_sent') reminderSent?: boolean;
  @date('reminder_time') reminderTime?: Date;
  @field('reminder_type') reminderType?: string;
  @field('reminder_type_ar') reminderTypeAr?: string;
  @date('confirmed_at') confirmedAt?: Date;
  @date('cancelled_at') cancelledAt?: Date;
  @field('cancelled_reason') cancelledReason?: string;
  @field('cancelled_reason_ar') cancelledReasonAr?: string;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
