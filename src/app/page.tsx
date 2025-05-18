import InfiniteScroll from '@/components/InfiniteScroll';
import { openDb } from '@/lib/db';
import HeroSearch from '@/components/HeroSearch';
// import Link from 'next/link'; // Removed unused import

interface Item {
  id: number;
  title: string;
  year: number;
  is_year_unknown: boolean;
  collection: string;
  oss_key: string;
  thumbnail_key: string | null;
}

async function getRandomItems(limit: number): Promise<Item[]> {
  const db = await openDb();
  // This provides a simple way to get random rows, though not truly random for very large tables
  // A more robust method might involve getting total count and selecting random IDs
  const items = await db.all(`
    SELECT id, title, year, is_year_unknown, collection, oss_key, thumbnail_key
    FROM items
    ORDER BY RANDOM()
    LIMIT ?
  `, limit);
  return items;
}

export default async function Home() {
  const backgroundItems = await getRandomItems(16);

  return (
    <main className="min-h-screen bg-gray-100 text-gray-800">
      {/* HeroSearch handles its own search state and result display */}
      <HeroSearch backgroundItems={backgroundItems} />

      {/* Latest Additions - Always rendered below HeroSearch */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-800">Latest Additions</h2>
          <InfiniteScroll />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>Made by Zigao Wang. Not affiliated with Apple Inc.</p>
            <p className="mt-2">© {new Date().getFullYear()} Apple76.com. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
