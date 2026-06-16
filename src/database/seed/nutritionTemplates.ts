import { NutritionTemplateSeed } from './seedData';

const TEMPLATE_CATEGORIES: Array<{
  category: string;
  categoryAr: string;
  items: Array<{
    nameEn: string;
    nameAr: string;
    energyKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    sodiumMG: number;
  }>;
}> = [
  {
    category: 'diabetes', categoryAr: 'السكري',
    items: [
      { nameEn: 'Diabetes Control 1500 Calorie', nameAr: 'التحكم في السكري 1500 سعرة', energyKcal: 1500, proteinG: 90, carbsG: 150, fatG: 55, fiberG: 30, sodiumMG: 1500 },
      { nameEn: 'Diabetes Control 1800 Calorie', nameAr: 'التحكم في السكري 1800 سعرة', energyKcal: 1800, proteinG: 100, carbsG: 180, fatG: 65, fiberG: 35, sodiumMG: 1800 },
      { nameEn: 'Diabetes Control 2000 Calorie', nameAr: 'التحكم في السكري 2000 سعرة', energyKcal: 2000, proteinG: 110, carbsG: 200, fatG: 75, fiberG: 35, sodiumMG: 2000 },
      { nameEn: 'Diabetes Control 2200 Calorie', nameAr: 'التحكم في السكري 2200 سعرة', energyKcal: 2200, proteinG: 120, carbsG: 220, fatG: 85, fiberG: 40, sodiumMG: 2000 },
      { nameEn: 'Diabetes Weight Loss 1200 Calorie', nameAr: 'إنقاص الوزن للسكري 1200 سعرة', energyKcal: 1200, proteinG: 80, carbsG: 120, fatG: 40, fiberG: 30, sodiumMG: 1200 },
      { nameEn: 'Diabetes Weight Loss 1400 Calorie', nameAr: 'إنقاص الوزن للسكري 1400 سعرة', energyKcal: 1400, proteinG: 90, carbsG: 140, fatG: 50, fiberG: 30, sodiumMG: 1400 },
      { nameEn: 'Gestational Diabetes 1800 Calorie', nameAr: 'سكري الحمل 1800 سعرة', energyKcal: 1800, proteinG: 90, carbsG: 180, fatG: 70, fiberG: 30, sodiumMG: 1800 },
      { nameEn: 'Gestational Diabetes 2000 Calorie', nameAr: 'سكري الحمل 2000 سعرة', energyKcal: 2000, proteinG: 100, carbsG: 200, fatG: 80, fiberG: 30, sodiumMG: 2000 },
      { nameEn: 'T1D Carbohydrate Counting', nameAr: 'حساب الكربوهيدرات للنوع الأول', energyKcal: 1800, proteinG: 95, carbsG: 195, fatG: 65, fiberG: 30, sodiumMG: 1800 },
      { nameEn: 'T1D Flexible Insulin Plan', nameAr: 'خطة الأنسولين المرنة للنوع الأول', energyKcal: 2000, proteinG: 100, carbsG: 220, fatG: 75, fiberG: 30, sodiumMG: 2000 },
      { nameEn: 'Pre-Diabetes Prevention 1600 Calorie', nameAr: 'الوقاية من مقدمات السكري 1600 سعرة', energyKcal: 1600, proteinG: 85, carbsG: 170, fatG: 60, fiberG: 35, sodiumMG: 1600 },
      { nameEn: 'Pre-Diabetes Prevention 2000 Calorie', nameAr: 'الوقاية من مقدمات السكري 2000 سعرة', energyKcal: 2000, proteinG: 100, carbsG: 210, fatG: 75, fiberG: 35, sodiumMG: 2000 },
    ],
  },
  {
    category: 'chronic_kidney_disease', categoryAr: 'أمراض الكلى المزمنة',
    items: [
      { nameEn: 'CKD Non-Dialysis 1500 Calorie', nameAr: 'مرض الكلى غير الغسيل 1500 سعرة', energyKcal: 1500, proteinG: 50, carbsG: 200, fatG: 60, fiberG: 20, sodiumMG: 1500 },
      { nameEn: 'CKD Non-Dialysis 1800 Calorie', nameAr: 'مرض الكلى غير الغسيل 1800 سعرة', energyKcal: 1800, proteinG: 50, carbsG: 240, fatG: 75, fiberG: 20, sodiumMG: 1800 },
      { nameEn: 'CKD Non-Dialysis 2000 Calorie', nameAr: 'مرض الكلى غير الغسيل 2000 سعرة', energyKcal: 2000, proteinG: 60, carbsG: 260, fatG: 85, fiberG: 25, sodiumMG: 2000 },
      { nameEn: 'Haemodialysis 1500 Calorie', nameAr: 'غسيل كلوي دموي 1500 سعرة', energyKcal: 1500, proteinG: 75, carbsG: 170, fatG: 55, fiberG: 15, sodiumMG: 1500 },
      { nameEn: 'Haemodialysis 2000 Calorie', nameAr: 'غسيل كلوي دموي 2000 سعرة', energyKcal: 2000, proteinG: 90, carbsG: 230, fatG: 80, fiberG: 20, sodiumMG: 2000 },
      { nameEn: 'Haemodialysis 2200 Calorie', nameAr: 'غسيل كلوي دموي 2200 سعرة', energyKcal: 2200, proteinG: 100, carbsG: 250, fatG: 90, fiberG: 20, sodiumMG: 2000 },
      { nameEn: 'Peritoneal Dialysis 1800 Calorie', nameAr: 'غسيل كلوي بريتوني 1800 سعرة', energyKcal: 1800, proteinG: 80, carbsG: 200, fatG: 65, fiberG: 20, sodiumMG: 1500 },
      { nameEn: 'Peritoneal Dialysis 2200 Calorie', nameAr: 'غسيل كلوي بريتوني 2200 سعرة', energyKcal: 2200, proteinG: 90, carbsG: 250, fatG: 80, fiberG: 20, sodiumMG: 1800 },
      { nameEn: 'CKD Stage 3-4 Low Protein', nameAr: 'مرض الكلى المرحلة 3-4 بروتين منخفض', energyKcal: 1800, proteinG: 50, carbsG: 240, fatG: 75, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'CKD Stage 5 Conservative', nameAr: 'مرض الكلى المرحلة 5 تحفظي', energyKcal: 2000, proteinG: 55, carbsG: 270, fatG: 85, fiberG: 20, sodiumMG: 1500 },
      { nameEn: 'Post-Transplant Recovery', nameAr: 'التعافي بعد زراعة الكلى', energyKcal: 2000, proteinG: 100, carbsG: 230, fatG: 75, fiberG: 25, sodiumMG: 2000 },
      { nameEn: 'CKD with Diabetes 1800 Calorie', nameAr: 'مرض الكلى مع السكري 1800 سعرة', energyKcal: 1800, proteinG: 60, carbsG: 200, fatG: 70, fiberG: 25, sodiumMG: 1500 },
    ],
  },
  {
    category: 'cardiac', categoryAr: 'القلب',
    items: [
      { nameEn: 'Heart Healthy 1600 Calorie', nameAr: 'صحة القلب 1600 سعرة', energyKcal: 1600, proteinG: 80, carbsG: 200, fatG: 50, fiberG: 30, sodiumMG: 1500 },
      { nameEn: 'Heart Healthy 2000 Calorie', nameAr: 'صحة القلب 2000 سعرة', energyKcal: 2000, proteinG: 90, carbsG: 250, fatG: 65, fiberG: 35, sodiumMG: 1500 },
      { nameEn: 'Heart Healthy 2400 Calorie', nameAr: 'صحة القلب 2400 سعرة', energyKcal: 2400, proteinG: 100, carbsG: 300, fatG: 85, fiberG: 40, sodiumMG: 1500 },
      { nameEn: 'DASH Diet 1600 Calorie', nameAr: 'حمية داش 1600 سعرة', energyKcal: 1600, proteinG: 85, carbsG: 200, fatG: 50, fiberG: 35, sodiumMG: 1200 },
      { nameEn: 'DASH Diet 2000 Calorie', nameAr: 'حمية داش 2000 سعرة', energyKcal: 2000, proteinG: 100, carbsG: 250, fatG: 65, fiberG: 40, sodiumMG: 1500 },
      { nameEn: 'DASH Diet 2400 Calorie', nameAr: 'حمية داش 2400 سعرة', energyKcal: 2400, proteinG: 110, carbsG: 300, fatG: 85, fiberG: 45, sodiumMG: 1500 },
      { nameEn: 'Heart Failure Fluid Restricted', nameAr: 'فشل القلب محدود السوائل', energyKcal: 1800, proteinG: 85, carbsG: 230, fatG: 60, fiberG: 30, sodiumMG: 1500 },
      { nameEn: 'Mediterranean Heart 1800 Calorie', nameAr: 'متوسطي للقلب 1800 سعرة', energyKcal: 1800, proteinG: 90, carbsG: 200, fatG: 70, fiberG: 35, sodiumMG: 1500 },
      { nameEn: 'Mediterranean Heart 2200 Calorie', nameAr: 'متوسطي للقلب 2200 سعرة', energyKcal: 2200, proteinG: 100, carbsG: 250, fatG: 85, fiberG: 40, sodiumMG: 1500 },
      { nameEn: 'Low Sodium 1500 Calorie', nameAr: 'قليل الصوديوم 1500 سعرة', energyKcal: 1500, proteinG: 75, carbsG: 200, fatG: 50, fiberG: 30, sodiumMG: 1000 },
      { nameEn: 'Low Sodium 2000 Calorie', nameAr: 'قليل الصوديوم 2000 سعرة', energyKcal: 2000, proteinG: 90, carbsG: 270, fatG: 65, fiberG: 35, sodiumMG: 1000 },
    ],
  },
  {
    category: 'hypertension', categoryAr: 'ارتفاع ضغط الدم',
    items: [
      { nameEn: 'Hypertension Control 1600 Calorie', nameAr: 'التحكم في الضغط 1600 سعرة', energyKcal: 1600, proteinG: 80, carbsG: 210, fatG: 50, fiberG: 35, sodiumMG: 1200 },
      { nameEn: 'Hypertension Control 2000 Calorie', nameAr: 'التحكم في الضغط 2000 سعرة', energyKcal: 2000, proteinG: 95, carbsG: 260, fatG: 65, fiberG: 40, sodiumMG: 1500 },
      { nameEn: 'Hypertension DASH 1500 Calorie', nameAr: 'داش للضغط 1500 سعرة', energyKcal: 1500, proteinG: 80, carbsG: 190, fatG: 50, fiberG: 35, sodiumMG: 1000 },
      { nameEn: 'Hypertension DASH 1800 Calorie', nameAr: 'داش للضغط 1800 سعرة', energyKcal: 1800, proteinG: 90, carbsG: 230, fatG: 60, fiberG: 40, sodiumMG: 1200 },
    ],
  },
  {
    category: 'weight_loss', categoryAr: 'إنقاص الوزن',
    items: [
      { nameEn: 'Weight Loss 1200 Calorie', nameAr: 'إنقاص الوزن 1200 سعرة', energyKcal: 1200, proteinG: 80, carbsG: 120, fatG: 35, fiberG: 25, sodiumMG: 1200 },
      { nameEn: 'Weight Loss 1400 Calorie', nameAr: 'إنقاص الوزن 1400 سعرة', energyKcal: 1400, proteinG: 85, carbsG: 150, fatG: 40, fiberG: 30, sodiumMG: 1400 },
      { nameEn: 'Weight Loss 1600 Calorie', nameAr: 'إنقاص الوزن 1600 سعرة', energyKcal: 1600, proteinG: 90, carbsG: 170, fatG: 50, fiberG: 30, sodiumMG: 1600 },
      { nameEn: 'Weight Loss 1800 Calorie', nameAr: 'إنقاص الوزن 1800 سعرة', energyKcal: 1800, proteinG: 95, carbsG: 200, fatG: 60, fiberG: 35, sodiumMG: 1800 },
      { nameEn: 'High Protein Weight Loss', nameAr: 'بروتين عالٍ لإنقاص الوزن', energyKcal: 1500, proteinG: 120, carbsG: 130, fatG: 45, fiberG: 30, sodiumMG: 1500 },
      { nameEn: 'Low Carb Weight Loss', nameAr: 'كربوهيدرات منخفضة لإنقاص الوزن', energyKcal: 1500, proteinG: 100, carbsG: 80, fatG: 85, fiberG: 20, sodiumMG: 1500 },
      { nameEn: 'Metabolic Boost 1600 Calorie', nameAr: 'تعزيز الأيض 1600 سعرة', energyKcal: 1600, proteinG: 100, carbsG: 170, fatG: 50, fiberG: 30, sodiumMG: 1500 },
    ],
  },
  {
    category: 'paediatric', categoryAr: 'الأطفال',
    items: [
      { nameEn: 'Paediatric Standard 1200 Calorie', nameAr: 'أطفال قياسي 1200 سعرة', energyKcal: 1200, proteinG: 35, carbsG: 160, fatG: 45, fiberG: 20, sodiumMG: 1000 },
      { nameEn: 'Paediatric Standard 1500 Calorie', nameAr: 'أطفال قياسي 1500 سعرة', energyKcal: 1500, proteinG: 45, carbsG: 190, fatG: 55, fiberG: 25, sodiumMG: 1200 },
      { nameEn: 'Paediatric Standard 1800 Calorie', nameAr: 'أطفال قياسي 1800 سعرة', energyKcal: 1800, proteinG: 55, carbsG: 230, fatG: 65, fiberG: 28, sodiumMG: 1500 },
      { nameEn: 'Paediatric Malnutrition 1500 Calorie', nameAr: 'سوء تغذية أطفال 1500 سعرة', energyKcal: 1500, proteinG: 50, carbsG: 180, fatG: 60, fiberG: 20, sodiumMG: 1200 },
      { nameEn: 'Paediatric Malnutrition 2000 Calorie', nameAr: 'سوء تغذية أطفال 2000 سعرة', energyKcal: 2000, proteinG: 60, carbsG: 250, fatG: 80, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'Paediatric High Calorie 2000 Calorie', nameAr: 'سعرات عالية أطفال 2000 سعرة', energyKcal: 2000, proteinG: 60, carbsG: 250, fatG: 80, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'Paediatric High Calorie 2500 Calorie', nameAr: 'سعرات عالية أطفال 2500 سعرة', energyKcal: 2500, proteinG: 75, carbsG: 310, fatG: 100, fiberG: 30, sodiumMG: 1800 },
    ],
  },
  {
    category: 'icu', categoryAr: 'العناية المركزة',
    items: [
      { nameEn: 'ICU Standard 1500 Calorie', nameAr: 'عناية مركزة قياسي 1500 سعرة', energyKcal: 1500, proteinG: 75, carbsG: 150, fatG: 65, fiberG: 15, sodiumMG: 1000 },
      { nameEn: 'ICU Standard 1800 Calorie', nameAr: 'عناية مركزة قياسي 1800 سعرة', energyKcal: 1800, proteinG: 90, carbsG: 180, fatG: 75, fiberG: 15, sodiumMG: 1000 },
      { nameEn: 'ICU High Protein 1800 Calorie', nameAr: 'بروتين عالٍ عناية 1800 سعرة', energyKcal: 1800, proteinG: 110, carbsG: 170, fatG: 70, fiberG: 18, sodiumMG: 1000 },
      { nameEn: 'ICU High Protein 2200 Calorie', nameAr: 'بروتين عالٍ عناية 2200 سعرة', energyKcal: 2200, proteinG: 130, carbsG: 210, fatG: 85, fiberG: 20, sodiumMG: 1200 },
      { nameEn: 'ICU Refeeding Protocol', nameAr: 'بروتوكول إعادة التغذية عناية', energyKcal: 1000, proteinG: 50, carbsG: 120, fatG: 35, fiberG: 10, sodiumMG: 800 },
      { nameEn: 'ICU Trophic Feeding', nameAr: 'تغذية تغذوية عناية', energyKcal: 500, proteinG: 30, carbsG: 60, fatG: 15, fiberG: 5, sodiumMG: 500 },
      { nameEn: 'ICU Diabetic 1600 Calorie', nameAr: 'عناية مع سكري 1600 سعرة', energyKcal: 1600, proteinG: 80, carbsG: 160, fatG: 65, fiberG: 20, sodiumMG: 1000 },
      { nameEn: 'ICU Renal 1600 Calorie', nameAr: 'عناية مع كلوي 1600 سعرة', energyKcal: 1600, proteinG: 50, carbsG: 200, fatG: 65, fiberG: 15, sodiumMG: 800 },
    ],
  },
  {
    category: 'oncology', categoryAr: 'الأورام',
    items: [
      { nameEn: 'Cancer Support 1800 Calorie', nameAr: 'دعم السرطان 1800 سعرة', energyKcal: 1800, proteinG: 90, carbsG: 210, fatG: 65, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'Cancer Support 2200 Calorie', nameAr: 'دعم السرطان 2200 سعرة', energyKcal: 2200, proteinG: 100, carbsG: 260, fatG: 80, fiberG: 30, sodiumMG: 1800 },
      { nameEn: 'Cancer High Protein 2000 Calorie', nameAr: 'بروتين عالٍ للسرطان 2000 سعرة', energyKcal: 2000, proteinG: 120, carbsG: 220, fatG: 65, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'Cancer Cachexia 2200 Calorie', nameAr: 'دنف السرطان 2200 سعرة', energyKcal: 2200, proteinG: 120, carbsG: 250, fatG: 75, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'Neutropenic Diet 1800 Calorie', nameAr: 'نظام العَدلات 1800 سعرة', energyKcal: 1800, proteinG: 85, carbsG: 220, fatG: 60, fiberG: 20, sodiumMG: 1500 },
      { nameEn: 'Chemotherapy Support 1600 Calorie', nameAr: 'دعم العلاج الكيميائي 1600 سعرة', energyKcal: 1600, proteinG: 80, carbsG: 200, fatG: 50, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'Radiation Support 2000 Calorie', nameAr: 'دعم العلاج الإشعاعي 2000 سعرة', energyKcal: 2000, proteinG: 90, carbsG: 250, fatG: 70, fiberG: 30, sodiumMG: 1800 },
    ],
  },
  {
    category: 'liver', categoryAr: 'الكبد',
    items: [
      { nameEn: 'Cirrhosis Standard 1800 Calorie', nameAr: 'تليف كبد قياسي 1800 سعرة', energyKcal: 1800, proteinG: 85, carbsG: 220, fatG: 60, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'Cirrhosis High Protein 2000 Calorie', nameAr: 'بروتين عالٍ تليف كبد 2000 سعرة', energyKcal: 2000, proteinG: 100, carbsG: 240, fatG: 65, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'Cirrhosis with Ascites 1600 Calorie', nameAr: 'تليف مع استسقاء 1600 سعرة', energyKcal: 1600, proteinG: 80, carbsG: 200, fatG: 50, fiberG: 20, sodiumMG: 1000 },
      { nameEn: 'Hepatic Encephalopathy 1800 Calorie', nameAr: 'اعتلال دماغي كبدي 1800 سعرة', energyKcal: 1800, proteinG: 85, carbsG: 230, fatG: 55, fiberG: 20, sodiumMG: 1500 },
      { nameEn: 'NAFLD Weight Loss 1500 Calorie', nameAr: 'دهون الكبد 1500 سعرة', energyKcal: 1500, proteinG: 80, carbsG: 170, fatG: 50, fiberG: 30, sodiumMG: 1500 },
      { nameEn: 'NAFLD Weight Loss 1800 Calorie', nameAr: 'دهون الكبد 1800 سعرة', energyKcal: 1800, proteinG: 90, carbsG: 210, fatG: 60, fiberG: 35, sodiumMG: 1800 },
    ],
  },
  {
    category: 'pregnancy_lactation', categoryAr: 'الحمل والرضاعة',
    items: [
      { nameEn: 'Pregnancy 1st Trimester 1800 Calorie', nameAr: 'الحمل الثلث الأول 1800 سعرة', energyKcal: 1800, proteinG: 75, carbsG: 230, fatG: 65, fiberG: 28, sodiumMG: 1800 },
      { nameEn: 'Pregnancy 2nd Trimester 2000 Calorie', nameAr: 'الحمل الثلث الثاني 2000 سعرة', energyKcal: 2000, proteinG: 85, carbsG: 250, fatG: 75, fiberG: 30, sodiumMG: 2000 },
      { nameEn: 'Pregnancy 3rd Trimester 2200 Calorie', nameAr: 'الحمل الثلث الثالث 2200 سعرة', energyKcal: 2200, proteinG: 90, carbsG: 270, fatG: 80, fiberG: 30, sodiumMG: 2000 },
      { nameEn: 'Lactation 2200 Calorie', nameAr: 'رضاعة 2200 سعرة', energyKcal: 2200, proteinG: 85, carbsG: 280, fatG: 85, fiberG: 30, sodiumMG: 2200 },
      { nameEn: 'Lactation 2500 Calorie', nameAr: 'رضاعة 2500 سعرة', energyKcal: 2500, proteinG: 90, carbsG: 310, fatG: 95, fiberG: 35, sodiumMG: 2500 },
      { nameEn: 'Gestational Diabetes Pregnancy', nameAr: 'سكري الحمل 2000 سعرة', energyKcal: 2000, proteinG: 85, carbsG: 200, fatG: 85, fiberG: 30, sodiumMG: 1800 },
    ],
  },
  {
    category: 'geriatric', categoryAr: 'المسنين',
    items: [
      { nameEn: 'Geriatric Standard 1600 Calorie', nameAr: 'مسنين قياسي 1600 سعرة', energyKcal: 1600, proteinG: 75, carbsG: 200, fatG: 55, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'Geriatric Standard 1800 Calorie', nameAr: 'مسنين قياسي 1800 سعرة', energyKcal: 1800, proteinG: 85, carbsG: 220, fatG: 65, fiberG: 28, sodiumMG: 1800 },
      { nameEn: 'Geriatric High Protein 1600 Calorie', nameAr: 'بروتين عالٍ مسنين 1600 سعرة', energyKcal: 1600, proteinG: 90, carbsG: 180, fatG: 50, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'Geriatric High Protein 2000 Calorie', nameAr: 'بروتين عالٍ مسنين 2000 سعرة', energyKcal: 2000, proteinG: 110, carbsG: 230, fatG: 65, fiberG: 30, sodiumMG: 1800 },
      { nameEn: 'Geriatric Sarcopenia 1800 Calorie', nameAr: 'ضمور عضلات مسنين 1800 سعرة', energyKcal: 1800, proteinG: 100, carbsG: 200, fatG: 60, fiberG: 28, sodiumMG: 1500 },
      { nameEn: 'Geriatric Dysphagia Pureed 1600 Calorie', nameAr: 'عسر بلع مسنين مهروس 1600 سعرة', energyKcal: 1600, proteinG: 75, carbsG: 200, fatG: 55, fiberG: 20, sodiumMG: 1500 },
      { nameEn: 'Geriatric Dementia 1800 Calorie', nameAr: 'خرف مسنين 1800 سعرة', energyKcal: 1800, proteinG: 80, carbsG: 230, fatG: 60, fiberG: 25, sodiumMG: 1500 },
    ],
  },
  {
    category: 'surgical', categoryAr: 'الجراحة',
    items: [
      { nameEn: 'Pre-Surgery Immune 1800 Calorie', nameAr: 'قبل الجراحة مناعي 1800 سعرة', energyKcal: 1800, proteinG: 100, carbsG: 200, fatG: 60, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'Post-Surgery Recovery 1600 Calorie', nameAr: 'تعافي بعد الجراحة 1600 سعرة', energyKcal: 1600, proteinG: 90, carbsG: 180, fatG: 50, fiberG: 20, sodiumMG: 1200 },
      { nameEn: 'Post-Surgery Recovery 2000 Calorie', nameAr: 'تعافي بعد الجراحة 2000 سعرة', energyKcal: 2000, proteinG: 110, carbsG: 230, fatG: 65, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'Post-Bariatric Liquid Phase', nameAr: 'سوائل بعد السمنة', energyKcal: 800, proteinG: 60, carbsG: 80, fatG: 15, fiberG: 0, sodiumMG: 800 },
      { nameEn: 'Post-Bariatric Pureed Phase', nameAr: 'مهروس بعد السمنة', energyKcal: 1000, proteinG: 70, carbsG: 100, fatG: 25, fiberG: 10, sodiumMG: 1000 },
      { nameEn: 'Post-Bariatric Soft Phase', nameAr: 'طري بعد السمنة', energyKcal: 1200, proteinG: 75, carbsG: 130, fatG: 35, fiberG: 15, sodiumMG: 1200 },
      { nameEn: 'Wound Healing 2000 Calorie', nameAr: 'التئام الجروح 2000 سعرة', energyKcal: 2000, proteinG: 110, carbsG: 230, fatG: 65, fiberG: 25, sodiumMG: 1500 },
    ],
  },
  {
    category: 'gi', categoryAr: 'الجهاز الهضمي',
    items: [
      { nameEn: 'Crohn\'s Disease 1800 Calorie', nameAr: 'مرض كرون 1800 سعرة', energyKcal: 1800, proteinG: 85, carbsG: 220, fatG: 60, fiberG: 20, sodiumMG: 1500 },
      { nameEn: 'Ulcerative Colitis 1800 Calorie', nameAr: 'التهاب القولون التقرحي 1800 سعرة', energyKcal: 1800, proteinG: 80, carbsG: 230, fatG: 55, fiberG: 18, sodiumMG: 1500 },
      { nameEn: 'Gastroparesis Small Frequent', nameAr: 'خزل المعدة وجبات صغيرة', energyKcal: 1600, proteinG: 70, carbsG: 200, fatG: 55, fiberG: 15, sodiumMG: 1500 },
      { nameEn: 'Pancreatitis Recovery 1600 Calorie', nameAr: 'التهاب البنكرياس 1600 سعرة', energyKcal: 1600, proteinG: 75, carbsG: 200, fatG: 50, fiberG: 20, sodiumMG: 1200 },
      { nameEn: 'Low Fibre 1800 Calorie', nameAr: 'ألياف منخفضة 1800 سعرة', energyKcal: 1800, proteinG: 80, carbsG: 230, fatG: 60, fiberG: 10, sodiumMG: 1500 },
      { nameEn: 'High Fibre 1800 Calorie', nameAr: 'ألياف عالية 1800 سعرة', energyKcal: 1800, proteinG: 80, carbsG: 230, fatG: 60, fiberG: 40, sodiumMG: 1500 },
    ],
  },
  {
    category: 'pulmonary', categoryAr: 'الرئة',
    items: [
      { nameEn: 'COPD Standard 1800 Calorie', nameAr: 'مرض الرئة قياسي 1800 سعرة', energyKcal: 1800, proteinG: 85, carbsG: 210, fatG: 65, fiberG: 25, sodiumMG: 1500 },
      { nameEn: 'COPD Standard 2200 Calorie', nameAr: 'مرض الرئة قياسي 2200 سعرة', energyKcal: 2200, proteinG: 100, carbsG: 260, fatG: 80, fiberG: 30, sodiumMG: 1800 },
      { nameEn: 'COPD High Protein 2000 Calorie', nameAr: 'بروتين عالٍ لمرض الرئة 2000 سعرة', energyKcal: 2000, proteinG: 110, carbsG: 220, fatG: 70, fiberG: 28, sodiumMG: 1500 },
    ],
  },
  {
    category: 'renal_stone', categoryAr: 'حصوات الكلى',
    items: [
      { nameEn: 'Calcium Stone Prevention', nameAr: 'الوقاية من حصوات الكالسيوم', energyKcal: 1800, proteinG: 70, carbsG: 240, fatG: 60, fiberG: 30, sodiumMG: 1500 },
      { nameEn: 'Uric Acid Stone Prevention', nameAr: 'الوقاية من حصوات حمض البول', energyKcal: 1800, proteinG: 65, carbsG: 250, fatG: 55, fiberG: 30, sodiumMG: 1500 },
      { nameEn: 'Oxalate Stone Prevention', nameAr: 'الوقاية من حصوات الأوكسالات', energyKcal: 1800, proteinG: 75, carbsG: 240, fatG: 55, fiberG: 30, sodiumMG: 1500 },
    ],
  },
];

function generateTemplates(): NutritionTemplateSeed[] {
  const templates: NutritionTemplateSeed[] = [];
  let idCounter = 0;

  for (const cat of TEMPLATE_CATEGORIES) {
    for (const item of cat.items) {
      templates.push({
        id: `template-${String(++idCounter).padStart(4, '0')}`,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        category: cat.category,
        categoryAr: cat.categoryAr,
        energyKcal: item.energyKcal,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        fiberG: item.fiberG,
        sodiumMG: item.sodiumMG,
      });
    }
  }

  return templates;
}

export const nutritionTemplates: NutritionTemplateSeed[] = generateTemplates();
