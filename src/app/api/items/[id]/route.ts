import { NextRequest, NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET a single item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Unwrap params to avoid sync access warning
  const paramsValue = await Promise.resolve(params);
  const id = parseInt(paramsValue.id);
  
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const db = await openDb();
    const item = await db.get('SELECT * FROM items WHERE id = ?', id);
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

// PUT to update an item by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Unwrap params to avoid sync access warning
  const paramsValue = await Promise.resolve(params);
  const id = parseInt(paramsValue.id);
  
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const data = await request.json();
    const db = await openDb();
    
    // Check if item exists
    const existingItem = await db.get('SELECT id FROM items WHERE id = ?', id);
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Extract fields to update
    const {
      title,
      year,
      is_year_unknown,
      collection,
      original_link,
      description,
      tags,
      thumbnail_key,
      source,
      author,
      notes
    } = data;

    // Update the item in the database
    await db.run(
      `UPDATE items SET 
        title = ?,
        year = ?,
        is_year_unknown = ?,
        collection = ?,
        original_link = ?,
        description = ?,
        tags = ?,
        thumbnail_key = ?,
        source = ?,
        author = ?,
        notes = ?
      WHERE id = ?`,
      [
        title,
        year,
        is_year_unknown ? 1 : 0,
        collection,
        original_link,
        description,
        tags,
        thumbnail_key,
        source,
        author,
        notes,
        id
      ]
    );

    // Get the updated item
    const updatedItem = await db.get('SELECT * FROM items WHERE id = ?', id);
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item', details: String(error) }, { status: 500 });
  }
} 