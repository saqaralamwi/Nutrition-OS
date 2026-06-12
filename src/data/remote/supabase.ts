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

export const supabaseService = {
  async create(table: string, data: Record<string, any>): Promise<Record<string, any> | null> {
    const supabase = await getClient();
    if (!supabase) return null;

    const { data: result, error } = await supabase.from(table).insert(data).select().single();
    if (error) throw error;
    return result;
  },

  async read(
    table: string,
    options?: {
      where?: Record<string, any>;
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      limit?: number;
      offset?: number;
      since?: string;
    }
  ): Promise<Record<string, any>[] | null> {
    const supabase = await getClient();
    if (!supabase) return null;

    let query = supabase.from(table).select('*');

    if (options?.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
    }

    if (options?.since) {
      query = query.gt('updated_at', options.since);
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.field, {
        ascending: options.orderBy.direction === 'asc',
      });
    }

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async update(table: string, id: string, data: Record<string, any>): Promise<void> {
    const supabase = await getClient();
    if (!supabase) return;

    const { error } = await supabase.from(table).update(data).eq('id', id);
    if (error) throw error;
  },

  async delete(table: string, id: string): Promise<void> {
    const supabase = await getClient();
    if (!supabase) return;

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  },

  async upsert(table: string, data: Record<string, any>): Promise<Record<string, any> | null> {
    const supabase = await getClient();
    if (!supabase) return null;

    const { data: result, error } = await supabase
      .from(table)
      .upsert(data, { onConflict: 'id', ignoreDuplicates: false })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async isConfigured(): Promise<boolean> {
    if (!ENABLE_SUPABASE) return false;
    const c = await getClient();
    return c !== null;
  },
};
