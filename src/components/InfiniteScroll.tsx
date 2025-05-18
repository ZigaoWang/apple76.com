'use client';

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import ItemCard from '@/components/ItemCard'; // Import the shared ItemCard component

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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
        <div className="relative w-full overflow-hidden rounded-t-xl bg-gray-200 aspect-[4/3]" />
        <div className="p-4 flex-grow">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="flex gap-3 mt-auto">
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
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);
    
    try {
      // Add cache-busting query parameter
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/items?page=${page}&limit=12&t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...data.items]);
        setPage(prev => prev + 1);
      }
      
      // Reset retry count on success
      setRetryCount(0);
    } catch (error) {
      console.error('Error loading more items:', error);
      setError(`Failed to load items. ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Don't retry more than 3 times
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          setLoading(false); // Allow retry
        }, 2000); // Wait 2 seconds before retry
      } else {
        setHasMore(false); // Stop trying after 3 retries
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inView && !loading && hasMore) {
      loadMore();
    }
  }, [inView, retryCount]);

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {items.map((item) => (
        <div key={item.id} className="mb-4 break-inside-avoid">
          <ItemCard item={item} />
        </div>
      ))}
      
      {/* Show skeletons while loading */}
      {loading && Array.from({ length: 4 }).map((_, index) => (
        <div key={`skeleton-${page}-${index}`} className="mb-4 break-inside-avoid">
          <ItemSkeleton />
        </div>
      ))}
      
      {/* Error message */}
      {error && (
        <div className="col-span-full p-4 my-4 bg-red-50 border border-red-100 rounded-lg text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => {
              setLoading(false);
              setRetryCount(prev => prev + 1);
            }}
            className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Loading indicator */}
      <div ref={ref} className="h-20 flex items-center justify-center">
        {hasMore && !error && !loading && <div className="w-6 h-6 border-t-2 border-blue-500 rounded-full animate-spin"></div>}
      </div>
    </div>
  );
} 