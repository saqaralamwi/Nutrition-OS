import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Subject } from 'rxjs';

const mockUseState = vi.fn();
const mockUseEffect = vi.fn();

// Mock react module at the module level before importing the hook
vi.mock('react', () => {
  return {
    useState: (init: any) => mockUseState(init),
    useEffect: (effect: any, deps: any) => mockUseEffect(effect, deps),
  };
});

import { useObservable, useObservableArray } from '../useObservable';

describe('useObservable Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('subscribes on mount and updates state on emission', () => {
    const subject = new Subject<number>();
    const setValue = vi.fn();

    mockUseState.mockReturnValue([undefined, setValue]);
    
    let effectCleanup: (() => void) | null = null;
    mockUseEffect.mockImplementation((effect) => {
      effectCleanup = effect();
    });

    const val = useObservable(subject);

    expect(mockUseState).toHaveBeenCalled();
    expect(mockUseEffect).toHaveBeenCalled();
    expect(val).toBeUndefined();

    // Emit a value on the subject
    subject.next(55);
    expect(setValue).toHaveBeenCalledWith(55);
  });

  test('unsubscribes on unmount to prevent leaks', () => {
    const subject = new Subject<number>();
    const setValue = vi.fn();

    mockUseState.mockReturnValue([undefined, setValue]);
    
    let effectCleanup: (() => void) | null = null;
    mockUseEffect.mockImplementation((effect) => {
      effectCleanup = effect();
    });

    useObservable(subject);

    expect(effectCleanup).toBeTypeOf('function');
    if (effectCleanup) {
      effectCleanup();
    }

    // Emitting after cleanup should not trigger updates
    setValue.mockClear();
    subject.next(99);
    expect(setValue).not.toHaveBeenCalled();
  });

  test('useObservableArray returns default empty array', () => {
    const subject = new Subject<number[]>();
    const setValue = vi.fn();

    mockUseState.mockReturnValue([[], setValue]);
    mockUseEffect.mockImplementation(() => {});

    const arr = useObservableArray(subject);

    expect(arr).toEqual([]);
    expect(mockUseState).toHaveBeenCalledWith([]);
  });
});
