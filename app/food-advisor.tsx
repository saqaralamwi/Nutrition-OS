import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { watchRecord } from '../src/data/database/observe';
import { FoodRepository } from '../src/data/repositories/FoodRepository';
import Food from '../src/data/models/Food';
import Patient from '../src/data/models/Patient';
import { FoodAdvisorEngine } from '../src/domain/clinical/advisor/FoodAdvisorEngine';
import type { IFoodAdvisorResult, SuitabilityScore, ISuitabilityExplanation } from '../src/domain/clinical/advisor/FoodAdvisorEngine';
import { colors, spacing, safeHeaderPaddingTop, fontFamilies } from '../src/presentation/theme';
import ArabicText from '../src/presentation/components/ArabicText';
import { useToastStore } from '../src/presentation/stores/toastStore';

const SUITABILITY_LABELS: Record<SuitabilityScore, { label: string; labelAr: string; color: string; bg: string; icon: string }> = {
  green: { label: 'Suitable', labelAr: 'مناسب', color: '#4ADE80', bg: '#052E16', icon: 'checkmark-circle' },
  orange: { label: 'Caution', labelAr: 'بحذر', color: '#FB923C', bg: '#431407', icon: 'alert-circle' },
  red: { label: 'Unsuitable', labelAr: 'غير مناسب', color: '#F87171', bg: '#450A0A', icon: 'close-circle' },
};

function suitColor(s: SuitabilityScore): string { return SUITABILITY_LABELS[s].color; }
function suitBg(s: SuitabilityScore): string { return SUITABILITY_LABELS[s].bg; }

export default function FoodAdvisorScreen() {
  const router = useRouter();
  const { patientId: paramPatientId } = useLocalSearchParams<{ patientId?: string }>();
  const routePatientId = paramPatientId || '';
  const showToast = useToastStore((s) => s.showToast);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [advisorResult, setAdvisorResult] = useState<IFoodAdvisorResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);

  const searchSubjectRef = useRef<Subject<string> | null>(null);

  useEffect(() => {
    if (routePatientId) {
      const sub = watchRecord<Patient>('patients', routePatientId).subscribe({
        next: (p) => setPatient(p),
      });
      return () => sub.unsubscribe();
    }
  }, [routePatientId]);

  useEffect(() => {
    const subject = new Subject<string>();
    searchSubjectRef.current = subject;

    const stream = subject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) => {
        if (!q.trim()) return of([] as Food[]);
        setIsSearching(true);
        return FoodRepository.searchFoods(q).then(
          (r) => { setIsSearching(false); return r; },
          () => { setIsSearching(false); showToast('خطأ في البحث', 'error'); return []; },
        );
      }),
    ).subscribe({ next: (r) => setResults(r) });

    return () => stream.unsubscribe();
  }, [showToast]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    searchSubjectRef.current?.next(text);
  }, []);

  const handleAnalyze = useCallback(async (food: Food) => {
    if (!routePatientId) {
      showToast('الرجاء تحديد مريض للتحليل السريري', 'error');
      return;
    }
    setSelectedFood(food);
    setShowModal(true);
    setIsAnalyzing(true);
    setAdvisorResult(null);
    try {
      const result = await FoodAdvisorEngine.analyze(food.id, routePatientId);
      setAdvisorResult(result);
    } catch (err: any) {
      showToast(err?.message || 'فشل التحليل السريري', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [routePatientId, showToast]);

  const renderExplanations = (explanations: ISuitabilityExplanation[], score: SuitabilityScore) => {
    return explanations.map((ex, i) => {
      let icon: string;
      let iconColor: string;
      switch (ex.type) {
        case 'benefit':
          icon = 'checkmark-circle';
          iconColor = '#4ADE80';
          break;
        case 'caution':
          icon = 'alert-circle';
          iconColor = '#FB923C';
          break;
        case 'contraindication':
          icon = 'close-circle';
          iconColor = '#F87171';
          break;
        case 'guideline_match':
          icon = 'book';
          iconColor = '#7C3AED';
          break;
        default:
          icon = 'information-circle';
          iconColor = '#94A3B8';
      }
      return (
        <View key={i} style={styles.explanationRow}>
          <Ionicons name={icon as any} size={16} color={iconColor} />
          <Text style={[styles.explanationText, ex.type === 'contraindication' && { color: '#F87171' }]}>
            {ex.message}
          </Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ArabicText bold style={styles.headerTitle}>المستشار الغذائي السريري</ArabicText>
          <ArabicText style={styles.headerSubtitle}>ابحث عن طعام أو مكمل غذائي</ArabicText>
        </View>
        {patient && (
          <View style={styles.patientBadge}>
            <Ionicons name="person" size={14} color="#0D9488" />
            <Text style={styles.patientBadgeText} numberOfLines={1}>{patient.fullName}</Text>
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن طعام أو مكمل..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={handleSearchChange}
          textAlign="right"
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {patient && (
        <View style={styles.patientContextCard}>
          <Ionicons name="person-circle" size={20} color="#0D9488" />
          <View style={styles.patientContextInfo}>
            <ArabicText style={styles.patientContextName}>
              التحليل لـ: {patient.fullName}
            </ArabicText>
            <ArabicText style={styles.patientContextDiag}>
              التشخيص: {patient.primaryDiagnosis || 'غير محدد'}
            </ArabicText>
          </View>
          <View style={styles.patientContextActive}>
            <View style={styles.activeDot} />
            <ArabicText style={styles.patientContextActiveText}>نشط</ArabicText>
          </View>
        </View>
      )}

      {!routePatientId && (
        <View style={styles.noPatientCard}>
          <Ionicons name="person-outline" size={20} color="#7C3AED" />
          <ArabicText style={styles.noPatientText}>
            لتحليل توافق الطعام مع حالة المريض، يرجى فتح المستشار الغذائي من ملف المريض
          </ArabicText>
        </View>
      )}

      {isSearching && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.accentTeal} />
          <ArabicText style={styles.loadingText}>جاري البحث...</ArabicText>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {results.length === 0 && searchQuery.trim().length > 0 && !isSearching && (
          <View style={styles.emptyCard}>
            <Ionicons name="search-outline" size={48} color="#334155" />
            <ArabicText style={styles.emptyText}>لا توجد نتائج مطابقة لـ "{searchQuery}"</ArabicText>
          </View>
        )}

        {results.length === 0 && searchQuery.trim().length === 0 && !isSearching && (
          <View style={styles.emptyCard}>
            <Ionicons name="restaurant-outline" size={48} color="#334155" />
            <ArabicText style={styles.emptyText}>ابدأ بالبحث للحصول على تحليل سريري للطعام</ArabicText>
          </View>
        )}

        {results.map((food) => (
          <View key={food.id} style={styles.foodCard}>
            <View style={styles.foodCardHeader}>
              <Text style={styles.foodName}>{food.nameAr}</Text>
              {food.categoryAr && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{food.categoryAr}</Text>
                </View>
              )}
            </View>

            <View style={styles.macroRow}>
              <MacroChip label="سعرات" value={`${Math.round(food.calories)}`} unit="" icon="flame" />
              <MacroChip label="بروتين" value={`${food.proteinG.toFixed(1)}`} unit="جم" icon="fitness" />
              <MacroChip label="كربوهيدرات" value={`${food.carbsG.toFixed(1)}`} unit="جم" icon="pulse" />
              <MacroChip label="دهون" value={`${food.fatG.toFixed(1)}`} unit="جم" icon="water" />
            </View>

            <TouchableOpacity
              style={[styles.analyzeButton, !routePatientId && styles.analyzeButtonDisabled]}
              onPress={() => handleAnalyze(food)}
            >
              <Ionicons name="search-circle" size={18} color="#F8FAFC" />
              <ArabicText style={styles.analyzeButtonText}>تحليل سريري</ArabicText>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ArabicText bold style={styles.modalTitle}>
                {selectedFood?.nameAr || ''}
              </ArabicText>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {isAnalyzing && (
              <View style={styles.analysisLoading}>
                <ActivityIndicator size="large" color={colors.accentTeal} />
                <ArabicText style={styles.analysisLoadingText}>
                  جاري التحليل السريري وفقاً لحالة المريض...
                </ArabicText>
              </View>
            )}

            {advisorResult && !isAnalyzing && (
              <ScrollView style={styles.analysisContent}>
                {patient && (
                  <View style={styles.patientRefBanner}>
                    <Ionicons name="person" size={14} color="#0D9488" />
                    <Text style={styles.patientRefText}>
                      تحليل لـ {advisorResult.patientName} — {advisorResult.conditionAr}
                    </Text>
                  </View>
                )}

                <View style={[styles.suitabilityCard, { borderColor: suitColor(advisorResult.suitabilityScore), backgroundColor: suitBg(advisorResult.suitabilityScore) }]}>
                  <View style={styles.suitabilityHeader}>
                    <Ionicons
                      name={SUITABILITY_LABELS[advisorResult.suitabilityScore].icon as any}
                      size={28}
                      color={suitColor(advisorResult.suitabilityScore)}
                    />
                    <View style={styles.suitabilityScoreCol}>
                      <Text style={[styles.suitabilityScoreLabel, { color: suitColor(advisorResult.suitabilityScore) }]}>
                        درجة التوافق
                      </Text>
                      <Text style={[styles.suitabilityScoreValue, { color: suitColor(advisorResult.suitabilityScore) }]}>
                        {SUITABILITY_LABELS[advisorResult.suitabilityScore].labelAr}
                      </Text>
                    </View>
                  </View>
                  {advisorResult.servingRecommendation && (
                    <View style={styles.suitabilityServing}>
                      <Ionicons name="scale" size={16} color={suitColor(advisorResult.suitabilityScore)} />
                      <Text style={[styles.suitabilityServingText, { color: suitColor(advisorResult.suitabilityScore) }]}>
                        {advisorResult.servingRecommendation}
                      </Text>
                    </View>
                  )}
                </View>

                {advisorResult.explanations.length > 0 && (
                  <View style={styles.explanationsCard}>
                    <ArabicText bold style={styles.sectionTitle}>
                      <Ionicons name="analytics" size={16} color="#0D9488" /> تحليل التوافق
                    </ArabicText>
                    {renderExplanations(advisorResult.explanations, advisorResult.suitabilityScore)}
                  </View>
                )}

                {advisorResult.matchedGuidelines.length > 0 && (
                  <View style={styles.guidelinesCard}>
                    <ArabicText bold style={styles.sectionTitle}>
                      <Ionicons name="book" size={16} color="#7C3AED" /> الإرشادات السريرية المطابقة
                    </ArabicText>
                    {advisorResult.matchedGuidelines.map((g, i) => (
                      <View key={i} style={styles.guidelineRow}>
                        <Text style={styles.guidelineBullet}>•</Text>
                        <Text style={styles.guidelineText}>{g}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.nutritionCard}>
                  <ArabicText bold style={styles.sectionTitle}>
                    <Ionicons name="stats-chart" size={16} color="#0D9488" /> القيمة الغذائية
                  </ArabicText>
                  <View style={styles.nutritionGrid}>
                    {[
                      `السعرات: ${Math.round(selectedFood?.calories || 0)} كيلو سعر`,
                      `بروتين: ${(selectedFood?.proteinG || 0).toFixed(1)} جم`,
                      `كربوهيدرات: ${(selectedFood?.carbsG || 0).toFixed(1)} جم`,
                      `دهون: ${(selectedFood?.fatG || 0).toFixed(1)} جم`,
                      selectedFood?.fiberG ? `ألياف: ${selectedFood.fiberG.toFixed(1)} جم` : null,
                      selectedFood?.sodiumMg ? `صوديوم: ${Math.round(selectedFood.sodiumMg)} ملجم` : null,
                      selectedFood?.potassiumMg ? `بوتاسيوم: ${Math.round(selectedFood.potassiumMg)} ملجم` : null,
                    ].filter(Boolean).map((h, i) => (
                      <View key={i} style={styles.nutritionItem}>
                        <Text style={styles.nutritionDot}>•</Text>
                        <Text style={styles.nutritionText}>{h}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {advisorResult.macroConflicts.length > 0 && (
                  <View style={styles.conflictsCard}>
                    <ArabicText bold style={styles.conflictsTitle}>⚠️ تعارضات غذائية</ArabicText>
                    {advisorResult.macroConflicts.map((c, i) => (
                      <Text key={i} style={styles.conflictText}>{c}</Text>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MacroChip({ label, value, unit, icon }: { label: string; value: string; unit: string; icon: string }) {
  return (
    <View style={styles.macroChip}>
      <Ionicons name={icon as any} size={12} color="#64748B" />
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}<Text style={styles.macroUnit}> {unit}</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', paddingTop: safeHeaderPaddingTop },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#1E293B', backgroundColor: '#0F172A',
  },
  backButton: { padding: spacing.xs },
  headerTitle: { fontSize: 18, color: '#F8FAFC', fontFamily: fontFamilies.bold, textAlign: 'right' },
  headerSubtitle: { fontSize: 11, color: '#94A3B8', textAlign: 'right', marginTop: 2, fontFamily: fontFamilies.regular },
  patientBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B',
    borderRadius: 6, paddingVertical: 4, paddingHorizontal: spacing.sm, gap: 4,
  },
  patientBadgeText: { fontSize: 11, color: '#0D9488', fontFamily: fontFamilies.regular, maxWidth: 80 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B',
    borderRadius: 12, marginHorizontal: spacing.md, marginTop: spacing.md,
    paddingHorizontal: spacing.md, borderWidth: 1, borderColor: '#334155',
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, height: 48, color: '#F8FAFC', fontSize: 15, fontFamily: fontFamilies.regular },
  clearButton: { padding: 4 },
  patientContextCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D9488',
    borderRadius: 10, marginHorizontal: spacing.md, marginTop: spacing.sm,
    padding: spacing.sm, gap: spacing.sm,
  },
  patientContextInfo: { flex: 1 },
  patientContextName: { fontSize: 13, color: '#F8FAFC', fontFamily: fontFamilies.bold, textAlign: 'right' },
  patientContextDiag: { fontSize: 11, color: '#CCFBF1', fontFamily: fontFamilies.regular, textAlign: 'right' },
  patientContextActive: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  patientContextActiveText: { fontSize: 10, color: '#CCFBF1', fontFamily: fontFamilies.regular },
  noPatientCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1917',
    borderRadius: 10, marginHorizontal: spacing.md, marginTop: spacing.sm,
    padding: spacing.sm, gap: spacing.sm, borderWidth: 1, borderColor: '#7C3AED',
  },
  noPatientText: { fontSize: 11, color: '#A78BFA', fontFamily: fontFamilies.regular, flex: 1, textAlign: 'right' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  loadingText: { fontSize: 13, color: '#94A3B8', fontFamily: fontFamilies.regular },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl * 2, gap: spacing.md },
  emptyCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  emptyText: { fontSize: 14, color: '#E2E8F0', textAlign: 'center', marginTop: spacing.md, fontFamily: fontFamilies.regular },
  foodCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: spacing.md, borderWidth: 1, borderColor: '#334155' },
  foodCardHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  foodName: { fontSize: 16, color: '#F8FAFC', fontFamily: fontFamilies.bold, textAlign: 'right', flex: 1 },
  categoryBadge: { backgroundColor: '#1A2332', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8, borderWidth: 1, borderColor: '#334155' },
  categoryText: { fontSize: 10, color: '#94A3B8', fontFamily: fontFamilies.regular },
  macroRow: { flexDirection: 'row-reverse', gap: spacing.xs, marginBottom: spacing.sm, flexWrap: 'wrap' },
  macroChip: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 6, paddingVertical: 4, paddingHorizontal: spacing.sm, gap: 4, borderWidth: 1, borderColor: '#334155' },
  macroLabel: { fontSize: 10, color: '#64748B', fontFamily: fontFamilies.regular },
  macroValue: { fontSize: 11, color: '#E2E8F0', fontFamily: fontFamilies.bold },
  macroUnit: { fontSize: 9, color: '#64748B', fontFamily: fontFamilies.regular },
  analyzeButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D9488', borderRadius: 8, paddingVertical: spacing.sm, gap: spacing.xs },
  analyzeButtonDisabled: { opacity: 0.4 },
  analyzeButtonText: { fontSize: 13, color: '#F8FAFC', fontFamily: fontFamilies.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.md },
  modalContainer: { backgroundColor: '#1E293B', borderRadius: 16, maxHeight: '85%', borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalTitle: { fontSize: 16, color: '#F8FAFC', flex: 1, textAlign: 'right', fontFamily: fontFamilies.bold },
  analysisLoading: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  analysisLoadingText: { fontSize: 14, color: '#94A3B8', fontFamily: fontFamilies.regular },
  analysisContent: { padding: spacing.md },
  patientRefBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#0F172A', borderRadius: 8, padding: spacing.sm,
    marginBottom: spacing.md, borderWidth: 1, borderColor: '#0D9488',
  },
  patientRefText: { fontSize: 12, color: '#4ADE80', fontFamily: fontFamilies.bold, flex: 1, textAlign: 'right' },
  suitabilityCard: {
    borderRadius: 14, padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 2,
  },
  suitabilityHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  suitabilityScoreCol: { flex: 1 },
  suitabilityScoreLabel: { fontSize: 11, fontFamily: fontFamilies.regular },
  suitabilityScoreValue: { fontSize: 20, fontFamily: fontFamilies.black },
  suitabilityServing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  suitabilityServingText: { fontSize: 12, fontFamily: fontFamilies.bold, flex: 1, textAlign: 'right' },
  explanationsCard: {
    backgroundColor: '#0F172A', borderRadius: 12, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: '#334155',
  },
  sectionTitle: { fontSize: 14, color: '#F8FAFC', fontFamily: fontFamilies.bold, textAlign: 'right', marginBottom: spacing.sm },
  explanationRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.xs, marginVertical: 3 },
  explanationText: { fontSize: 12, color: '#E2E8F0', fontFamily: fontFamilies.regular, textAlign: 'right', flex: 1, lineHeight: 18 },
  guidelinesCard: {
    backgroundColor: '#1C1917', borderRadius: 12, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: '#7C3AED',
  },
  guidelineRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.xs, marginVertical: 2 },
  guidelineBullet: { fontSize: 14, color: '#7C3AED' },
  guidelineText: { fontSize: 12, color: '#C4B5FD', fontFamily: fontFamilies.regular, textAlign: 'right', flex: 1, lineHeight: 18 },
  nutritionCard: { backgroundColor: '#0F172A', borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: '#334155' },
  nutritionGrid: { gap: 4 },
  nutritionItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  nutritionDot: { fontSize: 14, color: '#0D9488' },
  nutritionText: { fontSize: 13, color: '#E2E8F0', fontFamily: fontFamilies.regular, textAlign: 'right' },
  conflictsCard: { backgroundColor: '#450A0A', borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1.5, borderColor: '#DC2626' },
  conflictsTitle: { fontSize: 14, color: '#FCA5A5', fontFamily: fontFamilies.bold, textAlign: 'right', marginBottom: spacing.xs },
  conflictText: { fontSize: 12, color: '#FCA5A5', fontFamily: fontFamilies.regular, textAlign: 'right', lineHeight: 18, marginBottom: 4 },
});
