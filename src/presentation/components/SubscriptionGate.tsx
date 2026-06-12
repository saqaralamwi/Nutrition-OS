import { ReactNode } from 'react';
import { SubscriptionPlan } from '../../domain/entities/User';

interface SubscriptionGateProps {
  requiredPlan: SubscriptionPlan;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function SubscriptionGate({ children }: SubscriptionGateProps) {
  return <>{children}</>;
}
