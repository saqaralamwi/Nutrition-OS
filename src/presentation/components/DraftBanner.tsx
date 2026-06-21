import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { colors, spacing, fontFamilies } from '../theme';
import { DraftInfo, dismissAllDrafts } from '../../data/repositories/DraftRepository';

interface DraftBannerProps {
  drafts: DraftInfo[];
  patientId: string;
}

export default function DraftBanner({ drafts, patientId }: DraftBannerProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const activeDrafts = drafts.filter((d) => d.hasDraft);

  useEffect(() => {
    if (activeDrafts.length > 0) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(-200);
    }
  }, [activeDrafts.length]);

  if (activeDrafts.length === 0) return null;

  const handleDismissAll = () => {
    Alert.alert(
      'تجاهل المسودات',
      'هل تريد تجاهل جميع المسودات غير المحفوظة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تجاهل الكل',
          style: 'destructive',
          onPress: async () => {
            await dismissAllDrafts(patientId);
          },
        },
      ],
    );
  };

  const formatTime = (ts: number | null): string => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="document-text-outline" size={18} color={colors.warning} />
          <Text style={styles.headerText}>
            مسودات غير مكتملة ({activeDrafts.length})
          </Text>
        </View>
        <TouchableOpacity onPress={handleDismissAll} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>تجاهل الكل</Text>
        </TouchableOpacity>
      </View>
      {activeDrafts.map((draft) => (
        <TouchableOpacity
          key={draft.screenKey}
          style={styles.draftRow}
          onPress={() => router.push(`/patient/${patientId}/${draft.moduleRoute}`)}
        >
          <Ionicons name="time-outline" size={16} color={colors.textDisabled} />
          <Text style={styles.draftLabel}>{draft.label}</Text>
          {draft.lastSavedAt && (
            <Text style={styles.draftTime}>{formatTime(draft.lastSavedAt)}</Text>
          )}
          <Text style={styles.resumeText}>استئناف</Text>
          <Ionicons name="arrow-back" size={14} color={colors.accentTeal} />
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning + '60',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.warning + '15',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerText: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.warning,
  },
  dismissBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dismissText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.textDisabled,
    textDecorationLine: 'underline',
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  draftLabel: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.textPrimary,
  },
  draftTime: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.textDisabled,
    marginRight: spacing.sm,
  },
  resumeText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.accentTeal,
    marginRight: 2,
  },
});
