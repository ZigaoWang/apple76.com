import Image from 'next/image';
import Link from 'next/link';
import { listFiles } from '@/lib/oss';

export default async function WallpapersPage() {
  const files = await listFiles('wallpapers/');
  const wallpapers = files.filter((file: any) => file.name && (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png') || file.name.endsWith('.webp') || file.name.endsWith('.heic')));

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <div className="max-w-5xl w-full">
        <h1 className="text-3xl font-bold mb-6">Apple Wallpapers</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {wallpapers.map((wallpaper: any) => {
            const url = `/api/oss-proxy?key=${encodeURIComponent(wallpaper.name)}`;
            const previewUrl = `/collections/wallpapers/${encodeURIComponent(wallpaper.name)}`;
            return (
              <div key={wallpaper.name} className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
                <Link href={previewUrl}>
                  <Image src={url} alt={wallpaper.name} width={300} height={400} className="rounded mb-2 object-contain max-h-80" />
                </Link>
                <div className="flex gap-4 mt-2">
                  <a href={url} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" download>Download</a>
                  <Link href={previewUrl} className="text-blue-400 hover:underline">Preview</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
} 