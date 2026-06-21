import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import DietaryHistoryAssessment from '../../src/presentation/components/assessment/DietaryHistoryAssessment';
import { FoodRepository } from '../../src/data/repositories/FoodRepository';
import { IFoodExchange } from '../../src/data/types/meal_planner';
import { colors } from '../../src/presentation/theme';

export default function DietaryHistoryRoute() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const [masterFoods, setMasterFoods] = useState<IFoodExchange[]>([]);
  const router = useRouter();

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

  if (!patientId) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'تقييم التاريخ التغذوي' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>يرجى اختيار مريض أولاً</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'تقييم التاريخ التغذوي (24h Recall)',
        }}
      />
      <DietaryHistoryAssessment
        patientId={patientId}
        masterFoods={masterFoods}
        targets={{ calories: 2000, protein: 75, carbs: 250, fat: 65, fluidMl: 2000 }}
        onSaveSession={async (session, items) => {
          try {
            const { getDatabase } = await import('../../src/data/database');
            const db = await getDatabase();
            await db.write(async () => {
              const sessionRecord = await db.get('patient_dietary_history_sessions').create((r: any) => {
                r.patientId = session.patientId || patientId;
                r.interviewDate = session.interviewDate || Date.now();
                r.dayType = session.dayType;
                r.reliabilityScore = session.reliabilityScore;
                r.totalComputedCalories = session.totalComputedCalories;
                r.totalComputedProtein = session.totalComputedProtein;
                r.totalFluidIntakeMl = session.totalFluidIntakeMl;
                r.recordedAt = new Date(session.recordedAt || Date.now());
              });

              for (const item of items) {
                await db.get('patient_dietary_history_items').create((r: any) => {
                  r.sessionId = sessionRecord.id;
                  r.mealSlotType = item.mealSlotType;
                  r.consumptionTime = item.consumptionTime;
                  r.foodExchangeId = item.foodExchangeId;
                  r.customReportedName = item.customReportedName;
                  r.servingUnitUsed = item.servingUnitUsed;
                  r.servingsConsumed = item.servingsConsumed;
                  r.derivedFluidMl = item.derivedFluidMl;
                  r.derivedCalories = item.derivedCalories;
                  r.derivedProtein = item.derivedProtein;
                  r.derivedCarbs = item.derivedCarbs;
                  r.derivedFat = item.derivedFat;
                });
              }
            });

            const { useToastStore } = await import('../../src/presentation/stores/toastStore');
            useToastStore.getState().showToast('تم حفظ جلسة التاريخ التغذوي بنجاح', 'success');

            router.push(`/meal-planner/smart-planner?patientId=${patientId}`);
          } catch (err) {
            console.error('Failed to save session data:', err);
            const { useToastStore } = await import('../../src/presentation/stores/toastStore');
            useToastStore.getState().showToast('حدث خطأ أثناء حفظ الجلسة في قاعدة البيانات', 'error');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: colors.textPrimary, fontFamily: 'ThmanyahSans-Bold', textAlign: 'center' },
  headerNavLink: {
    color: colors.primaryContrast,
    fontFamily: 'ThmanyahSans-Bold',
    fontSize: 14,
    paddingHorizontal: 8,
  },
});
