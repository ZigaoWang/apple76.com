import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    if (!query) {
      return NextResponse.json({ items: [] });
    }

    const db = await openDb();

    // Basic search across relevant fields
    const searchTerm = `%${query}%`;
    const items = await db.all(
      `SELECT id, title, year, is_year_unknown, collection, oss_key, thumbnail_key
       FROM items
       WHERE title LIKE ? OR source LIKE ? OR author LIKE ? OR notes LIKE ?
       ORDER BY uploaded_at DESC`,
      searchTerm, searchTerm, searchTerm, searchTerm // Apply search term to each field
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ message: 'Error searching items', error: (error as Error).message }, { status: 500 });
  }
} 