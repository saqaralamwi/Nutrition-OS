import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  ListRenderItemInfo,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePatientStore } from '../src/presentation/stores/patientStore';
import { useToastStore } from '../src/presentation/stores/toastStore';
import { useSettingsStore } from '../src/presentation/stores/settingsStore';
import PatientCard from '../src/presentation/components/PatientCard';
import EmptyState from '../src/presentation/components/EmptyState';
import ErrorView from '../src/presentation/components/ErrorView';
import SearchBar from '../src/presentation/components/SearchBar';
import { colors, spacing, safeHeaderPaddingTop } from '../src/presentation/theme';
import { Patient } from '../src/domain/entities/Patient';

const LIST_ITEM_HEIGHT = 110;

export default function PatientListScreen() {
  const router = useRouter();
  const patients = usePatientStore((s) => s.patients);
  const isLoading = usePatientStore((s) => s.isLoading);
  const error = usePatientStore((s) => s.error);
  const totalCount = usePatientStore((s) => s.totalCount);
  const activeCount = usePatientStore((s) => s.activeCount);
  const sortOrder = usePatientStore((s) => s.sortOrder);
  const searchQuery = usePatientStore((s) => s.searchQuery);
  const loadPatients = usePatientStore((s) => s.loadPatients);
  const searchPatients = usePatientStore((s) => s.searchPatients);
  const setSortOrder = usePatientStore((s) => s.setSortOrder);
  const showToast = useToastStore((s) => s.showToast);

  const settingsUsername = useSettingsStore((s) => s.username);
  const settingsTitle = useSettingsStore((s) => s.professionalTitle);
  const settingsHospital = useSettingsStore((s) => s.hospitalName);

  const [isDragging, setIsDragging] = useState(false);

  const [icuCount, setIcuCount] = useState(0);
  const [malnutritionRiskCount, setMalnutritionRiskCount] = useState(0);
  const [stableCount, setStableCount] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { getDatabase } = await import('../src/data/database');
        const { Q } = await import('@nozbe/watermelondb');
        let db;
        try {
          db = await getDatabase();
        } catch {
          console.warn('fetchStats: database not available');
          return;
        }
        if (!db) return;

        // 1. ICU Admissions
        const icu = patients.filter((p) => p.department === 'ICU' || p.department === 'عناية مركزة').length;
        setIcuCount(icu);

        // 2. Malnutrition Risk (NRS Score >= 3)
        const calcCollection = db.get('calculations');
        if (calcCollection) {
          const malnutritionCalcs = (await calcCollection.query(
            Q.where('calculation_type', 'nrs_2002'),
            Q.where('result_value', Q.gte(3))
          ).fetch()) as any[];
          const uniqueAtRiskIds = new Set(malnutritionCalcs.map((c) => c.patientId));
          const atRiskCount = patients.filter((p) => uniqueAtRiskIds.has(p.id)).length;
          setMalnutritionRiskCount(atRiskCount);

          const stableCalcs = (await calcCollection.query(
            Q.where('calculation_type', 'nrs_2002'),
            Q.where('result_value', Q.lt(3))
          ).fetch()) as any[];
          const uniqueStableIds = new Set(stableCalcs.map((c) => c.patientId));
          const stable = patients.filter((p) => p.status !== 'active' || (uniqueStableIds.has(p.id) && !uniqueAtRiskIds.has(p.id))).length;
          setStableCount(stable);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    }
    fetchStats();
  }, [patients]);

  const handleDragOver = useCallback((e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      setIsDragging(false);
    }
  }, []);

  const handleImportData = useCallback(async (jsonText: string) => {
    try {
      let data = JSON.parse(jsonText);
      if (data.patientData) {
        data = data.patientData;
      }
      
      const { patientProfile, clinicalWorkflow } = data;
      if (!patientProfile || !clinicalWorkflow) {
        Alert.alert('خطأ في البنية', 'الملف المرفوع لا يحتوي على البنية الصحيحة لملف الحالة (.adcn)');
        return;
      }

      const parseDate = (val: any): Date => {
        if (!val) return new Date();
        if (typeof val === 'number') return new Date(val);
        const parsed = new Date(val);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
      };

      const { getDatabase } = await import('../src/data/database');
      let db;
      try {
        db = await getDatabase();
      } catch {
        Alert.alert('خطأ', 'تعذر الاتصال بقاعدة البيانات');
        return;
      }
      if (!db) return;

      const patientCollection = db.get('patients');
      if (!patientCollection) {
        Alert.alert('خطأ', 'جدول المرضى غير متاح');
        return;
      }

      await db.write(async () => {
        const count = await patientCollection.query().fetchCount();
        const fileNumber = `CN-${String(count + 1).padStart(5, '0')}`;

        const newPatient = await patientCollection.create((record: any) => {
          record.fileNumber = fileNumber;
          record.fullName = patientProfile.fullName;
          record.age = Number(patientProfile.age) || 0;
          record.dateOfBirth = patientProfile.dateOfBirth || '';
          record.gender = patientProfile.gender;
          record.nationalId = patientProfile.nationalId || '';
          record.nationality = patientProfile.nationality || '';
          record.phoneNumber = patientProfile.phoneNumber || '';
          record.department = patientProfile.department;
          record.bedNumber = patientProfile.bedNumber || '';
          record.admissionDate = parseDate(patientProfile.admissionDate);
          record.referringPhysician = patientProfile.referringPhysician || '';
          record.primaryDiagnosis = patientProfile.primaryDiagnosis;
          record.patientType = patientProfile.patientType;
          record.status = patientProfile.status || 'active';
          record.notes = patientProfile.notes || '';
          record.incompleteSections = typeof patientProfile.incompleteSections === 'string'
            ? patientProfile.incompleteSections
            : JSON.stringify(patientProfile.incompleteSections || []);
        });

        const pId = newPatient.id;
        const cw = clinicalWorkflow;

        // medical_histories
        if (cw.medicalHistories && Array.isArray(cw.medicalHistories)) {
          const col = db.get('medical_histories');
          for (const item of cw.medicalHistories) {
            await col.create((r: any) => {
              r.patientId = pId;
              r.chiefComplaint = item.chief_complaint || '';
              r.currentDiagnosis = item.current_diagnosis || '';
              r.icd10Code = item.icd_10_code || '';
              r.comorbidities = item.comorbidities || '';
              r.surgicalHistory = item.surgical_history || '';
              r.pastMedicalHistory = item.past_medical_history || '';
              r.familyHistory = item.family_history || '';
              r.medicationAllergies = item.medication_allergies || '';
              r.covid19Status = item.covid_19_status || '';
              r.comments = item.comments || '';
            });
          }
        }

        // social_histories
        if (cw.socialHistories && Array.isArray(cw.socialHistories)) {
          const col = db.get('social_histories');
          for (const item of cw.socialHistories) {
            await col.create((r: any) => {
              r.patientId = pId;
              r.maritalStatus = item.marital_status || '';
              r.educationLevel = item.education_level || '';
              r.occupation = item.occupation || '';
              r.livingArea = item.living_area || '';
              r.familyStructure = item.family_structure || '';
              r.incomeLevel = item.income_level || '';
              r.smoking = item.smoking || '';
              r.cigarettesPerDay = Number(item.cigarettes_per_day) || 0;
              r.yearsSmoked = Number(item.years_smoked) || 0;
              r.alcoholSubstanceUse = item.alcohol_substance_use || '';
              r.physicalActivity = item.physical_activity || '';
              r.activityDescription = item.activity_description || '';
              r.dietaryHistory = item.dietary_history || '';
              r.foodAllergies = item.food_allergies || '';
              r.specialDietBeforeAdmission = item.special_diet_before_admission || '';
              r.comments = item.comments || '';
            });
          }
        }

        // medications
        if (cw.medications && Array.isArray(cw.medications)) {
          const col = db.get('medications');
          for (const item of cw.medications) {
            await col.create((r: any) => {
              r.patientId = pId;
              r.drugName = item.drug_name || '';
              r.dosage = item.dosage || '';
              r.frequency = item.frequency || '';
              r.route = item.route || '';
              if (item.start_date) r.startDate = parseDate(item.start_date);
              if (item.end_date) r.endDate = parseDate(item.end_date);
              r.prescribingPhysician = item.prescribing_physician || '';
              r.dniRisk = item.dni_risk || '';
              r.dniNotes = item.dni_notes || '';
            });
          }
        }

        // supplements
        if (cw.supplements && Array.isArray(cw.supplements)) {
          const col = db.get('supplements');
          for (const item of cw.supplements) {
            await col.create((r: any) => {
              r.patientId = pId;
              r.supplementName = item.supplement_name || '';
              r.dosage = item.dosage || '';
              r.supplementType = item.supplement_type || '';
            });
          }
        }

        // lab_results
        if (cw.labResults && Array.isArray(cw.labResults)) {
          const col = db.get('lab_results');
          for (const item of cw.labResults) {
            await col.create((r: any) => {
              r.patientId = pId;
              r.testName = item.test_name || '';
              r.resultValue = Number(item.result_value) || 0;
              r.unit = item.unit || '';
              r.referenceRangeLow = Number(item.reference_range_low) || 0;
              r.referenceRangeHigh = Number(item.reference_range_high) || 0;
              r.interpretation = item.interpretation || '';
              r.overrideReason = item.override_reason || '';
              r.testDate = parseDate(item.test_date);
              r.comments = item.comments || '';
              r.attachedImagePath = item.attached_image_path || '';
            });
          }
        }

        // physical_exam_items
        if (cw.physicalExamItems && Array.isArray(cw.physicalExamItems)) {
          const col = db.get('physical_exam_items');
          for (const item of cw.physicalExamItems) {
            await col.create((r: any) => {
              r.patientId = pId;
              r.domain = item.domain || '';
              r.itemKey = item.item_key || '';
              r.response = item.response || '';
              r.comments = item.comments || '';
            });
          }
        }

        // calculations
        if (cw.calculations && Array.isArray(cw.calculations)) {
          const col = db.get('calculations');
          for (const item of cw.calculations) {
            await col.create((r: any) => {
              r.patientId = pId;
              r.calculationType = item.calculation_type || '';
              r.formulaName = item.formula_name || '';
              r.inputValues = item.input_values || '';
              r.resultValue = Number(item.result_value) || 0;
              r.isOverridden = Boolean(item.is_overridden);
              r.overrideValue = Number(item.override_value) || 0;
              r.overrideReason = item.override_reason || '';
            });
          }
        }

        // interventions
        if (cw.interventions && Array.isArray(cw.interventions)) {
          const col = db.get('interventions');
          for (const item of cw.interventions) {
            await col.create((r: any) => {
              r.patientId = pId;
              r.nutritionDiagnosis = item.nutrition_diagnosis || '';
              r.mainGoal = item.main_goal || '';
              r.dietType = item.diet_type || '';
              r.foodTexture = item.food_texture || '';
              r.routeOfFeeding = item.route_of_feeding || '';
              r.targetCalories = Number(item.target_calories) || 0;
              r.targetProtein = Number(item.target_protein) || 0;
              r.targetCarbohydrates = Number(item.target_carbohydrates) || 0;
              r.targetFat = Number(item.target_fat) || 0;
              r.fluidAllowance = Number(item.fluid_allowance) || 0;
              r.dietModifications = item.diet_modifications || '';
              r.dietRecommendations = item.diet_recommendations || '';
              r.supplementPlan = item.supplement_plan || '';
              r.behavioralInstructions = item.behavioral_instructions || '';
              r.followUpInterval = item.follow_up_interval || '';
              r.linkedFindings = item.linked_findings || '';
              r.status = item.status || '';
              r.supersededBy = item.superseded_by || '';
              r.comments = item.comments || '';
            });
          }
        }

        // meal_plans
        if (cw.mealPlans && Array.isArray(cw.mealPlans)) {
          const col = db.get('meal_plans');
          for (const item of cw.mealPlans) {
            await col.create((r: any) => {
              r.patientId = pId;
              r.planDate = parseDate(item.plan_date);
              r.mealType = item.meal_type || '';
              r.foodDetails = item.food_details || '';
              r.totalCalories = Number(item.total_calories) || 0;
              r.totalCarbs = Number(item.total_carbs) || 0;
              r.totalProtein = Number(item.total_protein) || 0;
              r.totalFat = Number(item.total_fat) || 0;
            });
          }
        }
      });

      await loadPatients();
      showToast('تم استيراد ملف الحالة بنجاح 🎉', 'success');
      Alert.alert('تم الاستيراد', `تم استيراد ملف حالة المريض "${patientProfile.fullName}" بنجاح!`);
    } catch (err) {
      console.error('Import processing error:', err);
      showToast('فشل في استيراد ملف الحالة', 'error');
      Alert.alert('خطأ', 'فشل في استيراد ملف الحالة، تأكد من صحة الملف وبنيته.');
    }
  }, [loadPatients, showToast]);

  const processFile = useCallback((file: any) => {
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result;
        if (typeof text !== 'string') return;
        await handleImportData(text);
      };
      reader.readAsText(file);
    } catch (err) {
      console.error('File reading error:', err);
      Alert.alert('خطأ', 'فشل في قراءة الملف.');
    }
  }, [handleImportData]);

  const handleDrop = useCallback((e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    }
  }, [processFile]);

  const handleImportPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Alert.alert('تنبيه', 'الاستيراد متاح على نسخة الويب حالياً');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.adcn,.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        processFile(file);
      }
    };
    input.click();
  }, [processFile]);

  const handleExportResearchData = useCallback(async () => {
    try {
      showToast('⏳ جاري استخراج وتعمية البيانات البحثية...', 'info');
      
      const { getDatabase } = await import('../src/data/database');
      const { Q } = await import('@nozbe/watermelondb');
      let db;
      try {
        db = await getDatabase();
      } catch {
        showToast('تعذر الاتصال بقاعدة البيانات للتصدير', 'error');
        return;
      }
      if (!db) return;

      // Fetch all patients with any casting
      const patientCollection = db.get('patients');
      if (!patientCollection) {
        showToast('جدول المرضى غير متاح للتصدير', 'error');
        return;
      }
      const allPatients = (await patientCollection.query().fetch()) as any[];

      if (allPatients.length === 0) {
        Alert.alert('تنبيه', 'لا يوجد مرضى مسجلين في النظام لتصدير بياناتهم.');
        return;
      }

      const DEPARTMENT_LABELS: Record<string, string> = {
        ICU: 'عناية مركزة',
        Internal: 'داخلي',
        Surgical: 'جراحي',
        Pediatrics: 'أطفال',
        'OB/GYN': 'نساء وتوليد',
        Outpatient: 'عيادات خارجية',
      };

      const rows: string[] = [];

      // Loop and anonymize
      for (let i = 0; i < allPatients.length; i++) {
        const p = allPatients[i];
        const resId = `RES-${String(i + 1).padStart(4, '0')}`;
        const age = p.age !== undefined ? p.age : '';
        const genderLabel = p.gender === 'male' ? 'ذكر' : 'أنثى';
        const deptLabel = DEPARTMENT_LABELS[p.department] || p.department || '';
        const diagnosis = p.primaryDiagnosis || '';

        // Query lab results and records with any casting
        const labs = (await db.get('lab_results').query(Q.where('patient_id', p.id)).fetch()) as any[];
        const records = (await db.get('laboratory_records').query(Q.where('patient_id', p.id)).fetch()) as any[];

        let albVal = '';
        let crVal = '';
        let ureaVal = '';
        let hba1cVal = '';

        // Sort by date descending
        const sortedRecords = [...records].sort((a: any, b: any) => (b.testDate || 0) - (a.testDate || 0));
        const sortedLabs = [...labs].sort((a: any, b: any) => {
          const dateA = a.testDate ? new Date(a.testDate).getTime() : 0;
          const dateB = b.testDate ? new Date(b.testDate).getTime() : 0;
          return dateB - dateA;
        });

        if (sortedRecords.length > 0) {
          const latestRec = sortedRecords[0];
          if (latestRec.albumin !== undefined && latestRec.albumin !== null) albVal = String(latestRec.albumin);
          if (latestRec.creatinine !== undefined && latestRec.creatinine !== null) crVal = String(latestRec.creatinine);
          if (latestRec.urea !== undefined && latestRec.urea !== null) ureaVal = String(latestRec.urea);
          if (latestRec.hba1c !== undefined && latestRec.hba1c !== null) hba1cVal = String(latestRec.hba1c);
        }

        // Merge from lab_results
        sortedLabs.forEach((l: any) => {
          const name = (l.testName || '').toLowerCase().trim();
          const val = String(l.resultValue || '');
          if (!val) return;
          
          if (name.includes('albumin') || name.includes('ألبومين') || name === 'alb') {
            if (!albVal) albVal = val;
          } else if (name.includes('creatinine') || name.includes('كرياتينين') || name === 'cr' || name === 'creat') {
            if (!crVal) crVal = val;
          } else if (name.includes('urea') || name.includes('يوريا')) {
            if (!ureaVal) ureaVal = val;
          } else if (name.includes('hba1c') || name.includes('التراكمي') || name.includes('a1c')) {
            if (!hba1cVal) hba1cVal = val;
          }
        });

        // Query active intervention with any casting
        const interventions = (await db.get('interventions')
          .query(Q.where('patient_id', p.id), Q.where('status', 'active'))
          .fetch()) as any[];
        let interventionType = '-';
        if (interventions.length > 0) {
          const route = interventions[0].routeOfFeeding;
          if (route === 'ng_tube' || route === 'peg' || route === 'jejunostomy' || route === 'enteral') {
            interventionType = 'أنبوبي (Enteral)';
          } else if (route === 'tpn' || route === 'ppn' || route === 'parenteral') {
            interventionType = 'وريدي (Parenteral)';
          } else if (route === 'oral') {
            interventionType = 'فموي (Oral)';
          } else {
            interventionType = interventions[0].dietType || '-';
          }
        }

        const escapeCSV = (val: string): string => {
          if (!val) return '';
          const clean = val.replace(/"/g, '""');
          if (clean.includes(',') || clean.includes('\n') || clean.includes('"')) {
            return `"${clean}"`;
          }
          return clean;
        };

        const row = [
          resId,
          age,
          genderLabel,
          deptLabel,
          escapeCSV(diagnosis),
          albVal,
          crVal,
          ureaVal,
          hba1cVal,
          escapeCSV(interventionType),
        ].join(',');

        rows.push(row);
      }

      // Add UTF-8 BOM to ensure Excel reads Arabic characters correctly
      const csvContent = '\uFEFF' + [
        'المعرف_البحثي,العمر,الجنس,القسم,التشخيص_الطبي,ألبومين,كرياتينين,يوريا,السكر_التراكمي,نوع_التدخل_التغذوي',
        ...rows,
      ].join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Clinical_ADCN_Research_Data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('تم تصدير البيانات البحثية بنجاح 🎉', 'success');
      } else {
        const FileSystem = (await import('expo-file-system')) as any;
        const Sharing = (await import('expo-sharing')) as any;
        const fileUri = `${FileSystem.cacheDirectory}Clinical_ADCN_Research_Data.csv`;
        
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'تصدير البيانات البحثية المُعماة (CSV)' });
        showToast('تم تصدير البيانات البحثية بنجاح 🎉', 'success');
      }
    } catch (err) {
      console.error('CSV Export Error:', err);
      showToast('فشل في تصدير البيانات البحثية', 'error');
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [])
  );

  const handlePatientPress = useCallback(
    (patient: Patient) => {
      router.push(`/patient/${patient.id}`);
    },
    [router]
  );

  const handleDeletePress = useCallback(
    (id: string, name: string) => {
      Alert.alert('حذف مريض', `هل أنت متأكد من حذف المريض "${name}"؟`, [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const { PatientRepository } = await import('../src/data/repositories/PatientRepository');
              const repo = new PatientRepository();
              await repo.delete(id);
              loadPatients();
            } catch (e) {
              showToast('فشل حذف المريض', 'error');
            }
          },
        },
      ]);
    },
    [loadPatients, showToast]
  );

  const handleSearch = useCallback(
    (text: string) => {
      if (text.trim().length === 0) {
        loadPatients();
        return;
      }
      searchPatients(text);
    },
    [loadPatients, searchPatients]
  );

  const toggleSort = useCallback(() => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  }, [sortOrder, setSortOrder]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Patient>) => (
      <PatientCard
        patient={item}
        onPress={handlePatientPress}
        onDelete={() => handleDeletePress(item.id, item.fullName)}
      />
    ),
    [handlePatientPress, handleDeletePress]
  );

  const keyExtractor = useCallback((item: Patient) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: LIST_ITEM_HEIGHT,
      offset: LIST_ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  if (error && patients.length === 0) {
    return (
      <View style={styles.container}>
        <ErrorView message={error} onRetry={loadPatients} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => router.push('/admin')}
              style={styles.headerIconBtn}
              accessibilityLabel="لوحة التحكم"
            >
              <Ionicons name="stats-chart" size={20} color={colors.primaryContrast} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.headerIconBtn}
              accessibilityLabel="الإعدادات"
            >
              <Ionicons name="settings-outline" size={20} color={colors.primaryContrast} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleImportPress}
            {...({
              onDragOver: handleDragOver,
              onDragLeave: handleDragLeave,
              onDrop: handleDrop,
            } as any)}
            style={[styles.importBtn, isDragging && styles.importBtnDragging]}
            activeOpacity={0.8}
          >
            <Text style={styles.importBtnText}>📥 استيراد حالة مريض جديدة</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, justifyContent: 'flex-start' }}>
          <Text style={styles.headerTitle}>Clinical-ADCN</Text>
          <TouchableOpacity
            onPress={() => router.push('/about')}
            style={styles.headerIconBtn}
            accessibilityLabel="عن المطور"
          >
            <Ionicons name="information-circle-outline" size={22} color="#4775B3" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>{settingsUsername} - {settingsTitle}</Text>
        <Text style={styles.headerUser}>{settingsHospital}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsScrollViewContent}
        style={styles.statsScrollView}
      >
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{patients.length}</Text>
          <Text style={styles.statLabel}>إجمالي المرضى</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{icuCount}</Text>
          <Text style={styles.statLabel}>العناية المركزة</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{malnutritionRiskCount}</Text>
          <Text style={styles.statLabel}>خطر سوء التغذية</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stableCount}</Text>
          <Text style={styles.statLabel}>الحالات المستقرة</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.researchExportBtn}
        onPress={handleExportResearchData}
        activeOpacity={0.8}
      >
        <Ionicons name="bar-chart-outline" size={18} color="#3A5F91" />
        <Text style={styles.researchExportBtnText}>📊 تصدير البيانات البحثية المُعماة (CSV)</Text>
      </TouchableOpacity>

      <SearchBar value={searchQuery} onChangeText={handleSearch} />

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
          <Ionicons
            name={sortOrder === 'newest' ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.sortLabel}>
            {sortOrder === 'newest' ? 'الأحدث أولاً' : 'الأقدم أولاً'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.resultCount}>{patients.length} مريض</Text>
      </View>

      <FlatList
        data={patients}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        contentContainerStyle={
          patients.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <EmptyState
              title={searchQuery ? 'لا توجد نتائج' : 'لا يوجد مرضى'}
              subtitle={
                searchQuery
                  ? 'حاول البحث باسم آخر'
                  : 'أضف مريضاً جديداً لبدء العمل'
              }
              icon={searchQuery ? 'search-outline' : 'people-outline'}
            />
          )
        }
        onRefresh={loadPatients}
        refreshing={isLoading}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/patient/new')}
        activeOpacity={0.8}
        accessibilityLabel="إضافة مريض جديد"
      >
        <Ionicons name="add" size={28} color={colors.primaryContrast} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: safeHeaderPaddingTop,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  importBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  importBtnDragging: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderColor: '#fff',
  },
  importBtnText: {
    color: colors.primaryContrast,
    fontSize: 12,
    fontFamily: 'ThmanyahSans-Bold',
  },
  headerIconBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'ThmanyahSans-Black',
    color: colors.primaryContrast,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'ThmanyahSans-Medium',
    color: colors.primaryContrast,
    opacity: 0.8,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  headerUser: {
    fontSize: 12,
    fontFamily: 'ThmanyahSans-Light',
    color: colors.primaryContrast,
    opacity: 0.6,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  statsScrollView: {
    maxHeight: 110,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  statsScrollViewContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row-reverse',
  },
  statCard: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'ThmanyahSans-Bold',
    color: colors.success,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'ThmanyahSans-Medium',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  sortLabel: {
    fontSize: 13,
    fontFamily: 'ThmanyahSans-Regular',
    color: colors.textSecondary,
  },
  resultCount: {
    fontSize: 13,
    fontFamily: 'ThmanyahSans-Regular',
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  list: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
  researchExportBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4775B3',
    backgroundColor: '#F0F4F8',
    gap: spacing.sm,
    minHeight: 44,
  },
  researchExportBtnText: {
    color: '#3A5F91',
    fontSize: 13,
    fontFamily: 'ThmanyahSans-Medium',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    start: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  },
});
