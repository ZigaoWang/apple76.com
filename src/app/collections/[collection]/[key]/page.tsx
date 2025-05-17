import { notFound } from 'next/navigation';

interface CollectionPageProps {
  params: { 
    collection: string;
    key: string;
  };
}

export default async function CollectionPreviewPage({ params }: CollectionPageProps) {
  const { collection, key } = params;
  const oss_key = decodeURIComponent(key);
  const url = `/api/oss-proxy?key=${encodeURIComponent(oss_key)}`;

  // Determine if it's a PDF
  const isPDF = oss_key.toLowerCase().endsWith('.pdf');

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6">Preview</h1>
        <div className="bg-gray-900 rounded-lg p-8 flex flex-col items-center">
          {isPDF ? (
            <iframe
              src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(url)}`}
              width="100%"
              height="800"
              className="rounded border border-gray-700 bg-white"
              style={{ minHeight: 600 }}
              title="PDF Preview"
              allowFullScreen
            />
          ) : (
            <img src={url} alt={oss_key} className="rounded shadow-lg max-w-full max-h-[80vh] bg-white" />
          )}
          <div className="flex gap-6 mt-6">
            <a href={url} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" download>Download</a>
            <a href={url} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Open in new tab</a>
          </div>
        </div>
      </div>
    </main>
  );
} 