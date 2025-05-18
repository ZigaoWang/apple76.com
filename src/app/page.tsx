import InfiniteScroll from '@/components/InfiniteScroll';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Apple76.com
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              A curated collection of Apple&apos;s rich history through vintage manuals, advertisements, and rare memorabilia.
            </p>
          </div>
        </div>
      </div>

      {/* Masonry Grid with Infinite Scroll */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InfiniteScroll />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>Made by Zigao Wang. Not affiliated with Apple Inc.</p>
            <p className="mt-2">© {new Date().getFullYear()} Apple76.com. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
