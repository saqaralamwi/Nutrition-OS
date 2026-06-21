export const CryptoDigestAlgorithm = {
  SHA256: 'SHA-256',
};

export async function digestStringAsync(
  _algorithm: string,
  str: string
): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return str.split('').reduce((acc, c) => {
    const hex = c.charCodeAt(0).toString(16);
    return acc + hex.padStart(2, '0');
  }, '');
}
