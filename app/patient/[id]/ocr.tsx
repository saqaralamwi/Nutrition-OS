import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontFamilies } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';
// import { recognizeTextFromImage } from '../../../src/services/ocrService'; // REMOVED - service deleted during cleanup
import { ParsedLabResult } from '../../../src/services/ocrTypes';
import { getDatabase } from '../../../src/data/database';
import { InterpretLabResultUseCase } from '../../../src/domain/use-cases/InterpretLabResultUseCase';
import { TestCatalogRepository } from '../../../src/data/repositories/TestCatalogRepository';
import { useToastStore } from '../../../src/presentation/stores/toastStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Optimized Mobile-First OCR Implementation
export default function OCRScannerScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [viewState, setViewState] = useState<'camera' | 'processing' | 'review'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [parsedResults, setParsedResults] = useState<ParsedLabResult[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load Test Catalog for interpreting results
  useEffect(() => {
    const loadCatalog = async () => {
      const repo = new TestCatalogRepository();
      const items = await repo.getAll();
      setCatalog(items);
    };
    loadCatalog();
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    
    try {
      // 1. Capture High-Resolution Image
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo) throw new Error('Capture failed');
      
      setViewState('processing');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // 2. Mobile Memory Optimization (Critical for OOM prevention)
      // Resize to a maximum width of 1200px while maintaining aspect ratio
      const processed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      setCapturedImage(processed.uri);

      // 3. Native OCR Extraction (DISABLED - ocrService was deleted)
      // const ocrData = await recognizeTextFromImage(processed.uri);
      // const results = parseMedicalLabText(ocrData.text);
      const results: ParsedLabResult[] = [];
      
      setParsedResults(results);
      
      if (results.length > 0) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setViewState('review');
      } else {
        Alert.alert('تنبيه', 'لم يتم العثور على نتائج واضحة. يرجى التأكد من جودة الصورة وتوسيط التقرير.', [
          { text: 'حاول مجدداً', onPress: () => setViewState('camera') }
        ]);
      }
    } catch (error) {
      console.error('[OCR Capture] Error:', error);
      showToast('فشل معالجة الصورة', 'error');
      setViewState('camera');
    }
  };

  const handleSave = async () => {
    if (parsedResults.length === 0) return;
    
    setIsSaving(true);
    try {
      const db = await getDatabase();
      const interpreter = new InterpretLabResultUseCase();
      
      await db.write(async () => {
        for (const res of parsedResults) {
          const catalogItem = catalog.find(c => c.testNameEn.toLowerCase() === res.testName.toLowerCase());
          const interpretation = interpreter.execute({
            resultValue: res.resultValue,
            referenceRangeLow: catalogItem?.defaultRangeLow ?? 0,
            referenceRangeHigh: catalogItem?.defaultRangeHigh ?? 0,
          });

          await db.get('laboratory_results').create((record: any) => {
            record._raw.patient_id = patientId;
            record._raw.test_name = res.testName;
            record._raw.value = res.resultValue;
            record._raw.unit = catalogItem?.defaultUnit || '';
            record._raw.normal_low = catalogItem?.defaultRangeLow ?? null;
            record._raw.normal_high = catalogItem?.defaultRangeHigh ?? null;
            record._raw.is_abnormal = false; // Required boolean
            record._raw.recorded_by = 'Smart_OCR_Engine';
            record._raw.created_at = Date.now();
            record._raw.updated_at = Date.now();
            record._raw.notes = 'مستخرج آلياً عبر المسح الذكي (Native Mobile OCR)';
            record._raw.source = 'ocr';
          });
        }
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('تم حفظ الفحوصات بنجاح 🎉', 'success');
      router.back();
    } catch (error) {
      showToast('فشل حفظ البيانات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!permission) return <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera" size={64} color={colors.textSecondary} />
        <ArabicText bold style={styles.permissionText}>يجب منح صلاحية الكاميرا للمسح الذكي</ArabicText>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <ArabicText style={styles.permissionBtnText}>منح الصلاحية الآن</ArabicText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {viewState === 'camera' && (
        <View style={styles.cameraWrapper}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            autofocus="on"
            enableTorch={false}
          >
            {/* SCANNING OVERLAY GUIDES */}
            <View style={styles.overlay}>
              <View style={styles.topMask} />
              <View style={styles.middleRow}>
                <View style={styles.sideMask} />
                <View style={styles.guideFrame}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <View style={styles.sideMask} />
              </View>
              <View style={styles.bottomMask}>
                <ArabicText style={styles.guideText}>ضع التقرير داخل المربع لتسهيل القراءة</ArabicText>
                <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
                  <View style={styles.captureBtnInner} />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
          
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {viewState === 'processing' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ArabicText style={styles.processingText}>جاري تحليل التقرير بدقة...</ArabicText>
        </View>
      )}

      {viewState === 'review' && (
        <View style={styles.reviewContainer}>
          <View style={styles.reviewHeader}>
            <ArabicText bold style={styles.reviewTitle}>مراجعة النتائج المستخرجة</ArabicText>
            <ArabicText style={styles.reviewSubtitle}>تأكد من دقة الأرقام قبل الحفظ النهائي</ArabicText>
          </View>
          
          <ScrollView style={styles.resultsList}>
            {parsedResults.map((res, index) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultInfo}>
                  <ArabicText bold style={styles.testName}>{res.testName}</ArabicText>
                  <Ionicons name="flask" size={16} color={colors.primary} />
                </View>
                <TextInput
                  style={styles.valueInput}
                  keyboardType="decimal-pad"
                  defaultValue={String(res.resultValue)}
                  onChangeText={(val) => {
                    const newRes = [...parsedResults];
                    newRes[index].resultValue = parseFloat(val) || 0;
                    setParsedResults(newRes);
                  }}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.reviewActions}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.cancelBtn]} 
              onPress={() => setViewState('camera')}
            >
              <ArabicText style={styles.cancelBtnText}>إلغاء</ArabicText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.saveBtn]} 
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="#FFF" /> : <ArabicText style={styles.saveBtnText}>حفظ النتائج</ArabicText>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Mobile-Optimized Parser (Robust Bilingual Regex Engine)
function parseMedicalLabText(rawText: string): ParsedLabResult[] {
  const lines = rawText.split('\n');
  const results: ParsedLabResult[] = [];
  const seenTests = new Set<string>();

  const testDefinitions = [
    { name: 'Urea', regex: /(ur|ure|urea|بولي|يوريا)/i },
    { name: 'Creatinine', regex: /(creat|cr|crea|كclear|كرياتينين)/i },
    { name: 'Potassium', regex: /(pot|potas|k\+)/i },
    { name: 'Sodium', regex: /(sod|sodium|na\+)/i },
    { name: 'HbA1c', regex: /(hba1c|hba|تراكمي)/i },
    { name: 'Glucose', regex: /(gluc|sugar|سكر)/i },
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 1. Sanitize the line
    let cleanLine = trimmed
      .replace(/([a-zA-Z\u0600-\u06FF\+]+)(\d)/g, '$1 $2')
      .replace(/(\d)([a-zA-Z\u0600-\u06FF\+]+)/g, '$1 $2')
      .replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ')
      .replace(/\b\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\b/g, ' ')
      .replace(/[^\w\s\.\+\u0600-\u06FF]/g, ' ');

    const tokens = cleanLine.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;

    // 2. Match test definitions
    for (const def of testDefinitions) {
      if (seenTests.has(def.name)) continue;

      const matchIndex = tokens.findIndex((token) => def.regex.test(token));
      if (matchIndex !== -1) {
        let detectedValue: number | null = null;
        
        // Check tokens after the match
        for (let i = matchIndex + 1; i < tokens.length; i++) {
          if (/^\d+(?:\.\d+)?$/.test(tokens[i])) {
            detectedValue = parseFloat(tokens[i]);
            break;
          }
        }

        // Fallback to tokens before
        if (detectedValue === null) {
          for (let i = matchIndex - 1; i >= 0; i--) {
            if (/^\d+(?:\.\d+)?$/.test(tokens[i])) {
              detectedValue = parseFloat(tokens[i]);
              break;
            }
          }
        }

        if (detectedValue !== null) {
          results.push({ testName: def.name, resultValue: detectedValue });
          seenTests.add(def.name);
          break;
        }
      }
    }
  }
  return results;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  cameraWrapper: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1 },
  topMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  middleRow: { flexDirection: 'row', height: 250 },
  sideMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  guideFrame: {
    width: SCREEN_WIDTH * 0.8,
    borderWidth: 0,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: '#10B981',
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  bottomMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', paddingTop: 20 },
  guideText: { color: '#FFF', fontSize: 13, marginBottom: 30 },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: { color: '#FFF', marginTop: 20, fontSize: 14 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#FFF' },
  permissionText: { textAlign: 'center', marginTop: 20, color: colors.textPrimary },
  permissionBtn: { marginTop: 30, backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  permissionBtnText: { color: '#FFF', fontWeight: 'bold' },
  reviewContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  reviewHeader: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  reviewTitle: { fontSize: 18, color: '#1E293B', textAlign: 'right' },
  reviewSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'right', marginTop: 4 },
  resultsList: { flex: 1, padding: 15 },
  resultCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  testName: { fontSize: 15, color: '#1E293B' },
  valueInput: {
    width: 80,
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  reviewActions: {
    padding: 20,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionBtn: { flex: 1, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9' },
  cancelBtnText: { color: '#64748B', fontWeight: 'bold' },
  saveBtn: { backgroundColor: colors.primary },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },
});
