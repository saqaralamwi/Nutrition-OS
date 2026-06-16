import jwt from 'jsonwebtoken';

export async function jwtAuthenticate(request: Request): Promise<{
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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return { valid: true, userId: decoded.userId };
  } catch {
    return { valid: false, error: 'Invalid token' };
  }
}
