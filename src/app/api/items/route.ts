import { NextRequest, NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    const db = await openDb();
    
    // Check if the database is connected properly
    const count = await db.get('SELECT COUNT(*) as count FROM items');
    console.log(`Total items in DB: ${count?.count}`);
    
    const items = await db.all(
      'SELECT id, title, year, is_year_unknown, collection, oss_key, thumbnail_key FROM items ORDER BY uploaded_at DESC LIMIT ? OFFSET ?',
      [limit, offset] // Use an array for multiple parameters
    );

    return NextResponse.json({ items, page, totalItems: count?.count || 0 });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items', details: String(error) }, { status: 500 });
  }
} 