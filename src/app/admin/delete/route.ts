import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/oss';
import { openDb } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'apple76admin';

export async function POST(req: NextRequest) {
  const baseUrl = req.nextUrl.origin;
  try {
    // Check admin auth
    const cookie = req.cookies.get('admin_auth');
    if (cookie?.value !== ADMIN_PASSWORD) {
      return NextResponse.redirect(`${baseUrl}/admin?error=auth`);
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.redirect(`${baseUrl}/admin?error=noid`);

    const db = await openDb();
    const item = await db.get('SELECT * FROM items WHERE id = ?', id);
    if (item) {
      // Remove from OSS
      await client.delete(item.oss_key);
      // Remove from DB
      await db.run('DELETE FROM items WHERE id = ?', id);
    }
    return NextResponse.redirect(`${baseUrl}/admin?success=delete`);
  } catch (e) {
    console.error('Delete error:', e);
    return NextResponse.redirect(`${baseUrl}/admin?error=delete`);
  }
} 