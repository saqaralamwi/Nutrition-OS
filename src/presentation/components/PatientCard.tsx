import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Patient } from '../../domain/entities/Patient';
import { colors, spacing } from '../theme';
import { useAppTheme } from '../hooks/useAppTheme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface PatientCardProps {
  patient: Patient;
  onPress: (patient: Patient) => void;
  onDelete?: (id: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  discharged: 'منتهي',
  'follow-up': 'متابعة',
};

const STATUS_COLORS: Record<string, string> = {
  active: colors.success,
  discharged: colors.textDisabled,
  'follow-up': colors.info,
};

const DEPARTMENT_LABELS: Record<string, string> = {
  ICU: 'عناية مركزة',
  Internal: 'داخلي',
  Surgical: 'جراحي',
  Pediatrics: 'أطفال',
  'OB/GYN': 'نساء وتوليد',
  Outpatient: 'عيادات خارجية',
};

export default function PatientCard({ patient, onPress, onDelete }: PatientCardProps) {
  const { animatedCard, animatedText, animatedSubtext } = useAppTheme();
  const deptLabel = DEPARTMENT_LABELS[patient.department] || patient.department;
  const statusLabel = STATUS_LABELS[patient.status] || patient.status;
  const statusColor = STATUS_COLORS[patient.status] || colors.textDisabled;

  const getDisplayDate = (dateVal: any) => {
    if (!dateVal) {
      return new Date().toLocaleDateString('ar-YE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime()) || d.getTime() <= 0 || d.getFullYear() === 1970) {
      return new Date().toLocaleDateString('ar-YE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return d.toLocaleDateString('ar-YE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const admissionDate = getDisplayDate(patient.admissionDate);

  return (
    <AnimatedTouchableOpacity
      style={[styles.card, animatedCard]}
      onPress={() => onPress(patient)}
      onLongPress={() => onDelete?.(patient.id)}
      activeOpacity={0.7}
      accessibilityLabel={`${patient.fullName}، رقم الملف ${patient.fileNumber}`}
    >
      <View style={styles.header}>
        <Animated.Text style={[styles.fileNumber, animatedSubtext]}>{patient.fileNumber}</Animated.Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      <Animated.Text style={[styles.name, animatedText]}>{patient.fullName}</Animated.Text>

      <View style={styles.footer}>
        <Animated.Text style={[styles.meta, animatedSubtext]}>
          {deptLabel} · {admissionDate}
        </Animated.Text>
        <Animated.Text style={[styles.meta, animatedSubtext]}>{patient.age} سنة</Animated.Text>
      </View>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  fileNumber: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: colors.surface,
    fontWeight: '700',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
