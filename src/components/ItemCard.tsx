import Link from 'next/link';

interface Item {
  id: number;
  title: string;
  year: number;
  is_year_unknown: boolean;
  collection: string;
  oss_key: string;
  thumbnail_key: string | null;
}

interface ItemCardProps {
    item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  const url = `/api/oss-proxy?key=${encodeURIComponent(item.oss_key)}`;
  const thumbnailUrl = item.thumbnail_key ? `/api/oss-proxy?key=${encodeURIComponent(item.thumbnail_key)}` : url;
  const previewUrl = `/item/${item.id}`;

  return (
    <div className="break-inside-avoid group">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
        <Link href={previewUrl} className="block relative w-full aspect-[4/3]">
          {/* Image Container with overflow hidden and transition */}
          <div className="relative w-full h-full overflow-hidden rounded-t-xl bg-gray-100 transition-transform duration-300 group-hover:scale-105">
            {/* Tiny placeholder image for blur-up effect */}
            <div
              className="absolute inset-0 w-full h-full bg-gray-200 blur-xl scale-110"
              style={{
                backgroundImage: `url(${thumbnailUrl}?x-oss-process=image/resize,w_20)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            {/* Main image */}
            <img
              src={thumbnailUrl}
              alt={item.title}
              className="relative w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.opacity = '1';
              }}
              style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
            />
          </div>
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm rounded-full text-gray-700 shadow-sm">
              {item.is_year_unknown ? 'Year Unknown' : item.year}
            </span>
          </div>
        </Link>
        <div className="p-4 flex-grow flex flex-col">
          <div className="mb-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
              {item.collection.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors flex-grow">
            {item.title}
          </h3>
          <div className="flex gap-3 mt-auto">
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
    </div>
  );
} 