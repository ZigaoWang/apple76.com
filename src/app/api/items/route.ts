import { NextRequest, NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    const db = await openDb();
    const items = await db.all(
      'SELECT * FROM items ORDER BY uploaded_at DESC LIMIT ? OFFSET ?',
      limit,
      offset
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
} 