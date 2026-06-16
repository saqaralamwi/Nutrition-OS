import { AuthCredentials, RegisterInput, UserProfile } from '../../domain/entities/User';

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

function mapSupabaseUser(sbUser: any, profile: any): UserProfile {
  return {
    id: sbUser.id,
    email: sbUser.email ?? '',
    fullName: profile?.full_name ?? sbUser.email?.split('@')[0] ?? 'مستخدم',
    clinicName: profile?.clinic_name,
    subscriptionPlan: profile?.subscription_plan ?? 'free',
    patientLimit: profile?.patient_limit ?? 20,
    aiEnabled: profile?.ai_enabled ?? false,
    createdAt: sbUser.created_at ?? new Date().toISOString(),
  };
}

export async function login(credentials: AuthCredentials): Promise<{ user: UserProfile; error: string | null }> {
  const supabase = await getSupabase();
  if (!supabase) {
    return { user: null as any, error: 'الخدمة السحابية غير متصلة. يرجى التحقق من إعدادات الاتصال.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      const messages: Record<string, string> = {
        'Invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        'Email not confirmed': 'البريد الإلكتروني غير مفعل. يرجى التحقق من بريدك الوارد.',
        'User not found': 'لا يوجد حساب بهذا البريد الإلكتروني.',
      };
      return { user: null as any, error: messages[error.message] || error.message };
    }

    if (!data.user) {
      return { user: null as any, error: 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.' };
    }

    const profile = await fetchUserProfile(supabase, data.user.id);
    const user = mapSupabaseUser(data.user, profile);
    return { user, error: null };
  } catch (e: any) {
    return { user: null as any, error: e?.message || 'حدث خطأ في الاتصال بالخادم.' };
  }
}

export async function register(input: RegisterInput): Promise<{ user: UserProfile | null; error: string | null }> {
  const supabase = await getSupabase();
  if (!supabase) {
    return { user: null, error: 'الخدمة السحابية غير متصلة. يرجى التحقق من إعدادات الاتصال.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.fullName, clinic_name: input.clinicName ?? null },
      },
    });

    if (error) {
      const messages: Record<string, string> = {
        'User already registered': 'البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول.',
        'Password should be at least 6 characters': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
        'Unable to validate email address: invalid format': 'صيغة البريد الإلكتروني غير صحيحة.',
      };
      return { user: null, error: messages[error.message] || error.message };
    }

    if (!data.user) {
      return { user: null, error: 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.' };
    }

    await createUserProfile(supabase, data.user.id, input);

    const profile = await fetchUserProfile(supabase, data.user.id);
    const user = mapSupabaseUser(data.user, profile);
    return { user, error: null };
  } catch (e: any) {
    return { user: null, error: e?.message || 'حدث خطأ في الاتصال بالخادم.' };
  }
}

async function createUserProfile(supabase: any, userId: string, input: RegisterInput): Promise<void> {
  try {
    await supabase.from('user_profiles').insert({
      user_id: userId,
      full_name: input.fullName,
      clinic_name: input.clinicName ?? null,
      subscription_plan: 'free',
      patient_limit: 20,
      ai_enabled: false,
    });
  } catch {
    // Non-critical: profile will be created on first login
  }
}

async function fetchUserProfile(supabase: any, userId: string): Promise<any | null> {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  const supabase = await getSupabase();
  if (!supabase) return;

  try {
    await supabase.auth.signOut();
  } catch {
    // Silently fail
  }
}

export async function getCurrentSession(): Promise<{ user: UserProfile | null; error: string | null }> {
  const supabase = await getSupabase();
  if (!supabase) return { user: null, error: null };

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      return { user: null, error: null };
    }

    const profile = await fetchUserProfile(supabase, data.session.user.id);
    const user = mapSupabaseUser(data.session.user, profile);
    return { user, error: null };
  } catch {
    return { user: null, error: null };
  }
}

export function onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
  let unsubscribe: (() => void) | null = null;

  getSupabase().then((supabase) => {
    if (!supabase) {
      callback(null);
      return;
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profile = await fetchUserProfile(supabase, session.user.id);
          callback(mapSupabaseUser(session.user, profile));
        }
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });

    unsubscribe = () => listener?.subscription?.unsubscribe?.();
  });

  return () => unsubscribe?.();
}
