import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/oss';
import { openDb } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'apple76admin';

export async function POST(req: NextRequest) {
  // Check admin auth
  const cookie = req.cookies.get('admin_auth');
  if (cookie?.value !== ADMIN_PASSWORD) {
    return NextResponse.redirect('/admin?error=auth');
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.redirect('/admin?error=nofile');
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
  await client.put(oss_key, Buffer.from(arrayBuffer));

  // Insert metadata into DB
  const db = await openDb();
  await db.run(
    'INSERT OR IGNORE INTO items (title, year, collection, original_link, description, tags, oss_key) VALUES (?, ?, ?, ?, ?, ?, ?)',
    title, year, collection, original_link, description, tags, oss_key
  );

  return NextResponse.redirect('/admin');
} 