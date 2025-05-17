import Link from 'next/link';
import { openDb } from '@/lib/db';

async function getAllItems(limit = 20) {
  const db = await openDb();
  return db.all('SELECT * FROM items ORDER BY uploaded_at DESC LIMIT ?', limit);
}

export default async function Home() {
  const items = await getAllItems();

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Apple Archive</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const url = `/api/oss-proxy?key=${encodeURIComponent(item.oss_key)}`;
            const previewUrl = `/collections/${item.collection}/${encodeURIComponent(item.oss_key)}`;
            return (
              <div key={item.id} className="bg-gray-800 rounded-lg p-4 flex flex-col">
                <Link href={previewUrl} className="flex-grow">
                  <img src={url} alt={item.title} className="rounded mb-2 object-contain max-h-48 bg-white w-full" style={{ height: 192 }} />
                </Link>
                <div className="text-center">
                  <div className="font-bold text-lg mb-1">{item.title}</div>
                  <div className="text-gray-400 text-sm mb-2">
                    {item.is_year_unknown ? 'Year Unknown' : item.year}
                  </div>
                  <div className="text-blue-400 text-sm mb-2">
                    {item.collection.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Link href={previewUrl} className="text-blue-400 hover:underline">Preview</Link>
                    <a href={url} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" download>Download</a>
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
