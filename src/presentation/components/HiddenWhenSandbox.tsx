import { useSandboxMode } from '../contexts/SandboxContext';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function HiddenWhenSandbox({ children, fallback = null }: Props) {
  const { isSandbox } = useSandboxMode();
  if (isSandbox) return <>{fallback}</>;
  return <>{children}</>;
}

export function DisabledWhenSandbox({ children }: { children: React.ReactNode }) {
  const { isSandbox } = useSandboxMode();
  if (!isSandbox) return <>{children}</>;
  return null;
}
