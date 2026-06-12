const ENABLE_SUPABASE =
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_SUPABASE_URL &&
  process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function getSupabaseClient(): Promise<any | null> {
  if (!ENABLE_SUPABASE) return null;
  try {
    const mod = await import('./supabase');
    return mod.getSupabaseClient();
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  try {
    const mod = await import('./supabase');
    return mod.getAccessToken();
  } catch {
    return null;
  }
}

export async function createCheckoutSession(): Promise<string | null> {
  return null;
}

export async function getSubscriptionStatus(): Promise<{ plan: string; periodEnd: string | null } | null> {
  return { plan: 'free', periodEnd: null };
}

export function canAddPatient(
  _plan: string,
  _currentPatientCount: number
): { allowed: boolean; message?: string } {
  return { allowed: true };
}

export function getPlanFeatures(_plan: string): { patientLimit: number; aiEnabled: boolean } {
  return { patientLimit: 999999, aiEnabled: true };
}
