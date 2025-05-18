import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/oss';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  if (!key) {
    return new NextResponse('Missing key parameter', { status: 400 });
  }

  try {
    // Get range header if it exists
    const rangeHeader = request.headers.get('range');
    let options = {};
    
    // Handle range requests (mainly for video streaming)
    if (rangeHeader) {
      const matches = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (matches) {
        options = {
          headers: {
            Range: rangeHeader
          },
          process: null // Disable image processing for range requests
        };
      }
    }

    const result = await client.get(key, options);
    const buffer = await result.content;
    const contentType = (result.res.headers as Record<string, string>)['content-type'] || 'application/octet-stream';
    const contentLength = (result.res.headers as Record<string, string>)['content-length'] || buffer.length.toString();
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', contentLength);
    
    // For PDFs, images, and videos, we want to display them in the browser
    if (
      contentType === 'application/pdf' || 
      contentType.startsWith('image/') || 
      contentType.startsWith('video/')
    ) {
      headers.set('Content-Disposition', 'inline');
      
      // For images, add caching headers to improve performance
      if (contentType.startsWith('image/')) {
        headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        console.log(`Serving image: ${key} with content type: ${contentType}`);
      }
      
      // For videos, add additional headers for streaming support
      if (contentType.startsWith('video/')) {
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Cache-Control', 'public, max-age=3600');
        
        // If this is a range request, set appropriate status and headers
        const contentRange = (result.res.headers as Record<string, string>)['content-range'];
        if (rangeHeader && contentRange) {
          headers.set('Content-Range', contentRange);
          return new NextResponse(buffer, {
            status: 206,
            headers,
          });
        }
      }
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