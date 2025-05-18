'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the VideoPlayer component with no SSR
const VideoPlayer = dynamic(() => import('./VideoPlayer'), { ssr: false });

interface VideoPlayerWrapperProps {
  src: string;
  poster?: string;
  title: string;
}

export default function VideoPlayerWrapper({ src, poster, title }: VideoPlayerWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  
  // Log poster URL for debugging
  useEffect(() => {
    console.log(`VideoPlayer for ${title} - Poster URL:`, poster);
  }, [poster, title]);

  // Make sure we're on the client side before rendering the video player
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Loading placeholder while on server or before hydration
    return (
      <div className="w-full aspect-video bg-gray-100 flex items-center justify-center rounded-lg">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
          </div>
          <p className="mt-4 text-gray-500">Loading video player...</p>
        </div>
      </div>
    );
  }

  return (
    <VideoPlayer 
      src={src} 
      poster={poster} 
      title={title} 
    />
  );
} 