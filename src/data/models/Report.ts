import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Report extends Model {
  static table = 'reports';

  @field('patient_id') patientId!: string;
  @field('report_type') reportType!: string;
  @field('generated_at') generatedAt!: number;
  @field('digital_fingerprint_hash') digitalFingerprintHash!: string;
  @field('pdf_blob') pdfBlob?: string;
  @field('input_snapshot') inputSnapshot!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
