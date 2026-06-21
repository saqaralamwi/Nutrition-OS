export interface IEgfrInput {
  serumCreatinine: number;
  age: number;
  gender: 'male' | 'female';
}

export interface IEgfrResult {
  egfrValue: number;
  stage: 'stage_1' | 'stage_2' | 'stage_3a' | 'stage_3b' | 'stage_4' | 'stage_5' | 'unknown';
  classification: string;
  isSafe: boolean;
}

export class EgfrCalculatorEngine {
  public static calculateEgfr(input: IEgfrInput): IEgfrResult {
    const { serumCreatinine, age, gender } = input;

    if (isNaN(serumCreatinine) || isNaN(age) || serumCreatinine <= 0 || age < 18 || age > 120) {
      return {
        egfrValue: 0,
        stage: 'unknown',
        classification: 'الرجاء إدخال قيم صحيحة للكرياتينين وعمر المريض (بالغ فوق 18 عاماً)',
        isSafe: false,
      };
    }

    const { kappa, alpha, genderMultiplier } = gender === 'female'
      ? { kappa: 0.7, alpha: -0.241, genderMultiplier: 1.012 }
      : { kappa: 0.9, alpha: -0.302, genderMultiplier: 1.0 };

    const ratio = serumCreatinine / kappa;
    const minRatio = Math.min(ratio, 1);
    const maxRatio = Math.max(ratio, 1);

    const egfrValue = parseFloat(
      (142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, age) * genderMultiplier).toFixed(2),
    );

    return EgfrCalculatorEngine.mapToStage(egfrValue);
  }

  private static mapToStage(egfrValue: number): IEgfrResult {
    if (egfrValue >= 90) {
      return {
        egfrValue,
        stage: 'stage_1',
        classification: 'المرحلة 1: أداء كلوي طبيعي',
        isSafe: true,
      };
    }
    if (egfrValue >= 60) {
      return {
        egfrValue,
        stage: 'stage_2',
        classification: 'المرحلة 2: قصور كلوي طفيف',
        isSafe: true,
      };
    }
    if (egfrValue >= 45) {
      return {
        egfrValue,
        stage: 'stage_3a',
        classification: 'المرحلة 3أ: قصور كلوي متوسط (خفيف)',
        isSafe: true,
      };
    }
    if (egfrValue >= 30) {
      return {
        egfrValue,
        stage: 'stage_3b',
        classification: 'المرحلة 3ب: قصور كلوي متوسط (شديد)',
        isSafe: true,
      };
    }
    if (egfrValue >= 15) {
      return {
        egfrValue,
        stage: 'stage_4',
        classification: 'المرحلة 4: قصور كلوي شديد',
        isSafe: true,
      };
    }
    return {
      egfrValue,
      stage: 'stage_5',
      classification: 'المرحلة 5: فشل كلوي نهائي',
      isSafe: true,
    };
  }
}
