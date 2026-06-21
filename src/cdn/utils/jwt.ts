import { jwtVerify } from 'jose';

export async function jwtAuthenticate(request: Request, env?: any): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return { valid: false, error: 'Authorization header required' };
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return { valid: false, error: 'Token required' };
  }

  const JWT_SECRET = env?.JWT_SECRET || process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    throw new Error(
      'JWT_SECRET environment variable is required but not set. ' +
      'Please configure JWT_SECRET in your Cloudflare Worker environment.'
    );
  }

  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    return { valid: true, userId: payload.userId as string };
  } catch (err: any) {
    return { valid: false, error: 'Invalid or expired token' };
  }
}
