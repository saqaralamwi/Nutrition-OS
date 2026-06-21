import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, TextInput, KeyboardAvoidingView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import TripleActionFooter from '../../src/presentation/components/TripleActionFooter';
import { Ionicons } from '@expo/vector-icons';
import FormField from '../../src/presentation/components/FormField';
import DropdownField from '../../src/presentation/components/DropdownField';
import DatePickerField from '../../src/presentation/components/DatePickerField';
import { PatientRepository } from '../../src/data/repositories/PatientRepository';
import { CreatePatientInput } from '../../src/domain/entities/Patient';
import { useToastStore } from '../../src/presentation/stores/toastStore';
import { getBmiCategory, getBmiColor } from '../../src/domain/utils/bmiClassification';
import { useAppTheme } from '../../src/presentation/hooks/useAppTheme';
import {
  GENDER_OPTIONS,
  PATIENT_TYPE_OPTIONS,
} from '../../src/core/constants/dropdownValues';

const DISEASE_CATEGORIES = [
  { label: 'أمراض القلب والأوعية الدموية (Cardiovascular)', value: 'cardio' },
  { label: 'الغدد الصماء والسكري (Endocrinology & Diabetes)', value: 'endocrine' },
  { label: 'الجهاز الهضمي والكبد (Gastrointestinal & Hepatic)', value: 'gastro' },
  { label: 'أمراض الكلى (Renal Diseases)', value: 'renal' },
  { label: 'العناية المركزة والجراحة (Critical Care & Surgery)', value: 'critical' },
  { label: 'الأورام وأمراض الدم (Oncology & Hematology)', value: 'oncology' },
  { label: 'الجهاز التنفسي (Pulmonology)', value: 'respiratory' },
  { label: 'أمراض أخرى (Other Diseases)', value: 'other' },
];

const SUB_DISEASES: Record<string, { label: string; value: string }[]> = {
  cardio: [
    { label: 'فشل القلب (Heart Failure)', value: 'Heart Failure' },
    { label: 'ارتفاع ضغط الدم (Hypertension)', value: 'Hypertension' },
    { label: 'مرض الشريان التاجي (Coronary Artery Disease)', value: 'Coronary Artery Disease' },
    { label: 'احتشاء عضلة القلب (Myocardial Infarction)', value: 'Myocardial Infarction' },
  ],
  endocrine: [
    { label: 'سكري النوع الأول (Type 1 Diabetes)', value: 'Type 1 Diabetes' },
    { label: 'سكري النوع الثاني (Type 2 Diabetes)', value: 'Type 2 Diabetes' },
    { label: 'الحماض الكيتوني السكري (Diabetic Ketoacidosis)', value: 'Diabetic Ketoacidosis' },
    { label: 'سكري الحمل (Gestational Diabetes)', value: 'Gestational Diabetes' },
    { label: 'السمنة (Obesity)', value: 'Obesity' },
  ],
  gastro: [
    { label: 'تليف الكبد (Liver Cirrhosis)', value: 'Liver Cirrhosis' },
    { label: 'داء كرون (Crohn\'s Disease)', value: 'Crohn\'s Disease' },
    { label: 'التهاب القولون التقرحي (Ulcerative Colitis)', value: 'Ulcerative Colitis' },
    { label: 'التهاب البنكرياس الحاد (Acute Pancreatitis)', value: 'Acute Pancreatitis' },
    { label: 'متلازمة الأمعاء القصيرة (Short Bowel Syndrome)', value: 'Short Bowel Syndrome' },
  ],
  renal: [
    { label: 'الفشل الكلوي الحاد (Acute Kidney Injury - AKI)', value: 'Acute Kidney Injury - AKI' },
    { label: 'الفشل الكلوي المزمن (Chronic Kidney Disease - CKD)', value: 'Chronic Kidney Disease - CKD' },
    { label: 'الفشل الكلوي النهائي (End-Stage Renal Disease - ESRD)', value: 'End-Stage Renal Disease - ESRD' },
    { label: 'المتلازمة الكلوية (Nephrotic Syndrome)', value: 'Nephrotic Syndrome' },
  ],
  critical: [
    { label: 'الحروق البالغة (Major Burns)', value: 'Major Burns' },
    { label: 'الإصابات المتعددة (Polytrauma)', value: 'Polytrauma' },
    { label: 'تسمم الدم / الصدمة الإنتانية (Sepsis / Septic Shock)', value: 'Sepsis / Septic Shock' },
    { label: 'جراحة كبرى بعد العملية (Post-op Major Surgery)', value: 'Post-op Major Surgery' },
  ],
  oncology: [
    { label: 'سرطان الجهاز الهضمي (Gastrointestinal Cancer)', value: 'Gastrointestinal Cancer' },
    { label: 'أورام الدم (Hematological Malignancy)', value: 'Hematological Malignancy' },
    { label: 'فقر الدم الشديد (Severe Anemia)', value: 'Severe Anemia' },
  ],
  respiratory: [
    { label: 'الانسداد الرئوي المزمن (COPD)', value: 'COPD' },
    { label: 'متلازمة الضائقة التنفسية الحادة (ARDS)', value: 'ARDS' },
    { label: 'الالتهاب الرئوي الشديد (Severe Pneumonia)', value: 'Severe Pneumonia' },
  ],
  other: [
    { label: 'سوء التغذية الحاد الوخيم (Severe Acute Malnutrition - SAM)', value: 'Severe Acute Malnutrition - SAM' },
    { label: 'سوء التغذية الحاد المتوسط (Moderate Acute Malnutrition - MAM)', value: 'Moderate Acute Malnutrition - MAM' },
    { label: 'تشخيص مخصص (Custom / Other)', value: 'custom' },
  ],
};

const hospitalDepartments = [
  // الأجنحة الباطنية التخصصية (Specialized Internal Medicine Wards)
  { label: "قسم الباطنية العامة (General Internal Medicine)", value: "internal_medicine_general" },
  { label: "قسم أمراض الجهاز الهضمي والكبد (Gastroenterology & Hepatology)", value: "gastroenterology" },
  { label: "قسم أمراض الكلى ووحدة الغسيل الكلوي (Nephrology & Dialysis)", value: "nephrology" },
  { label: "قسم الغدد الصماء والسكري (Endocrinology & Diabetes)", value: "diabetes_endo" },
  { label: "قسم الأورام وأمراض الدم (Oncology & Hematology)", value: "oncology" },
  { label: "قسم الأمراض الصدرية والجهاز التنفسي (Pulmonology)", value: "pulmonology" },
  { label: "قسم أمراض المخ والأعصاب (Neurology)", value: "neurology" },

  // الأجنحة الجراحية (Surgical Wards)
  { label: "قسم الجراحة العامة (General Surgery)", value: "surgery_general" },
  { label: "قسم جراحة العظام والمفاصل (Orthopedic Surgery)", value: "orthopedics" },
  { label: "قسم جراحة المخ والأعصاب (Neurosurgery)", value: "neurosurgery" },
  { label: "قسم جراحة القلب والصدر (Cardiothoracic Surgery)", value: "cardiothoracic_surgery" },
  { label: "قسم جراحة الأوعية الدموية (Vascular Surgery)", value: "vascular_surgery" },
  { label: "قسم جراحة المسالك البولية (Urology)", value: "urology" },
  { label: "قسم الحروق وجراحة التجميل (Burns & Plastic Surgery)", value: "burns_plastic" },

  // وحدات العناية المركزة الحرجة (Critical Care Units - ICUs)
  { label: "وحدة العناية المركزة العامة (General ICU)", value: "icu_general" },
  { label: "وحدة عناية أمراض القلب (CCU)", value: "ccu" },
  { label: "وحدة عناية جراحة القلب (Post-Cardiac Surgery ICU)", value: "cardiac_icu" },
  { label: "وحدة العناية المركزة للأطفال (PICU)", value: "picu" },
  { label: "وحدة عناية الخدج وحديثي الولادة (NICU)", value: "nicu" },

  // أجنحة الأطفال والنساء (Pediatrics & OB/GYN)
  { label: "قسم طب الأطفال العام (General Pediatrics)", value: "pediatrics_general" },
  { label: "قسم أمراض وجراحة النساء والتوليد (Obstetrics & Gynecology)", value: "obgyn" },

  // العيادات والمراكز الخارجية (Outpatient & Specialized Centers)
  { label: "العيادة الخارجية لاستشارات التغذية (Outpatient Nutrition Clinic)", value: "outpatient_nutrition" },
  { label: "مركز معالجة سوء التغذية الحاد الوخيم (SAM/MAM Clinic)", value: "malnutrition_center" },
  { label: "أخرى (Other)", value: "other" }
];
import { colors, spacing, fontFamilies } from '../../src/presentation/theme';

interface FormState {
  fullName: string;
  age: string;
  gender: string;
  weight: string;
  height: string;
  phoneNumber: string;
  department: string;
  primaryDiagnosis: string;
  patientType: string;
  notes: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

const INITIAL_STATE: FormState = {
  fullName: '',
  age: '',
  gender: '',
  weight: '',
  height: '',
  phoneNumber: '',
  department: '',
  primaryDiagnosis: '',
  patientType: '',
  notes: '',
};

function calculateAge(birthDate: Date): number {
  const today = new Date('2026-06-12');
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function validateField(field: keyof FormState, value: string): string | null {
  switch (field) {
    case 'fullName':
      if (!value || value.trim().length < 3) return 'الاسم يجب أن يكون 3 أحرف على الأقل';
      if (value.length > 100) return 'الاسم يجب أن لا يتجاوز 100 حرف';
      return null;

    case 'age': {
      const age = parseInt(value, 10);
      if (!value || isNaN(age)) return 'العمر مطلوب (اختر تاريخ الميلاد أولاً)';
      if (age < 0 || age > 120) return 'العمر يجب أن يكون بين 0 و 120';
      return null;
    }

    case 'weight': {
      const w = parseFloat(value);
      if (!value || isNaN(w) || w <= 0) return 'الوزن يجب أن يكون أكبر من صفر';
      if (w > 500) return 'الوزن غير منطقي (أكبر من 500 كجم)';
      return null;
    }

    case 'height': {
      const h = parseFloat(value);
      if (!value || isNaN(h) || h <= 0) return 'الطول يجب أن يكون أكبر من صفر';
      if (h > 250) return 'الطول غير منطقي (أكبر من 250 سم)';
      return null;
    }

    case 'gender':
      if (!value) return 'يرجى اختيار الجنس';
      return null;

    case 'department':
      if (!value) return 'يرجى اختيار القسم';
      return null;

    case 'primaryDiagnosis':
      if (!value || value.trim().length === 0) return 'التشخيص الرئيسي مطلوب';
      return null;

    case 'patientType':
      if (!value) return 'يرجى اختيار نوع المريض';
      return null;

    default:
      return null;
  }
}

export default function AddPatientScreen() {
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  const { theme } = useAppTheme();
  const [repository] = useState(() => new PatientRepository());
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSaving, setIsSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<{ field: string; message: string }[]>([]);
  const [customFields, setCustomFields] = useState<{ id: number; value: string }[]>([{ id: 1, value: '' }]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubDisease, setSelectedSubDisease] = useState('');
  const [customDiagnosis, setCustomDiagnosis] = useState('');

  const errors = useMemo(() => {
    const result: Record<string, string | undefined> = {};
    (Object.keys(form) as (keyof FormState)[]).forEach((field) => {
      if (touched[field]) {
        const err = validateField(field, form[field]);
        if (err) result[field] = err;
      }
    });
    if (serverErrors.length > 0) {
      serverErrors.forEach((se) => {
        result[se.field] = se.message;
      });
    }
    return result;
  }, [form, touched, serverErrors]);

  const isFormValid = useMemo(() => {
    const requiredFields: (keyof FormState)[] = [
      'fullName', 'age', 'gender', 'department', 'primaryDiagnosis', 'patientType',
      'weight', 'height',
    ];
    for (const field of requiredFields) {
      const err = validateField(field, form[field]);
      if (err) return false;
    }
    if (form.department === 'other') {
      const hasValue = customFields.some(f => f.value.trim().length > 0);
      if (!hasValue) return false;
    }
    return dateOfBirth !== null;
  }, [form, dateOfBirth, customFields]);

  interface BmiDisplay {
    value: number;
    category: string;
    color: string;
  }

  const bmiResult = useMemo<BmiDisplay | null>(() => {
    const w = parseFloat(form.weight);
    const h = parseFloat(form.height);
    if (!form.weight || !form.height || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return null;
    const heightM = h / 100;
    const bmi = Math.round((w / (heightM * heightM)) * 100) / 100;
    return { value: bmi, category: getBmiCategory(bmi), color: getBmiColor(bmi) };
  }, [form.weight, form.height]);

  const bmiOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(bmiOpacity, {
      toValue: bmiResult ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [bmiResult, bmiOpacity]);

  const updateField = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setServerErrors([]);
    },
    []
  );

  const handleBlur = useCallback((field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleBirthDateChange = useCallback((date: Date) => {
    setDateOfBirth(date);
    const calculatedAge = calculateAge(date);
    setForm((prev) => ({
      ...prev,
      age: String(calculatedAge),
    }));
    setServerErrors([]);
  }, []);

  const handleSave = async (status: 'complete' | 'incomplete'): Promise<string | undefined> => {
    const allTouched: TouchedFields = {};
    (Object.keys(form) as (keyof FormState)[]).forEach((f) => {
      allTouched[f] = true;
    });
    setTouched(allTouched);
    setServerErrors([]);

    if (!isFormValid || !dateOfBirth) {
      const weightErr = validateField('weight', form.weight);
      const heightErr = validateField('height', form.height);
      if (weightErr) showToast(weightErr, 'error');
      else if (heightErr) showToast(heightErr, 'error');
      else showToast('يرجى إكمال جميع الحقول المطلوبة', 'error');
      return undefined;
    }

    setIsSaving(true);

    const weightKg = parseFloat(form.weight);
    const heightCm = parseFloat(form.height);

    const input: CreatePatientInput = {
      fullName: form.fullName.trim(),
      age: parseInt(form.age, 10),
      dateOfBirth: dateOfBirth.toISOString().split('T')[0],
      gender: form.gender as 'male' | 'female',
      nationalId: null,
      phoneNumber: form.phoneNumber || null,
      department: form.department === 'other'
        ? (customFields.map(f => f.value.trim()).filter(Boolean).join(', ') || 'other')
        : form.department,
      primaryDiagnosis: form.primaryDiagnosis.trim(),
      patientType: form.patientType as 'inpatient' | 'outpatient' | 'consultation',
      notes: form.notes || null,
      status: status,
      incompleteSections: ['medical-history', 'social-history', 'physical-exam', 'laboratory', 'medications', 'calculations', 'intervention'],
      weightKg: !isNaN(weightKg) && weightKg > 0 ? weightKg : undefined,
      heightCm: !isNaN(heightCm) && heightCm > 0 ? heightCm : undefined,
    };

    try {
      const patient = await repository.create(input);
      setIsSaving(false);
      const newPatientId = patient.id;
      setForm(INITIAL_STATE);
      setDateOfBirth(null);
      setTouched({});
      setCustomFields([{ id: 1, value: '' }]);
      setSelectedCategory('');
      setSelectedSubDisease('');
      setCustomDiagnosis('');
      return newPatientId;
    } catch (err: any) {
      setIsSaving(false);
      const msg = err?.message || 'حدث خطأ في حفظ المريض';
      setServerErrors([{ field: 'general', message: msg }]);
      return undefined;
    }
  };

  const renderField = (
    field: keyof FormState,
    label: string,
    options?: {
      placeholder?: string;
      keyboardType?: 'default' | 'numeric' | 'phone-pad';
      multiline?: boolean;
      required?: boolean;
      type?: 'text' | 'picker';
      pickerOptions?: readonly { label: string; value: string }[];
      editable?: boolean;
    }
  ) => {
    if (options?.type === 'picker' && options.pickerOptions) {
      return (
        <View onStartShouldSetResponder={() => true}>
          <DropdownField
            label={label}
            options={options.pickerOptions}
            selectedValue={form[field]}
            onValueChange={(v) => {
              updateField(field, v);
              handleBlur(field);
            }}
            error={errors[field]}
            required={options.required}
            placeholder={`اختر ${label}`}
          />
        </View>
      );
    }

    return (
      <FormField
        label={label}
        value={form[field]}
        onChangeText={(v) => updateField(field, v)}
        onBlur={() => handleBlur(field)}
        placeholder={options?.placeholder}
        error={errors[field]}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline || false}
        required={options?.required || false}
        editable={options?.editable !== false}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {serverErrors.length > 0 && (
            <View style={styles.alertContainer}>
              <Ionicons name="warning-outline" size={24} color={colors.danger} />
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertTitle}>خطأ في حفظ البيانات</Text>
                {serverErrors.map((se, idx) => (
                  <Text key={idx} style={styles.alertMessage}>
                    {se.message}
                  </Text>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>معلومات المريض</Text>

          {renderField('fullName', 'الاسم الكامل', {
            placeholder: 'أدخل اسم المريض',
            required: true,
          })}

          {Platform.OS === 'web' ? (
            <View style={styles.webDatePickerContainer}>
              <Text style={[styles.webDatePickerLabel, { color: theme.subtext }]}>
                تاريخ الميلاد <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                {...(Platform.OS === 'web' ? { type: 'date' } : {})}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: theme.background,
                  color: dateOfBirth ? theme.text : theme.subtext,
                  fontSize: 16,
                  textAlign: 'right',
                }}
                value={dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : ''}
                onChangeText={(text) => {
                  if (text) {
                    handleBirthDateChange(new Date(text + 'T00:00:00'));
                  }
                }}
                {...(Platform.OS === 'web' ? {
                  max: new Date().toISOString().split('T')[0]
                } : {})}
              />
            </View>
          ) : (
            <DatePickerField
              label="تاريخ الميلاد"
              value={dateOfBirth}
              onChange={handleBirthDateChange}
              maximumDate={new Date()}
              required
            />
          )}

          {renderField('age', 'العمر (محسوب تلقائياً)', {
            placeholder: 'سنوات',
            keyboardType: 'numeric',
            required: true,
            editable: false,
          })}

          {renderField('gender', 'الجنس', {
            type: 'picker',
            pickerOptions: GENDER_OPTIONS,
            required: true,
          })}

          {renderField('phoneNumber', 'رقم الهاتف', {
            placeholder: 'مثال: 05xxxxxxxx',
            keyboardType: 'phone-pad',
          })}

          {renderField('weight', 'الوزن (كجم)', {
            placeholder: 'مثال: 70',
            keyboardType: 'numeric',
            required: true,
          })}

          {renderField('height', 'الطول (سم)', {
            placeholder: 'مثال: 170',
            keyboardType: 'numeric',
            required: true,
          })}

          {bmiResult && (
            <Animated.View style={[styles.bmiBadge, { opacity: bmiOpacity, backgroundColor: theme.background, borderColor: bmiResult.color }]}>
              <View style={styles.bmiBadgeHeader}>
                <Ionicons name="fitness-outline" size={18} color={bmiResult.color} />
                <Text style={[styles.bmiBadgeTitle, { color: theme.subtext }]}>مؤشر كتلة الجسم (BMI)</Text>
              </View>
              <View style={styles.bmiBadgeBody}>
                <Text style={[styles.bmiNumber, { color: bmiResult.color }]}>
                  {bmiResult.value.toFixed(1)}
                </Text>
                <View style={[styles.bmiPill, { backgroundColor: bmiResult.color + '20' }]}>
                  <Text style={[styles.bmiPillText, { color: bmiResult.color }]}>
                    {bmiResult.category}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>معلومات القبول</Text>

          {renderField('department', 'القسم', {
            type: 'picker',
            pickerOptions: hospitalDepartments,
            required: true,
          })}

          {form.department === 'other' && (
            <View style={styles.customFieldsContainer}>
              {customFields.map((field) => (
                <View key={field.id} style={styles.customFieldRow}>
                  <TextInput
                    style={[styles.customTextInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    placeholder="يرجى تحديد القسم/التشخيص المخصص..."
                    placeholderTextColor={theme.subtext}
                    value={field.value}
                    onChangeText={(text) => {
                      setCustomFields(prev => prev.map(f => f.id === field.id ? { ...f, value: text } : f));
                    }}
                  />
                  {customFields.length > 1 && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        setCustomFields(prev => prev.filter(f => f.id !== field.id));
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={styles.addFieldButton}
                onPress={() => {
                  setCustomFields(prev => [...prev, { id: Date.now(), value: '' }]);
                }}
              >
                <Text style={styles.addFieldButtonText}>
                  ➕ إضافة حقل مخصّص آخر
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <DropdownField
            label="فئة التشخيص الرئيسي"
            options={DISEASE_CATEGORIES}
            selectedValue={selectedCategory}
            onValueChange={(val) => {
              setSelectedCategory(val);
              setSelectedSubDisease('');
              updateField('primaryDiagnosis', '');
            }}
            required
            placeholder="اختر فئة المرض..."
          />

          {selectedCategory !== '' && (
            <DropdownField
              label="التشخيص الفرعي"
              options={SUB_DISEASES[selectedCategory] || []}
              selectedValue={selectedSubDisease}
              onValueChange={(val) => {
                setSelectedSubDisease(val);
                if (val !== 'custom') {
                  const label = (SUB_DISEASES[selectedCategory] || []).find(o => o.value === val)?.label || val;
                  updateField('primaryDiagnosis', label);
                } else {
                  updateField('primaryDiagnosis', customDiagnosis);
                }
              }}
              error={errors.primaryDiagnosis}
              required
              placeholder="اختر التشخيص الفرعي..."
            />
          )}

          {selectedSubDisease === 'custom' && (
            <FormField
              label="التشخيص الرئيسي المخصص"
              value={customDiagnosis}
              onChangeText={(text) => {
                setCustomDiagnosis(text);
                updateField('primaryDiagnosis', text);
              }}
              onBlur={() => handleBlur('primaryDiagnosis')}
              placeholder="أدخل التشخيص المخصص..."
              error={errors.primaryDiagnosis}
              required
            />
          )}

          {renderField('patientType', 'نوع المريض', {
            type: 'picker',
            pickerOptions: PATIENT_TYPE_OPTIONS,
            required: true,
          })}

          {renderField('notes', 'ملاحظات', {
            placeholder: 'أي ملاحظات إضافية...',
            multiline: true,
          })}
        </View>
      </ScrollView>

      <TripleActionFooter
        screenKey="new"
        onSave={handleSave}
        isSaving={isSaving}
        isValid={isFormValid}
      />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryContrast,
  },
  customFieldsContainer: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  customFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm + 2,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    textAlign: 'right',
    minHeight: 48,
    fontFamily: fontFamilies?.regular || 'System',
  },
  deleteButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  addFieldButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fontFamilies?.medium || 'System',
  },
  webDatePickerContainer: {
    marginBottom: spacing.md,
  },
  webDatePickerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  alertContainer: {
    backgroundColor: '#FDE8E8',
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },
  alertTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9B1C1C',
    fontFamily: fontFamilies?.medium || 'System',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#9B1C1C',
    fontFamily: fontFamilies?.regular || 'System',
    textAlign: 'right',
  },
  bmiBadge: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: colors.surfaceCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bmiBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bmiBadgeTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fontFamilies?.medium || 'System',
  },
  bmiBadgeBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bmiNumber: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: fontFamilies?.bold || 'System',
    letterSpacing: 0.5,
  },
  bmiPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: 20,
  },
  bmiPillText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fontFamilies?.medium || 'System',
  },
});
