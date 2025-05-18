'use client';

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface Item {
  id: number;
  title: string;
  year: number;
  is_year_unknown: boolean;
  collection: string;
  oss_key: string;
  thumbnail_key: string | null;
}

// Loading skeleton component
function ItemSkeleton() {
  return (
    <div className="break-inside-avoid group animate-pulse">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="relative w-full overflow-hidden rounded-t-xl bg-gray-200 aspect-[4/3]" />
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="flex gap-3">
            <div className="flex-1 h-8 bg-gray-200 rounded" />
            <div className="flex-1 h-8 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InfiniteScroll() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/items?page=${page}&limit=12`); // Reduced batch size for better performance
      const data = await response.json();
      
      if (data.items.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...data.items]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView]);

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {items.map((item) => {
        const url = `/api/oss-proxy?key=${encodeURIComponent(item.oss_key)}`;
        const thumbnailUrl = item.thumbnail_key ? `/api/oss-proxy?key=${encodeURIComponent(item.thumbnail_key)}` : url;
        const previewUrl = `/item/${item.id}`;
        return (
          <div key={item.id} className="break-inside-avoid group">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <a href={previewUrl} className="block relative">
                <div className="relative w-full overflow-hidden rounded-t-xl bg-gray-100">
                  {/* Tiny placeholder image for blur-up effect */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-gray-200 blur-xl scale-110"
                    style={{
                      backgroundImage: `url(${thumbnailUrl}?x-oss-process=image/resize,w_20)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <img
                    src={thumbnailUrl}
                    alt={item.title}
                    className="relative w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    onLoad={(e) => {
                      // Remove blur effect once image is loaded
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
              </a>
              <div className="p-4">
                <div className="mb-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                    {item.collection.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <div className="flex gap-3">
                  <a 
                    href={previewUrl} 
                    className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Preview
                  </a>
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
      })}
      <div ref={ref} className="h-20 flex items-center justify-center">
        {loading && (
          <>
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
          </>
        )}
      </div>
    </div>
  );
} 