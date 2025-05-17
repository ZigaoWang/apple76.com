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

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
        return NextResponse.json({ success: false, error: 'noid' }, { status: 400 });
      }
      return NextResponse.redirect(new URL('/admin?error=noid', req.url));
    }

    const db = await openDb();
    const item = await db.get('SELECT * FROM items WHERE id = ?', id);
    if (item) {
      // Remove from OSS
      await client.delete(item.oss_key);
      // Remove from DB
      await db.run('DELETE FROM items WHERE id = ?', id);
    }

    if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
      return NextResponse.json({ success: true });
    }
    return NextResponse.redirect(new URL('/admin', req.url));
  } catch (error) {
    console.error('Delete error:', error);
    if (req.headers.get('x-requested-with') === 'XMLHttpRequest') {
      return NextResponse.json({ success: false, error: 'delete_failed' }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/admin?error=delete_failed', req.url));
  }
} 