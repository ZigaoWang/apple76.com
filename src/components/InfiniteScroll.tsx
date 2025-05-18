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
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/items?page=${page}&limit=12`);
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
      {items.map((item) => (
        <div key={item.id} className="mb-4 break-inside-avoid">
          <ItemCard item={item} />
        </div>
      ))}
      {/* Show skeletons while loading */}
      {loading && Array.from({ length: 12 }).map((_, index) => (
        <div key={page * 12 + index} className="mb-4 break-inside-avoid">
          <ItemSkeleton />
        </div>
      ))}
      <div ref={ref} className="h-20 flex items-center justify-center">
      </div>
    </div>
  );
} 