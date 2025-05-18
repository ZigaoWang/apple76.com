'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

interface Item {
  id: number;
  title: string;
  year: number;
  is_year_unknown: boolean;
  collection: string;
  oss_key: string;
  thumbnail_key: string | null;
}

interface HeroSearchProps {
    backgroundItems: Item[]; // Items passed from server for background
}

export default function HeroSearch({ backgroundItems }: HeroSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter(); // Initialize useRouter

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      // Redirect to search results page with query parameter
      router.push(`/search?query=${encodeURIComponent(query)}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div 
      className="relative overflow-hidden py-24 sm:py-32 lg:py-40 bg-cover bg-center"
    >
      {/* Dynamic Background Images */}
      <div className="absolute inset-0 w-full h-full">
        <div className="grid grid-cols-4 gap-1 h-full opacity-20"> {/* Removed grayscale */}
          {backgroundItems.map(item => {
            const thumbnailUrl = item.thumbnail_key ? `/api/oss-proxy?key=${encodeURIComponent(item.thumbnail_key)}` : `/api/oss-proxy?key=${encodeURIComponent(item.oss_key)}`;
            return (
              <div key={item.id} className="relative overflow-hidden">
                 <img
                  src={thumbnailUrl}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  // Remove blur-up for background images for simplicity
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Overlay */}
      {/* Removed the overlay div */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-900"> {/* Adjusted text color for better contrast without overlay */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight drop-shadow-lg">
          Apple76.com
        </h1>
        <p className="text-xl sm:text-2xl text-gray-700 max-w-3xl mx-auto mb-10 leading-relaxed drop-shadow">
          A curated collection of Apple&apos;s rich history through vintage manuals,
          advertisements, and rare memorabilia.
        </p>
        
        {/* Search Bar */}
        <div className="mt-10 max-w-md mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              placeholder="Search items..."
              className="w-full px-6 py-3 text-lg rounded-full border-2 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 shadow-lg"
              value={searchQuery}
              onChange={handleInputChange}
            />
            <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3">
              {/* Search Icon */}
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 