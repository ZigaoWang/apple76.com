import { openDb } from '@/lib/db';
import ItemCard from '@/components/ItemCard';

interface Item {
  id: number;
  title: string;
  year: number;
  is_year_unknown: boolean;
  collection: string;
  oss_key: string;
  thumbnail_key: string | null;
}

async function searchItems(query: string): Promise<Item[]> {
  const db = await openDb();
  const searchTerm = `%${query}%`;
  const items = await db.all(
    `SELECT id, title, year, is_year_unknown, collection, oss_key, thumbnail_key
     FROM items
     WHERE title LIKE ? OR source LIKE ? OR author LIKE ? OR notes LIKE ?
     ORDER BY uploaded_at DESC`,
    searchTerm, searchTerm, searchTerm, searchTerm
  );
  return items;
}

interface SearchPageProps {
    searchParams: { query?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.query || '';
  const results = query ? await searchItems(query) : [];

  return (
    <main className="min-h-screen bg-gray-100 text-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          {query ? `Search Results for "${query}"` : 'Search'}
        </h1>

        {!query && (
             <p className="text-center text-gray-600">Enter a search term above to find items.</p>
        )}

        {query && results.length === 0 && (
          <p className="text-center text-gray-600">No items found matching your search.</p>
        )}

        {results.length > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {results.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 