import { notFound } from 'next/navigation';
import { openDb } from '@/lib/db';
import { formatFileSize } from '@/lib/utils';
import VideoPlayerWrapper from '@/components/VideoPlayerWrapper';
import Link from 'next/link';

interface ItemPageProps {
  params: { id: string };
}

export default async function ItemPage({ params }: ItemPageProps) {
  // Properly handle params
  const paramsValue = await Promise.resolve(params);
  const id = parseInt(paramsValue.id, 10);
  
  if (isNaN(id)) return notFound();

  const db = await openDb();
  const item = await db.get('SELECT * FROM items WHERE id = ?', id);
  if (!item) return notFound();

  const url = `/api/oss-proxy?key=${encodeURIComponent(item.oss_key)}`;
  
  // Determine file type
  const isPDF = item.oss_key.toLowerCase().endsWith('.pdf');
  const isVideo = item.oss_key.toLowerCase().endsWith('.mp4') || 
                 item.oss_key.toLowerCase().endsWith('.mov') || 
                 item.oss_key.toLowerCase().endsWith('.webm');
  const isImage = item.oss_key.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i);
  
  // Generate a proper poster URL for videos 
  const posterUrl = item.thumbnail_key 
    ? `/api/oss-proxy?key=${encodeURIComponent(item.thumbnail_key)}` 
    : undefined;

  // Check if file type is supported for preview
  const supportsPreview = isPDF || isVideo || isImage;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Preview Section */}
              <div className="md:w-2/3 flex flex-col">
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center mb-4">
                  {!supportsPreview ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">This file doesn&apos;t support preview</h3>
                      <p className="text-gray-600 mb-4">Use the download button below to view this file.</p>
                      <a
                        href={url}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download File
                      </a>
                    </div>
                  ) : isPDF ? (
                    <iframe
                      src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(url)}`}
                      width="100%"
                      height="800"
                      className="rounded border border-gray-200 bg-white"
                      style={{ minHeight: 600 }}
                      title="PDF Preview"
                      allowFullScreen
                    />
                  ) : isVideo ? (
                    <VideoPlayerWrapper
                      src={url} 
                      poster={posterUrl}
                      title={item.title}
                    />
                  ) : (
                    <img 
                      src={url} 
                      alt={item.title} 
                      className="rounded shadow-sm max-w-full max-h-[80vh] bg-white" 
                    />
                  )}
                </div>
                <div className="flex gap-4 mt-2 mb-4">
                  <a 
                    href={url} 
                    className="flex-1 text-center px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                    target="_blank" 
                    rel="noopener noreferrer" 
                    download
                  >
                    Download
                  </a>
                  <a 
                    href={url} 
                    className="flex-1 text-center px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Open in new tab
                  </a>
                </div>
              </div>

              {/* Details Section */}
              <div className="md:w-1/3">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
                  <Link 
                    href={`/admin/items/${id}/edit`}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Museum ID</span>
                    <p className="text-2xl font-mono text-blue-700">#{item.id.toString().padStart(6, '0')}</p>
                  </div>
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