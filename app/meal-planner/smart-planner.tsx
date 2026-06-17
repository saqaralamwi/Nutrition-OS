import { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import SmartMealPlanner from '../../src/presentation/components/intervention/SmartMealPlanner';
import { ClinicalIntegrationOrchestrator } from '../../src/domain/orchestrators/ClinicalIntegrationOrchestrator';
import { FoodRepository } from '../../src/data/repositories/FoodRepository';
import { IFoodExchange } from '../../src/data/types/meal_planner';
import type { IClinicalIntegrationInput } from '../../src/domain/orchestrators/ClinicalIntegrationOrchestrator';
import { colors } from '../../src/presentation/theme';

import useClinicalAlerts from '../../src/presentation/hooks/useClinicalAlerts';
import ClinicalAlertsBanner from '../../src/presentation/components/ClinicalAlertsBanner';

export default function SmartPlannerRoute() {
  const { patientId, weight, data } = useLocalSearchParams<{
    patientId?: string;
    weight?: string;
    data?: string;
  }>();

  const { alerts } = useClinicalAlerts(patientId || '');
  const [masterFoods, setMasterFoods] = useState<IFoodExchange[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const results = await FoodRepository.getAllExchanges();
        const mapped = results.map(FoodRepository.mapExchangeToInterface);
        setMasterFoods(mapped);
      } catch (err) {
        console.error('Failed to load master foods:', err);
      }
    };
    load();
  }, []);

  const integrationInput = useMemo((): IClinicalIntegrationInput | null => {
    if (!patientId) return null;
    if (data) {
      try { return { patientId, patientWeightKg: parseFloat(weight ?? '70'), ...JSON.parse(data) }; }
      catch { return { patientId, patientWeightKg: parseFloat(weight ?? '70') }; }
    }
    return { patientId, patientWeightKg: parseFloat(weight ?? '70') };
  }, [patientId, weight, data]);

  const integrationResult = useMemo(() => {
    if (!integrationInput) return null;
    return ClinicalIntegrationOrchestrator.fetchAndAggregatePatientTargets(integrationInput);
  }, [integrationInput]);

  if (!patientId) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'تخطيط الوجبات العلاجية' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🥗</Text>
          <Text style={styles.emptyTitle}>يرجى اختيار مريض أولاً</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'تخطيط الوجبات والوصفة العلاجية' }} />
      {integrationResult && integrationResult.conflictResolutionNotes.length > 0 && (
        <View style={styles.notesBanner}>
          {integrationResult.conflictResolutionNotes.map((note, i) => (
            <Text key={i} style={styles.noteText}>{note}</Text>
          ))}
        </View>
      )}
      <ScrollView style={{ flex: 1 }}>
        <ClinicalAlertsBanner alerts={alerts} />
        <View style={{ marginTop: 10 }}>
          <SmartMealPlanner
            patientId={patientId}
            masterFoods={masterFoods}
            targets={integrationResult?.targets ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fluidMl: 0 }}
            aversions={[]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: colors.textPrimary, fontFamily: 'ThmanyahSans-Bold', textAlign: 'center' },
  notesBanner: {
    backgroundColor: '#1A2332',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noteText: {
    fontSize: 12,
    fontFamily: 'ThmanyahSans-Regular',
    color: colors.warning,
    textAlign: 'right',
    lineHeight: 18,
  },
});
