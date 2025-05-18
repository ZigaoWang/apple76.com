'use client';

import { useState } from 'react';
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

interface HeroSearchProps {
    backgroundItems: Item[]; // Items passed from server for background
}

export default function HeroSearch({ backgroundItems }: HeroSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[] | null>(null); // null means no search yet, [] means no results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null); // Clear results if query is empty
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data.items);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch search results.');
      setSearchResults([]); // Show empty results on error
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Optional: Trigger search automatically after a delay as user types
    // debounce(() => handleSearch(), 500)();
  };

  // Optional: Effect to perform search if query param exists on initial load
  // useEffect(() => {
  //   const params = new URLSearchParams(window.location.search);
  //   const query = params.get('query');
  //   if (query) {
  //     setSearchQuery(query);
  //     // Need to call handleSearch here, but need to handle the async nature
  //     // For simplicity now, we rely on button click or enter key
  //   }
  // }, []);

  return (
    <>
      {/* Hero Section with Dynamic Background */}
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
        <div className="absolute inset-0 bg-black opacity-60"></div> {/* Slightly darker overlay */}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight drop-shadow-lg">
            Apple76.com
          </h1>
          <p className="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto mb-10 leading-relaxed drop-shadow">
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
                {loading ? (
                    <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l2-2.647z"></path>
                    </svg>
                ) : (
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults !== null && (
        <section className="py-16 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-12 text-center text-gray-800">Search Results</h2>
            {error && <div className="text-center text-red-600 mb-8">{error}</div>}
            {searchResults.length === 0 && !loading ? (
              <p className="text-center text-gray-600">No items found matching your search.</p>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                {searchResults.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
            {loading && searchResults.length === 0 && ( // Show loading only if no results yet
                 <div className="text-center text-gray-600">Searching...</div>
            )}
          </div>
        </section>
      )}
    </>
  );
} 