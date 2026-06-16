import { useEffect, useState } from 'react';
import { Observable } from 'rxjs';

/**
 * Custom React hook that subscribes to an RxJS Observable on mount
 * and unsubscribes on unmount to prevent memory leaks.
 *
 * @param observable The RxJS Observable to watch
 * @param initialValue Optional initial state value (defaults to undefined)
 */
export function useObservable<T>(observable: Observable<T>, initialValue?: T): T {
  const [value, setValue] = useState<T>(initialValue as T);

  useEffect(() => {
    const subscription = observable.subscribe({
      next: (newValue) => setValue(newValue),
      error: (err) => console.error('[useObservable] stream error:', err),
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [observable]);

  return value;
}

/**
 * Custom React hook that subscribes to an RxJS Observable array.
 * Automatically defaults to an empty array before the first emission.
 *
 * @param observable The RxJS Observable array to watch
 */
export function useObservableArray<T>(observable: Observable<T[]>): T[] {
  return useObservable<T[]>(observable, []) || [];
}
