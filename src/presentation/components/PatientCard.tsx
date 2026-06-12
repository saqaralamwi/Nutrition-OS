import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Patient } from '../../domain/entities/Patient';
import { colors, spacing } from '../theme';

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
  const deptLabel = DEPARTMENT_LABELS[patient.department] || patient.department;
  const statusLabel = STATUS_LABELS[patient.status] || patient.status;
  const statusColor = STATUS_COLORS[patient.status] || colors.textDisabled;

  const admissionDate = new Date(patient.admissionDate).toLocaleDateString(
    'ar-SA',
    { day: '2-digit', month: '2-digit', year: 'numeric' }
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(patient)}
      onLongPress={() => onDelete?.(patient.id)}
      activeOpacity={0.7}
      accessibilityLabel={`${patient.fullName}، رقم الملف ${patient.fileNumber}`}
    >
      <View style={styles.header}>
        <Text style={styles.fileNumber}>{patient.fileNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.name}>{patient.fullName}</Text>

      <View style={styles.footer}>
        <Text style={styles.meta}>
          {deptLabel} · {admissionDate}
        </Text>
        <Text style={styles.meta}>{patient.age} سنة</Text>
      </View>
    </TouchableOpacity>
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
