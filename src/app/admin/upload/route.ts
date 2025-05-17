import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/oss';
import { openDb } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'apple76admin';

export async function POST(req: NextRequest) {
  try {
    // Check admin auth
    const cookie = req.cookies.get('admin_auth');
    if (cookie?.value !== ADMIN_PASSWORD) {
      if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
        return NextResponse.json({ success: false, error: 'auth' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin?error=auth', req.url));
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
        return NextResponse.json({ success: false, error: 'nofile' }, { status: 400 });
      }
      return NextResponse.redirect(new URL('/admin?error=nofile', req.url));
    }

    // Get all form fields
    const title = form.get('title')?.toString() || '';
    const yearStr = form.get('year')?.toString();
    const isYearUnknown = form.get('is_year_unknown') === 'true';
    const year = isYearUnknown ? null : parseInt(yearStr || '0', 10);
    const collection = form.get('collection')?.toString() || '';
    const original_link = form.get('original_link')?.toString() || '';
    const description = form.get('description')?.toString() || '';
    const tags = form.get('tags')?.toString() || '';
    const source = form.get('source')?.toString() || '';
    const author = form.get('author')?.toString() || '';
    const notes = form.get('notes')?.toString() || '';

    // Generate a unique filename to prevent collisions
    const timestamp = Date.now();
    const originalName = file.name;
    const oss_key = `${collection}/${timestamp}-${originalName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Upload to OSS with proper error handling
      await client.put(oss_key, buffer, {
        headers: {
          'Content-Type': file.type,
          'Content-Length': buffer.length.toString(),
        },
      });

      // Verify the upload was successful
      try {
        await client.head(oss_key);
      } catch (error) {
        console.error('OSS verification error:', error);
        throw new Error('Failed to verify file upload');
      }

      // Insert metadata into DB
      const db = await openDb();
      await db.run(
        `INSERT OR IGNORE INTO items (
          title, year, collection, original_link, description, tags, oss_key,
          source, author, file_size, notes, is_year_unknown
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        title, year, collection, original_link, description, tags, oss_key,
        source, author, buffer.length, notes, isYearUnknown ? 1 : 0
      );

      if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
        return NextResponse.json({ success: true });
      }
      return NextResponse.redirect(new URL('/admin', req.url));
    } catch (error) {
      console.error('OSS upload error:', error);
      
      // Try to clean up if the upload failed
      try {
        await client.delete(oss_key);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
        return NextResponse.json({ 
          success: false, 
          error: 'upload_failed',
          message: errorMessage 
        }, { status: 500 });
      }
      return NextResponse.redirect(new URL(`/admin?error=upload_failed&message=${encodeURIComponent(errorMessage)}`, req.url));
    }
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
      return NextResponse.json({ 
        success: false, 
        error: 'upload_failed',
        message: errorMessage 
      }, { status: 500 });
    }
    return NextResponse.redirect(new URL(`/admin?error=upload_failed&message=${encodeURIComponent(errorMessage)}`, req.url));
  }
} 