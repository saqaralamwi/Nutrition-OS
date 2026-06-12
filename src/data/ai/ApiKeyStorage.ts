const STORE_KEY = 'openai_api_key';
const FALLBACK_STORE_KEY = '@clinical_nutrition/openai_api_key';

let memoryFallback: string | null = null;

async function getSecureStore(): Promise<typeof import('expo-secure-store') | null> {
  try {
    return await import('expo-secure-store');
  } catch {
    return null;
  }
}

export async function getApiKey(): Promise<string | null> {
  if (memoryFallback) return memoryFallback;

  const SecureStore = await getSecureStore();
  if (!SecureStore) return null;

  try {
    return await SecureStore.getItemAsync(STORE_KEY);
  } catch {
    return memoryFallback;
  }
}

export async function setApiKey(key: string): Promise<void> {
  memoryFallback = key;

  const SecureStore = await getSecureStore();
  if (!SecureStore) return;

  try {
    await SecureStore.setItemAsync(STORE_KEY, key);
  } catch {
    // memoryFallback is already set
  }
}

export async function deleteApiKey(): Promise<void> {
  memoryFallback = null;

  const SecureStore = await getSecureStore();
  if (!SecureStore) return;

  try {
    await SecureStore.deleteItemAsync(STORE_KEY);
  } catch {
    // already cleared from memory
  }
}

export function validateApiKey(key: string): string | null {
  if (!key || key.trim().length === 0) {
    return 'مفتاح API مطلوب';
  }
  if (!key.trim().startsWith('sk-')) {
    return 'مفتاح API يجب أن يبدأ بـ sk-';
  }
  if (key.trim().length < 20) {
    return 'مفتاح API غير صالح (قصير جداً)';
  }
  return null;
}
