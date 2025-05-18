import InfiniteScroll from '@/components/InfiniteScroll';
import { openDb } from '@/lib/db';
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
  const backgroundItems = await getRandomItems(16); // Fetch 16 random items for the background

  return (
    <main className="min-h-screen bg-gray-100 text-gray-800">
      {/* Hero Section with Dynamic Background */}
      <div 
        className="relative overflow-hidden py-24 sm:py-32 lg:py-40 bg-cover bg-center"
      >
        {/* Dynamic Background Images */}
        <div className="absolute inset-0 w-full h-full">
          <div className="grid grid-cols-4 gap-1 h-full opacity-20">
            {backgroundItems.map(item => {
              const thumbnailUrl = item.thumbnail_key ? `/api/oss-proxy?key=${encodeURIComponent(item.thumbnail_key)}` : `/api/oss-proxy?key=${encodeURIComponent(item.oss_key)}`;
              return (
                <div key={item.id} className="relative overflow-hidden">
                   <img
                    src={thumbnailUrl}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    // Remove blur-up for background images for simplicity
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-60"></div> {/* Slightly darker overlay */}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight drop-shadow-lg">
            Apple76.com
          </h1>
          <p className="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto mb-10 leading-relaxed drop-shadow">
            A curated collection of Apple&apos;s rich history through vintage manuals,
            advertisements, and rare memorabilia.
          </p>
          
          {/* Placeholder Search Bar */}
          <div className="mt-10 max-w-md mx-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search items..."
                className="w-full px-6 py-3 text-lg rounded-full border-2 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 shadow-lg"
              />
              <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3">
                {/* Search Icon */}
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </button>
            </div>
          </div>

          {/* Original buttons - keeping them commented out for now */}
          {/* <div className="mt-8 flex justify-center gap-4">
            <Link href="/collections" className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
              Explore Collections
            </Link>
            <Link href="/about" className="inline-block px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
              Learn More
            </Link>
          </div> */}
        </div>
      </div>

      {/* Items Grid Section */}
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
