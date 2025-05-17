import Link from 'next/link';
import { openDb } from '@/lib/db';

async function getCollections() {
  const db = await openDb();
  const collections = await db.all(`
    SELECT DISTINCT collection, COUNT(*) as count 
    FROM items 
    GROUP BY collection 
    ORDER BY collection
  `);
  return collections;
}

export default async function CollectionsPage() {
  const collections = await getCollections();

  const collectionInfo = {
    'hardware-manuals': {
      title: 'Hardware Manuals',
      description: 'Original user manuals and technical documentation for Apple hardware products.',
      icon: '📚'
    },
    'software-manuals': {
      title: 'Software Manuals',
      description: 'User guides and documentation for Apple software and operating systems.',
      icon: '💻'
    },
    'print-ads': {
      title: 'Print Advertisements',
      description: 'Magazine and newspaper advertisements showcasing Apple products.',
      icon: '📰'
    },
    'tv-ads': {
      title: 'TV Commercials',
      description: 'Television advertisements and promotional videos.',
      icon: '📺'
    },
    'wwdc-keynotes': {
      title: 'WWDC Keynotes',
      description: 'Keynote presentations from Apple\'s Worldwide Developers Conference.',
      icon: '🎤'
    },
    'wwdc-sessions': {
      title: 'WWDC Sessions',
      description: 'Technical sessions and workshops from WWDC.',
      icon: '👨‍💻'
    },
    'wallpapers': {
      title: 'Wallpapers',
      description: 'Original desktop wallpapers from various Apple operating systems.',
      icon: '🖼️'
    },
    'event-photos': {
      title: 'Event Photos',
      description: 'Photographs from Apple events and product launches.',
      icon: '📸'
    },
    'product-photos': {
      title: 'Product Photos',
      description: 'Official product photography and marketing images.',
      icon: '📱'
    },
    'product-announcements': {
      title: 'Product Announcements',
      description: 'Press releases and announcements for new Apple products.',
      icon: '📢'
    },
    'press-releases': {
      title: 'Press Releases',
      description: 'Official press releases and media communications.',
      icon: '📄'
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Collections
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Browse our curated collections of Apple history and memorabilia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => {
            const info = collectionInfo[collection.collection as keyof typeof collectionInfo];
            if (!info) return null;

            return (
              <Link 
                key={collection.collection}
                href={`/collections/${collection.collection}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-3xl">{info.icon}</span>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {info.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {collection.count} items
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {info.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
} 