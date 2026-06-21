import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafePatientId } from '../../../src/presentation/hooks/useSafePatientId';
import { watchRecord } from '../../../src/data/database/observe';
import { useObservable } from '../../../src/presentation/hooks/useObservable';
import PediatricMeasurementForm from '../../../src/presentation/components/PediatricMeasurementForm';
import { colors, spacing, safeHeaderPaddingTop, fontFamilies } from '../../../src/presentation/theme';
import ArabicText from '../../../src/presentation/components/ArabicText';

export default function PediatricMeasurementFormScreen() {
  const patientId = useSafePatientId();
  const router = useRouter();

  // Watch patient data using observation hook
  const patient = useObservable(
    useMemo(() => watchRecord<any>('patients', patientId), [patientId]),
    null
  );

  if (!patient) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const gender = patient.gender === 'female' ? 'female' : 'male';
  const ageMonths = Math.round(patient.age * 12);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ArabicText bold style={styles.headerTitle}>إدخال قياسات النمو للأطفال</ArabicText>
          <ArabicText style={styles.headerSubtitle}>
            {patient.fullName} | {patient.fileNumber}
          </ArabicText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <PediatricMeasurementForm
          patientId={patientId}
          gender={gender}
          ageMonths={ageMonths}
          onSave={() => {
            router.back();
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: safeHeaderPaddingTop,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    color: '#F8FAFC',
    fontFamily: fontFamilies.bold,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 2,
    fontFamily: fontFamilies.regular,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
