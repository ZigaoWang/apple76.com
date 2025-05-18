import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/oss';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const collection = formData.get('collection') as string | null;

    if (!file || !collection) {
      return NextResponse.json({ error: 'Missing file or collection' }, { status: 400 });
    }
    
    // Create filename with timestamp and original name to avoid conflicts
    const timestamp = Date.now();
    const originalName = file.name;
    const fileName = `${timestamp}-${originalName}`;
    
    // Upload path based on collection
    const uploadKey = `${collection}/thumbnails/${fileName}`;
    
    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    
    // Upload to OSS storage
    const result = await client.put(uploadKey, Buffer.from(buffer));
    
    if (!result || !result.url) {
      return NextResponse.json({ error: 'Failed to upload thumbnail' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      thumbnailKey: uploadKey,
      url: result.url,
    });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    return NextResponse.json({ error: 'Failed to upload thumbnail', details: String(error) }, { status: 500 });
  }
} 