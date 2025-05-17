import Link from 'next/link';
import { openDb } from '@/lib/db';
import client from '@/lib/oss';

async function getItemsByCollection(collection: string, limit = 8) {
  const db = await openDb();
  return db.all('SELECT * FROM items WHERE collection = ? ORDER BY year DESC, uploaded_at DESC LIMIT ?', collection, limit);
}

export default async function Home() {
  const [manuals, ads, wwdc, wallpapers] = await Promise.all([
    getItemsByCollection('manuals'),
    getItemsByCollection('ads'),
    getItemsByCollection('wwdc'),
    getItemsByCollection('wallpapers'),
  ]);

  function renderSection(title: string, items: any[], collection: string) {
    return (
      <section className="mb-12 w-full max-w-5xl">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item) => {
            const url = `/api/oss-proxy?key=${encodeURIComponent(item.oss_key)}`;
            const previewUrl = `/collections/${collection}/${encodeURIComponent(item.oss_key)}`;
  return (
              <div key={item.id} className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
                <Link href={previewUrl}>
                  {/* Use img for all types, fallback to file name if no image */}
                  <img src={url} alt={item.title} className="rounded mb-2 object-contain max-h-48 bg-white" style={{ width: '100%', height: 192 }} />
                </Link>
                <div className="text-center">
                  <div className="font-bold text-lg mb-1">{item.title}</div>
                  <div className="text-gray-400 text-sm mb-2">{item.year}</div>
                  <div className="flex gap-2 justify-center">
                    <Link href={previewUrl} className="text-blue-400 hover:underline">Preview</Link>
                    <a href={url} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" download>Download</a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-right mt-2">
          <Link href={`/collections/${collection}`} className="text-blue-400 hover:underline">View all &rarr;</Link>
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center p-8">
      <div className="w-full flex flex-col items-center">
        <h1 className="text-5xl font-extrabold mb-4">apple76.com</h1>
        <p className="text-xl mb-8 max-w-2xl text-center">
          Dedicated to preserving and sharing the rich history of Apple Inc. through a curated collection of vintage manuals, advertisements, WWDC materials, and rare ephemera.
        </p>
        {renderSection('Manuals', manuals, 'manuals')}
        {renderSection('Ads', ads, 'ads')}
        {renderSection('WWDC', wwdc, 'wwdc')}
        {renderSection('Wallpapers', wallpapers, 'wallpapers')}
        </div>
      </main>
  );
}
