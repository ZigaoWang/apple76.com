import { notFound } from 'next/navigation';
import { openDb } from '@/lib/db';
import { formatFileSize } from '@/lib/utils';

interface ItemPageProps {
  params: { 
    collection: string;
    key: string;
  };
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { key } = await params;
  const oss_key = decodeURIComponent(key);

  // Get item details from database
  const db = await openDb();
  const item = await db.get('SELECT * FROM items WHERE oss_key = ?', oss_key);

  if (!item) {
    return notFound();
  }

  const url = `/api/oss-proxy?key=${encodeURIComponent(oss_key)}`;
  const isPDF = oss_key.toLowerCase().endsWith('.pdf');

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Preview Section */}
              <div className="md:w-2/3">
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                  {isPDF ? (
                    <iframe
                      src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(url)}`}
                      width="100%"
                      height="800"
                      className="rounded border border-gray-200 bg-white"
                      style={{ minHeight: 600 }}
                      title="PDF Preview"
                      allowFullScreen
                    />
                  ) : (
                    <img 
                      src={url} 
                      alt={item.title} 
                      className="rounded shadow-sm max-w-full max-h-[80vh] bg-white" 
                    />
                  )}
                </div>
                <div className="flex gap-4 mt-4">
                  <a 
                    href={url} 
                    className="flex-1 text-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    target="_blank" 
                    rel="noopener noreferrer" 
                    download
                  >
                    Download
                  </a>
                  <a 
                    href={url} 
                    className="flex-1 text-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Open in new tab
                  </a>
                </div>
              </div>

              {/* Details Section */}
              <div className="md:w-1/3">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{item.title}</h1>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Year</span>
                    <p className="text-gray-900">{item.is_year_unknown ? 'Unknown' : item.year}</p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-500">Collection</span>
                    <p className="text-gray-900">
                      {item.collection.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </p>
                  </div>

                  {item.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Description</span>
                      <p className="text-gray-900 whitespace-pre-wrap">{item.description}</p>
                    </div>
                  )}

                  {item.author && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Author</span>
                      <p className="text-gray-900">{item.author}</p>
                    </div>
                  )}

                  {item.source && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Source</span>
                      <p className="text-gray-900">{item.source}</p>
                    </div>
                  )}

                  {item.original_link && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Original Link</span>
                      <a 
                        href={item.original_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline block truncate"
                      >
                        {item.original_link}
                      </a>
                    </div>
                  )}

                  {item.tags && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Tags</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.tags.split(',').map((tag: string) => (
                          <span 
                            key={tag} 
                            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Notes</span>
                      <p className="text-gray-900 whitespace-pre-wrap">{item.notes}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-medium text-gray-500">File Size</span>
                    <p className="text-gray-900">{formatFileSize(item.file_size)}</p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-500">Uploaded</span>
                    <p className="text-gray-900">{new Date(item.uploaded_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 