import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, safeHeaderPaddingTop, fontFamilies } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import TextInputField from '../../../src/presentation/components/TextInputField';
import DropdownField from '../../../src/presentation/components/DropdownField';
import RadioGroup from '../../../src/presentation/components/RadioGroup';
import TripleActionFooter from '../../../src/presentation/components/TripleActionFooter';

/**
 * YEMEN ADMINISTRATIVE MATRIX
 * 22 Governorates with Districts and specialized Uzlah for Ibb.
 */
const YEMEN_DATA = {
  "governorates": [
    {
      "id": 1,
      "name": "إب",
      "districts": [
        "إب", "الرضمة", "السبرة", "السدة", "السياني", "الشعر",
        "الظهار", "العدين", "القفر", "المخادر", "المشنة", "النادرة",
        "بعدان", "جبلة", "حبيش", "حزم العدين", "ذي السفال", "فرع العدين",
        "مذيخرة", "يريم"
      ],
      "uzlahs": {
        "إب": ["عزلة ميتم", "عزلة شعب يافع", "عزلة جبل معود", "عزلة ثواب أعلى", "عزلة ثواب أسفل", "عزلة بني محرم", "عزلة بني مدسم", "عزلة بلادشار", "عزلة الحوج القبلي", "عزلة الحوج العدني", "عزلة المقاطن", "عزلة الروس", "عزلة البحريين", "عزلة الموية"],
        "العدين": ["عزلة السارة", "عزلة بني زهير", "عزلة بلاد المليكي", "عزلة شلف", "عزلة الرضائي", "عزلة الغضيبة", "عزلة قصع حليان", "عزلة بني هات", "عزلة عردن", "عزلة غابر", "عزلة قداس", "عزلة قصل", "عزلة خباز", "عزلة الجبلين", "عزلة العمارنة", "عزلة بني عبد الله", "عزلة بني عمران"],
        "فرع العدين": ["عزلة الأخماس", "عزلة العاقبة", "عزلة بني أحمد", "عزلة المزاحن", "عزلة الوزيرة"],
        "حزم العدين": ["عزلة بني عوض", "عزلة يريس", "عزلة المعيظة", "عزلة الأبعون", "عزلة بني وائل"],
        "بعدان": ["عزلة دلال", "عزلة حيسان", "عزلة ريمان", "عزلة بني عواض", "عزلة المنار", "عزلة الدعيس", "عزلة حرد", "عزلة سير", "عزلة ضابي", "عزلة شرف حاتم"],
        "جبلة": ["عزلة جبلة", "عزلة وائل", "عزلة الثوابي", "عزلة المكتب", "عزلة انامر اعلى", "عزلة المعشار", "عزلة الوقش"],
        "حبيش": ["عزلة شباع", "عزلة السلق", "عزلة جبل خضراء", "عزلة بني شبيب", "عزلة الناحية", "عزلة الفراعي"],
        "ذي السفال": ["عزلة ذي السفال", "عزلة خنوة", "عزلة السيف", "عزلة رعاش", "عزلة ريده ورياد", "عزلة شوائط"],
        "السياني": ["عزلة الدامغ", "عزلة النقيلين", "عزلة الأزارق", "عزلة الهادس", "عزلة عميد الداخل", "عزلة عميد الخارج"],
        "السبرة": ["عزلة نجد الجماعي", "عزلة مطاية", "عزلة عروان", "عزلة عينان", "عزلة بلادالجماعي"],
        "الشعر": ["عزلة العبس", "عزلة مقنع", "عزلة الأملؤك", "عزلة قطن"],
        "النادرة": ["عزلة شعب المريسي", "عزلة شخب", "عزلة مقنع الأعلى", "عزلة الفجرة", "عزلة العود"],
        "السدة": ["عزلة وادي عصام", "عزلة الزعلاء", "عزلة التويتي", "عزلة الاعماس", "عزلة جبل حجاج"],
        "يريم": ["عزلة بني مسلم", "عزلة عراس", "عزلة خبان", "عزلة ارياب", "عزلة رعين"],
        "الرضمة": ["عزلة كحلان", "عزلة يحصب", "عزلة البكرة", "عزلة أزال", "عزلة بني قيس"],
        "المخادر": ["عزلة السحول", "عزلة بضعة", "عزلة الشرف", "عزلة جبل عقد", "عزلة الوادي"],
        "القفر": ["عزلة بني سيف السافل", "عزلة بني سيف العالي", "عزلة بني مبارز", "عزلة الكرابة", "عزلة بني جماعة"],
        "مذيخرة": ["عزلة مذيخرة", "عزلة خولان", "عزلة الأفيوش", "عزلة الجوالح", "عزلة حليان"],
      }
    },
    { "id": 2, "name": "أمانة العاصمة", "districts": ["صنعاء القديمة", "شعوب", "أزال", "الصافية", "السبعين", "الوحدة", "التحرير", "معين", "الثورة", "بني الحارث"] },
    { "id": 3, "name": "عدن", "districts": ["دار سعد", "الشيخ عثمان", "المنصورة", "البريقة", "التواهي", "المعلا", "صيرة", "خور مكسر"] },
    { "id": 4, "name": "حضرموت", "districts": ["المكلا", "ثمود", "القف", "زمخ ومنوخ", "حجر", "العبر", "القطن", "شبام", "ساه", "سيئون", "تريم", "السوم", "الريدة وقصيعر", "الديس", "الشحر", "غيل بن يمين", "غيل باوزير", "دوعن", "حورة ووادي العين", "رخية", "عمد", "الضليعة", "يبعث", "حجر الصيعر", "بروم ميفع", "حريضة", "رماه", "أرياف المكلا"] },
    { "id": 5, "name": "تعز", "districts": ["ماوية", "شرعب السلام", "شرعب الرونة", "مقبنة", "المخا", "ذو باب", "موزع", "جبل حبشي", "مشرعة وحدنان", "صبر الموادم", "المسراخ", "خدير", "الصلو", "الشمايتين", "الوازعية", "حيفان", "المظفر", "القاهرة", "صالة", "التعزية", "المعافر", "المواسط", "سامع"] },
    { "id": 6, "name": "لحج", "districts": ["الحد", "الحوطة", "القبيطة", "المسيمير", "المضاربة والعارة", "المفلحي", "المقاطرة", "الملاح", "تبن", "حالمين", "حبيل جبر", "ردفان", "طور الباحة", "يافع", "يهر"] },
    { "id": 7, "name": "الضالع", "districts": ["الأزارق", "الحشاء", "الحصين", "الشعيب", "الضالع", "جبن", "جحاف", "دمت", "قعطبة"] },
    { "id": 8, "name": "ريمة", "districts": ["بلاد الطعام", "السلفية", "الجبين", "مزهر", "كسمة", "الجعفرية"] },
    { "id": 9, "name": "صعدة", "districts": ["الحشوة", "الصفراء", "الظاهر", "باقم", "حيدان", "رازح", "ساقين", "سحار", "شداء", "صعدة", "غمر", "قطابر", "كتاف والبقع", "مجز", "منبة"] },
    { "id": 10, "name": "شبوة", "districts": ["دهر", "الطلح", "جردان", "عرماء", "عسيلان", "عين", "بيحان", "مرخة العليا", "مرخة السفلى", "نصاب", "حطيب", "الصعيد", "عتق", "حبان", "الروضة", "ميفعة", "رضوم"] },
    { "id": 11, "name": "البيضاء", "districts": ["نعمان", "ناطع", "مسورة", "الصومعة", "الزاهر", "ذي ناعم", "الطفة", "مكيراس", "مدينة البيضاء", "البيضاء", "السوادية", "ردمان", "رداع", "القريشية", "ولد ربيع", "العرش", "صباح", "الرياشية", "الشرية", "الملاجم"] },
    { "id": 12, "name": "الحديدة", "districts": ["الزهرة", "اللحية", "كمران", "الصليف", "المنيرة", "القناوص", "الزيدية", "المغلاف", "الضحى", "باجل", "الحجيلة", "برع", "المراوعة", "الدريهمي", "السخنة", "المنصورية", "بيت الفقيه", "جبل راس", "حيس", "الخوخة", "الحوك", "الميناء", "الحالي", "زبيد", "الجراحي", "التحيتا"] },
    { "id": 13, "name": "الجوف", "districts": ["خب والشعف", "الحميدات", "المطمة", "الزاهر", "الحزم", "المتون", "المصلوب", "الغيل", "الخلق", "برط العنان", "رجوزة", "خراب المراشي"] },
    { "id": 14, "name": "المهرة", "districts": ["شحن", "حات", "حوف", "الغيظة", "منعر", "المسيلة", "سيحوت", "قشن", "حصوين"] },
    { "id": 15, "name": "المحويت", "districts": ["شبام كوكبان", "الطويلة", "الرجم", "الخبت", "ملحان", "حفاش", "بني سعد", "مدينة المحويت", "المحويت"] },
    { "id": 16, "name": "صنعاء", "districts": ["همدان", "أرحب", "نهم", "بني حشيش", "سنحان وبني بهلول", "بلاد الروس", "بني مطر", "الحيمة الداخلية", "الحيمة الخارجية", "مناخة", "صعفان", "خولان", "الطيال", "بني ضبيان", "الحصن", "جحانة"] },
    { "id": 17, "name": "ذمار", "districts": ["الحداء", "جهران", "جبل الشرق", "مغرب عنس", "عتمـة", "وصاب العالي", "وصاب السافل", "مدينة ذمار", "ميفعة عنس", "عنس", "ضوران أنس", "المنار"] },
    { "id": 18, "name": "حجة", "districts": ["بكيل المير", "حرض", "ميدي", "عبس", "حيران", "مستباء", "كشر", "الجميمة", "كحلان الشرف", "أفلح الشام", "خيران المحرق", "أسلم", "قفل شمر", "أفلح اليمن", "المحابشة", "المفتاح", "المغربة", "كحلان عفار", "شرس", "مبين", "الشاهل", "كعيدنة", "وضرة", "بني قيس الطور", "الشغادرة", "نجرة", "بني العوام", "مدينة حجة", "حجة", "وشحة", "قارة"] },
    { "id": 19, "name": "مأرب", "districts": ["الجوبة", "العبدية", "بدبدة", "جبل مراد", "حريب", "حريب القرامش", "رحبة", "رغوان", "صرواح", "مأرب", "ماهلية", "مجزر", "مدغل الجدعان", "مدينة مأرب"] },
    { "id": 20, "name": "أرخبيل سقطرى", "districts": ["حديبو", "قلنسيه وعبد الكوري"] },
    { "id": 21, "name": "عمران", "districts": ["حرف سفيان", "حوث", "العشة", "قفلة عذر", "شهارة", "المدان", "صوير", "ظليمة حبور", "ذيبين", "خارف", "ريدة", "جبل عيال يزيد", "السودة", "السود", "عمران", "مسور", "ثلاء", "عيال سريح", "خمر", "بني صريم"] },
    { "id": 22, "name": "أبين", "districts": ["المحفد", "مودية", "جيشان", "لودر", "سباح", "رصد", "سرار", "الوضيع", "أحور", "زنجبار", "خنفر"] }
  ]
};

const MARITAL_OPTIONS = [
  { label: 'أعزب/عزباء', value: 'single' },
  { label: 'متزوج/متزوجة', value: 'married' },
  { label: 'مطلق/مطلقة', value: 'divorced' },
  { label: 'أرمل/أرملة', value: 'widowed' },
] as const;

const EDUCATION_OPTIONS = [
  { label: 'غير متعلم', value: 'none' },
  { label: 'ابتدائي', value: 'primary' },
  { label: 'متوسط', value: 'intermediate' },
  { label: 'ثانوي', value: 'secondary' },
  { label: 'جامعي', value: 'university' },
  { label: 'دراسات عليا', value: 'postgraduate' },
] as const;

const OCCUPATION_OPTIONS = [
  { label: 'موظف', value: 'employed' },
  { label: 'عامل حر', value: 'self_employed' },
  { label: 'متقاعد', value: 'retired' },
  { label: 'طالب', value: 'student' },
  { label: 'رب/ربة منزل', value: 'housewife' },
  { label: 'عاطل عن العمل', value: 'unemployed' },
] as const;

const FAMILY_STRUCTURE_OPTIONS = [
  { label: 'يعيش بمفرده', value: 'alone' },
  { label: 'مع الزوج/الزوجة', value: 'with_spouse' },
  { label: 'مع الأبناء', value: 'with_children' },
  { label: 'مع الوالدين', value: 'with_parents' },
  { label: 'مع العائلة الممتدة', value: 'extended_family' },
] as const;

const INCOME_LEVEL_OPTIONS = [
  { label: 'أقل من 3000 ريال', value: 'low' },
  { label: '3000 - 8000 ريال', value: 'middle_low' },
  { label: '8000 - 15000 ريال', value: 'middle' },
  { label: 'أكثر من 15000 ريال', value: 'high' },
] as const;

const YES_NO_OPTIONS = [
  { label: 'نعم', value: 'yes' },
  { label: 'لا', value: 'no' },
  { label: 'سابقاً', value: 'former' },
] as const;

const PHYSICAL_ACTIVITY_OPTIONS = [
  { label: 'خامل', value: 'sedentary' },
  { label: 'خفيف', value: 'light' },
  { label: 'معتدل', value: 'moderate' },
  { label: 'شديد', value: 'heavy' },
  { label: 'شديد جداً', value: 'very_heavy' },
] as const;

const DIET_OPTIONS = [
  { label: 'لا يوجد', value: 'none' },
  { label: 'نباتي', value: 'vegetarian' },
  { label: 'نباتي صرف', value: 'vegan' },
  { label: 'سكري', value: 'diabetic' },
  { label: 'ضغط', value: 'hypertension' },
  { label: 'كلوي', value: 'renal' },
  { label: 'أخرى', value: 'other' },
] as const;

const socialHistorySchema = z.object({
  maritalStatus: z.string(),
  educationLevel: z.string(),
  occupation: z.string(),
  familyStructure: z.string(),
  incomeLevel: z.string(),
  smoking: z.string().min(1, 'حقل التدخين مطلوب'),
  cigarettesPerDay: z.string(),
  yearsSmoked: z.string(),
  alcoholSubstanceUse: z.string().min(1, 'حقل الكحول/المخدرات مطلوب'),
  physicalActivity: z.string().min(1, 'حقل النشاط البدني مطلوب'),
  activityDescription: z.string(),
  dietaryHistory: z.string(),
  foodAllergies: z.string(),
  specialDietBeforeAdmission: z.string().min(1, 'حقل النظام الغذائي مطلوب'),
  comments: z.string(),
});

type SocialHistoryFormValues = z.infer<typeof socialHistorySchema>;

export default function SocialHistoryScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cascading Region States
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedDist, setSelectedDist] = useState('');
  const [selectedUzlah, setSelectedUzlah] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<SocialHistoryFormValues>({
    mode: 'onChange',
    resolver: zodResolver(socialHistorySchema),
    defaultValues: {
      maritalStatus: '',
      educationLevel: '',
      occupation: '',
      familyStructure: '',
      incomeLevel: '',
      smoking: '',
      cigarettesPerDay: '',
      yearsSmoked: '',
      alcoholSubstanceUse: '',
      physicalActivity: '',
      activityDescription: '',
      dietaryHistory: '',
      foodAllergies: '',
      specialDietBeforeAdmission: '',
      comments: '',
    },
  });

  const smokingValue = watch('smoking');
  const showSmokingDetails = smokingValue === 'yes' || smokingValue === 'former';

  useEffect(() => {
    loadExistingData();
  }, [patientId]);

  async function loadExistingData() {
    try {
      setIsLoading(true);
      const { GetSocialHistoryUseCase } = await import('../../../src/domain/use-cases/GetSocialHistoryUseCase');
      const useCase = new GetSocialHistoryUseCase();
      const data = await useCase.execute(patientId);
      if (data) {
        // Parse livingArea if it follows the combined format
        if (data.livingArea && data.livingArea.includes(' - ')) {
          const parts = data.livingArea.split(' - ');
          setSelectedGov(parts[0] || '');
          setSelectedDist(parts[1] || '');
          setSelectedUzlah(parts[2] || '');
        } else if (data.livingArea) {
          setSelectedGov(data.livingArea);
        }

        reset({
          maritalStatus: data.maritalStatus || '',
          educationLevel: data.educationLevel || '',
          occupation: data.occupation || '',
          familyStructure: data.familyStructure || '',
          incomeLevel: data.incomeLevel || '',
          smoking: data.smoking || '',
          cigarettesPerDay: data.cigarettesPerDay ? String(data.cigarettesPerDay) : '',
          yearsSmoked: data.yearsSmoked ? String(data.yearsSmoked) : '',
          alcoholSubstanceUse: data.alcoholSubstanceUse || '',
          physicalActivity: data.physicalActivity || '',
          activityDescription: data.activityDescription || '',
          dietaryHistory: data.dietaryHistory || '',
          foodAllergies: data.foodAllergies || '',
          specialDietBeforeAdmission: data.specialDietBeforeAdmission || '',
          comments: data.comments || '',
        });
      }
    } catch {
      /* silent fail */
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = async (status: 'complete' | 'incomplete'): Promise<string | undefined> => {
    let success = false;

    // Construct final living area string
    let finalLivingArea = selectedGov;
    if (selectedDist) finalLivingArea += ` - ${selectedDist}`;
    if (selectedGov === 'إب' && selectedUzlah) finalLivingArea += ` - ${selectedUzlah}`;

    await handleSubmit(async (values) => {
      try {
        setIsSaving(true);
        const { SaveSocialHistoryUseCase } = await import('../../../src/domain/use-cases/SaveSocialHistoryUseCase');
        const useCase = new SaveSocialHistoryUseCase();
        await useCase.execute({
          patientId: patientId,
          maritalStatus: values.maritalStatus || undefined,
          educationLevel: values.educationLevel || undefined,
          occupation: values.occupation || undefined,
          livingArea: finalLivingArea || undefined,
          familyStructure: values.familyStructure || undefined,
          incomeLevel: values.incomeLevel || undefined,
          smoking: values.smoking,
          cigarettesPerDay: values.cigarettesPerDay ? parseInt(values.cigarettesPerDay, 10) : undefined,
          yearsSmoked: values.yearsSmoked ? parseInt(values.yearsSmoked, 10) : undefined,
          alcoholSubstanceUse: values.alcoholSubstanceUse,
          physicalActivity: values.physicalActivity,
          activityDescription: values.activityDescription || undefined,
          dietaryHistory: values.dietaryHistory || undefined,
          foodAllergies: values.foodAllergies || undefined,
          specialDietBeforeAdmission: values.specialDietBeforeAdmission,
          comments: values.comments || undefined,
        });
        success = true;
      } catch {
        /* error handled via toast */
      } finally {
        setIsSaving(false);
      }
    })();
    return success ? patientId : undefined;
  };

  const governorateOptions = YEMEN_DATA.governorates.map(gov => ({ label: gov.name, value: gov.name }));
  const activeGov = YEMEN_DATA.governorates.find(gov => gov.name === selectedGov);
  const districtOptions = activeGov?.districts.map(d => ({ label: d, value: d })) || [];
  const uzlahOptions = (selectedGov === 'إب' && activeGov && (activeGov as any).uzlahs[selectedDist])
    ? (activeGov as any).uzlahs[selectedDist].map((u: string) => ({ label: u, value: u }))
    : [];

  const renderDropdown = (name: keyof SocialHistoryFormValues, label: string, options: readonly { label: string; value: string }[], required = false) => (
    <DropdownField
      label={required ? `${label}` : label}
      options={options}
      selectedValue={watch(name)}
      onValueChange={(val) => setValue(name, val, { shouldValidate: true })}
      error={errors[name]?.message}
      placeholder={`اختر ${label}...`}
    />
  );

  const renderRadioGroup = (name: keyof SocialHistoryFormValues, label: string, options: readonly { label: string; value: string }[]) => {
    return (
      <RadioGroup
        label={label}
        options={options}
        selectedValue={watch(name)}
        onValueChange={(val) => setValue(name, val, { shouldValidate: true })}
        error={errors[name]?.message}
        direction="row"
      />
    );
  };

  const renderTextInput = (name: keyof SocialHistoryFormValues, label: string, opts?: { keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'decimal-pad'; multiline?: boolean }) => (
    <TextInputField
      label={label}
      value={watch(name) || ''}
      onChangeText={(val) => setValue(name, val, { shouldValidate: true })}
      error={errors[name]?.message}
      keyboardType={opts?.keyboardType}
      multiline={opts?.multiline}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ArabicText style={styles.loadingText}>جاري تحميل البيانات...</ArabicText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Ionicons name="people-outline" size={24} color={colors.primaryContrast} />
            <ArabicText bold style={styles.headerTitle}>التاريخ الاجتماعي</ArabicText>
          </View>
        </View>

        {/* Demographic Info */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>المعلومات الديموغرافية</ArabicText>
          {renderDropdown('maritalStatus', 'الحالة الاجتماعية', MARITAL_OPTIONS)}
          {renderDropdown('educationLevel', 'المستوى التعليمي', EDUCATION_OPTIONS)}
          {renderDropdown('occupation', 'المهنة', OCCUPATION_OPTIONS)}
          
          <View style={styles.cascadingContainer}>
            <ArabicText style={styles.fieldLabel}>منطقة السكن (Residence Area)</ArabicText>
            
            <DropdownField
              label="المحافظة"
              options={governorateOptions}
              selectedValue={selectedGov}
              onValueChange={(val) => {
                setSelectedGov(val);
                setSelectedDist('');
                setSelectedUzlah('');
              }}
              placeholder="اختر المحافظة..."
            />

            {selectedGov !== '' && districtOptions.length > 0 && (
              <DropdownField
                label="المديرية"
                options={districtOptions}
                selectedValue={selectedDist}
                onValueChange={(val) => {
                  setSelectedDist(val);
                  setSelectedUzlah('');
                }}
                placeholder="اختر المديرية..."
              />
            )}

            {selectedGov === 'إب' && selectedDist !== '' && uzlahOptions.length > 0 && (
              <DropdownField
                label="العزلة (Sub-district)"
                options={uzlahOptions}
                selectedValue={selectedUzlah}
                onValueChange={setSelectedUzlah}
                placeholder="اختر العزلة..."
              />
            )}
          </View>

          {renderDropdown('familyStructure', 'التركيبة الأسرية', FAMILY_STRUCTURE_OPTIONS)}
          {renderDropdown('incomeLevel', 'مستوى الدخل', INCOME_LEVEL_OPTIONS)}
        </View>

        {/* Smoking & Substances */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>التدخين والمؤثرات</ArabicText>
          {renderRadioGroup('smoking', 'التدخين', YES_NO_OPTIONS)}
          {showSmokingDetails && (
            <View style={styles.subSection}>
              {renderTextInput('cigarettesPerDay', 'عدد السجائر يومياً', { keyboardType: 'numeric' })}
              {renderTextInput('yearsSmoked', 'عدد سنوات التدخين', { keyboardType: 'numeric' })}
            </View>
          )}
          {renderRadioGroup('alcoholSubstanceUse', 'الكحول / المخدرات', YES_NO_OPTIONS)}
        </View>

        {/* Physical Activity */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>النشاط البدني</ArabicText>
          {renderRadioGroup('physicalActivity', 'مستوى النشاط البدني', PHYSICAL_ACTIVITY_OPTIONS)}
          {renderTextInput('activityDescription', 'وصف النشاط البدني', { multiline: true })}
        </View>

        {/* Dietary History */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>التاريخ الغذائي</ArabicText>
          {renderDropdown('dietaryHistory', 'النظام الغذائي المتبع', DIET_OPTIONS)}
          {renderTextInput('foodAllergies', 'الحساسية الغذائية', { multiline: true })}
          {renderRadioGroup('specialDietBeforeAdmission', 'حمية خاصة قبل التنويم', YES_NO_OPTIONS)}
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <ArabicText bold style={styles.sectionTitle}>ملاحظات</ArabicText>
          {renderTextInput('comments', 'ملاحظات إضافية', { multiline: true })}
        </View>

      <TripleActionFooter
        patientId={patientId}
        screenKey="social-history"
        onSave={handleSave}
        isSaving={isSaving}
        isValid={isValid}
      />

        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: safeHeaderPaddingTop,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    color: colors.primaryContrast,
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    marginBottom: 0,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    paddingBottom: spacing.sm,
  },
  subSection: {
    paddingStart: spacing.md,
    borderStartWidth: 2,
    borderStartColor: colors.primaryLight,
    marginBottom: spacing.sm,
  },
  cascadingContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'right',
    fontFamily: fontFamilies.medium,
  },
  actions: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  spacer: {
    height: 40,
  },
});
