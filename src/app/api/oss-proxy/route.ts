import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/oss';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  if (!key) {
    return new NextResponse('Missing key parameter', { status: 400 });
  }

  try {
    const result = await client.get(key);
    const buffer = await result.content;
    const contentType = (result.res.headers as Record<string, string>)['content-type'] || 'application/octet-stream';

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', (result.res.headers as Record<string, string>)['content-length'] || buffer.length.toString());
    
    // For PDFs, we want to display them in the browser
    if (contentType === 'application/pdf') {
      headers.set('Content-Disposition', 'inline');
    } else {
      headers.set('Content-Disposition', 'attachment');
    }

    return new NextResponse(buffer, {
      headers,
    });
  } catch (error) {
    console.error('Error fetching from OSS:', error);
    return new NextResponse('Error fetching file', { status: 500 });
  }
} 