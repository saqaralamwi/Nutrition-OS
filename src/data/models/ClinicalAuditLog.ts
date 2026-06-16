import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class ClinicalAuditLog extends Model {
  static table = 'clinical_audit_logs';

  @field('actor_id') actorId!: string;
  @field('actor_name') actorName!: string;
  @field('actor_role') actorRole!: string;
  @field('action_type') actionType!: string;
  @field('patient_id') patientId!: string;
  @field('metadata_snapshot') metadataSnapshot!: string;
  @field('clinical_justification') clinicalJustification!: string;
  @field('digital_fingerprint_hash') digitalFingerprintHash!: string;
  @date('created_at') createdAt!: Date;
}
