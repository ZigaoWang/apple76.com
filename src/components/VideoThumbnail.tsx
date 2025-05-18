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
  
  // Log thumbnail URL for debugging
  useEffect(() => {
    console.log(`Video: ${title} - Thumbnail URL:`, thumbnailUrl);
  }, [thumbnailUrl, title]);
  
  // Generate a default gradient background for videos without thumbnails
  const colorHue = Math.floor((title.length * 137.5) % 360); // Generate a color based on title
  const defaultBg = `linear-gradient(135deg, hsl(${colorHue}, 70%, 35%) 0%, hsl(${(colorHue + 60) % 360}, 70%, 45%) 100%)`;

  return (
    <Link href={linkUrl} className="block relative w-full aspect-[4/3]">
      {/* Image Container with overflow hidden and transition */}
      <div className="relative w-full h-full overflow-hidden rounded-t-xl bg-gray-800 transition-transform duration-300 group-hover:scale-105">
        {/* Default background when no thumbnail or loading */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ 
            background: defaultBg,
            opacity: imageLoaded && !imageError ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          {/* Video icon for no-thumbnail case */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        {/* Only attempt to show thumbnail if URL exists */}
        {thumbnailUrl && (
          <>
            {/* Thumbnail image with debug logging */}
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onLoad={(e) => {
                console.log(`Thumbnail loaded for: ${title}`);
                const target = e.target as HTMLImageElement;
                target.style.opacity = '1';
                setImageLoaded(true);
              }}
              onError={(e) => {
                console.error(`Thumbnail loading error for: ${title}`, e);
                setImageError(true);
              }}
              style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
            />
          </>
        )}
        
        {/* Video play button overlay - always visible */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center transition-all duration-300 
            opacity-70 group-hover:opacity-90 group-hover:scale-110 group-hover:bg-blue-600/80">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Video label */}
      <div className="absolute bottom-3 right-3">
        <span className="px-2 py-1 text-xs font-medium bg-black/70 text-white rounded-md shadow-sm">
          Video
        </span>
      </div>
      
      {/* Year label (if provided) */}
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