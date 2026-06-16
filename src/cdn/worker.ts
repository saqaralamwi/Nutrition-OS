import { UploadService } from './services/UploadService';
import { jwtAuthenticate } from './utils/jwt';

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (request.method === 'POST' && url.pathname === '/upload') {
      const auth = await jwtAuthenticate(request);
      if (!auth.valid) {
        return Response.json({ error: auth.error }, { status: 401 });
      }

      const userId = auth.userId!;
      const formData = await request.formData() as any;
      const imageFile = formData.get('image') as File | null;

      if (!imageFile) {
        return Response.json({ error: 'Image required' }, { status: 400 });
      }

      const maxFileSize = parseInt(env.MAX_FILE_SIZE || process.env.MAX_FILE_SIZE!);
      if (imageFile.size > maxFileSize) {
        return Response.json(
          { error: `File size exceeded ${maxFileSize / 1000000}MB` },
          { status: 400 }
        );
      }

      const allowedMimeTypes = (env.ALLOWED_MIME_TYPES || process.env.ALLOWED_MIME_TYPES!).split(',');
      if (!allowedMimeTypes.includes(imageFile.type)) {
        return Response.json(
          { error: `MIME type ${imageFile.type} not allowed` },
          { status: 400 }
        );
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      const type = (formData.get('type') as 'food' | 'recipe') || 'food';
      const category = (formData.get('category') as string) || 'foods';

      try {
        const uploadService = new UploadService(env);
        const urls = await uploadService.uploadImage(imageBuffer, type, category, userId);

        return Response.json({ success: true, urls, userId });
      } catch (error) {
        console.error('Upload error:', error);
        return Response.json({ error: 'Upload failed' }, { status: 500 });
      }
    }

    return Response.json({ error: 'Method not found' }, { status: 404 });
  },
};
