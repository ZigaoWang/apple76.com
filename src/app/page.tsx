import Link from 'next/link';
import { openDb } from '@/lib/db';

async function getAllItems(limit = 20) {
  const db = await openDb();
  return db.all('SELECT * FROM items ORDER BY uploaded_at DESC LIMIT ?', limit);
}

export default async function Home() {
  const items = await getAllItems();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Apple76.com</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-4">
            A curated collection of Apple&apos;s rich history through vintage manuals, advertisements, and rare memorabilia.
          </p>
          <p className="text-gray-500 text-sm">
            Made by Zigao Wang. Not affiliated with Apple Inc.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {items.map((item) => {
            const url = `/api/oss-proxy?key=${encodeURIComponent(item.oss_key)}`;
            const thumbnailUrl = item.thumbnail_key ? `/api/oss-proxy?key=${encodeURIComponent(item.thumbnail_key)}` : url;
            const previewUrl = `/item/${item.id}`;
            return (
              <div key={item.id} className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <Link href={previewUrl} className="block relative">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={thumbnailUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      width={400}
                      height={300}
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm rounded-full text-gray-700 shadow-sm">
                      {item.is_year_unknown ? 'Year Unknown' : item.year}
                    </span>
                  </div>
                </Link>
                <div className="p-4">
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                      {item.collection.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">{item.title}</h3>
                  <div className="flex gap-3">
                    <Link 
                      href={previewUrl} 
                      className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Preview
                    </Link>
                    <a 
                      href={url} 
                      className="flex-1 text-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      target="_blank" 
                      rel="noopener noreferrer" 
                      download
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
