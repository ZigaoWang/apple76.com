export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold mb-8">Collections</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <a href="/collections/manuals" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">📚 Manuals</h2>
            <p>Vintage Apple manuals with online previews.</p>
          </a>
          <a href="/collections/ads" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">📰 Ads</h2>
            <p>Iconic Apple advertisements from 1984 and beyond.</p>
          </a>
          <a href="/collections/wwdc" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">🎟️ WWDC</h2>
            <p>Rare WWDC stickers, passes, and memorabilia.</p>
          </a>
          <a href="/collections/wallpapers" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
            <h2 className="text-2xl font-bold mb-2">🖼️ Wallpapers</h2>
            <p>Apple wallpaper collection, downloadable and previewable.</p>
          </a>
        </div>
      </div>
    </main>
  );
} 