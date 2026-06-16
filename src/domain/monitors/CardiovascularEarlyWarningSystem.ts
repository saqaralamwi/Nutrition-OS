import type { ICvewsInput, ICvewsOutput } from '../../data/types/cardiovascular';

export class CardiovascularEarlyWarningSystem {
  public static evaluateWarningStatus(input: ICvewsInput): ICvewsOutput {
    const { systolicBloodPressure: sbp, diastolicBloodPressure: dbp, weightDelta24hKg: wd, edemaGrading, hasDyspneaAtRest, hasOrthopnea } = input;

    if (!sbp || sbp <= 0 || !dbp || dbp <= 0 || isNaN(sbp) || isNaN(dbp)) {
      return {
        warningStatus: 'STABLE_GREEN',
        isEmergencyAlert: false,
        restrictFluidMl: 0,
        isSafe: false,
        arabicClinicalAlerts: ['الرجاء إدخال قيم ضغط دم صحيحة'],
      };
    }

    const hasRespiratoryDistress = hasDyspneaAtRest || hasOrthopnea;
    const hasSevereEdema = edemaGrading === '3+' || edemaGrading === '4+';

    if (sbp >= 180 || dbp >= 120 || (hasRespiratoryDistress && (wd >= 1.0 || hasSevereEdema))) {
      return {
        warningStatus: 'EMERGENCY_RED',
        isEmergencyAlert: true,
        restrictFluidMl: 800,
        isSafe: true,
        arabicClinicalAlerts: [
          '🚨 إنذار أحمر طارئ: وذمة رئوية حادة واختناق هيدروليكي وشيك! المريض يغرق في سوائله الخاصة فسيولوجياً',
          '🚫 إيقاف فوري لكافة السوائل الوريدية، وتفعيل قيود بروتوكول قفل المياه الصارم بحد أقصى 800 مل/24 ساعة، واستدعاء العناية المركزة للتدخل العاجل بمدرات عروية (Loop Diuretics)',
        ],
      };
    }

    if (sbp >= 140 || dbp >= 90 || wd >= 0.5 || edemaGrading === '1+' || edemaGrading === '2+') {
      return {
        warningStatus: 'WARNING_YELLOW',
        isEmergencyAlert: true,
        restrictFluidMl: 1200,
        isSafe: true,
        arabicClinicalAlerts: [
          '⚠️ تحذير أصفر: بوادر تراكم هيدروليكي قلبي غير مستقر. يفرض تقييد السوائل عند 1200 مل وتخفيض الصوديوم الصارم',
        ],
      };
    }

    return {
      warningStatus: 'STABLE_GREEN',
      isEmergencyAlert: false,
      restrictFluidMl: 0,
      isSafe: true,
      arabicClinicalAlerts: [],
    };
  }
}
