import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';

export default class PatientEducationContent extends Model {
  static table = 'patient_education_content';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId?: string;
  @field('content_id') contentId?: string;
  @field('title') title!: string;
  @field('title_ar') titleAr?: string;
  @field('content_type') contentType!: string;
  @field('content_type_ar') contentTypeAr?: string;
  @field('content') content!: string;
  @field('content_ar') contentAr?: string;
  @field('summary') summary?: string;
  @field('summary_ar') summaryAr?: string;
  @field('category') category!: string;
  @field('category_ar') categoryAr?: string;
  @field('condition') condition?: string;
  @field('condition_ar') conditionAr?: string;
  @field('tags') tags?: string;
  @field('image_url') imageUrl?: string;
  @field('video_url') videoUrl?: string;
  @field('video_duration') videoDuration?: number;
  @field('document_url') documentUrl?: string;
  @field('viewed') viewed?: boolean;
  @date('viewed_at') viewedAt?: Date;
  @field('likes') likes?: number;
  @field('rating') rating?: number;
  @field('is_published') isPublished!: boolean;
  @field('source') source?: string;
  @field('url') url?: string;
  @date('published_at') publishedAt?: Date;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
