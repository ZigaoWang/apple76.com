import Link from 'next/link';
import { listFiles } from '@/lib/oss';
import client from '@/lib/oss';

export default async function ManualsPage() {
  // Fetch manuals from OSS
  const files = await listFiles('manuals/');
  // Filter out folders and only show PDF/manual files
  const manuals = files.filter((file: any) => file.name && file.name.endsWith('.pdf'));

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6">Apple Manuals</h1>
        <ul className="space-y-4">
          {manuals.map((manual: any) => {
            const previewUrl = `/collections/manuals/${encodeURIComponent(manual.name)}`;
            const downloadUrl = client.signatureUrl(manual.name, { expires: 600 });
            return (
              <li key={manual.name} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                <span>{manual.name.replace('manuals/', '')}</span>
                <div className="flex gap-4">
                  <Link href={previewUrl} className="text-blue-400 hover:underline">Preview</Link>
                  <a href={downloadUrl} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" download>Download</a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
} 