import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePatientStore } from '../../src/presentation/stores/patientStore';
import { colors, spacing } from '../../src/presentation/theme';
import { formatSafeDate } from '../../src/utils/date';
import { Patient } from '../../src/domain/entities/Patient';
import { ActivityLevel } from '../../src/domain/entities/NutritionPlan';
import { ACTIVITY_LEVELS } from '../../src/domain/entities/NutritionPlan';


const DEPARTMENT_LABELS: Record<string, string> = {
  ICU: 'عناية مركزة',
  Internal: 'داخلي',
  Surgical: 'جراحي',
  Pediatrics: 'أطفال',
  'OB/GYN': 'نساء وتوليد',
  Outpatient: 'عيادات خارجية',
};

const PATIENT_TYPE_LABELS: Record<string, string> = {
  inpatient: 'منوم',
  outpatient: 'عيادات خارجية',
  consultation: 'استشارة',
};

const GENDER_LABELS: Record<string, string> = {
  male: 'ذكر',
  female: 'أنثى',
};

const FREQUENCY_LABELS: Record<string, string> = {
  once_daily: 'مرة يومياً',
  twice_daily: 'مرتين يومياً',
  three_times_daily: 'ثلاث مرات يومياً',
  four_times_daily: 'أربع مرات يومياً',
  prn: 'عند الحاجة',
  weekly: 'أسبوعياً',
  monthly: 'شهرياً',
};

const SUPPLEMENT_TYPE_LABELS: Record<string, string> = {
  vitamin: 'فيتامين',
  mineral: 'معدن',
  protein: 'بروتين',
  amino_acid: 'أحماض أمينية',
  herbal: 'أعشاب',
  oil: 'زيوت',
  other: 'أخرى',
};

const MAIN_GOAL_OPTIONS = [
  { label: 'إنقاص الوزن', value: 'weight_loss' },
  { label: 'زيادة الوزن', value: 'weight_gain' },
  { label: 'المحافظة على الوزن', value: 'maintenance' },
  { label: 'السيطرة على السكر', value: 'glycemic_control' },
  { label: 'النظام الكلوي', value: 'renal_diet' },
  { label: 'بناء العضلات', value: 'muscle_building' },
  { label: 'تحسين الصحة العامة', value: 'general_health' },
  { label: 'تعديل السلوك الغذائي', value: 'behavioral' },
  { label: 'تعويض نقص التغذية', value: 'repletion' },
];

const DIET_TYPE_OPTIONS = [
  { label: 'عادي', value: 'regular' },
  { label: 'سكري', value: 'diabetic' },
  { label: 'قليل الصوديوم', value: 'low_sodium' },
  { label: 'قليل الدهون', value: 'low_fat' },
  { label: 'عالي البروتين', value: 'high_protein' },
  { label: 'قليل البروتين', value: 'low_protein' },
  { label: 'كلوي', value: 'renal' },
  { label: 'كبدي', value: 'liver' },
  { label: 'لين', value: 'soft' },
  { label: 'سائل', value: 'liquid' },
  { label: 'DASH', value: 'dash' },
  { label: 'البحر المتوسط', value: 'mediterranean' },
  { label: 'نباتي', value: 'vegetarian' },
];

const FOOD_TEXTURE_OPTIONS = [
  { label: 'عادي', value: 'regular' },
  { label: 'لين', value: 'soft' },
  { label: 'مفروم', value: 'minced' },
  { label: 'مهروس', value: 'pureed' },
  { label: 'سائل', value: 'liquid' },
  { label: 'سائل كثيف', value: 'thickened_liquid' },
];

const ROUTE_OF_FEEDING_OPTIONS = [
  { label: 'عن طريق الفم', value: 'oral' },
  { label: 'أنبوب أنفي معدي (NGT)', value: 'ng_tube' },
  { label: 'فغر المعدة (PEG)', value: 'peg' },
  { label: 'فغر الصائم (Jejunostomy)', value: 'jejunostomy' },
  { label: 'تغذية وريدية كلية (TPN)', value: 'tpn' },
  { label: 'تغذية وريدية جزئية (PPN)', value: 'ppn' },
];

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
  const [dietitianNotes, setDietitianNotes] = useState('');

  const [medicalHistory, setMedicalHistory] = useState<any>(null);
  const [socialHistory, setSocialHistory] = useState<any>(null);
  const [physicalExam, setPhysicalExam] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [intervention, setIntervention] = useState<any>(null);

  const getLatestLabResult = (testNameEn: string) => {
    const filtered = labResults.filter(
      (r) => r.testName?.toLowerCase() === testNameEn.toLowerCase()
    );
    if (filtered.length === 0) return null;
    return filtered.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())[0];
  };

  const getLabResultStyleClass = (resultVal: number, lowBound: number | null, highBound: number | null) => {
    if (lowBound !== null && resultVal < lowBound) {
      return 'print-bg-danger';
    }
    if (highBound !== null && resultVal > highBound) {
      return 'print-bg-danger';
    }
    return 'print-bg-normal';
  };

  const getLabResultStatusLabel = (resultVal: number, lowBound: number | null, highBound: number | null) => {
    if (lowBound !== null && resultVal < lowBound) {
      return 'منخفض ⚠️';
    }
    if (highBound !== null && resultVal > highBound) {
      return 'مرتفع ⚠️';
    }
    return 'طبيعي ✓';
  };

  async function loadClinicalData(patientId: string) {
    try {
      const [
        medHistMod,
        socHistMod,
        physExamMod,
        labMod,
        medsMod,
        supsMod,
        intervMod
      ] = await Promise.all([
        import('../../src/domain/use-cases/GetMedicalHistoryUseCase'),
        import('../../src/domain/use-cases/GetSocialHistoryUseCase'),
        import('../../src/domain/use-cases/GetPhysicalExamUseCase'),
        import('../../src/domain/use-cases/GetLabResultsUseCase'),
        import('../../src/domain/use-cases/GetMedicationsUseCase'),
        import('../../src/domain/use-cases/GetSupplementsUseCase'),
        import('../../src/domain/use-cases/GetActiveInterventionUseCase')
      ]);

      const [medHist, socHist, physExam, labs, meds, sups, interv] = await Promise.all([
        new medHistMod.GetMedicalHistoryUseCase().execute(patientId).catch(() => null),
        new socHistMod.GetSocialHistoryUseCase().execute(patientId).catch(() => null),
        new physExamMod.GetPhysicalExamUseCase().execute(patientId).catch(() => []),
        new labMod.GetLabResultsUseCase().execute(patientId).catch(() => []),
        new medsMod.GetMedicationsUseCase().execute(patientId).catch(() => []),
        new supsMod.GetSupplementsUseCase().execute(patientId).catch(() => []),
        new intervMod.GetActiveInterventionUseCase().execute(patientId).catch(() => null)
      ]);

      setMedicalHistory(medHist);
      setSocialHistory(socHist);
      setPhysicalExam(physExam);
      setLabResults(labs);
      setMedications(meds);
      setSupplements(sups);
      setIntervention(interv);
    } catch (e) {
      console.error('Failed to load clinical data for report:', e);
    }
  }

  const scrollViewRef = useRef<ScrollView>(null);
  const clinicalAnalysisYRef = useRef<number>(0);

  const scrollToClinicalAnalysis = useCallback(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: clinicalAnalysisYRef.current,
        animated: true,
      });
    }
  }, []);

  const currentMetrics = usePatientStore((s) => s.currentMetrics);
  const currentPlan = usePatientStore((s) => s.currentPlan);
  const isCalculating = usePatientStore((s) => s.isCalculating);
  const isGeneratingPlan = usePatientStore((s) => s.isGeneratingPlan);
  const calculateMetrics = usePatientStore((s) => s.calculateMetrics);
  const generatePlan = usePatientStore((s) => s.generatePlan);
  const loadMetricsForPatient = usePatientStore((s) => s.loadMetricsForPatient);
  const loadPlanForPatient = usePatientStore((s) => s.loadPlanForPatient);
  const showToast = usePatientStore((s) => s.showToast);

  const handlePrintReport = useCallback(async () => {
    try {
      const activeLabs = labResults.filter(
        (r) => r.testName && r.resultValue !== undefined && r.resultValue !== null
      );
      
      const labRows = activeLabs.length > 0 ? activeLabs.map(r => {
        const isHigh = r.referenceRangeHigh && r.resultValue > r.referenceRangeHigh;
        const isLow = r.referenceRangeLow && r.resultValue < r.referenceRangeLow;
        const statusText = isHigh ? 'مرتفع' : isLow ? 'منخفض' : 'طبيعي';
        const statusColor = isHigh || isLow ? 'red' : 'green';
        return `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${r.testName}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${r.resultValue} ${r.unit || ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${r.referenceRangeLow !== null && r.referenceRangeLow !== undefined ? r.referenceRangeLow : '-'} - ${r.referenceRangeHigh !== null && r.referenceRangeHigh !== undefined ? r.referenceRangeHigh : '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: ${statusColor}; font-weight: bold;">${statusText}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${r.testDate ? formatSafeDate(r.testDate) : '-'}</td>
          </tr>
        `;
      }).join('') : '<tr><td colspan="5" style="text-align: center; border: 1px solid #ddd; padding: 8px;">لا توجد فحوصات مخبرية مسجلة</td></tr>';

      const medRows = medications.length > 0 ? medications.map(m => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${m.drugName}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${m.dosage || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${FREQUENCY_LABELS[m.frequency] || m.frequency || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${m.route || '-'}</td>
        </tr>
      `).join('') : '<tr><td colspan="4" style="text-align: center; border: 1px solid #ddd; padding: 8px;">لا توجد أدوية مسجلة</td></tr>';

      const supRows = supplements.length > 0 ? supplements.map(s => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${s.supplementName}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${s.dosage || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${SUPPLEMENT_TYPE_LABELS[s.supplementType] || s.supplementType || '-'}</td>
        </tr>
      `).join('') : '<tr><td colspan="3" style="text-align: center; border: 1px solid #ddd; padding: 8px;">لا توجد مكملات مسجلة</td></tr>';

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>التقرير الطبي الشامل</title>
          <style>
            body {
              font-family: 'system-ui', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              color: #333;
              padding: 20px;
              line-height: 1.6;
              direction: rtl;
              text-align: right;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #3F51B5;
              padding-bottom: 10px;
              margin-bottom: 25px;
            }
            .header h1 {
              color: #3F51B5;
              margin: 0;
              font-size: 22px;
            }
            .header h2 {
              color: #555;
              margin: 5px 0 0 0;
              font-size: 15px;
            }
            .section {
              margin-bottom: 20px;
              background: #fff;
              border: 1.5px solid #ddd;
              border-radius: 8px;
              padding: 15px;
            }
            .section-title {
              font-size: 15px;
              font-weight: bold;
              color: #3F51B5;
              border-bottom: 1.5px solid #3F51B5;
              padding-bottom: 5px;
              margin-bottom: 12px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            .info-item {
              margin: 0;
              font-size: 13px;
            }
            .info-label {
              font-weight: bold;
              color: #444;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: right;
              font-size: 12px;
            }
            th {
              background-color: #f8f9fa;
              color: #333;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 11px;
              color: #777;
              border-top: 1px solid #eee;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>نظام إدارة التغذية العلاجية المتكامل - Clinical-ADCN</h1>
            <h2>التقرير السريري التغذوي الشامل للحالة</h2>
          </div>

          <!-- Basic Data -->
          <div class="section">
            <div class="section-title">معلومات المريض الأساسية</div>
            <div class="grid">
              <p class="info-item"><span class="info-label">اسم المريض:</span> ${patient?.fullName || '-'}</p>
              <p class="info-item"><span class="info-label">رقم الملف:</span> ${patient?.fileNumber || '-'}</p>
              <p class="info-item"><span class="info-label">العمر:</span> ${patient?.age ? `${patient.age} سنة` : '-'}</p>
              <p class="info-item"><span class="info-label">الجنس:</span> ${patient?.gender === 'male' ? 'ذكر' : patient?.gender === 'female' ? 'أنثى' : '-'}</p>
              <p class="info-item"><span class="info-label">القسم:</span> ${DEPARTMENT_LABELS[patient?.department || ''] || patient?.department || '-'}</p>
              <p class="info-item"><span class="info-label">رقم السرير:</span> ${patient?.bedNumber || '-'}</p>
              <p class="info-item"><span class="info-label">التشخيص الرئيسي:</span> ${patient?.primaryDiagnosis || '-'}</p>
              <p class="info-item"><span class="info-label">نوع المريض:</span> ${PATIENT_TYPE_LABELS[patient?.patientType || ''] || patient?.patientType || '-'}</p>
            </div>
          </div>

          <!-- Medical/Social History -->
          <div class="section">
            <div class="section-title">التاريخ المرضي والاجتماعي</div>
            <div class="grid">
              <p class="info-item"><span class="info-label">الشكوى الرئيسية:</span> ${medicalHistory?.chiefComplaint || '-'}</p>
              <p class="info-item"><span class="info-label">التشخيص الحالي:</span> ${medicalHistory?.currentDiagnosis || '-'}</p>
              <p class="info-item"><span class="info-label">الحساسية للدواء/الغذاء:</span> ${medicalHistory?.medicationAllergies || 'لا يوجد'}</p>
              <p class="info-item"><span class="info-label">النشاط البدني:</span> ${socialHistory?.physicalActivity || '-'}</p>
              <p class="info-item"><span class="info-label">النظام الغذائي المتبع قبل الدخول:</span> ${socialHistory?.specialDietBeforeAdmission || '-'}</p>
              <p class="info-item"><span class="info-label">التدخين:</span> ${socialHistory?.smoking === 'yes' ? 'نعم' : 'لا'}</p>
            </div>
          </div>

          <!-- Lab Records -->
          <div class="section">
            <div class="section-title">الفحوصات المخبرية المسجلة</div>
            <table>
              <thead>
                <tr>
                  <th>اسم الفحص</th>
                  <th>النتيجة</th>
                  <th>المدى الطبيعي</th>
                  <th>الحالة</th>
                  <th>تاريخ الفحص</th>
                </tr>
              </thead>
              <tbody>
                ${labRows}
              </tbody>
            </table>
          </div>

          <!-- Medications & Supplements -->
          <div class="section">
            <div class="section-title">الأدوية والمكملات الغذائية</div>
            <div class="grid">
              <div>
                <p style="font-weight: bold; font-size: 13px; margin: 0 0 5px 0;">الأدوية الحالية:</p>
                <table>
                  <thead>
                    <tr>
                      <th>اسم الدواء</th>
                      <th>الجرعة</th>
                      <th>التكرار</th>
                      <th>طريقة الإعطاء</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${medRows}
                  </tbody>
                </table>
              </div>
              <div>
                <p style="font-weight: bold; font-size: 13px; margin: 0 0 5px 0;">المكملات الغذائية:</p>
                <table>
                  <thead>
                    <tr>
                      <th>اسم المكمل</th>
                      <th>الجرعة</th>
                      <th>النوع</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${supRows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Energy Calculations & Plan -->
          <div class="section">
            <div class="section-title">الحسابات والتدخل الغذائي المستهدف</div>
            <div class="grid">
              <div>
                <p class="info-item"><span class="info-label">الوزن الحالي:</span> ${currentMetrics?.weightKg || '-'} كجم</p>
                <p class="info-item"><span class="info-label">الطول:</span> ${currentMetrics?.heightCm || '-'} سم</p>
                <p class="info-item"><span class="info-label">مؤشر كتلة الجسم (BMI):</span> ${currentMetrics?.bmi ? currentMetrics.bmi.value.toFixed(2) : '-'}</p>
                <p class="info-item"><span class="info-label">تصنيف كتلة الجسم:</span> ${currentMetrics?.bmi ? currentMetrics.bmi.categoryLabel : '-'}</p>
                <p class="info-item"><span class="info-label">إجمالي الاحتياج اليومي (TDEE):</span> ${currentMetrics?.tdee ? `${currentMetrics.tdee.value} سعرة` : '-'}</p>
              </div>
              <div>
                <p class="info-item"><span class="info-label">التشخيص التغذوي:</span> ${intervention?.nutritionDiagnosis || '-'}</p>
                <p class="info-item"><span class="info-label">الهدف الرئيسي:</span> ${MAIN_GOAL_OPTIONS.find(g => g.value === intervention?.mainGoal)?.label || intervention?.mainGoal || '-'}</p>
                <p class="info-item"><span class="info-label">نوع الحمية:</span> ${DIET_TYPE_OPTIONS.find(d => d.value === intervention?.dietType)?.label || intervention?.dietType || '-'}</p>
                <p class="info-item"><span class="info-label">طريقة التغذية:</span> ${ROUTE_OF_FEEDING_OPTIONS.find(r => r.value === intervention?.routeOfFeeding)?.label || intervention?.routeOfFeeding || '-'}</p>
                <p class="info-item"><span class="info-label">السعرات المستهدفة بالخطة:</span> ${currentPlan?.totalCalories || '-'} سعرة</p>
                <p class="info-item"><span class="info-label">بروتين:</span> ${currentPlan?.macros ? `${currentPlan.macros.proteinGrams} غرام` : '-'}</p>
                <p class="info-item"><span class="info-label">كربوهيدرات:</span> ${currentPlan?.macros ? `${currentPlan.macros.carbsGrams} غرام` : '-'}</p>
                <p class="info-item"><span class="info-label">دهون:</span> ${currentPlan?.macros ? `${currentPlan.macros.fatGrams} غرام` : '-'}</p>
              </div>
            </div>
            ${currentPlan?.dietitianNotes ? `<p class="info-item" style="margin-top: 15px;"><span class="info-label">ملاحظات أخصائي التغذية:</span> ${currentPlan.dietitianNotes}</p>` : ''}
          </div>

          <div class="footer">
            <p>تم استخراج التقرير آلياً عبر نظام Clinical-ADCN - د. أنس الأموي</p>
            <p>تاريخ التقرير: ${new Date().toLocaleString('ar-YE')}</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'حفظ التقرير الطبي الشامل' });
      showToast('تم تصدير التقرير بنجاح 🎉', 'success');
    } catch (error) {
      console.error('Print error:', error);
      showToast('فشل تصدير التقرير السريري', 'error');
    }
  }, [patient, medicalHistory, socialHistory, labResults, medications, supplements, intervention, currentMetrics, currentPlan, showToast]);

  const handleExportCase = useCallback(async () => {
    try {
      const { getDatabase } = await import('../../src/data/database');
      const { Q } = await import('@nozbe/watermelondb');
      const db = await getDatabase();
      const patientId = id;

      const [
        medHistories,
        socHistories,
        meds,
        sups,
        labs,
        exams,
        calcs,
        interventions,
        meals
      ] = await Promise.all([
        db.get('medical_histories').query(Q.where('patient_id', patientId)).fetch(),
        db.get('social_histories').query(Q.where('patient_id', patientId)).fetch(),
        db.get('medications').query(Q.where('patient_id', patientId)).fetch(),
        db.get('supplements').query(Q.where('patient_id', patientId)).fetch(),
        db.get('lab_results').query(Q.where('patient_id', patientId)).fetch(),
        db.get('physical_exam_items').query(Q.where('patient_id', patientId)).fetch(),
        db.get('calculations').query(Q.where('patient_id', patientId)).fetch(),
        db.get('interventions').query(Q.where('patient_id', patientId)).fetch(),
        db.get('meal_plans').query(Q.where('patient_id', patientId)).fetch(),
      ]);

      const serializeRecord = (record: any) => {
        const raw = record._raw;
        const copy = { ...raw };
        delete copy.id;
        delete copy._status;
        delete copy._changed;
        return copy;
      };

      const payload = {
        adcnProtocolVersion: "2.0",
        exportedBy: "Dr. Anas Al-Umawi",
        exportedAt: new Date().toISOString(),
        patientData: {
          patientProfile: patient ? {
            fullName: patient.fullName,
            age: patient.age,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            nationalId: patient.nationalId,
            nationality: patient.nationality,
            phoneNumber: patient.phoneNumber,
            department: patient.department,
            bedNumber: patient.bedNumber,
            referringPhysician: patient.referringPhysician,
            primaryDiagnosis: patient.primaryDiagnosis,
            patientType: patient.patientType,
            status: patient.status,
            notes: patient.notes,
            incompleteSections: patient.incompleteSections,
          } : null,
          clinicalWorkflow: {
            medicalHistories: medHistories.map(serializeRecord),
            socialHistories: socHistories.map(serializeRecord),
            medications: meds.map(serializeRecord),
            supplements: sups.map(serializeRecord),
            labResults: labs.map(serializeRecord),
            physicalExamItems: exams.map(serializeRecord),
            calculations: calcs.map(serializeRecord),
            interventions: interventions.map(serializeRecord),
            mealPlans: meals.map(serializeRecord),
          }
        }
      };

      if (Platform.OS === 'web') {
        const jsonStr = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = patient ? patient.fullName.replace(/\s+/g, '_') : 'case';
        a.download = `patient_${cleanName}_record.adcn`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('تم تصدير ملف الحالة بنجاح 🎉', 'success');
      } else {
        const summaryText = `ملف حالة المريض: ${patient ? patient.fullName : 'غير معروف'}\nنظام إدارة التغذية العلاجية: Clinical-ADCN\nامتداد الملف المرفق: .adcn\nتاريخ التصدير: ${new Date().toLocaleDateString('ar-YE')}`;
        await Share.share({
          message: summaryText,
          title: 'مشاركة ملف الحالة (.adcn)'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast('فشل تصدير ملف الحالة', 'error');
    }
  }, [id, patient, showToast]);

  useEffect(() => {
    loadPatient();
    loadMetricsForPatient(id);
    loadPlanForPatient(id);
    loadClinicalData(id);
  }, [id]);

  useEffect(() => {
    if (currentMetrics) {
      setWeightKg(String(currentMetrics.weightKg));
      setHeightCm(String(currentMetrics.heightCm));
    }
    if (currentPlan?.dietitianNotes) {
      setDietitianNotes(currentPlan.dietitianNotes);
    }
  }, [currentMetrics, currentPlan]);

  async function loadPatient() {
    try {
      const { GetPatientUseCase } = await import('../../src/domain/use-cases/GetPatientUseCase');
      const useCase = new GetPatientUseCase();
      const p = await useCase.execute(id);
      setPatient(p);
    } catch {
      showToast('فشل في تحميل بيانات المريض', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleCalculate = useCallback(async () => {
    if (!patient) return;
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (!w || !h || w <= 0 || h <= 0) {
      showToast('يرجى إدخال وزن وطول صحيحين', 'error');
      return;
    }
    try {
      await calculateMetrics({
        patientId: patient.id,
        weightKg: w,
        heightCm: h,
        age: patient.age,
        isMale: patient.gender === 'male',
        activityLevel,
      });
    } catch {
      /* error handled in store */
    }
  }, [patient, weightKg, heightCm, activityLevel, calculateMetrics, showToast]);

  const handleGeneratePlan = useCallback(async () => {
    if (!patient || !currentMetrics?.id || !currentMetrics?.tdee) return;
    try {
      await generatePlan({
        patientId: patient.id,
        metricsId: currentMetrics.id,
        weightKg: currentMetrics.weightKg,
        tdee: currentMetrics.tdee.value,
        diagnosis: patient.primaryDiagnosis,
        activityLevel,
      });
    } catch {
      /* error handled in store */
    }
  }, [patient, currentMetrics, activityLevel, generatePlan]);

  const handleSaveNotes = useCallback(async () => {
    if (!currentPlan?.id) return;
    try {
      const { UpdatePlanNotesUseCase } = await import('../../src/domain/use-cases/UpdatePlanNotesUseCase');
      const useCase = new UpdatePlanNotesUseCase();
      await useCase.execute(currentPlan.id, dietitianNotes);
      showToast('تم حفظ الملاحظات', 'success');
    } catch {
      showToast('فشل في حفظ الملاحظات', 'error');
    }
  }, [currentPlan, dietitianNotes, showToast]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>المريض غير موجود</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>عودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView ref={scrollViewRef} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{patient.fullName}</Text>
          <Text style={styles.headerSubtitle}>{patient.fileNumber}</Text>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات المريض</Text>
          <InfoRow label="القسم" value={DEPARTMENT_LABELS[patient.department] || patient.department} />
          <InfoRow label="نوع المريض" value={PATIENT_TYPE_LABELS[patient.patientType] || patient.patientType} />
          <InfoRow label="الجنس" value={GENDER_LABELS[patient.gender] || patient.gender} />
          <InfoRow label="العمر" value={`${patient.age} سنة`} />
          <InfoRow label="التشخيص" value={patient.primaryDiagnosis} />
          <InfoRow label="رقم السرير" value={patient.bedNumber || '-'} />
        </View>

        {/* Clinical Modules Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأقسام السريرية</Text>
          <View style={styles.twoColumnContainer}>
            {/* Left Column: DATA COLLECTION & ASSESSMENT */}
            <View style={styles.column}>
              <ModuleButton
                title="التاريخ المرضي"
                icon="clipboard"
                route={`/patient/${patient.id}/medical-history`}
                color="#4CAF50"
              />
              <ModuleButton
                title=" التاريخ الاجتماعي والنمط"
                icon="people"
                route={`/patient/${patient.id}/social-history`}
                color="#FF9800"
              />
              <ModuleButton
                title=" الفحص السريري"
                icon="body"
                route={`/patient/${patient.id}/physical-exam`}
                color="#00BCD4"
              />
              <ModuleButton
                title="🧪 الفحوصات المخبرية"
                icon="flask"
                route={`/patient/${patient.id}/laboratory`}
                color="#E91E63"
              />
              <ModuleButton
                title="📋 تقييم الخطر التغذوي (NRS-2002)"
                icon="checkbox-outline"
                route={`/patient/${patient.id}/screening`}
                color="#2E7D32"
              />
            </View>

            {/* Right Column: ANALYSIS, CALCULATION & INTERVENTION */}
            <View style={styles.column}>
              <ModuleButton
                title="💊 الأدوية والمكملات"
                icon="medical"
                route={`/patient/${patient.id}/medications`}
                color="#3F51B5"
              />
              <ModuleButton
                title="🧮 حسابات الطاقة التفصيلية"
                icon="calculator"
                route={`/patient/${patient.id}/calculations`}
                color="#607D8B"
              />
              <ModuleButton
                title="خطة التدخل التغذوي"
                icon="restaurant"
                route={`/patient/${patient.id}/intervention`}
                color="#795548"
              />
              <ModuleButton
                title="🧪 حاسبة التغذية الأنبوبية والوريدية"
                icon="flask"
                route={`/patient/${patient.id}/nutrition-calculator`}
                color="#00695C"
              />
              <ModuleButton
                title=" تخطيط الوجبات والبدائل الغذائية"
                icon="nutrition"
                route={`/patient/${patient.id}/diet-plan`}
                color="#2E7D32"
              />
            </View>
          </View>

          {/* BOTTOM SECTION: MONITORING, ANALYSIS & DISCHARGE */}
          <View style={styles.bottomSection}>
            <ModuleButton
              title="🔬 التحليل السريري"
              icon="analytics"
              route={`/patient/${patient.id}/clinical-analysis`}
              color="#008080"
              isWide
            />
            <ModuleButton
              title="📉 المتابعة والتقييم"
              icon="pulse"
              route={`/patient/${patient.id}/monitoring`}
              color={colors.primary}
              isWide
            />
            <ModuleButton
              title="🚪 خروج وتلخيص الحالة"
              icon="log-out"
              route={`/patient/${patient.id}/discharge`}
              color="#E67E22"
              isWide
            />
            <ModuleButton
              title="📄 تصدير التقرير السريري الشامل (PDF)"
              icon="print"
              onPress={handlePrintReport}
              color="#3F51B5"
              isWide
            />
            <ModuleButton
              title="🔗 مشاركة ملف الحالة (.adcn)"
              icon="share-social"
              onPress={handleExportCase}
              color="#4CAF50"
              isWide
              fontFamily="ThmanyahSans-Medium"
            />
          </View>
        </View>

        {/* Clinical Analysis */}
        <View
          style={styles.section}
          onLayout={(event) => {
            clinicalAnalysisYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>التحليل السريري</Text>

          {/* Weight Input */}
          <Text style={styles.fieldLabel}>الوزن (كجم)</Text>
          <TextInput
            style={styles.input}
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="decimal-pad"
            placeholder="مثال: 70"
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
          />

          {/* Height Input */}
          <Text style={styles.fieldLabel}>الطول (سم)</Text>
          <TextInput
            style={styles.input}
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="decimal-pad"
            placeholder="مثال: 170"
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
          />

          {/* Activity Level */}
          <Text style={styles.fieldLabel}>مستوى النشاط:</Text>
          <View style={styles.activityRow}>
            {(Object.entries(ACTIVITY_LEVELS) as [ActivityLevel, typeof ACTIVITY_LEVELS[ActivityLevel]][]).map(
              ([key, val]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.activityButton,
                    activityLevel === key && styles.activityButtonActive,
                  ]}
                  onPress={() => setActivityLevel(key)}
                >
                  <Text
                    style={[
                      styles.activityButtonText,
                      activityLevel === key && styles.activityButtonTextActive,
                    ]}
                  >
                    {val.label}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {/* Calculate Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCalculate}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <ActivityIndicator size="small" color={colors.primaryContrast} />
            ) : (
              <>
                <Ionicons name="calculator-outline" size={18} color={colors.primaryContrast} />
                <Text style={styles.primaryButtonText}>حساب القياسات</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Results */}
          {currentMetrics && (
            <View style={styles.metricsContainer}>
              <MetricDisplay label="مؤشر كتلة الجسم (BMI)" value={currentMetrics.bmi.value.toFixed(2)} />
              <MetricDisplay label="التصنيف" value={currentMetrics.bmi.categoryLabel} color={colors.primary} />
              <View style={styles.clinicalNote}>
                <Text style={styles.clinicalNoteText}>{currentMetrics.bmi.clinicalNote}</Text>
              </View>
              <MetricDisplay label="معدل الأيض الأساسي (BMR)" value={`${currentMetrics.bmr.value.toFixed(0)} سعرة`} />
              <MetricDisplay label="إجمالي السعرات (TDEE)" value={`${currentMetrics.tdee.value} سعرة`} />
            </View>
          )}
        </View>

        {/* Nutrition Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>خطة التغذية</Text>

          {currentPlan ? (
            <View style={styles.planContainer}>
              <Text style={styles.planTitle}>
                السعرات المستهدفة: {currentPlan.totalCalories} سعرة/يوم
              </Text>
              {currentPlan.calorieAdjustment !== 0 && (
                <Text style={styles.adjustmentText}>
                  (تعديل: {currentPlan.calorieAdjustment > 0 ? '+' : ''}{currentPlan.calorieAdjustment} سعرة)
                </Text>
              )}

              <View style={styles.macroRow}>
                <MacroBox label="بروتين" grams={currentPlan.macros.proteinGrams} calories={currentPlan.macros.proteinCalories} />
                <MacroBox label="كربوهيدرات" grams={currentPlan.macros.carbsGrams} calories={currentPlan.macros.carbsCalories} />
                <MacroBox label="دهون" grams={currentPlan.macros.fatGrams} calories={currentPlan.macros.fatCalories} />
              </View>

              {currentPlan.recommendations.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>توصيات:</Text>
                  {currentPlan.recommendations.map((r: string, i: number) => (
                    <Text key={i} style={styles.listItem}>• {r}</Text>
                  ))}
                </View>
              )}

              {currentPlan.restrictions.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={[styles.listTitle, { color: colors.danger }]}>محظورات:</Text>
                  {currentPlan.restrictions.map((r: string, i: number) => (
                    <Text key={i} style={[styles.listItem, { color: colors.danger }]}>• {r}</Text>
                  ))}
                </View>
              )}

              {/* Dietitian Notes */}
              <Text style={styles.notesLabel}>ملاحظات أخصائي التغذية:</Text>
              <TextInput
                style={styles.notesInput}
                value={dietitianNotes}
                onChangeText={setDietitianNotes}
                placeholder="أضف ملاحظات..."
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
                multiline
              />
              {currentPlan.id && (
                <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveNotes}>
                  <Text style={styles.secondaryButtonText}>حفظ الملاحظات</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.noDataText}>لم يتم إنشاء خطة تغذية بعد</Text>
          )}

          {/* Generate Plan Button */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.success, marginTop: spacing.md }]}
            onPress={handleGeneratePlan}
            disabled={isGeneratingPlan || !currentMetrics}
          >
            {isGeneratingPlan ? (
              <ActivityIndicator size="small" color={colors.primaryContrast} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color={colors.primaryContrast} />
                <Text style={styles.primaryButtonText}>إنشاء خطة تغذية</Text>
              </>
            )}
          </TouchableOpacity>
        </View>


      </ScrollView>

      {Platform.OS === 'web' && patient && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: A4;
                margin: 20mm 15mm;
              }
              body {
                visibility: hidden !important;
                background-color: #fff !important;
              }
              #print-report-root, #print-report-root * {
                visibility: visible !important;
              }
              #print-report-root {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                display: block !important;
                direction: rtl !important;
                text-align: right !important;
                background-color: #fff !important;
                color: #000 !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              #print-report-root table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin-top: 15px !important;
                margin-bottom: 15px !important;
              }
              #print-report-root th, #print-report-root td {
                padding: 8px 10px !important;
                border: 1.5px solid #000 !important;
                font-size: 12px !important;
                text-align: right !important;
              }
              #print-report-root th {
                background-color: #f2f2f2 !important;
                font-family: 'ThmanyahSans-Bold', sans-serif !important;
                font-weight: bold !important;
              }
              #print-report-root td {
                font-family: 'ThmanyahSans-Regular', sans-serif !important;
              }
              .print-bg-normal {
                background-color: #e8f5e9 !important;
                color: #1b5e20 !important;
                font-weight: bold !important;
                border: 1.5px solid #000 !important;
              }
              .print-bg-danger {
                background-color: #ffebee !important;
                color: #c62828 !important;
                font-weight: bold !important;
                border: 1.5px solid #000 !important;
              }
              .print-header {
                border-bottom: 3px double #000 !important;
                padding-bottom: 10px !important;
                margin-bottom: 20px !important;
                text-align: center !important;
              }
              .print-section {
                margin-bottom: 25px !important;
                page-break-inside: avoid !important;
              }
              .print-section-title {
                font-size: 15px !important;
                font-family: 'ThmanyahSans-Bold', sans-serif !important;
                font-weight: bold !important;
                border-bottom: 1.5px solid #000 !important;
                padding-bottom: 5px !important;
                margin-bottom: 10px !important;
                color: #000 !important;
              }
              .print-grid {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 15px !important;
              }
              .print-info-item {
                font-size: 13px !important;
                margin-bottom: 6px !important;
                line-height: 1.4 !important;
              }
              .print-info-label {
                font-family: 'ThmanyahSans-Bold', sans-serif !important;
                font-weight: bold !important;
                color: #000 !important;
              }
            }
          `}} />

          <div id="print-report-root" style={{ display: 'none' }}>
            {/* Header */}
            <div className="print-header">
              <h2 style={{ fontSize: '16px', margin: '0 0 5px 0', color: '#000', fontWeight: 'bold' }}>نظام إدارة التغذية العلاجية المتكامل - ADCN-Clinical</h2>
              <h3 style={{ fontSize: '14px', margin: '0', color: '#333', fontWeight: 'bold' }}>التقرير السريري التغذوي الشامل للحالة</h3>
            </div>

            {/* Section 1: Demographics */}
            <div className="print-section">
              <div className="print-section-title">👤 البيانات الأساسية للمريض</div>
              <div className="print-grid">
                <div>
                  <p className="print-info-item"><span className="print-info-label">اسم المريض:</span> {patient.fullName}</p>
                  <p className="print-info-item"><span className="print-info-label">رقم الملف:</span> {patient.fileNumber}</p>
                  <p className="print-info-item"><span className="print-info-label">الجنس:</span> {GENDER_LABELS[patient.gender] || patient.gender}</p>
                  <p className="print-info-item"><span className="print-info-label">العمر:</span> {patient.age} سنة</p>
                </div>
                <div>
                  <p className="print-info-item"><span className="print-info-label">القسم الطبي:</span> {DEPARTMENT_LABELS[patient.department] || patient.department}</p>
                  <p className="print-info-item"><span className="print-info-label">رقم السرير:</span> {patient.bedNumber || '-'}</p>
                  <p className="print-info-item"><span className="print-info-label">نوع المريض:</span> {PATIENT_TYPE_LABELS[patient.patientType] || patient.patientType}</p>
                  <p className="print-info-item"><span className="print-info-label">التشخيص الرئيسي:</span> {patient.primaryDiagnosis}</p>
                </div>
              </div>
            </div>

            {/* Section 2: Anthropometrics */}
            <div className="print-section">
              <div className="print-section-title">🧮 التقييم الأنثروبومتري وحساب الاحتياجات</div>
              <div className="print-grid">
                <div>
                  <p className="print-info-item"><span className="print-info-label">الوزن الحالي:</span> {weightKg || '-'} كجم</p>
                  <p className="print-info-item"><span className="print-info-label">الطول الحالي:</span> {heightCm || '-'} سم</p>
                  <p className="print-info-item"><span className="print-info-label">مؤشر كتلة الجسم (BMI):</span> {currentMetrics ? `${currentMetrics.bmi.value.toFixed(2)} (${currentMetrics.bmi.categoryLabel})` : '-'}</p>
                </div>
                <div>
                  <p className="print-info-item"><span className="print-info-label">معدل الأيض الأساسي (BMR):</span> {currentMetrics ? `${currentMetrics.bmr.value.toFixed(0)} سعرة` : '-'}</p>
                  <p className="print-info-item"><span className="print-info-label">إجمالي الاحتياج اليومي للطاقة (TDEE):</span> {currentMetrics ? `${currentMetrics.tdee.value} سعرة` : '-'}</p>
                  <p className="print-info-item"><span className="print-info-label">مستوى النشاط البدني:</span> {ACTIVITY_LEVELS[activityLevel]?.label || activityLevel}</p>
                </div>
              </div>
            </div>

            {/* Section 3: Laboratory Analysis */}
            <div className="print-section">
              <div className="print-section-title">🧪 نتائج الفحوصات المخبرية والمقارنة السريرية</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1.5px solid #000', padding: '8px', backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>اسم الفحص</th>
                    <th style={{ border: '1.5px solid #000', padding: '8px', backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>النتيجة المسجلة</th>
                    <th style={{ border: '1.5px solid #000', padding: '8px', backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>النطاق الطبيعي المرجعي</th>
                    <th style={{ border: '1.5px solid #000', padding: '8px', backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>حجم النقص/الزيادة</th>
                    <th style={{ border: '1.5px solid #000', padding: '8px', backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>تاريخ الفحص</th>
                    <th style={{ border: '1.5px solid #000', padding: '8px', backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>الحالة السريرية</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Albumin */}
                  {(() => {
                    const res = getLatestLabResult('Albumin');
                    const val = res ? res.resultValue : null;
                    const styleClass = val !== null ? getLabResultStyleClass(val, 3.5, 5.0) : '';
                    const status = val !== null ? getLabResultStatusLabel(val, 3.5, 5.0) : 'غير متوفر';
                    return (
                      <tr>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>ألبومين (Albumin)</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{val !== null ? `${val} g/dL` : '-'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>3.5 - 5.0 g/dL</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{val !== null ? (val < 3.5 ? `نقص ${(3.5 - val).toFixed(1)}` : val > 5.0 ? `زيادة ${(val - 5.0).toFixed(1)}` : 'سليم') : '-'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{res ? res.testDate : '-'}</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{status}</td>
                      </tr>
                    );
                  })()}
                  {/* Creatinine */}
                  {(() => {
                    const res = getLatestLabResult('Creatinine');
                    const val = res ? res.resultValue : null;
                    const styleClass = val !== null ? getLabResultStyleClass(val, 0.6, 1.2) : '';
                    const status = val !== null ? getLabResultStatusLabel(val, 0.6, 1.2) : 'غير متوفر';
                    return (
                      <tr>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>كرياتينين (Creatinine)</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{val !== null ? `${val} mg/dL` : '-'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>0.6 - 1.2 mg/dL</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{val !== null ? (val < 0.6 ? `نقص ${(0.6 - val).toFixed(2)}` : val > 1.2 ? `زيادة ${(val - 1.2).toFixed(2)}` : 'سليم') : '-'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{res ? res.testDate : '-'}</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{status}</td>
                      </tr>
                    );
                  })()}
                  {/* Urea */}
                  {(() => {
                    const res = getLatestLabResult('Urea');
                    const val = res ? res.resultValue : null;
                    const styleClass = val !== null ? getLabResultStyleClass(val, 7, 20) : '';
                    const status = val !== null ? getLabResultStatusLabel(val, 7, 20) : 'غير متوفر';
                    return (
                      <tr>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>يوريا (Urea)</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{val !== null ? `${val} mg/dL` : '-'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>7 - 20 mg/dL</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{val !== null ? (val < 7 ? `نقص ${(7 - val).toFixed(1)}` : val > 20 ? `زيادة ${(val - 20).toFixed(1)}` : 'سليم') : '-'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{res ? res.testDate : '-'}</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{status}</td>
                      </tr>
                    );
                  })()}
                  {/* HbA1c */}
                  {(() => {
                    const res = getLatestLabResult('HbA1c');
                    const val = res ? res.resultValue : null;
                    const styleClass = val !== null ? getLabResultStyleClass(val, null, 5.7) : '';
                    const status = val !== null ? getLabResultStatusLabel(val, null, 5.7) : 'غير متوفر';
                    return (
                      <tr>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>السكر التراكمي (HbA1c)</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{val !== null ? `${val}%` : '-'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>&lt; 5.7%</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{val !== null ? (val > 5.7 ? `زيادة ${(val - 5.7).toFixed(1)}` : 'سليم') : '-'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{res ? res.testDate : '-'}</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{status}</td>
                      </tr>
                    );
                  })()}
                  {/* ALT */}
                  {(() => {
                    const res = getLatestLabResult('ALT (SGPT)') || getLatestLabResult('ALT');
                    const val = res ? res.resultValue : null;
                    const styleClass = val !== null ? getLabResultStyleClass(val, 7, 56) : '';
                    const status = val !== null ? getLabResultStatusLabel(val, 7, 56) : 'غير متوفر';
                    return (
                      <tr>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>وظائف الكبد ALT</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{val !== null ? `${val} U/L` : '-'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>7 - 56 U/L</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{val !== null ? (val < 7 ? `نقص ${(7 - val).toFixed(0)}` : val > 56 ? `زيادة ${(val - 56).toFixed(0)}` : 'سليم') : '-'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{res ? res.testDate : '-'}</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{status}</td>
                      </tr>
                    );
                  })()}
                  {/* AST */}
                  {(() => {
                    const res = getLatestLabResult('AST (SGOT)') || getLatestLabResult('AST');
                    const val = res ? res.resultValue : null;
                    const styleClass = val !== null ? getLabResultStyleClass(val, 10, 40) : '';
                    const status = val !== null ? getLabResultStatusLabel(val, 10, 40) : 'غير متوفر';
                    return (
                      <tr>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>وظائف الكبد AST</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{val !== null ? `${val} U/L` : '-'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>10 - 40 U/L</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{val !== null ? (val < 10 ? `نقص ${(10 - val).toFixed(0)}` : val > 40 ? `زيادة ${(val - 40).toFixed(0)}` : 'سليم') : '-'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{res ? res.testDate : '-'}</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{status}</td>
                      </tr>
                    );
                  })()}

                  {/* Other labs */}
                  {labResults.filter(
                    (r) => ![
                      'albumin', 'creatinine', 'urea', 'hba1c', 'alt (sgpt)', 'alt', 'ast (sgot)', 'ast'
                    ].includes(r.testName?.toLowerCase())
                  ).map((r, index) => {
                    const isHigh = r.referenceRangeHigh && r.resultValue > r.referenceRangeHigh;
                    const isLow = r.referenceRangeLow && r.resultValue < r.referenceRangeLow;
                    const styleClass = (isHigh || isLow) ? 'print-bg-danger' : 'print-bg-normal';
                    const status = isHigh ? 'مرتفع ⚠️' : isLow ? 'منخفض ⚠️' : 'طبيعي ✓';
                    return (
                      <tr key={r.id || index}>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{r.testName}</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{r.resultValue} {r.unit}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{r.referenceRangeLow} - {r.referenceRangeHigh} {r.unit}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{isLow ? `نقص ${(r.referenceRangeLow - r.resultValue).toFixed(1)}` : isHigh ? `زيادة ${(r.resultValue - r.referenceRangeHigh).toFixed(1)}` : 'سليم'}</td>
                        <td style={{ border: '1.5px solid #000', padding: '8px' }}>{r.testDate}</td>
                        <td className={styleClass} style={{ border: '1.5px solid #000', padding: '8px' }}>{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Section 4: History */}
            <div className="print-section">
              <div className="print-section-title">🩺 التاريخ المرضي والتاريخ الاجتماعي</div>
              <div className="print-grid">
                <div>
                  <p className="print-info-item"><span className="print-info-label">الشكوى الرئيسية:</span> {medicalHistory?.chiefComplaint || '-'}</p>
                  <p className="print-info-item"><span className="print-info-label">التشخيص الحالي:</span> {medicalHistory?.currentDiagnosis || '-'}</p>
                  <p className="print-info-item"><span className="print-info-label">الأمراض المصاحبة:</span> {(() => {
                    if (!medicalHistory?.comorbidities) return '-';
                    try {
                      const parsed = JSON.parse(medicalHistory.comorbidities);
                      return Array.isArray(parsed) ? parsed.join('، ') : '-';
                    } catch {
                      return '-';
                    }
                  })()}</p>
                  <p className="print-info-item"><span className="print-info-label">الحساسية للدواء/الغذاء:</span> {medicalHistory?.medicationAllergies || 'لا يوجد'}</p>
                </div>
                <div>
                  <p className="print-info-item"><span className="print-info-label">التاريخ الاجتماعي (التدخين):</span> {socialHistory?.smoking === 'yes' ? 'نعم' : socialHistory?.smoking === 'former' ? 'سابق' : 'لا'}</p>
                  <p className="print-info-item"><span className="print-info-label">النشاط البدني الموصوف:</span> {socialHistory?.physicalActivity || '-'}</p>
                  <p className="print-info-item"><span className="print-info-label">النظام المتبع قبل الدخول:</span> {socialHistory?.specialDietBeforeAdmission || '-'}</p>
                </div>
              </div>
            </div>

            {/* Section 5: Meds & Supplements */}
            <div className="print-section">
              <div className="print-section-title">💊 الأدوية الموصوفة والمكملات الغذائية</div>
              <div className="print-grid">
                <div>
                  <p className="print-info-item" style={{ fontWeight: 'bold' }}><span className="print-info-label">الأدوية الحالية:</span></p>
                  {medications.length === 0 ? <p className="print-info-item">لا يوجد أدوية مسجلة</p> : (
                    medications.map((m) => (
                      <p key={m.id} className="print-info-item" style={{ marginRight: '10px' }}>• {m.drugName} ({m.dosage}) - {FREQUENCY_LABELS[m.frequency] || m.frequency}</p>
                    ))
                  )}
                </div>
                <div>
                  <p className="print-info-item" style={{ fontWeight: 'bold' }}><span className="print-info-label">المكملات الغذائية:</span></p>
                  {supplements.length === 0 ? <p className="print-info-item">لا يوجد مكملات مسجلة</p> : (
                    supplements.map((s) => (
                      <p key={s.id} className="print-info-item" style={{ marginRight: '10px' }}>• {s.supplementName} ({s.dosage}) - {SUPPLEMENT_TYPE_LABELS[s.supplementType] || s.supplementType}</p>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Section 6: Intervention */}
            <div className="print-section">
              <div className="print-section-title"> خطة التدخل التغذوي والتوصيات المستهدفة</div>
              <div className="print-grid">
                <div>
                  <p className="print-info-item"><span className="print-info-label">التشخيص التغذوي:</span> {intervention?.nutritionDiagnosis || '-'}</p>
                  <p className="print-info-item"><span className="print-info-label">الهدف الرئيسي:</span> {MAIN_GOAL_OPTIONS.find(g => g.value === intervention?.mainGoal)?.label || intervention?.mainGoal || '-'}</p>
                  <p className="print-info-item"><span className="print-info-label">نوع الحمية المحددة:</span> {DIET_TYPE_OPTIONS.find(d => d.value === intervention?.dietType)?.label || intervention?.dietType || '-'}</p>
                  <p className="print-info-item"><span className="print-info-label">قوام الطعام:</span> {FOOD_TEXTURE_OPTIONS.find(t => t.value === intervention?.foodTexture)?.label || intervention?.foodTexture || '-'}</p>
                  <p className="print-info-item"><span className="print-info-label">طريقة التغذية:</span> {ROUTE_OF_FEEDING_OPTIONS.find(r => r.value === intervention?.routeOfFeeding)?.label || intervention?.routeOfFeeding || '-'}</p>
                </div>
                <div>
                  <p className="print-info-item"><span className="print-info-label">السعرات الحرارية المستهدفة:</span> {intervention?.targetCalories ? `${intervention.targetCalories} سعرة` : (currentPlan ? `${currentPlan.totalCalories} سعرة` : '-')}</p>
                  <p className="print-info-item"><span className="print-info-label">البروتين المستهدف:</span> {intervention?.targetProtein ? `${intervention.targetProtein} غرام` : (currentPlan ? `${currentPlan.macros.proteinGrams} غرام` : '-')}</p>
                  <p className="print-info-item"><span className="print-info-label">الكربوهيدرات المستهدفة:</span> {intervention?.targetCarbohydrates ? `${intervention.targetCarbohydrates} غرام` : (currentPlan ? `${currentPlan.macros.carbsGrams} غرام` : '-')}</p>
                  <p className="print-info-item"><span className="print-info-label">الدهون المستهدفة:</span> {intervention?.targetFat ? `${intervention.targetFat} غرام` : (currentPlan ? `${currentPlan.macros.fatGrams} غرام` : '-')}</p>
                  <p className="print-info-item"><span className="print-info-label">الاحتياج اليومي للسوائل:</span> {intervention?.fluidAllowance ? `${intervention.fluidAllowance} مل` : '-'}</p>
                </div>
              </div>
              {intervention?.dietRecommendations && (
                <p className="print-info-item" style={{ marginTop: '10px' }}><span className="print-info-label">توصيات حمية مخصصة:</span> {intervention.dietRecommendations}</p>
              )}
              {currentPlan?.dietitianNotes && (
                <p className="print-info-item" style={{ marginTop: '5px' }}><span className="print-info-label">ملاحظات أخصائي التغذية العلاجية:</span> {currentPlan.dietitianNotes}</p>
              )}
            </div>

            {/* Signatures */}
            <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', borderTop: '1.5px solid #000', paddingTop: '15px' }}>
              <div>
                <p style={{ fontSize: '12px', margin: '0 0 5px 0' }}><span className="print-info-label">توقيع أخصائي التغذية العلاجية:</span> ______________________</p>
                <p style={{ fontSize: '11px', margin: '0', color: '#333' }}>حرر في تاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '12px', margin: '0', fontWeight: 'bold' }}><span className="print-info-label">ختم القسم السريري والتثقيف التغذوي</span></p>
              </div>
            </div>
          </div>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

function ModuleButton({
  title,
  icon,
  route,
  onPress,
  color,
  isWide = false,
  fontFamily,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  onPress?: () => void;
  color: string;
  isWide?: boolean;
  fontFamily?: string;
}) {
  const router = useRouter();
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (route) {
      router.push(route as any);
    }
  };

  return (
    <TouchableOpacity
      style={[
        isWide ? styles.moduleButtonWide : styles.moduleButton,
        { borderColor: color + '22' }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.moduleIconContainer, { backgroundColor: color + '12' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.moduleButtonText, fontFamily ? { fontFamily } : undefined]}>{title}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MetricDisplay({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

function MacroBox({ label, grams, calories }: { label: string; grams: number; calories: number }) {
  return (
    <View style={styles.macroBox}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroGrams}>{grams} غم</Text>
      <Text style={styles.macroCalories}>{calories} سعرة</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  backButton: {
    padding: spacing.md,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  backBtn: {
    position: 'absolute',
    top: 54,
    start: spacing.md,
    zIndex: 1,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.primaryContrast,
    textAlign: 'right',
    marginTop: spacing.lg,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Regular',
    color: colors.primaryContrast,
    opacity: 0.8,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSecondary,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: 'ThmanyahSans-Medium',
    textAlign: 'right',
  },
  metricsContainer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.textPrimary,
  },
  clinicalNote: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.xs,
  },
  clinicalNoteText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textDisabled,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  activityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  activityButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  activityButtonTextActive: {
    color: colors.primaryContrast,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    gap: spacing.sm,
  },
  primaryButtonText: {
    color: colors.primaryContrast,
    fontSize: 15,
    fontFamily: 'ThmanyahSans-Medium',
  },
  planContainer: {
    gap: spacing.sm,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.success,
    textAlign: 'right',
  },
  adjustmentText: {
    fontSize: 13,
    color: colors.warning,
    textAlign: 'right',
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  macroBox: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  macroGrams: {
    fontSize: 16,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.textPrimary,
  },
  macroCalories: {
    fontSize: 11,
    color: colors.textDisabled,
    marginTop: 2,
  },
  listSection: {
    marginTop: spacing.xs,
  },
  listTitle: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  listItem: {
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 22,
    paddingEnd: spacing.sm,
  },
  notesLabel: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.textPrimary,
    textAlign: 'right',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSecondary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 10,
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Medium',
  },
  twoColumnContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  column: {
    flex: 1,
    gap: spacing.sm,
  },
  bottomSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  moduleButtonWide: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.sm,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.md,
    minHeight: 52,
  },
  moduleButton: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 85,
  },
  moduleIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleButtonText: {
    fontSize: 13,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
