import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import DietaryHistoryAssessment from '../../src/presentation/components/assessment/DietaryHistoryAssessment';
import { colors } from '../../src/presentation/theme';

export default function DietaryHistoryRoute() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const router = useRouter();

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

  const handleSaveAndPlan = async () => {
    // Session data committed to DB in DietaryHistoryAssessment via onSaveSession
    // Then navigate to intervention planner
    router.push(`/meal-planner/smart-planner?patientId=${patientId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'تقييم التاريخ التغذوي (24h Recall)',
          headerRight: () => (
            <Text
              style={styles.headerNavLink}
              onPress={handleSaveAndPlan}
            >
              التخطيط الذكي ←
            </Text>
          ),
        }}
      />
      <DietaryHistoryAssessment
        patientId={patientId}
        masterFoods={[]}
        targets={{ calories: 0, protein: 0, carbs: 0, fat: 0, fluidMl: 0 }}
        onSaveSession={async () => {
          // DB commit handled externally
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: colors.text, fontFamily: 'ThmanyahSans-Bold', textAlign: 'center' },
  headerNavLink: {
    color: colors.primaryContrast,
    fontFamily: 'ThmanyahSans-Bold',
    fontSize: 14,
    paddingHorizontal: 8,
  },
});
