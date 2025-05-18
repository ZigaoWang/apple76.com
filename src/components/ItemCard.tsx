'use client';

import Link from 'next/link';
import VideoThumbnail from './VideoThumbnail';

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
  
  // Check file types
  const isVideo = item.oss_key.toLowerCase().endsWith('.mp4') || 
                  item.oss_key.toLowerCase().endsWith('.mov') ||
                  item.oss_key.toLowerCase().endsWith('.webm');
  
  const isPDF = item.oss_key.toLowerCase().endsWith('.pdf');
  
  // Handle different thumbnail scenarios
  const videoThumbnailUrl = item.thumbnail_key && isVideo
    ? `/api/oss-proxy?key=${encodeURIComponent(item.thumbnail_key)}` 
    : null;
  
  // For regular content
  const thumbnailUrl = item.thumbnail_key && item.thumbnail_key !== item.oss_key
    ? `/api/oss-proxy?key=${encodeURIComponent(item.thumbnail_key)}`
    : isPDF ? null : url;
  
  const previewUrl = `/item/${item.id}`;

  // Create a default background color based on the title for items without thumbnails
  const colorHue = Math.floor((item.title.length * 137.5) % 360);
  const defaultBg = `linear-gradient(135deg, hsl(${colorHue}, 70%, 35%) 0%, hsl(${(colorHue + 60) % 360}, 70%, 45%) 100%)`;

  return (
    <div className="break-inside-avoid group">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
        {isVideo ? (
          <VideoThumbnail
            thumbnailUrl={videoThumbnailUrl}
            title={item.title}
            linkUrl={previewUrl}
            year={item.year}
            isYearUnknown={item.is_year_unknown}
          />
        ) : (
          <Link href={previewUrl} className="block relative w-full">
            {/* Image Container with overflow hidden and transition */}
            <div className="relative w-full overflow-hidden rounded-t-xl bg-gray-100 transition-transform duration-300 group-hover:scale-105" 
                 style={{ aspectRatio: isPDF ? '3/4' : '4/3' }}>
              {/* Default background for no-thumbnail or loading states */}
              {(!thumbnailUrl || isPDF) && (
                <div 
                  className="absolute inset-0 w-full h-full flex items-center justify-center"
                  style={{ background: defaultBg }}
                >
                  {isPDF && (
                    <div className="text-white font-bold text-2xl">PDF</div>
                  )}
                </div>
              )}
              
              {/* Main image if available */}
              {thumbnailUrl && (
                <>
                  {/* No blur effect - can cause 404s with OSS resize */}
                  <img
                    src={thumbnailUrl}
                    alt={item.title}
                    className="relative w-full h-full object-cover bg-gray-100"
                    loading="lazy"
                    decoding="async"
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.opacity = '1';
                    }}
                    onError={(e) => {
                      // Hide the image on error
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                    style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                  />
                </>
              )}
            </div>
            
            {/* File type label */}
            <div className="absolute bottom-3 right-3">
              <span className="px-2 py-1 text-xs font-medium bg-black/70 text-white rounded-md shadow-sm">
                {isPDF ? 'PDF' : 'Image'}
              </span>
            </div>
            
            {/* Conditionally render year/unknown label */}
            {!item.is_year_unknown && item.year && (
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm rounded-full text-gray-700 shadow-sm">
                  {item.year}
                </span>
              </div>
            )}
          </Link>
        )}
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