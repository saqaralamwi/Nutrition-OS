import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useToastStore } from '../stores/toastStore';

export function useSafePatientId(): string {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      showToast('معرف المريض مفقود', 'error');
      router.replace('/');
    }
  }, [id]);

  return id || '';
}
