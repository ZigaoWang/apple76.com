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

    const title = form.get('title')?.toString() || '';
    const year = parseInt(form.get('year')?.toString() || '0', 10);
    const collection = form.get('collection')?.toString() || '';
    const original_link = form.get('original_link')?.toString() || '';
    const description = form.get('description')?.toString() || '';
    const tags = form.get('tags')?.toString() || '';

    // Upload to OSS
    const oss_key = `${collection}/${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    
    try {
      await client.put(oss_key, Buffer.from(arrayBuffer), {
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
      });

      // Insert metadata into DB
      const db = await openDb();
      await db.run(
        'INSERT OR IGNORE INTO items (title, year, collection, original_link, description, tags, oss_key) VALUES (?, ?, ?, ?, ?, ?, ?)',
        title, year, collection, original_link, description, tags, oss_key
      );

      if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
        return NextResponse.json({ success: true });
      }
      return NextResponse.redirect(new URL('/admin', req.url));
    } catch (error) {
      console.error('OSS upload error:', error);
      if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
        return NextResponse.json({ success: false, error: 'upload_failed' }, { status: 500 });
      }
      return NextResponse.redirect(new URL('/admin?error=upload_failed', req.url));
    }
  } catch (error) {
    console.error('Upload error:', error);
    if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
      return NextResponse.json({ success: false, error: 'upload_failed' }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/admin?error=upload_failed', req.url));
  }
} 