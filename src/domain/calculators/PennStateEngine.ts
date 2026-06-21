export interface IPennStateInput {
  mifflinRee: number;
  minuteVentilationLMin: number;
  maxTemperatureCelsius: number;
  isObese: boolean;
}

export interface IPennStateResult {
  rmrValue: number;
  equationUsed: 'Penn_State_2003b' | 'Penn_State_2010';
  isSafe: boolean;
  clinicalAlerts: string[];
}

export class PennStateEngine {
  public static calculatePennState(input: IPennStateInput): IPennStateResult {
    const { mifflinRee, minuteVentilationLMin, maxTemperatureCelsius, isObese } = input;

    if (
      isNaN(mifflinRee) ||
      isNaN(minuteVentilationLMin) ||
      isNaN(maxTemperatureCelsius) ||
      mifflinRee <= 0 ||
      minuteVentilationLMin <= 0 ||
      maxTemperatureCelsius < 35 ||
      maxTemperatureCelsius > 43
    ) {
      return {
        rmrValue: 0,
        equationUsed: 'Penn_State_2003b',
        isSafe: false,
        clinicalAlerts: [
          'الرجاء التحقق من المؤشرات الحيوية المدخلة؛ قيم التهوية الدقيقة والحرارة خارج النطاق السريري الآمن',
        ],
      };
    }

    if (isObese) {
      const rmrValue = parseFloat(
        (mifflinRee * 0.71 + minuteVentilationLMin * 64 + maxTemperatureCelsius * 85 - 3085).toFixed(2),
      );

      return {
        rmrValue,
        equationUsed: 'Penn_State_2010',
        isSafe: true,
        clinicalAlerts: [
          `معدل الأيض المقدر باستخدام معادلة بن ستيت 2010: ${rmrValue} سعرة/يوم`,
          'تم تطبيق معادلة المرضى ذوي السمنة (BMI ≥ 30)',
        ],
      };
    }

    const rmrValue = parseFloat(
      (mifflinRee * 0.96 + minuteVentilationLMin * 31 + maxTemperatureCelsius * 167 - 6212).toFixed(2),
    );

    return {
      rmrValue,
      equationUsed: 'Penn_State_2003b',
      isSafe: true,
      clinicalAlerts: [
        `معدل الأيض المقدر باستخدام معادلة بن ستيت 2003b: ${rmrValue} سعرة/يوم`,
        'تم تطبيق معادلة المرضى غير ذوي السمنة',
      ],
    };
  }
}
