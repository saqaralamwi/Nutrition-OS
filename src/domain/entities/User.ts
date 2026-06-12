export type SubscriptionPlan = 'free' | 'pro' | 'clinic';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  clinicName?: string;
  subscriptionPlan: SubscriptionPlan;
  patientLimit: number;
  aiEnabled: boolean;
  createdAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterInput extends AuthCredentials {
  fullName: string;
  clinicName?: string;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, { patientLimit: number; aiEnabled: boolean; maxUsers: number }> = {
  free: { patientLimit: 20, aiEnabled: false, maxUsers: 1 },
  pro: { patientLimit: Infinity, aiEnabled: true, maxUsers: 1 },
  clinic: { patientLimit: Infinity, aiEnabled: true, maxUsers: 10 },
};

export const FULL_ACCESS_FEATURES = {
  patientLimit: Infinity,
  aiEnabled: true,
  maxUsers: 1,
};
