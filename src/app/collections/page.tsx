export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold mb-8">Collections</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <a href="/collections/hardware-manuals" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">📚 Hardware Manuals</h2>
            <p>Vintage Apple hardware manuals with online previews.</p>
          </a>
          <a href="/collections/software-manuals" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">📚 Software Manuals</h2>
            <p>Vintage Apple software manuals with online previews.</p>
          </a>
          <a href="/collections/print-ads" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">📰 Print Ads</h2>
            <p>Iconic Apple print advertisements from 1984 and beyond.</p>
          </a>
          <a href="/collections/tv-ads" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">📺 TV Ads</h2>
            <p>Iconic Apple TV commercials from 1984 and beyond.</p>
          </a>
          <a href="/collections/wwdc-keynotes" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">🎤 WWDC Keynotes</h2>
            <p>Historic WWDC keynote presentations and materials.</p>
          </a>
          <a href="/collections/wwdc-sessions" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">💻 WWDC Sessions</h2>
            <p>Technical sessions and developer materials from WWDC.</p>
          </a>
          <a href="/collections/wallpapers" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">🖼️ Wallpapers</h2>
            <p>Apple wallpaper collection, downloadable and previewable.</p>
          </a>
          <a href="/collections/event-photos" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">📸 Event Photos</h2>
            <p>Photos from Apple events, launches, and special occasions.</p>
          </a>
          <a href="/collections/product-photos" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">📸 Product Photos</h2>
            <p>Official product photography and promotional images.</p>
          </a>
          <a href="/collections/product-announcements" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">📢 Product Announcements</h2>
            <p>Historic product announcements and launch materials.</p>
          </a>
          <a href="/collections/press-releases" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">📰 Press Releases</h2>
            <p>Official Apple press releases and media announcements.</p>
          </a>
        </div>
      </div>
    </main>
  );
} 