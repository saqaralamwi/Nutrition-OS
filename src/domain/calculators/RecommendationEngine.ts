import type { PatientProfile } from '../../data/types/meal_planner';
import type { DrugNutrientInteraction } from '../../data/types/dni';
import type { NutritionPlanSummary, ClinicalAlert } from '../../data/types/recommendations';

export class RecommendationEngine {
  private static alertCounter = 0;

  public static generateSummary(
    profile: PatientProfile,
    triggeredInteractions: DrugNutrientInteraction[],
    gcsScore: number,
  ): NutritionPlanSummary {
    RecommendationEngine.alertCounter = 0;
    const alerts: ClinicalAlert[] = [];
    const educationalNotesAr: string[] = [];

    RecommendationEngine.assessProteinRestriction(profile, gcsScore, alerts, educationalNotesAr);
    RecommendationEngine.assessDrugInteractions(triggeredInteractions, alerts);
    RecommendationEngine.assessContraindications(profile, alerts, educationalNotesAr);

    const suggestedActionPlanAr = RecommendationEngine.buildActionPlan(profile, alerts);

    return {
      patientId: profile.id,
      alerts,
      educationalNotesAr,
      suggestedActionPlanAr,
    };
  }

  private static assessProteinRestriction(
    profile: PatientProfile,
    gcsScore: number,
    alerts: ClinicalAlert[],
    notes: string[],
  ): void {
    if (!profile.isStrictProteinRestriction) return;

    alerts.push({
      id: RecommendationEngine.nextId('PROT_RESTRICT'),
      level: 'critical',
      titleAr: 'قيد بروتيني صارم مفعل',
      messageAr: `تم تقييد البروتين تلقائياً إلى 0.8 غرام/كغ (الإجمالي: ${profile.targetProtein} غرام) نظراً لتدهور الوعي (GCS: ${gcsScore}) أو ارتفاع الأمونيا.`,
    });

    notes.push(
      'يُفضل التركيز على مصادر البروتين النباتي أو مصل اللبن المخصص للكبد لتقليل العبء النيتروجيني.',
    );
    notes.push(
      'يُنصح بإعطاء وجبة خفيفة متأخرة ليلاً (Late-Night Snack) غنية بالكربوهيدرات المعقدة لمنع الهدم العضلي.',
    );
  }

  private static assessDrugInteractions(
    triggeredInteractions: DrugNutrientInteraction[],
    alerts: ClinicalAlert[],
  ): void {
    for (const dni of triggeredInteractions) {
      if (dni.severity === 'CRITICAL') {
        alerts.push({
          id: RecommendationEngine.nextId(`DNI_${dni.id}`),
          level: 'critical',
          titleAr: `تعارض حرج: ${dni.drugNameAr}`,
          messageAr: dni.recommendationAr,
        });
      } else {
        alerts.push({
          id: RecommendationEngine.nextId(`DNI_${dni.id}`),
          level: 'warning',
          titleAr: `تنبيه دوائي: ${dni.drugNameAr}`,
          messageAr: dni.recommendationAr,
        });
      }
    }
  }

  private static assessContraindications(
    profile: PatientProfile,
    alerts: ClinicalAlert[],
    notes: string[],
  ): void {
    for (const nutrient of profile.activeContraindicatedNutrients) {
      switch (nutrient) {
        case 'potassium':
          alerts.push({
            id: RecommendationEngine.nextId('K_BAN'),
            level: 'warning',
            titleAr: 'حظر البوتاسيوم مفعل',
            messageAr: 'تم حظر الأطعمة الغنية بالبوتاسيوم (الموز، التمر، البطاطس، البرتقال، بدائل الملح) بسبب ارتفاع البوتاسيوم أو الأدوية الموفرة له.',
          });
          notes.push('نوصي باستبدال الخضار والفواكه عالية البوتاسيوم بنظائرها منخفضة البوتاسيوم مثل التفاح والتوت والخيار.');
          break;

        case 'sodium':
          alerts.push({
            id: RecommendationEngine.nextId('NA_BAN'),
            level: 'warning',
            titleAr: 'حظر الصوديوم مفعل',
            messageAr: 'تم حظر الأطعمة عالية الصوديوم نظراً لانخفاض الصوديوم في الدم أو احتباس السوائل.',
          });
          notes.push('تجنب إضافة الملح إلى الطعام، والابتعاد عن المخللات والأطعمة المصنعة والمعلبة.');
          break;

        case 'vitamin_k':
          alerts.push({
            id: RecommendationEngine.nextId('VITK_BAN'),
            level: 'critical',
            titleAr: 'مراقبة فيتامين ك مطلوبة',
            messageAr: 'المريض يتناول وارفارين. يجب الحفاظ على تناول ثابت لفيتامين ك يومياً وتجنب التقلبات الكبيرة.',
          });
          notes.push('تجنب التغيرات المفاجئة في استهلاك الخضار الورقية الداكنة. حافظ على كمية ثابتة يومياً.');
          break;

        case 'high_ammonia_triggers':
          alerts.push({
            id: RecommendationEngine.nextId('NH3_BAN'),
            level: 'critical',
            titleAr: 'ارتفاع الأمونيا — تقييد بروتيني',
            messageAr: 'ارتفاع الأمونيا في الدم يستدعي تقييد البروتين ومراقبة الحالة العصبية عن كثب.',
          });
          notes.push('استخدام مصادر بروتين عالية القيمة الحيوية بكميات صغيرة موزعة على الوجبات.');
          break;

        default:
          alerts.push({
            id: RecommendationEngine.nextId(`BAN_${nutrient.toUpperCase()}`),
            level: 'warning',
            titleAr: `مغذي محظور: ${nutrient}`,
            messageAr: `تم حظر المغذي "${nutrient}" من خطة الطعام وفقاً للبروتوكول السريري.`,
          });
          break;
      }
    }
  }

  private static buildActionPlan(
    profile: PatientProfile,
    alerts: ClinicalAlert[],
  ): string {
    const hasCritical = alerts.some((a) => a.level === 'critical');

    if (hasCritical) {
      const criticalAlerts = alerts.filter((a) => a.level === 'critical');
      const details = criticalAlerts.map((a) => `• ${a.titleAr}`).join('\n');
      return `خطة حرجة: ${details}\n\n` +
        'إلزام المريض بوجبة خفيفة متأخرة ليلاً (Late-Night Snack) غنية بالكربوهيدرات المعقدة لمنع الهدم العضلي. ' +
        'مراقبة الحالة العصبية كل 6 ساعات. متابعة دقيقة للتحاليل المخبرية (البوتاسيوم، الصوديوم، الأمونيا). ' +
        'التواصل مع الفريق الطبي فور ظهور أي أعراض جديدة.';
    }

    return 'خطة اعتيادية: متابعة الحصص الغذائية وتوزيعها على 5 وجبات. ' +
      `الهدف: ${profile.targetCalories} سعرة حرارية، ${profile.targetProtein} غرام بروتين يومياً. ` +
      'تشجيع المريض على التنويع في مصادر الطعام وشرب كمية كافية من الماء.';
  }

  private static nextId(prefix: string): string {
    RecommendationEngine.alertCounter++;
    return `REC_${prefix}_${RecommendationEngine.alertCounter}`;
  }
}
