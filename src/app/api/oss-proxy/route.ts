import { NextRequest } from 'next/server';
import client from '@/lib/oss';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) {
    return new Response('Missing key', { status: 400 });
  }
  try {
    const url = client.signatureUrl(key, { expires: 600 });
    const ossRes = await fetch(url);
    const headers = new Headers(ossRes.headers);
    // Remove CORS headers from OSS, set our own
    headers.set('Access-Control-Allow-Origin', '*');
    // Remove some headers that Next.js disallows
    headers.delete('content-encoding');
    headers.delete('content-length');
    headers.delete('transfer-encoding');
    return new Response(ossRes.body, {
      status: ossRes.status,
      headers,
    });
  } catch (e) {
    return new Response('Error fetching from OSS', { status: 500 });
  }
} 