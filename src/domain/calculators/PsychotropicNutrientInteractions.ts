export type InteractionLevel = 'none' | 'mild' | 'moderate' | 'severe';

export interface PsychotropicInteractionInput {
  medication: string;
  nutrient: string;
  dose: number;
}

export interface PsychotropicInteractionResult {
  interactionLevel: InteractionLevel;
  restriction: string;
  monitor: string;
  alternative: string;
  isSafe: boolean;
  errorCode?: string;
  message?: string;
}

export class PsychotropicNutrientInteractions {
  static calculate(input: PsychotropicInteractionInput): PsychotropicInteractionResult {
    const { medication, nutrient, dose } = input;

    if (isNaN(dose) || dose <= 0 || !medication || !nutrient) {
      return {
        interactionLevel: 'none',
        restriction: '',
        monitor: '',
        alternative: '',
        isSafe: false,
        errorCode: 'INVALID_INPUT',
        message: 'الدواء والمغذي مطلوبان، والجرعة يجب أن تكون موجبة',
      };
    }

    const interactions: Record<string, {
      level: InteractionLevel;
      restriction: string;
      monitor: string;
      alternative: string;
    }> = {
      'fluoxetine-serotonin': {
        level: 'mild',
        restriction: 'لا توجد قيود محددة',
        monitor: 'مراقبة متلازمة السيروتونين (نادرة)',
        alternative: '',
      },
      'olanzapine-sugar': {
        level: 'moderate',
        restriction: 'الحد من الأطعمة عالية السكر (تزيد خطر زيادة الوزن)',
        monitor: 'مراقبة الوزن، السكر التراكمي، سكر الدم',
        alternative: 'أريبيبرازول (خطر أقل لزيادة الوزن)',
      },
      'lithium-sodium': {
        level: 'severe',
        restriction: 'الحفاظ على تناول صوديوم ثابت (لا تقلل الصوديوم)',
        monitor: 'مراقبة مستوى الليثيوم أسبوعياً',
        alternative: 'فالبروات (لا يتفاعل مع الصوديوم)',
      },
      'mocobamine-tyramine': {
        level: 'severe',
        restriction: 'تجنب الأطعمة الغنية بالتيرامين (الجبن القديم، النبيذ، اللحوم المعالجة)',
        monitor: 'مراقبة أزمة ارتفاع ضغط الدم',
        alternative: 'SSRI (لا يتفاعل مع التيرامين)',
      },
    };

    const key = `${medication}-${nutrient}`.toLowerCase();
    const interaction = interactions[key];

    if (!interaction) {
      return {
        interactionLevel: 'none',
        restriction: 'لا يوجد تفاعل معروف',
        monitor: 'لا توجد مراقبة محددة مطلوبة',
        alternative: '',
        isSafe: true,
      };
    }

    return {
      interactionLevel: interaction.level,
      restriction: interaction.restriction,
      monitor: interaction.monitor,
      alternative: interaction.alternative,
      isSafe: interaction.level !== 'severe',
    };
  }
}
