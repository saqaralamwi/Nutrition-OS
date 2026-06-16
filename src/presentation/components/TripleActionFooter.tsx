import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamilies } from '../theme';
import ArabicText from './ArabicText';
import { PatientRepository } from '../../data/repositories/PatientRepository';
import { usePatientStore } from '../stores/patientStore';
import { useAppTheme } from '../hooks/useAppTheme';

const AnimatedArabicText = Animated.createAnimatedComponent(ArabicText);

interface TripleActionFooterProps {
  patientId?: string; // undefined during new patient creation
  screenKey: string; // 'new' | 'medical-history' | 'social-history' | 'physical-exam' | 'laboratory' | 'medications' | 'calculations' | 'intervention'
  onSave: (status: 'complete' | 'incomplete') => Promise<string | undefined>;
  isSaving: boolean;
  isValid?: boolean;
}

const SECTION_NAMES: Record<string, string> = {
  'new': 'البيانات الأساسية',
  'medical-history': 'التاريخ المرضي',
  'social-history': 'التاريخ الاجتماعي والنمط',
  'physical-exam': 'الفحص السريري والفيزيائي',
  'laboratory': 'الفحوصات المخبرية',
  'medications': 'الأدوية والمكملات',
  'calculations': 'حسابات الطاقة التفصيلية',
  'intervention': 'خطة التدخل التغذوي',
};

const PIPELINE_SEQUENCE: Record<string, string> = {
  'new': '/patient/[id]/medical-history',
  'medical-history': '/patient/[id]/social-history',
  'social-history': '/patient/[id]/physical-exam',
  'physical-exam': '/patient/[id]/laboratory',
  'laboratory': '/patient/[id]/medications',
  'medications': '/patient/[id]/calculations',
  'calculations': '/patient/[id]/intervention',
  'intervention': '/patient/[id]', // final step routes to active patient dashboard
};

const ADJACENT_SECTIONS = [
  { label: 'التاريخ المرضي', value: 'medical-history', pathname: '/patient/[id]/medical-history' },
  { label: 'التاريخ الاجتماعي والنمط', value: 'social-history', pathname: '/patient/[id]/social-history' },
  { label: 'الفحص السريري والفيزيائي', value: 'physical-exam', pathname: '/patient/[id]/physical-exam' },
  { label: 'الفحوصات المخبرية', value: 'laboratory', pathname: '/patient/[id]/laboratory' },
  { label: 'الأدوية والمكملات', value: 'medications', pathname: '/patient/[id]/medications' },
  { label: 'حسابات الطاقة التفصيلية', value: 'calculations', pathname: '/patient/[id]/calculations' },
  { label: 'خطة التدخل التغذوي', value: 'intervention', pathname: '/patient/[id]/intervention' },
];

export default function TripleActionFooter({
  patientId,
  screenKey,
  onSave,
  isSaving,
  isValid = true,
}: TripleActionFooterProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);
  const showToast = usePatientStore((s) => s.showToast);

  const updatePatientTracking = async (id: string, actionType: 'draft' | 'advance') => {
    const repo = new PatientRepository();
    const patient = await repo.findById(id);
    if (!patient) return;

    let incomplete = patient.incompleteSections ? [...patient.incompleteSections] : [];
    
    // For Draft: make sure the current screen is in the list
    if (actionType === 'draft') {
      if (screenKey !== 'new' && !incomplete.includes(screenKey)) {
        incomplete.push(screenKey);
      }
      patient.status = 'incomplete';
    } else {
      // For Save and Continue / Custom jump: remove current screen from missing list
      incomplete = incomplete.filter((x) => x !== screenKey);
      if (incomplete.length === 0) {
        patient.status = 'complete';
      } else {
        patient.status = 'incomplete'; // Keep incomplete if other parts are missing
      }
    }
    
    patient.incompleteSections = incomplete;
    await repo.update(patient);
  };

  const handleAction1 = async () => {
    // 1. Save as Draft
    try {
      setLocalSaving(true);
      const savedId = await onSave('incomplete');
      if (!savedId) return;

      await updatePatientTracking(savedId, 'draft');
      showToast('تم حفظ التغييرات كمسودة غير مكتملة', 'success');
      router.replace({ pathname: '/patient/[id]', params: { id: savedId } });
    } catch (e) {
      console.error('Action 1 failed:', e);
      showToast('فشل في حفظ المسودة', 'error');
    } finally {
      setLocalSaving(false);
    }
  };

  const handleAction2 = async () => {
    // 2. Save and Continue
    try {
      setLocalSaving(true);
      const savedId = await onSave('complete');
      if (!savedId) return;

      await updatePatientTracking(savedId, 'advance');

      const nextRoute = PIPELINE_SEQUENCE[screenKey];
      if (nextRoute === '/patient/[id]') {
        showToast('تم إكمال وحفظ الملف السريري بنجاح 🚀', 'success');
        router.replace({ pathname: '/patient/[id]', params: { id: savedId } });
      } else {
        showToast('تم الحفظ، جاري الانتقال للقسم التالي...', 'success');
        router.replace({ pathname: nextRoute as any, params: { id: savedId } });
      }
    } catch (e) {
      console.error('Action 2 failed:', e);
      showToast('فشل في الحفظ والاستمرار', 'error');
    } finally {
      setLocalSaving(false);
    }
  };

  const handleAction3 = () => {
    // 3. Open custom jump dropdown
    setShowMenu(true);
  };

  const handleCustomJump = async (targetPath: string, targetValue: string) => {
    setShowMenu(false);
    try {
      setLocalSaving(true);
      const savedId = await onSave('complete');
      if (!savedId) return;

      await updatePatientTracking(savedId, 'advance');

      showToast(`تم الحفظ، جاري الانتقال إلى ${SECTION_NAMES[targetValue]}...`, 'success');
      router.replace({ pathname: targetPath as any, params: { id: savedId } });
    } catch (e) {
      console.error('Custom jump failed:', e);
      showToast('فشل في الحفظ والانتقال المخصص', 'error');
    } finally {
      setLocalSaving(false);
    }
  };

  const activeSaving = isSaving || localSaving;
  const { animatedCard, animatedText, animatedSubtext } = useAppTheme();

  return (
    <Animated.View style={[styles.container, animatedCard]}>
      {/* Action 2: Solid Forest Green Save and Continue */}
      <TouchableOpacity
        style={[styles.btn, styles.btnGreen, (!isValid || activeSaving) && styles.btnDisabled]}
        onPress={handleAction2}
        disabled={!isValid || activeSaving}
        activeOpacity={0.8}
      >
        {activeSaving ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Ionicons name="rocket-outline" size={18} color="#FFF" />
            <ArabicText bold style={styles.btnGreenText}>
              حفظ واستمرار (التالي)
            </ArabicText>
          </>
        )}
      </TouchableOpacity>

      {/* Row for Draft and Custom Jumps */}
      <View style={styles.row}>
        {/* Action 1: Outlined Amber Draft Button */}
        <TouchableOpacity
          style={[styles.rowBtn, styles.btnAmber, activeSaving && styles.btnDisabled]}
          onPress={handleAction1}
          disabled={activeSaving}
          activeOpacity={0.8}
        >
          <Ionicons name="save-outline" size={16} color="#D97706" />
          <ArabicText style={styles.btnAmberText}>
            حفظ كمسودة
          </ArabicText>
        </TouchableOpacity>

        {/* Action 3: Slate gray Custom Jump Button */}
        <TouchableOpacity
          style={[styles.rowBtn, styles.btnSlate, activeSaving && styles.btnDisabled]}
          onPress={handleAction3}
          disabled={activeSaving}
          activeOpacity={0.8}
        >
          <Ionicons name="git-branch-outline" size={16} color="#4B5563" />
          <ArabicText style={styles.btnSlateText}>
            انتقال مخصص...
          </ArabicText>
        </TouchableOpacity>
      </View>

      {/* Stylized Dropdown Popover Modal */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <Animated.View style={[styles.modalContent, animatedCard]}>
            <AnimatedArabicText bold style={[styles.modalTitle, animatedText]}>
              حفظ والانتقال المخصص إلى:
            </AnimatedArabicText>
            <ScrollView style={styles.menuScroll}>
              {ADJACENT_SECTIONS.filter((s) => s.value !== screenKey).map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.menuItem}
                  onPress={() => handleCustomJump(item.pathname, item.value)}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.primary} />
                  <AnimatedArabicText style={[styles.menuItemText, animatedText]}>{item.label}</AnimatedArabicText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowMenu(false)}>
              <AnimatedArabicText bold style={[styles.closeBtnText, animatedSubtext]}>
                إلغاء
              </AnimatedArabicText>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
    minHeight: 48,
  },
  rowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm + 2,
    borderRadius: 8,
    gap: spacing.xs,
    minHeight: 44,
  },
  btnGreen: {
    backgroundColor: '#15803D', // Forest Green
  },
  btnGreenText: {
    color: '#FFF',
    fontSize: 15,
  },
  btnAmber: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  btnAmberText: {
    color: '#D97706',
    fontSize: 13,
    fontFamily: fontFamilies?.medium || 'System',
  },
  btnSlate: {
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
  },
  btnSlateText: {
    color: '#4B5563',
    fontSize: 13,
    fontFamily: fontFamilies?.medium || 'System',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    textAlign: 'right',
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  menuScroll: {
    gap: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  menuItemText: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  closeBtn: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
