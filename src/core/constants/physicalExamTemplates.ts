export interface ExamTemplateItem {
  itemKey: string;
  labelAr: string;
  domain: string;
}

const DOMAIN_PERFORMANCE = 'performance';
const DOMAIN_SKELETAL = 'skeletal';
const DOMAIN_SKIN = 'skin';
const DOMAIN_HAIR = 'hair';
const DOMAIN_NAILS = 'nails';
const DOMAIN_EYES = 'eyes';
const DOMAIN_MOUTH = 'mouth';
const DOMAIN_RESPIRATION = 'respiration';
const DOMAIN_FEEDING = 'feeding';

export const EXAM_DOMAINS = [
  { value: DOMAIN_PERFORMANCE, label: 'الأداء' },
  { value: DOMAIN_SKELETAL, label: 'الهيكل' },
  { value: DOMAIN_SKIN, label: 'الجلد' },
  { value: DOMAIN_HAIR, label: 'الشعر' },
  { value: DOMAIN_NAILS, label: 'الأظافر' },
  { value: DOMAIN_EYES, label: 'العين' },
  { value: DOMAIN_MOUTH, label: 'الفم' },
  { value: DOMAIN_RESPIRATION, label: 'التنفس' },
  { value: DOMAIN_FEEDING, label: 'التغذية' },
] as const;

export const EXAM_RESPONSE_OPTIONS = [
  { label: 'لا', value: 'no' },
  { label: 'نعم', value: 'yes' },
  { label: 'لا يمكن قياسه', value: 'cm' },
] as const;

export const EXAM_TEMPLATES: ExamTemplateItem[] = [
  { itemKey: 'general_appearance', labelAr: 'المظهر العام', domain: DOMAIN_PERFORMANCE },
  { itemKey: 'gait', labelAr: 'المشية', domain: DOMAIN_PERFORMANCE },
  { itemKey: 'mobility', labelAr: 'الحركة', domain: DOMAIN_PERFORMANCE },
  { itemKey: 'muscle_strength', labelAr: 'قوة العضلات', domain: DOMAIN_PERFORMANCE },
  { itemKey: 'handgrip_strength', labelAr: 'قوة القبضة', domain: DOMAIN_PERFORMANCE },
  { itemKey: 'ability_to_stand', labelAr: 'القدرة على الوقوف', domain: DOMAIN_PERFORMANCE },

  { itemKey: 'temporal_wasting', labelAr: 'هزال صدغي', domain: DOMAIN_SKELETAL },
  { itemKey: 'clavicular_prominence', labelAr: 'بروز ترقوي', domain: DOMAIN_SKELETAL },
  { itemKey: 'scapular_prominence', labelAr: 'بروز كتفي', domain: DOMAIN_SKELETAL },
  { itemKey: 'interosseous_wasting', labelAr: 'هزال بين العظام', domain: DOMAIN_SKELETAL },
  { itemKey: 'knee_bowing', labelAr: 'تقوس الركبة', domain: DOMAIN_SKELETAL },
  { itemKey: 'bone_deformities', labelAr: 'تشوهات عظمية', domain: DOMAIN_SKELETAL },

  { itemKey: 'skin_turgor', labelAr: 'تورم الجلد', domain: DOMAIN_SKIN },
  { itemKey: 'skin_dryness', labelAr: 'جفاف الجلد', domain: DOMAIN_SKIN },
  { itemKey: 'skin_rash', labelAr: 'طفح جلدي', domain: DOMAIN_SKIN },
  { itemKey: 'petechiae', labelAr: 'نمشات', domain: DOMAIN_SKIN },
  { itemKey: 'ecchymosis', labelAr: 'كدمات', domain: DOMAIN_SKIN },
  { itemKey: 'edema', labelAr: 'وذمة', domain: DOMAIN_SKIN },
  { itemKey: 'jaundice', labelAr: 'يرقان', domain: DOMAIN_SKIN },
  { itemKey: 'poor_wound_healing', labelAr: 'ضعف التئام الجروح', domain: DOMAIN_SKIN },

  { itemKey: 'hair_thinning', labelAr: 'ترقق الشعر', domain: DOMAIN_HAIR },
  { itemKey: 'hair_brittleness', labelAr: 'تقصف الشعر', domain: DOMAIN_HAIR },
  { itemKey: 'alopecia', labelAr: 'تساقط الشعر', domain: DOMAIN_HAIR },
  { itemKey: 'hair_color_change', labelAr: 'تغير لون الشعر', domain: DOMAIN_HAIR },

  { itemKey: 'nail_brittleness', labelAr: 'تقصف الأظافر', domain: DOMAIN_NAILS },
  { itemKey: 'koilonychia', labelAr: 'تقعر الأظافر', domain: DOMAIN_NAILS },
  { itemKey: 'nail_pallor', labelAr: 'شحوب الأظافر', domain: DOMAIN_NAILS },
  { itemKey: 'nail_ridging', labelAr: 'تخطم الأظافر', domain: DOMAIN_NAILS },
  { itemKey: 'clubbing', labelAr: 'تعجر الأصابع', domain: DOMAIN_NAILS },

  { itemKey: 'pale_conjunctiva', labelAr: 'شحوب الملتحمة', domain: DOMAIN_EYES },
  { itemKey: 'xerophthalmia', labelAr: 'جفاف العين', domain: DOMAIN_EYES },
  { itemKey: 'bitot_spots', labelAr: 'بقع بيتو', domain: DOMAIN_EYES },
  { itemKey: 'night_blindness', labelAr: 'العشى الليلي', domain: DOMAIN_EYES },
  { itemKey: 'periorbital_edema', labelAr: 'وذمة حول العين', domain: DOMAIN_EYES },

  { itemKey: 'cheilitis', labelAr: 'التهاب الشفة', domain: DOMAIN_MOUTH },
  { itemKey: 'angular_stomatitis', labelAr: 'التهاب زاوية الفم', domain: DOMAIN_MOUTH },
  { itemKey: 'glossitis', labelAr: 'التهاب اللسان', domain: DOMAIN_MOUTH },
  { itemKey: 'atrophic_papillae', labelAr: 'ضمور حليمات اللسان', domain: DOMAIN_MOUTH },
  { itemKey: 'gum_hypertrophy', labelAr: 'تضخم اللثة', domain: DOMAIN_MOUTH },
  { itemKey: 'gum_bleeding', labelAr: 'نزيف اللثة', domain: DOMAIN_MOUTH },
  { itemKey: 'dental_caries', labelAr: 'تسوس الأسنان', domain: DOMAIN_MOUTH },
  { itemKey: 'dry_mouth', labelAr: 'جفاف الفم', domain: DOMAIN_MOUTH },
  { itemKey: 'oral_ulcers', labelAr: 'تقرحات فموية', domain: DOMAIN_MOUTH },
  { itemKey: 'difficulty_swallowing', labelAr: 'صعوبة البلع', domain: DOMAIN_MOUTH },

  { itemKey: 'respiratory_rate', labelAr: 'معدل التنفس', domain: DOMAIN_RESPIRATION },
  { itemKey: 'dyspnea', labelAr: 'ضيق التنفس', domain: DOMAIN_RESPIRATION },
  { itemKey: 'cough', labelAr: 'سعال', domain: DOMAIN_RESPIRATION },
  { itemKey: 'sputum', labelAr: 'بلغم', domain: DOMAIN_RESPIRATION },
  { itemKey: 'accessory_muscle_use', labelAr: 'استخدام العضلات المساعدة', domain: DOMAIN_RESPIRATION },
  { itemKey: 'wheezing', labelAr: 'أزيز', domain: DOMAIN_RESPIRATION },

  { itemKey: 'ng_tube', labelAr: 'أنبوب أنفي معدي', domain: DOMAIN_FEEDING },
  { itemKey: 'peg_tube', labelAr: 'أنبوب فغر المعدة', domain: DOMAIN_FEEDING },
  { itemKey: 'tpn', labelAr: 'تغذية وريدية كلية', domain: DOMAIN_FEEDING },
  { itemKey: 'feeding_aspiration', labelAr: 'شفط أثناء التغذية', domain: DOMAIN_FEEDING },
  { itemKey: 'feeding_intolerance', labelAr: 'عدم تحمل التغذية', domain: DOMAIN_FEEDING },
];
