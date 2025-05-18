'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface VideoThumbnailProps {
  thumbnailUrl: string | null;
  title: string;
  linkUrl: string;
  year?: number;
  isYearUnknown?: boolean;
}

export default function VideoThumbnail({ 
  thumbnailUrl, 
  title, 
  linkUrl,
  year,
  isYearUnknown = false
}: VideoThumbnailProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Generate a default gradient background for videos without thumbnails
  const colorHue = Math.floor((title.length * 137.5) % 360);
  const defaultBg = `linear-gradient(135deg, hsl(${colorHue}, 70%, 35%) 0%, hsl(${(colorHue + 60) % 360}, 70%, 45%) 100%)`;

  // Ensure image styles are properly updated
  useEffect(() => {
    if (imageError) {
      console.log(`Error loading thumbnail for video: ${title}`);
    }
  }, [imageError, title]);

  return (
    <Link href={linkUrl} className="block relative w-full aspect-[4/3]">
      <div className="relative w-full h-full overflow-hidden rounded-t-xl bg-gray-800 transition-transform duration-300 group-hover:scale-105">
        {/* Default background for no-thumbnail or loading states */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ 
            background: defaultBg,
            opacity: imageLoaded && !imageError ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        {/* Thumbnail image if available */}
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onLoad={(e) => {
              setImageLoaded(true);
              const target = e.target as HTMLImageElement;
              target.style.opacity = '1';
            }}
            onError={() => setImageError(true)}
            style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
          />
        )}
      </div>
      
      {/* Labels */}
      <div className="absolute bottom-3 right-3">
        <span className="px-2 py-1 text-xs font-medium bg-black/70 text-white rounded-md shadow-sm">
          Video
        </span>
      </div>
      
      {!isYearUnknown && year && (
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm rounded-full text-gray-700 shadow-sm">
            {year}
          </span>
        </div>
      )}
    </Link>
  );
} 