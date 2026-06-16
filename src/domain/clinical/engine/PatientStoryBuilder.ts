import { PatientStory, ClinicalEngineInput } from '../types';

export class PatientStoryBuilder {
  static build(input: ClinicalEngineInput): PatientStory {
    const narrative = this.buildNarrative(input);
    const bmi = this.calcBmi(input.weightKg, input.heightCm);
    return {
      summary: `${input.patient.fullName}, ${input.age} سنة، ${input.isMale ? 'ذكر' : 'أنثى'}، وزن ${input.weightKg} كلغ، مؤشر كتلة الجسم ${bmi.toFixed(1)}`,
      medicalHistory: {
        primaryDiagnosis: input.diagnosis,
        chronicConditions: input.hasDiabetes ? ['سكري'] : input.hasKidneyDisease ? ['مرض كلوي'] : [],
        surgeries: [],
        hospitalizations: [],
        allergies: [],
      },
      nutritionHistory: {
        previousDiets: [],
        foodPreferences: [],
        foodIntolerances: [],
        eatingPatterns: [],
      },
      currentMedications: {
        medications: input.medications || [],
        hiddenCalories: 0,
      },
      currentIssues: {
        weightChange: input.weightChangePercent || 0,
        glucoseIssues: (input.glucoseMgDl || 0) > 140 || (input.glucoseMgDl || 0) < 70,
        electrolyteIssues: (input.phosphorus || 1) < 0.8 || (input.potassium || 4) < 3.5,
        malnutrition: bmi < 18.5 || (input.hasMalnutrition || false),
      },
      narrative,
    };
  }

  static buildNarrative(input: ClinicalEngineInput): string {
    const bmi = this.calcBmi(input.weightKg, input.heightCm);
    const gender = input.isMale ? 'ذكر' : 'أنثى';
    const parts: string[] = [];

    parts.push(`المريض "${input.patient.fullName}" ${gender}، عمر ${input.age} سنة.`);
    parts.push(`الوزن الحالي: ${input.weightKg} كلغ، الطول: ${input.heightCm} سم، مؤشر كتلة الجسم: ${bmi.toFixed(1)}.`);
    parts.push(`التشخيص الرئيسي: ${input.diagnosis}.`);

    if (input.glucoseMgDl) {
      parts.push(`سكر الدم: ${input.glucoseMgDl} mg/dL.`);
    }

    if (bmi < 16) {
      parts.push('المريض يعاني من سوء تغذية شديد - خطر متلازمة إعادة التغذية عالٍ جداً.');
    } else if (bmi < 18.5) {
      parts.push('المريض يعاني من نقص الوزن. هناك حاجة لزيادة السعرات والبروتين.');
    } else if (bmi >= 30) {
      parts.push(`المريض يعاني من السمنة (BMI ${bmi.toFixed(1)}). الهدف: فقدان وزن تدريجي ومنتظم.`);
    } else {
      parts.push('مؤشر كتلة الجسم ضمن المعدل الطبيعي.');
    }

    if (input.isVentilated) {
      parts.push('المريض على جهاز تنفس اصطناعي - تقليل الكربوهيدرات لتقليل إنتاج CO2.');
    }

    if (input.onDialysis) {
      parts.push('المريض على جلسات غسيل كلوي - بروتين عالي لتعويض الفقد.');
    }

    if (input.weightChangePercent && Math.abs(input.weightChangePercent) > 5) {
      parts.push(`تغير الوزن: ${input.weightChangePercent > 0 ? 'فقدان' : 'زيادة'} ${Math.abs(input.weightChangePercent)}% من الوزن.`);
    }

    return parts.join('\n');
  }

  static calcBmi(weight: number, height: number): number {
    if (height <= 0) return 0;
    return weight / Math.pow(height / 100, 2);
  }
}
