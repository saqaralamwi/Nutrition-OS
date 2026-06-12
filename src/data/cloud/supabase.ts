type SupabaseClient = any;

const ENABLE_SUPABASE =
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_SUPABASE_URL &&
  process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const SUPABASE_URL =
  typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_SUPABASE_URL : undefined;

const SUPABASE_ANON_KEY =
  typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY : undefined;

let client: SupabaseClient | null | undefined = undefined;

async function getClient(): Promise<SupabaseClient | null> {
  if (!ENABLE_SUPABASE) return null;
  if (client !== undefined) return client;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    });
    return client;
  } catch {
    client = null;
    return null;
  }
}

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  return getClient();
}

export async function isSupabaseConfigured(): Promise<boolean> {
  if (!ENABLE_SUPABASE) return false;
  const c = await getClient();
  return c !== null;
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = await getClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function configureSupabase(): Promise<void> {
  // Config is now read from environment variables (EXPO_PUBLIC_SUPABASE_*)
  // This function is a no-op; kept for backward compatibility
}
