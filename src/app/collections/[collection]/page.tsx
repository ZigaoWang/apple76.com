import Link from 'next/link';
import { openDb } from '@/lib/db';
import { notFound } from 'next/navigation';

interface CollectionPageProps {
  params: {
    collection: string;
  };
}

async function getItemsByCollection(collection: string) {
  const db = await openDb();
  return db.all('SELECT * FROM items WHERE collection = ? ORDER BY year DESC, uploaded_at DESC', collection);
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { collection } = params;
  const items = await getItemsByCollection(collection);

  if (items.length === 0) {
    return notFound();
  }

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

  const info = collectionInfo[collection as keyof typeof collectionInfo];
  if (!info) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-4xl">{info.icon}</span>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {info.title}
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {info.description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const url = `/api/oss-proxy?key=${encodeURIComponent(item.oss_key)}`;
            const previewUrl = `/item/${item.id}`;
            return (
              <div key={item.id} className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <Link href={previewUrl} className="block relative">
                  <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                    <img 
                      src={url} 
                      alt={item.title} 
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" 
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm rounded-full text-gray-700 shadow-sm">
                      {item.is_year_unknown ? 'Year Unknown' : item.year}
                    </span>
                  </div>
                </Link>
                <div className="p-4">
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