import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/oss';

interface OSSError extends Error {
  code?: string;
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
  }

  try {
    const result = await client.get(key);
    const buffer = await result.content;
    const contentType = (result.res.headers as Record<string, string>)['content-type'] || 'application/octet-stream';

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000');

    // For PDFs and images, we want to display them in the browser
    if (contentType === 'application/pdf' || contentType.startsWith('image/')) {
      headers.set('Content-Disposition', 'inline');
    } else {
      headers.set('Content-Disposition', 'attachment');
    }

    return new NextResponse(buffer, { headers });
  } catch (error) {
    console.error('Error fetching from OSS:', error);
    
    const ossError = error as OSSError;
    
    // Handle specific OSS errors
    if (ossError.code === 'NoSuchKey') {
      return NextResponse.json({ 
        error: 'File not found',
        code: 'NoSuchKey',
        key 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: 'Failed to fetch file',
      message: ossError.message,
      code: ossError.code
    }, { status: 500 });
  }
} 