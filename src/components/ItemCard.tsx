'use client';

import Link from 'next/link';
import { useState } from 'react';

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
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Get file extension
  const fileExt = item.oss_key.split('.').pop()?.toLowerCase() || '';
  
  // Check file types
  const isVideo = ['mp4', 'mov', 'webm'].includes(fileExt);
  const isPDF = fileExt === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(fileExt);
  
  // Use a generic file type label
  const fileType = isPDF ? 'PDF' : 
                  isVideo ? 'Video' : 
                  isImage ? 'Image' : 
                  fileExt.toUpperCase() || 'File';
  
  // Handle different thumbnail scenarios
  const thumbnailUrl = item.thumbnail_key ? 
    `/api/oss-proxy?key=${encodeURIComponent(item.thumbnail_key)}` : 
    (isImage ? url : null);
  
  const previewUrl = `/item/${item.id}`;
  
  // Check if we have a valid thumbnail
  const hasThumbnail = thumbnailUrl && !imgError;

  return (
    <div className="break-inside-avoid group">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
        {hasThumbnail && (
          <Link href={previewUrl} className="block relative w-full">
            {/* Image with natural aspect ratio */}
            <div className="relative w-full overflow-hidden rounded-t-xl bg-gray-100 transition-transform duration-300 group-hover:scale-105">
              <img
                src={thumbnailUrl}
                alt={item.title}
                className="relative w-full h-auto object-contain"
                loading="lazy"
                decoding="async"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{ 
                  opacity: imgLoaded ? 1 : 0, 
                  transition: 'opacity 0.3s ease-in-out' 
                }}
              />
            </div>
            
            {/* File type label */}
            <div className="absolute bottom-3 right-3">
              <span className="px-2 py-1 text-xs font-medium bg-black/70 text-white rounded-md shadow-sm">
                {fileType}
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
        
        <div className={`p-4 flex-grow flex flex-col ${!hasThumbnail ? 'rounded-t-xl' : ''}`}>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
              {item.collection.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
            {!hasThumbnail && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                {fileType}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors flex-grow">
            {item.title}
          </h3>
          {!item.is_year_unknown && item.year && !hasThumbnail && (
            <div className="mb-3">
              <span className="text-sm text-gray-500">
                {item.year}
              </span>
            </div>
          )}
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