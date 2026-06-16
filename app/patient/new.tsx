import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import TripleActionFooter from '../../src/presentation/components/TripleActionFooter';
import { Ionicons } from '@expo/vector-icons';
import FormField from '../../src/presentation/components/FormField';
import PickerField from '../../src/presentation/components/PickerField';
import DatePickerField from '../../src/presentation/components/DatePickerField';
import { usePatientStore } from '../../src/presentation/stores/patientStore';
import { CreatePatientInput } from '../../src/domain/entities/Patient';
import { ValidationError } from '../../src/domain/use-cases/AddPatientUseCase';
import {
  GENDER_OPTIONS,
  PATIENT_TYPE_OPTIONS,
} from '../../src/core/constants/dropdownValues';

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
  const { addPatient } = usePatientStore();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSaving, setIsSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<ValidationError[]>([]);
  const [customFields, setCustomFields] = useState<{ id: number; value: string }[]>([{ id: 1, value: '' }]);

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

    if (!isFormValid || !dateOfBirth) return undefined;

    setIsSaving(true);

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
      incompleteSections: ['medical-history', 'social-history', 'physical-exam', 'laboratory', 'medications', 'calculations', 'intervention']
    };

    const result = await addPatient(input);
    setIsSaving(false);

    if (result.success && result.patient) {
      const newPatientId = result.patient.id;
      setForm(INITIAL_STATE);
      setDateOfBirth(null);
      setTouched({});
      setCustomFields([{ id: 1, value: '' }]);
      return newPatientId;
    } else if (result.errors) {
      setServerErrors(result.errors);
    }
    return undefined;
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
          <PickerField
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
      <View style={styles.container}>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات المريض</Text>

          {renderField('fullName', 'الاسم الكامل', {
            placeholder: 'أدخل اسم المريض',
            required: true,
          })}

          {Platform.OS === 'web' ? (
            <View style={styles.webDatePickerContainer}>
              <Text style={styles.webDatePickerLabel}>
                تاريخ الميلاد <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleBirthDateChange(new Date(e.target.value + 'T00:00:00'));
                  }
                }}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: colors.border,
                  padding: '10px 14px',
                  backgroundColor: colors.surface,
                  color: dateOfBirth ? colors.textPrimary : colors.textDisabled,
                  fontSize: 16,
                  fontFamily: 'inherit',
                  textAlign: 'right',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات القبول</Text>

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
                    style={styles.customTextInput}
                    placeholder="يرجى تحديد القسم/التشخيص المخصص..."
                    placeholderTextColor={colors.textDisabled}
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

          {renderField('primaryDiagnosis', 'التشخيص الرئيسي', {
            placeholder: 'أدخل التشخيص الرئيسي',
            required: true,
          })}

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
});
