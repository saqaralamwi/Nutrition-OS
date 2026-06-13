import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, I18nManager, Text, TextInput, AppState, AppStateStatus } from 'react-native';
import { colors } from '../src/presentation/theme';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import { useSecurityStore } from '../src/presentation/stores/securityStore';
import { useSettingsStore } from '../src/presentation/stores/settingsStore';
import LockScreen from '../src/presentation/components/LockScreen';

SplashScreen.preventAutoHideAsync();

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Globally patch Text and TextInput components to use ThmanyahSans-Regular as default
if ((Text as any).defaultProps == null) {
  (Text as any).defaultProps = {};
}
(Text as any).defaultProps.style = {
  fontFamily: 'ThmanyahSans-Regular',
  ...((Text as any).defaultProps.style || {}),
};

if ((TextInput as any).defaultProps == null) {
  (TextInput as any).defaultProps = {};
}
(TextInput as any).defaultProps.style = {
  fontFamily: 'ThmanyahSans-Regular',
  ...((TextInput as any).defaultProps.style || {}),
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'ThmanyahSans-Regular': require('../assets/fonts/thmanyah-sans-regular.otf'),
    'ThmanyahSans-Medium': require('../assets/fonts/thmanyah-sans-medium.otf'),
    'ThmanyahSans-Bold': require('../assets/fonts/thmanyah-sans-bold.otf'),
    'ThmanyahSans-Black': require('../assets/fonts/thmanyah-sans-black.otf'),
    'ThmanyahSans-Light': require('../assets/fonts/thmanyah-sans-light.otf'),
  });

  const activeProfileId = useSettingsStore((s) => s.activeProfileId);
  const initSecurity = useSecurityStore((s) => s.initSecurity);

  // Initialize security for the active clinician profile on change/launch
  useEffect(() => {
    initSecurity(activeProfileId);
  }, [activeProfileId]);

  // AppState listener for 2-minute background auto-lock
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const { lastActiveTime, isLocked, hasPIN, lockApp, updateLastActiveTime } = useSecurityStore.getState();
      
      if (nextAppState === 'background') {
        updateLastActiveTime();
      } else if (nextAppState === 'active') {
        if (hasPIN && !isLocked) {
          const inactiveDurationMs = Date.now() - lastActiveTime;
          const twoMinutesMs = 2 * 60 * 1000;
          if (inactiveDurationMs > twoMinutesMs) {
            lockApp();
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
        <Text style={{ color: colors.primaryContrast, fontSize: 18, fontFamily: 'System' }}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      <LockScreen />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.primaryContrast,
          headerTitleStyle: { fontFamily: 'ThmanyahSans-Bold', fontSize: 18 },
          headerBackTitleStyle: { fontFamily: 'ThmanyahSans-Regular' },
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: colors.surfaceSecondary },
          animation: 'slide_from_left',
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'نظام إدارة التغذية العلاجية - نسخة قيد التطوير من أنس الأموي', headerShown: false }}
        />
        <Stack.Screen
          name="patient/new"
          options={{ title: 'قبول مريض جديد', presentation: 'modal' }}
        />
        <Stack.Screen
          name="patient/[id]"
          options={{ title: '', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/monitoring"
          options={{ title: 'المتابعة والتقييم المخبري', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/discharge"
          options={{ title: 'خروج المريض وتلخيص الحالة', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/diet-plan"
          options={{ title: 'تخطيط الوجبات والبدائل الغذائية', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/calculations"
          options={{ title: 'حسابات الطاقة والمغذيات', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/medications"
          options={{ title: 'الأدوية والمكملات', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/laboratory"
          options={{ title: 'الفحوصات المخبرية', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/physical-exam"
          options={{ title: 'الفحص السريري', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/social-history"
          options={{ title: 'التاريخ الاجتماعي', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/clinical-analysis"
          options={{ title: 'التحليل السريري', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/medical-history"
          options={{ title: 'التاريخ المرضي', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/intervention"
          options={{ title: 'خطة التدخل التغذوي', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/nutrition-calculator"
          options={{ title: 'حاسبة التغذية الأنبوبية والوريدية', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/screening"
          options={{ title: 'تقييم الخطر التغذوي NRS-2002', headerShown: false }}
        />
        <Stack.Screen
          name="patient/[id]/ocr"
          options={{ title: 'المسح الذكي للتحاليل (OCR)', headerShown: false }}
        />
        <Stack.Screen
          name="about"
          options={{ title: 'عن المطور', headerShown: false }}
        />
        <Stack.Screen
          name="settings"
          options={{ title: 'غرفة التحكم والإعدادات', headerShown: false }}
        />
        <Stack.Screen
          name="admin/index"
          options={{ title: 'لوحة التحكم', presentation: 'modal' }}
        />
      </Stack>
    </View>
  );
}
