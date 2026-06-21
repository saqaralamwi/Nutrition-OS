import React, { createContext, useContext, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';

interface SandboxContextValue {
  isSandbox: boolean;
}

const SandboxContext = createContext<SandboxContextValue>({ isSandbox: false });

export function SandboxProvider({ children }: { children: React.ReactNode }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isSandbox = id === 'sandbox';

  const value = useMemo(() => ({ isSandbox }), [isSandbox]);

  return (
    <SandboxContext.Provider value={value}>
      {children}
    </SandboxContext.Provider>
  );
}

export function useSandboxMode(): SandboxContextValue {
  return useContext(SandboxContext);
}
