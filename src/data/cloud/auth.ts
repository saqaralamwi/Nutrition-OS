const ENABLE_SUPABASE =
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_SUPABASE_URL &&
  process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function getSupabase(): Promise<any | null> {
  if (!ENABLE_SUPABASE) return null;
  try {
    const { getSupabaseClient } = await import('./supabase');
    return getSupabaseClient();
  } catch {
    return null;
  }
}

export async function login(): Promise<any> {
  return null;
}

export async function register(): Promise<any> {
  return null;
}

export async function logout(): Promise<void> {
  const supabase = await getSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
}

export async function getCurrentSession(): Promise<null> {
  return null;
}
