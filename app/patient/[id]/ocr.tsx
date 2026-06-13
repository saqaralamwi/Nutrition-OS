import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
import Button from '../../../src/presentation/components/Button';
import { usePatientStore } from '../../../src/presentation/stores/patientStore';
import { getDatabase } from '../../../src/data/database';
import { TestCatalogRepository } from '../../../src/data/repositories/TestCatalogRepository';
import { InterpretLabResultUseCase } from '../../../src/domain/use-cases/InterpretLabResultUseCase';
import { recognizeTextFromImage } from '../../../src/services/ocrService';
import * as ImagePicker from 'expo-image-picker';
import WebCropperModal from './WebCropperModal';

// Premium dark theme colors matching screening.tsx
const darkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  border: '#475569',
  accent: '#10B981', // Emerald green
  accentDark: '#059669',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textDisabled: '#64748B',
  white: '#FFFFFF',
  success: '#10B981',
  successBg: '#064E3B',
  danger: '#F43F5E', // Crimson red
  dangerBg: '#881337',
  forestGreen: '#1B6B4A',
  forestGreenDark: '#145237',
  slateBlue: '#4775B3',
};

export interface ParsedLabResult {
  testName: string;
  resultValue: number;
}

// Robust medical lab report parser (fuzzy-cleaning regex engine)
export function parseMedicalLabText(rawText: string): ParsedLabResult[] {
  const lines = rawText.split('\n');
  const results: ParsedLabResult[] = [];
  const seenTests = new Set<string>();

  const testDefinitions = [
    { name: 'Urea', regex: /(ur|ure|urea|بولي|يوريا)/i },
    { name: 'Creatinine', regex: /(creat|cr|crea|كclear|كرياتينين)/i },
    { name: 'Potassium', regex: /(pot|potas|k\+)/i },
    { name: 'Sodium', regex: /(sod|sodium|na\+)/i },
    { name: 'HbA1c', regex: /(hba1c|hba|تراكمي)/i },
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 1. Sanitize the line
    let cleanLine = trimmed;

    // Split stuck letters/symbols and numbers (e.g. Urea88.0 -> Urea 88.0, 88.0mg -> 88.0 mg, K+5.5 -> K+ 5.5)
    cleanLine = cleanLine
      .replace(/([a-zA-Z\u0600-\u06FF\+]+)(\d)/g, '$1 $2')
      .replace(/(\d)([a-zA-Z\u0600-\u06FF\+]+)/g, '$1 $2');

    // Remove parentheses/brackets and their contents (handles (Roch), (15-45), [15-45], etc.)
    cleanLine = cleanLine.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ');

    // Remove any standalone reference ranges (e.g. 15-45 or 15 - 45 or 3.5-5.1)
    cleanLine = cleanLine.replace(/\b\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\b/g, ' ');

    // Strip out confusing special characters (keep alphanumeric, space, dot, plus, and Arabic)
    cleanLine = cleanLine.replace(/[^\w\s\.\+\u0600-\u06FF]/g, ' ');

    // Convert into a clean array of tokens
    const tokens = cleanLine.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;

    // 2. Match test definitions
    for (const def of testDefinitions) {
      if (seenTests.has(def.name)) continue;

      // Find if any token matches the regex
      const matchIndex = tokens.findIndex((token) => def.regex.test(token));
      if (matchIndex !== -1) {
        // Grab the first independent floating number in that specific text context after the match
        let detectedValue: number | null = null;
        for (let i = matchIndex + 1; i < tokens.length; i++) {
          const token = tokens[i];
          if (/^\d+(?:\.\d+)?$/.test(token)) {
            const val = parseFloat(token);
            if (!isNaN(val)) {
              detectedValue = val;
              break;
            }
          }
        }

        // If not found after, also check before, just in case (e.g. "88.0 Urea")
        if (detectedValue === null) {
          for (let i = matchIndex - 1; i >= 0; i--) {
            const token = tokens[i];
            if (/^\d+(?:\.\d+)?$/.test(token)) {
              const val = parseFloat(token);
              if (!isNaN(val)) {
                detectedValue = val;
                break;
              }
            }
          }
        }

        if (detectedValue !== null) {
          results.push({
            testName: def.name,
            resultValue: detectedValue,
          });
          seenTests.add(def.name);
          break; // Match found for this line, proceed to next line
        }
      }
    }
  }

  return results;
}

const MOCK_LAB_REPORT = `AL AMWI CLINICAL LABORATORY REPORT
----------------------------------
Patient Name: Case Study ID
Date: ${new Date().toLocaleDateString('en-US')}
Test Name          Result      Unit       Normal Range
------------------------------------------------------
Urea (Roch)l       88.0        mg/dL      15 - 45
Creatinine         1.50        mg/dL      0.7 - 1.2
Potassium (K+)     5.50        mmol/L     3.5 - 5.1
Sodium (Na+)       142.0       mmol/L     136 - 145
HbA1c (Trakomi)    7.20        %          4.0 - 5.7
------------------------------------------------------
End of Report`;

const MANUAL_TESTS = [
  { key: 'Urea', labelAr: 'اليوريا', labelEn: 'Urea', unit: 'mg/dL' },
  { key: 'Creatinine', labelAr: 'الكرياتينين', labelEn: 'Creatinine', unit: 'mg/dL' },
  { key: 'Potassium', labelAr: 'البوتاسيوم', labelEn: 'Potassium', unit: 'mmol/L' },
  { key: 'Sodium', labelAr: 'الصوديوم', labelEn: 'Sodium', unit: 'mmol/L' },
  { key: 'HbA1c', labelAr: 'السكري التراكمي', labelEn: 'HbA1c', unit: '%' },
];

export default function OCRScannerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = usePatientStore((s: any) => s.showToast);

  const [isLoading, setIsLoading] = useState(false);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [rawText, setRawText] = useState('');
  const [detectedResults, setDetectedResults] = useState<ParsedLabResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [scanAttempted, setScanAttempted] = useState(false);
  const [manualValues, setManualValues] = useState<Record<string, string>>({
    Urea: '',
    Creatinine: '',
    Potassium: '',
    Sodium: '',
    HbA1c: '',
  });
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [webCropperVisible, setWebCropperVisible] = useState(false);
  const [webImageSrc, setWebImageSrc] = useState('');

  const fileInputRef = useRef<any>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  // Load test catalog details
  useEffect(() => {
    async function loadCatalog() {
      try {
        const { TestCatalogRepository } = await import('../../../src/data/repositories/TestCatalogRepository');
        const repo = new TestCatalogRepository();
        const items = await repo.getAll();
        setCatalog(items);
      } catch (err) {
        console.error('Failed to load test catalog:', err);
      }
    }
    loadCatalog();
  }, []);

  const handleBack = useCallback(() => {
    router.navigate(`/patient/${id}/laboratory`);
  }, [router, id]);

  const processImageSource = async (source: any) => {
    try {
      setIsLoading(true);
      setDetectedResults([]);
      setScanAttempted(false);
      showToast('⏳ جاري مسح وتحليل الفحوصات المخبرية ضوئياً...', 'info');

      const text = await recognizeTextFromImage(source);
      setRawText(text);

      const parsed = parseMedicalLabText(text);
      setDetectedResults(parsed);
      setScanAttempted(true);

      // Pre-fill manual values
      const prefilled: Record<string, string> = { Urea: '', Creatinine: '', Potassium: '', Sodium: '', HbA1c: '' };
      for (const res of parsed) {
        prefilled[res.testName] = String(res.resultValue);
      }
      setManualValues(prefilled);

      if (parsed.length > 0) {
        showToast(`تم استخراج ${parsed.length} فحص بنجاح 🎉`, 'success');
      } else {
        showToast('لم يتم العثور على فحوصات مطابقة في الصورة', 'info');
      }
    } catch (err: any) {
      console.error('OCR Error:', err);
      showToast(err.message || 'فشل قراءة الصورة. تأكد من جودتها وحاول مجدداً.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OCR file parsing (Web Only)
  const handleFileChange = async (event: any) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setWebImageSrc(reader.result as string);
      setWebCropperVisible(true);
    };
    reader.readAsDataURL(file);

    if (event.target) {
      event.target.value = '';
    }
  };

  const handleWebCropConfirm = (croppedDataUrl: string) => {
    setWebCropperVisible(false);
    processImageSource(croppedDataUrl);
  };

  // Run the regex parser manually on the entered raw text
  const handleParseText = useCallback(() => {
    if (!rawText.trim()) {
      showToast('يرجى إدخال أو لصق نص التقرير أولاً للمحاكاة.', 'warning');
      return;
    }
    const parsed = parseMedicalLabText(rawText);
    setDetectedResults(parsed);
    setScanAttempted(true);

    // Pre-fill manual values
    const prefilled: Record<string, string> = { Urea: '', Creatinine: '', Potassium: '', Sodium: '', HbA1c: '' };
    for (const res of parsed) {
      prefilled[res.testName] = String(res.resultValue);
    }
    setManualValues(prefilled);

    if (parsed.length > 0) {
      showToast(`تم تحليل واستخراج ${parsed.length} فحص بنجاح 🎉`, 'success');
    } else {
      showToast('لم يتم العثور على فحوصات مطابقة في النص المدخل', 'info');
    }
  }, [rawText, showToast]);

  // Load Mock Report template
  const handleLoadMock = useCallback(() => {
    setRawText(MOCK_LAB_REPORT);
    const parsed = parseMedicalLabText(MOCK_LAB_REPORT);
    setDetectedResults(parsed);
    setScanAttempted(false);

    // Pre-fill manual values
    const prefilled: Record<string, string> = { Urea: '', Creatinine: '', Potassium: '', Sodium: '', HbA1c: '' };
    for (const res of parsed) {
      prefilled[res.testName] = String(res.resultValue);
    }
    setManualValues(prefilled);

    showToast('تم تحميل نص التقرير الافتراضي واستخراج النتائج بنجاح 🧪', 'success');
  }, [showToast]);

  // Shared save handler executing direct WatermelonDB transactions
  const saveLabResults = useCallback(async (resultsToSave: ParsedLabResult[], isManual = false) => {
    if (resultsToSave.length === 0) {
      showToast('لا توجد نتائج لحفظها.', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      const database = await getDatabase();
      const interpreter = new InterpretLabResultUseCase();

      await database.write(async () => {
        // Loop through matched results and write them directly into WatermelonDB
        for (const result of resultsToSave) {
          const detectedTestName = result.testName;
          const detectedTestValue = result.resultValue;

          // Lookup catalogs to populate units, ranges & calculate interpretations
          const catalogItem = catalog.find((c) => c.testNameEn === detectedTestName);
          const unit = catalogItem?.defaultUnit || (
            detectedTestName === 'Urea' || detectedTestName === 'Creatinine' ? 'mg/dL' :
            detectedTestName === 'Potassium' || detectedTestName === 'Sodium' ? 'mmol/L' : '%'
          );
          const refLow = catalogItem?.defaultRangeLow ?? 0;
          const refHigh = catalogItem?.defaultRangeHigh ?? 0;
          const cLow = catalogItem?.criticalLowFactor ?? null;
          const cHigh = catalogItem?.criticalHighFactor ?? null;

          const interpretation = interpreter.execute({
            resultValue: detectedTestValue,
            referenceRangeLow: refLow,
            referenceRangeHigh: refHigh,
            criticalLowFactor: cLow,
            criticalHighFactor: cHigh,
          });

          await database.get('lab_results').create((record: any) => {
            record.patientId = id; // Linked to current patient profile
            record.testName = detectedTestName; // e.g., "Urea"
            record.resultValue = parseFloat(String(detectedTestValue)); // e.g., 88.0
            record.recordedAt = new Date().toISOString();

            // Required fields for schema validation:
            record.unit = unit;
            record.referenceRangeLow = refLow;
            record.referenceRangeHigh = refHigh;
            record.interpretation = interpretation;
            record.testDate = new Date();
            record.overrideReason = '';
            record.comments = isManual 
              ? 'مضاف يدوياً عبر شبكة الإدخال السريع الاحتياطية' 
              : 'مستخرج ومضاف تلقائياً عبر ميزة مسح OCR الذكي للتقرير';
            record.attachedImagePath = '';
            record.createdAt = new Date();
            record.updatedAt = new Date();
          });
        }
      });

      showToast(`تم حفظ ${resultsToSave.length} فحص بنجاح في قاعدة البيانات! 🎉`, 'success');
      router.navigate(`/patient/${id}/laboratory`);
    } catch (err) {
      console.error('Failed to save lab results:', err);
      showToast('فشل حفظ نتائج الفحوصات في قاعدة البيانات.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [catalog, id, router, showToast]);

  const handleSaveResults = useCallback(() => {
    saveLabResults(detectedResults, false);
  }, [detectedResults, saveLabResults]);

  const handleSaveManualResults = useCallback(() => {
    const resultsToSave: ParsedLabResult[] = [];
    for (const test of MANUAL_TESTS) {
      const valStr = manualValues[test.key];
      if (valStr && valStr.trim() !== '') {
        const val = parseFloat(valStr);
        if (!isNaN(val)) {
          resultsToSave.push({
            testName: test.key,
            resultValue: val,
          });
        }
      }
    }

    if (resultsToSave.length === 0) {
      showToast('يرجى إدخال قيمة فحص واحدة على الأقل للحفظ.', 'warning');
      return;
    }

    saveLabResults(resultsToSave, true);
  }, [manualValues, saveLabResults, showToast]);

  const handleManualValueChange = useCallback((key: string, val: string) => {
    setManualValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const triggerUploadClick = async () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }

    Alert.alert(
      'مسح تقرير التحاليل',
      'يرجى اختيار مصدر الصورة للتحليل التلقائي:',
      [
        {
          text: 'التقاط صورة بالكاميرا 📸',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              showToast('يجب منح صلاحية الكاميرا لتصوير التقرير الطبي.', 'warning');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: 'images',
              allowsEditing: true,
              quality: 0.9,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
              const uri = result.assets[0].uri;
              processImageSource(uri);
            }
          },
        },
        {
          text: 'اختيار من الاستوديو 🖼️',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              showToast('يجب منح صلاحية الوصول للاستوديو لاختيار الصورة.', 'warning');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: 'images',
              allowsEditing: true,
              quality: 0.9,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
              const uri = result.assets[0].uri;
              processImageSource(uri);
            }
          },
        },
        {
          text: 'إلغاء',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-forward" size={24} color={darkTheme.white} />
          </TouchableOpacity>
          <ArabicText bold style={styles.headerTitle}>
            المسح الذكي والتحليل التلقائي للفحوصات (OCR)
          </ArabicText>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Info Box */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={darkTheme.accent} />
          <View style={styles.infoTextContainer}>
            <ArabicText bold style={styles.infoTitle}>
              كيف تعمل ميزة المسح الذكي؟
            </ArabicText>
            <ArabicText style={styles.infoText}>
              قم برفع صورة تقرير التحاليل، أو الصق النص المستخرج من التقرير في المربع بالأسفل. سيقوم المحرك الذكي بقراءة المكونات واستخراج قيم: اليوريا، الكرياتينين، التراكمي، البوتاسيوم، والصوديوم تلقائياً وحفظها دون إدخال يدوي.
            </ArabicText>
          </View>
        </View>

        {/* hidden web input file */}
        {Platform.OS === 'web' && (
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileChange}
          />
        )}

        {/* Action Panel */}
        <View style={styles.card}>
          <ArabicText bold style={styles.cardTitle}>
            الخيار الأول: مسح ملف الصورة (OCR)
          </ArabicText>
          <TouchableOpacity
            style={[styles.uploadBox, isLoading && styles.uploadBoxDisabled]}
            onPress={triggerUploadClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color={darkTheme.accent} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={48} color={darkTheme.textSecondary} />
            )}
            <ArabicText bold style={styles.uploadText}>
              {isLoading ? 'جاري تحليل الصورة والتعرف على النصوص...' : 'اضغط لاختيار صورة تقرير التحاليل (الويب)'}
            </ArabicText>
            <ArabicText style={styles.uploadSubtext}>
              يدعم تنسيقات JPG, PNG
            </ArabicText>
          </TouchableOpacity>
        </View>

        {/* Text Parser Simulator */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <ArabicText bold style={styles.cardTitle}>
              الخيار الثاني: محاكي وقارئ النصوص
            </ArabicText>
            <TouchableOpacity style={styles.mockBtn} onPress={handleLoadMock}>
              <Ionicons name="flask-outline" size={16} color={darkTheme.white} />
              <ArabicText style={styles.mockBtnText}>تحميل تقرير افتراضي</ArabicText>
            </TouchableOpacity>
          </View>
          
          <ArabicText style={styles.inputLabel}>
            أدخل أو الصق نص تقرير المختبر هنا:
          </ArabicText>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={6}
            value={rawText}
            onChangeText={setRawText}
            placeholder="مثال:
Urea: 88.0 mg/dL (15-45)
Creatinine 1.5 mg/dL"
            placeholderTextColor={darkTheme.textDisabled}
          />

          <TouchableOpacity
            style={styles.parseButton}
            onPress={handleParseText}
          >
            <Ionicons name="thunderstorm-outline" size={20} color={darkTheme.white} />
            <ArabicText bold style={styles.parseButtonText}>
              تشغيل المحرك والتحليل الذكي للنصوص
            </ArabicText>
          </TouchableOpacity>
        </View>

        {/* Results Preview */}
        {detectedResults.length > 0 ? (
          <View style={[styles.card, styles.resultsCard]}>
            <ArabicText bold style={styles.resultsTitle}>
              التحاليل المكتشفة تلقائياً:
            </ArabicText>
            
            {detectedResults.map((res, index) => {
              const catalogItem = catalog.find((c) => c.testNameEn === res.testName);
              const label = catalogItem ? catalogItem.testNameAr : res.testName;
              const unit = catalogItem ? catalogItem.defaultUnit : '';

              return (
                <View key={index} style={styles.resultItem}>
                  <View style={styles.resultRow}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={darkTheme.accent} />
                    <ArabicText bold style={styles.resultTestName}>
                      {label} ({res.testName})
                    </ArabicText>
                  </View>
                  <ArabicText bold style={styles.resultValueText}>
                    {res.resultValue} <ArabicText style={styles.resultUnitText}>{unit}</ArabicText>
                  </ArabicText>
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveResults}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="save-outline" size={22} color="#FFF" />
              )}
              <ArabicText bold style={styles.saveButtonText}>
                {isSaving ? 'جاري تخزين الفحوصات...' : 'حفظ النتائج المستخرجة تلقائياً في السجل'}
              </ArabicText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gridCard}>
            <View style={styles.gridHeader}>
              <Ionicons name="apps-outline" size={20} color={darkTheme.accent} />
              <ArabicText bold style={styles.gridTitle}>
                لوحة الإدخال السريع الاحتياطية (Manual Override Grid)
              </ArabicText>
            </View>
            
            {scanAttempted ? (
              <View style={styles.scanFailedBox}>
                <Ionicons name="warning" size={20} color={darkTheme.white} />
                <ArabicText style={styles.scanFailedText}>
                  لم يتم استخراج فحوصات تلقائياً بسبب جودة الصورة أو وجود أختام. يمكنك كتابة القيم في الشبكة أدناه لحفظها فوراً.
                </ArabicText>
              </View>
            ) : (
              <ArabicText style={styles.gridSubText}>
                يمكنك استخدام لوحة الإدخال السريع هذه لكتابة وتعديل قيم الفحوصات يدوياً وبسرعة:
              </ArabicText>
            )}

            <View style={styles.gridContainer}>
              {MANUAL_TESTS.map((test) => {
                const catalogItem = catalog.find((c) => c.testNameEn === test.key);
                const labelAr = catalogItem ? catalogItem.testNameAr : test.labelAr;
                const unit = catalogItem ? catalogItem.defaultUnit : test.unit;
                const isFocused = activeInput === test.key;

                return (
                  <TouchableOpacity
                    key={test.key}
                    style={[
                      styles.manualCard,
                      isFocused && styles.manualCardFocused
                    ]}
                    activeOpacity={0.9}
                    onPress={() => inputRefs.current[test.key]?.focus()}
                  >
                    <View style={styles.manualCardRight}>
                      <View style={styles.accentIndicator} />
                      <View style={styles.testMeta}>
                        <ArabicText bold style={styles.manualTestAr}>
                          {labelAr}
                        </ArabicText>
                        <ArabicText style={styles.manualTestEn}>
                          {test.labelEn}
                        </ArabicText>
                      </View>
                    </View>

                    <View style={styles.manualCardLeft}>
                      <TextInput
                        ref={(el) => {
                          inputRefs.current[test.key] = el;
                        }}
                        style={[
                          styles.manualInput,
                          isFocused && styles.manualInputFocused
                        ]}
                        value={manualValues[test.key]}
                        onChangeText={(val) => handleManualValueChange(test.key, val)}
                        keyboardType="numeric"
                        placeholder="--"
                        placeholderTextColor={darkTheme.textDisabled}
                        onFocus={() => setActiveInput(test.key)}
                        onBlur={() => setActiveInput(null)}
                      />
                      <ArabicText style={styles.manualUnit}>{unit}</ArabicText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.saveManualButton}
              onPress={handleSaveManualResults}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="cloud-done-outline" size={22} color="#FFF" />
              )}
              <ArabicText bold style={styles.saveButtonText}>
                {isSaving ? 'جاري تخزين الفحوصات...' : 'حفظ وتحديث المؤشرات'}
              </ArabicText>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      <WebCropperModal
        visible={webCropperVisible}
        imageSrc={webImageSrc}
        onClose={() => setWebCropperVisible(false)}
        onCrop={handleWebCropConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: darkTheme.background },
  container: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  backButton: { padding: spacing.xs },
  headerTitle: { fontSize: 18, color: darkTheme.white, flex: 1, textAlign: 'right' },
  infoCard: {
    flexDirection: 'row-reverse',
    backgroundColor: darkTheme.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    gap: spacing.sm,
  },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 15, color: darkTheme.white, textAlign: 'right', marginBottom: 4 },
  infoText: { fontSize: 13, color: darkTheme.textSecondary, textAlign: 'right', lineHeight: 18 },
  card: {
    backgroundColor: darkTheme.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 16, color: darkTheme.white, textAlign: 'right' },
  rowBetween: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  mockBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: darkTheme.slateBlue,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  mockBtnText: { color: darkTheme.white, fontSize: 12 },
  inputLabel: { fontSize: 13, color: darkTheme.textSecondary, textAlign: 'right' },
  textArea: {
    backgroundColor: darkTheme.surfaceSecondary,
    color: darkTheme.textPrimary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.border,
    padding: spacing.sm,
    fontSize: 14,
    textAlign: 'left',
    minHeight: 120,
    fontFamily: 'System',
  },
  parseButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.slateBlue,
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  parseButtonText: { color: darkTheme.white, fontSize: 14 },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: darkTheme.border,
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.surfaceSecondary,
    minHeight: 140,
    gap: spacing.sm,
  },
  uploadBoxDisabled: { opacity: 0.6 },
  uploadText: { fontSize: 14, color: darkTheme.textPrimary, textAlign: 'center' },
  uploadSubtext: { fontSize: 12, color: darkTheme.textDisabled },
  resultsCard: { borderColor: darkTheme.accent, borderWidth: 1.5 },
  resultsTitle: { fontSize: 15, color: darkTheme.white, textAlign: 'right', marginBottom: spacing.xs },
  resultItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: darkTheme.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.border,
    marginBottom: spacing.xs,
  },
  resultRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  resultTestName: { fontSize: 14, color: darkTheme.textPrimary },
  resultValueText: { fontSize: 16, color: darkTheme.white },
  resultUnitText: { fontSize: 12, color: darkTheme.textSecondary },
  saveButton: {
    flexDirection: 'row-reverse',
    backgroundColor: darkTheme.forestGreen,
    padding: spacing.md,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  saveButtonText: { color: darkTheme.white, fontSize: 14 },
  spacer: { height: 60 },
  gridCard: {
    backgroundColor: darkTheme.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    gap: spacing.sm,
  },
  gridHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gridTitle: {
    fontSize: 16,
    color: darkTheme.white,
    textAlign: 'right',
  },
  gridSubText: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  scanFailedBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: darkTheme.dangerBg,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.danger,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  scanFailedText: {
    fontSize: 12,
    color: darkTheme.white,
    textAlign: 'right',
    flex: 1,
  },
  gridContainer: {
    gap: spacing.sm,
  },
  manualCard: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 64,
  },
  manualCardFocused: {
    borderColor: '#10B981',
  },
  manualCardRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  accentIndicator: {
    width: 4,
    height: 36,
    backgroundColor: '#1B6B4A',
    borderRadius: 2,
  },
  testMeta: {
    alignItems: 'flex-end',
  },
  manualTestAr: {
    fontSize: 15,
    color: darkTheme.white,
  },
  manualTestEn: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  manualCardLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  manualInput: {
    backgroundColor: '#0F172A',
    color: darkTheme.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    width: 80,
    height: 36,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'System',
    paddingHorizontal: spacing.xs,
  },
  manualInputFocused: {
    borderColor: '#10B981',
    backgroundColor: '#1E293B',
  },
  manualUnit: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    width: 50,
    textAlign: 'left',
  },
  saveManualButton: {
    flexDirection: 'row-reverse',
    backgroundColor: '#1B6B4A',
    padding: spacing.md,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
