import { notFound } from 'next/navigation';
import client from '@/lib/oss';

interface ManualPageProps {
  params: { key: string[] };
}

export default async function ManualPreviewPage({ params }: ManualPageProps) {
  // The key param is an array due to catch-all route
  const key = Array.isArray(params.key) ? params.key.join('/') : params.key;

  // Generate a signed URL for the file (valid for 10 minutes)
  let url: string | null = null;
  try {
    url = client.signatureUrl(key, { expires: 600 });
  } catch (e) {
    return notFound();
  }

  // Only support PDF preview for now
  const isPDF = key.toLowerCase().endsWith('.pdf');

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6">Manual Preview</h1>
        <div className="bg-gray-900 rounded-lg p-8 flex flex-col items-center">
          {isPDF ? (
            <iframe
              src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(url!)}`}
              width="100%"
              height="800"
              className="rounded border border-gray-700 bg-white"
              style={{ minHeight: 600 }}
              title="PDF Preview"
              allowFullScreen
            />
          ) : (
            <p className="mb-4">Preview not supported for this file type.</p>
          )}
          <a
            href={url!}
            className="text-blue-400 hover:underline mt-6"
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            Download PDF
          </a>
        </div>
      </div>
    </main>
  );
} 