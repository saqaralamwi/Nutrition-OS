import type {
  StrokeSeverity,
  DysphagiaSeverity,
  FoodConsistency,
  FeedingRoute,
  StrokeType,
  StrokeLocation,
  StrokeAssessment,
  StrokeNutritionPlan,
  DysphagiaIntervention
} from '../types/stroke';

export interface StrokeEngineInput {
  // Patient vitals / basics
  patientId?: string;
  age: number;
  weightKg: number;
  heightCm: number;
  gender: 'male' | 'female';
  baselineCalories?: number;
  baselineProteinGrams?: number;
  baselineFluidsMl?: number;

  // Stroke Assessment specific
  strokeType: StrokeType;
  strokeLocation: StrokeLocation;
  severity: StrokeSeverity;
  hoursSinceStroke: number;
  gcs: number; // Glasgow Coma Scale (3-15)
  nse: number; // NIHSS Score (0-42)
  hasDysphagia: boolean;
  dysphagiaSeverity: DysphagiaSeverity;
  waterSwallowTestResult: 'pass' | 'fail' | 'inconclusive';
  coughReflex: 'normal' | 'diminished' | 'absent';
  oralIntakePercentage?: number;
}

export interface StrokeEngineOutput {
  assessment: StrokeAssessment;
  nutritionPlan: StrokeNutritionPlan;
  intervention: DysphagiaIntervention;
  isSafe: boolean;
  arabicClinicalAlerts: string[];
  errorCode?: string;
  message?: string;
}

export class StrokeNutritionEngine {
  public static calculate(input: StrokeEngineInput): StrokeEngineOutput {
    const {
      age, weightKg, heightCm, gender,
      strokeType, strokeLocation, severity, hoursSinceStroke,
      gcs, nse, hasDysphagia, dysphagiaSeverity,
      waterSwallowTestResult, coughReflex, oralIntakePercentage = 100
    } = input;

    // 1. Validation Checks
    if (
      isNaN(age) || isNaN(weightKg) || isNaN(heightCm) ||
      age <= 0 || weightKg <= 0 || heightCm <= 0
    ) {
      return this.createUnsafeOutput('INVALID_VITALS', 'جميع البيانات الحيوية للمريض (العمر والوزن والطول) يجب أن تكون أرقاماً موجبة.');
    }

    if (isNaN(gcs) || gcs < 3 || gcs > 15) {
      return this.createUnsafeOutput('INVALID_GCS', 'مقياس غلاسكو للوعي (GCS) يجب أن يكون قيمة صحيحة بين 3 و 15.');
    }

    if (isNaN(nse) || nse < 0 || nse > 56) {
      return this.createUnsafeOutput('INVALID_NIHSS', 'مقياس السكتة الدماغية NIHSS يجب أن يكون قيمة صحيحة بين 0 و 56.');
    }

    // 2. Calculations factors
    let stressFactor = 1.0;
    if (severity === 'mild') stressFactor = 1.05;
    else if (severity === 'moderate') stressFactor = 1.15;
    else if (severity === 'severe') stressFactor = 1.30;
    else if (severity === 'massive') stressFactor = 1.40;

    // Add extra stress factor if GCS is low (critical brain injury)
    if (gcs < 8) {
      stressFactor += 0.05;
    }

    // Activity factor
    let activityFactor = 1.0;
    if (gcs < 8 || dysphagiaSeverity === 'cannot_eat' || waterSwallowTestResult === 'fail') {
      activityFactor = 0.9; // Bedridden / NPO
    } else if (severity === 'mild') {
      activityFactor = 1.1; // Active rehabilitation
    }

    // 3. Targets
    const targetCalories = Math.round(weightKg * 25 * stressFactor * activityFactor);
    
    let baselineProteinFactor = 1.1;
    if (severity === 'severe' || severity === 'massive') {
      baselineProteinFactor = 1.5;
    } else if (severity === 'moderate') {
      baselineProteinFactor = 1.3;
    }
    const targetProtein = Math.round(weightKg * baselineProteinFactor);

    let fluidFactor = 30;
    if (age > 65) {
      fluidFactor = 25; // Renal/cardiac safety boundary for elderly
    }
    const targetFluid = Math.round(weightKg * fluidFactor);

    // 4. Aspiration Risk Stratification
    let aspirationRisk: 'low' | 'moderate' | 'high' = 'low';
    if (
      gcs < 12 ||
      nse > 15 ||
      coughReflex === 'absent' ||
      waterSwallowTestResult === 'fail' ||
      dysphagiaSeverity === 'severe' ||
      dysphagiaSeverity === 'cannot_eat'
    ) {
      aspirationRisk = 'high';
    } else if (
      gcs < 14 ||
      nse > 8 ||
      coughReflex === 'diminished' ||
      waterSwallowTestResult === 'inconclusive' ||
      dysphagiaSeverity === 'moderate' ||
      dysphagiaSeverity === 'mild'
    ) {
      aspirationRisk = 'moderate';
    }

    // 5. Feeding Route and Consistency Recommendations
    let feedingRoute: FeedingRoute = 'oral';
    let foodConsistency: FoodConsistency = 'regular';
    let needsEnteral = false;
    let needsParenteral = false;

    if (gcs < 9 || dysphagiaSeverity === 'cannot_eat' || waterSwallowTestResult === 'fail') {
      needsEnteral = true;
      feedingRoute = hoursSinceStroke > 168 ? 'enteral_percutaneous' : 'enteral_nasogastric';
      foodConsistency = 'npo';
    } else if (dysphagiaSeverity === 'severe') {
      needsEnteral = true;
      feedingRoute = 'enteral_nasogastric';
      foodConsistency = 'npo';
    } else if (dysphagiaSeverity === 'moderate') {
      feedingRoute = oralIntakePercentage < 50 ? 'mixed' : 'oral';
      if (oralIntakePercentage < 50) {
        needsEnteral = true;
      }
      foodConsistency = 'pureed';
    } else if (dysphagiaSeverity === 'mild') {
      feedingRoute = 'oral';
      foodConsistency = 'soft';
    }

    // Thicken Liquids
    let thickenLiquids = false;
    let liquidThickness: 'thin' | 'moderate' | 'thick' | 'nectar' | 'honey' = 'thin';

    if (dysphagiaSeverity === 'severe') {
      thickenLiquids = true;
      liquidThickness = 'thick';
    } else if (dysphagiaSeverity === 'moderate') {
      thickenLiquids = true;
      liquidThickness = 'honey';
    } else if (dysphagiaSeverity === 'mild') {
      thickenLiquids = true;
      liquidThickness = 'nectar';
    }

    // Avoid Foods List
    const avoidFoods: string[] = [];
    if (hasDysphagia) {
      avoidFoods.push(
        'السوائل الرقيقة غير المكثفة (مثل الماء والشاي قبل زيادة الكثافة)',
        'الأطعمة ذات القوام المزدوج (مثل حساء الخضار مع قطع المعكرونة)',
        'الأطعمة القابلة للتفتت (مثل البسكويت والخبز الجاف)',
        'الأطعمة الدبقة واللزجة (مثل التمر والموز غير المهروس)'
      );
    }

    // Swallowing Interventions
    let swallowTherapyType: 'none' | 'oral_motor' | 'compensatory' | 'rehabilitative' = 'none';
    let therapyFrequency = 0;
    let feedingPosition: 'supine' | 'semi_fowler' | 'fowler' | 'upright_90' = 'semi_fowler';
    let chinTuck = false;
    let headRotation = false;
    let suctionAvailable = false;
    let emergencyProtocol: 'none' | 'fast_response' | 'full_support' = 'none';
    let foodTemperature: 'cold' | 'room_temp' | 'warm' = 'room_temp';
    let foodTexture: 'liquid' | 'pureed' | 'minced' | 'regular' = 'regular';

    if (hasDysphagia) {
      swallowTherapyType = gcs < 12 ? 'compensatory' : 'rehabilitative';
      therapyFrequency = gcs < 12 ? 3 : 5;
      feedingPosition = 'upright_90';
      chinTuck = true;
      suctionAvailable = true;
      emergencyProtocol = 'fast_response';
      foodTemperature = 'cold'; // Cold triggers swallow reflex better

      if (foodConsistency === 'pureed') foodTexture = 'pureed';
      else if (foodConsistency === 'soft') foodTexture = 'minced';
      else if (foodConsistency === 'npo') foodTexture = 'liquid';

      // Unilateral weakness benefits from head rotation to the weak side
      if (strokeLocation === 'left_hemisphere' || strokeLocation === 'right_hemisphere') {
        headRotation = true;
      }
    }

    // 6. Generate Alerts
    const alerts: string[] = [];
    if (gcs < 8) {
      alerts.push('🚨 إنذار فسيولوجي عصبي: المريض في حالة تدني حرج للوعي (GCS < 8). التغذية الفموية ممنوعة منعاً باتاً لتفادي الاختناق والشرقة الرئوية المميتة. يجب استخدام أنبوب التغذية الأنفي المعدي (NGT) فوراً.');
    }
    if (aspirationRisk === 'high') {
      alerts.push('⚠️ خطر الاختناق الرئوي حرج: يرجى تجهيز وحدة الشفط (Suction Unit) بجانب سرير المريض، وتطبيق وضعية جلوس 90 درجة مع مناورة ثني الذقن (Chin Tuck) أثناء الرضاعة أو البلع.');
    }
    if (nse > 15) {
      alerts.push('🚨 جلطة دماغية حادة شديدة (NIHSS > 15): يوصى بإبقاء المريض صائماً (NPO) خلال الساعات الـ 24 الأولى وتقييم قدرات البلع فسيولوجياً قبل إعطاء أي وجبة.');
    }
    if (hoursSinceStroke < 24 && needsEnteral) {
      alerts.push('🤰 حماية فسيولوجية حادة: البدء بالتغذية الأنبوبية التدريجية المبكرة (خلال أول 24-48 ساعة) يرتبط بتحسن التعافي العصبي وتخفيض معدل الالتهابات الرئوية.');
    }

    const isoNow = new Date().toISOString();

    const assessment: StrokeAssessment = {
      patientId: input.patientId || '',
      strokeDate: isoNow,
      strokeType,
      strokeLocation,
      severity,
      hoursSinceStroke,
      gcs,
      nse,
      hasDysphagia,
      dysphagiaSeverity,
      waterSwallowTestResult,
      coughReflex,
      feedingRoute,
      foodConsistency,
      needsEnteralNutrition: needsEnteral,
      needsParenteralNutrition: needsParenteral,
      oralIntakePercentage,
      createdAt: isoNow,
      updatedAt: isoNow,
    };

    const nutritionPlan: StrokeNutritionPlan = {
      patientId: input.patientId || '',
      assessmentId: '',
      targetCalories,
      targetProtein,
      targetFluid,
      stressFactor,
      activityFactor,
      thickenLiquids,
      liquidThickness,
      avoidFoods,
      feedingFrequency: foodConsistency === 'npo' ? 6 : 3,
      nocturnalFeeding: needsEnteral,
      nocturnalRate: needsEnteral ? Math.round(targetCalories / 24) : 0,
      weightCheckFrequency: severity === 'severe' || severity === 'massive' ? 'daily' : 'weekly',
      aspirationRisk,
      createdAt: isoNow,
      updatedAt: isoNow,
    };

    const intervention: DysphagiaIntervention = {
      patientId: input.patientId || '',
      assessmentId: '',
      swallowTherapyType,
      therapyFrequency,
      feedingPosition,
      chinTuck,
      headRotation,
      foodTemperature,
      foodTexture,
      suctionAvailable,
      emergencyProtocol,
      createdAt: isoNow,
      updatedAt: isoNow,
    };

    return {
      assessment,
      nutritionPlan,
      intervention,
      isSafe: true,
      arabicClinicalAlerts: alerts,
    };
  }

  private static createUnsafeOutput(code: string, message: string): StrokeEngineOutput {
    const isoNow = new Date().toISOString();
    return {
      assessment: {
        patientId: '',
        strokeDate: isoNow,
        strokeType: 'unknown',
        strokeLocation: 'unknown',
        severity: 'mild',
        hoursSinceStroke: 0,
        gcs: 15,
        nse: 0,
        hasDysphagia: false,
        dysphagiaSeverity: 'none',
        waterSwallowTestResult: 'pass',
        coughReflex: 'normal',
        feedingRoute: 'oral',
        foodConsistency: 'regular',
        needsEnteralNutrition: false,
        needsParenteralNutrition: false,
        oralIntakePercentage: 100,
        createdAt: isoNow,
        updatedAt: isoNow,
      },
      nutritionPlan: {
        patientId: '',
        assessmentId: '',
        targetCalories: 0,
        targetProtein: 0,
        targetFluid: 0,
        stressFactor: 1.0,
        activityFactor: 1.0,
        thickenLiquids: false,
        liquidThickness: 'thin',
        avoidFoods: [],
        feedingFrequency: 3,
        nocturnalFeeding: false,
        nocturnalRate: 0,
        weightCheckFrequency: 'weekly',
        aspirationRisk: 'low',
        createdAt: isoNow,
        updatedAt: isoNow,
      },
      intervention: {
        patientId: '',
        assessmentId: '',
        swallowTherapyType: 'none',
        therapyFrequency: 0,
        feedingPosition: 'semi_fowler',
        chinTuck: false,
        headRotation: false,
        foodTemperature: 'room_temp',
        foodTexture: 'regular',
        suctionAvailable: false,
        emergencyProtocol: 'none',
        createdAt: isoNow,
        updatedAt: isoNow,
      },
      isSafe: false,
      errorCode: code,
      message,
      arabicClinicalAlerts: [message],
    };
  }
}
