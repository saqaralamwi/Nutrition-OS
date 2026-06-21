import { useEffect, ComponentType } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export function withAuth<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const hydrationState = useAuthStore((s) => s.hydrationState);

    useEffect(() => {
      if (hydrationState === 'hydrated' && !isAuthenticated) {
        router.replace('/auth/login');
      }
    }, [isAuthenticated, hydrationState]);

    if (hydrationState !== 'hydrated' || !isAuthenticated) return null;

    return <Component {...props} />;
  };
}
