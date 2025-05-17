import { notFound } from 'next/navigation';

interface WallpaperPageProps {
  params: { key: string[] };
}

export default async function WallpaperPreviewPage({ params }: WallpaperPageProps) {
  const key = Array.isArray(params.key) ? params.key.join('/') : params.key;
  if (!key) return notFound();
  const url = `/api/oss-proxy?key=${encodeURIComponent(key)}`;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <div className="max-w-2xl w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6">Wallpaper Preview</h1>
        <img src={url} alt={key} className="rounded shadow-lg max-w-full max-h-[80vh] bg-white" />
        <div className="flex gap-6 mt-6">
          <a href={url} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" download>Download</a>
          <a href={url} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Open in new tab</a>
        </div>
      </div>
    </main>
  );
} 