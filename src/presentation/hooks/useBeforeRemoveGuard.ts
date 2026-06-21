import { useEffect } from 'react';
import { Alert } from 'react-native';

interface BeforeRemoveEvent {
  preventDefault(): void;
  data: { action: { type: string; payload?: object; source?: string; target?: string } };
}

interface NavigationGuard {
  addListener(event: 'beforeRemove', callback: (e: BeforeRemoveEvent) => void): () => void;
  dispatch(action: { type: string; payload?: object; source?: string; target?: string }): void;
}

export function useBeforeRemoveGuard(
  navigation: NavigationGuard,
  isDirty: boolean,
  saveImmediate: () => Promise<void>,
) {
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      Alert.alert(
        'تنبيه: تغييرات غير محفوظة',
        'لديك تغييرات لم يتم حفظها بعد. هل تريد الحفظ قبل الخروج؟',
        [
          {
            text: 'البقاء في الصفحة',
            style: 'cancel',
          },
          {
            text: 'تجاهل التغييرات',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
          {
            text: 'حفظ ثم خروج',
            onPress: async () => {
              try {
                await saveImmediate();
                navigation.dispatch(e.data.action);
              } catch {
                Alert.alert('خطأ', 'فشل حفظ التغييرات.');
              }
            },
          },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, isDirty, saveImmediate]);
}
