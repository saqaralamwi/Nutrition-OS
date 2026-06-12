import { AiGenerateInput } from '../../domain/entities/AiPlan';

const SYSTEM_PROMPT = `أنت أخصائي تغذية سريرية خبير. مهمتك إنشاء خطة تغذية مخصصة للمريض بناءً على بياناته.

يجب أن يكون الرد بصيغة JSON فقط بالعربية، بدون أي نص إضافي، وفق الهيكل التالي:

{
  "totalCalories": number,
  "calorieAdjustment": number,
  "proteinGrams": number,
  "carbsGrams": number,
  "fatGrams": number,
  "mealPlan": [
    { "meal": "وجبة الفطور", "foods": ["طعام 1", "طعام 2"], "calories": number },
    { "meal": "وجبة الغداء", "foods": ["طعام 1", "طعام 2"], "calories": number },
    { "meal": "وجبة العشاء", "foods": ["طعام 1", "طعام 2"], "calories": number }
  ],
  "recommendations": ["توصية 1", "توصية 2"],
  "restrictions": ["محظور 1", "محظور 2"],
  "clinicalNotes": "ملاحظات سريرية إضافية"
}

قواعد السلامة:
- يجب أن تكون الخطة آمنة طبياً ومناسبة للحالة
- لا تتجاوز 2500 سعرة إلا في حالات استثنائية
- وفر بدائل غذائية مناسبة للثقافة العربية
- استخدم مكونات متوفرة في المنطقة العربية
- يجب أن تكون التوصيات محددة وقابلة للتنفيذ`;

function buildPatientSummary(input: AiGenerateInput): string {
  const parts: string[] = [
    `- العمر: ${input.age} سنة`,
    `- الجنس: ${input.gender === 'male' ? 'ذكر' : 'أنثى'}`,
    `- الوزن: ${input.weightKg} كجم`,
    `- الطول: ${input.heightCm} سم`,
    `- BMI: ${input.bmi.toFixed(1)} (${input.bmiCategory})`,
    `- التشخيص الرئيسي: ${input.diagnosis}`,
    `- مستوى النشاط: ${input.activityLevel}`,
  ];

  if (input.department) {
    parts.push(`- القسم: ${input.department}`);
  }
  if (input.additionalNotes) {
    parts.push(`- ملاحظات إضافية: ${input.additionalNotes}`);
  }

  return parts.join('\n');
}

function buildContextualConstraints(input: AiGenerateInput): string {
  const constraints: string[] = [];
  const diagnosis = input.diagnosis.toLowerCase();

  if (diagnosis.includes('سكري') || diagnosis.includes('diabetes') || diagnosis.includes('dm')) {
    constraints.push('- تقليل الكربوهيدرات البسيطة');
    constraints.push('- زيادة الألياف إلى 25-30 غرام');
    constraints.push('- توزيع الوجبات على 5-6 وجبات صغيرة');
  }

  if (diagnosis.includes('ضغط') || diagnosis.includes('hypertension') || diagnosis.includes('htn')) {
    constraints.push('- صوديوم أقل من 2000 ملغ يومياً');
    constraints.push('- نظام DASH الغذائي');
  }

  if (diagnosis.includes('سمنة') || diagnosis.includes('obesity') || diagnosis.includes('obese') || diagnosis.includes('زيادة وزن')) {
    constraints.push('- عجز سعري بمقدار 500 سعرة');
  }

  if (diagnosis.includes('فشل كلوي') || diagnosis.includes('renal') || diagnosis.includes('ckd')) {
    constraints.push('- تقييد البروتين حسب توصيات الطبيب');
    constraints.push('- مراقبة البوتاسيوم والفوسفور');
  }

  if (diagnosis.includes('أمراض كبد') || diagnosis.includes('liver') || diagnosis.includes('cirrhosis')) {
    constraints.push('- تقسيم الوجبات إلى 4-6 وجبات صغيرة');
    constraints.push('- تجنب الكحول والأطعمة النيئة');
  }

  return constraints.length > 0
    ? `قيود خاصة بالحالة:\n${constraints.join('\n')}`
    : '';
}

export function buildPrompt(input: AiGenerateInput): {
  system: string;
  user: string;
} {
  const patientSummary = buildPatientSummary(input);
  const constraints = buildContextualConstraints(input);

  const userPrompt = `قم بإنشاء خطة تغذية للمريض التالي:

${patientSummary}

${constraints}

يرجى تقديم خطة متوازنة ومناسبة للحالة مع مراعاة الثقافة الغذائية العربية.`;

  return {
    system: SYSTEM_PROMPT,
    user: userPrompt,
  };
}
