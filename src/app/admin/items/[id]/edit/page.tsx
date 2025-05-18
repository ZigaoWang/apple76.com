'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Item {
  id: number;
  title: string;
  year: number;
  is_year_unknown: boolean;
  collection: string;
  original_link: string | null;
  description: string | null;
  tags: string | null;
  oss_key: string;
  thumbnail_key: string | null;
  source: string | null;
  author: string | null;
  notes: string | null;
  file_size: number;
  uploaded_at: string;
}

export default function EditItem({ params }: { params: { id: string } }) {
  // Access id directly as a string to avoid React.use() issues in client components
  const itemId = params.id;
  
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Collections list
  const collections = [
    'print-ads',
    'hardware-manuals',
    'software-manuals',
    'videos',
    'wallpapers',
    'wwdc-sessions',
    'press-releases',
    'interviews'
  ];

  useEffect(() => {
    async function fetchItem() {
      try {
        const response = await fetch(`/api/items/${itemId}`);
        if (!response.ok) {
          throw new Error(`Error fetching item: ${response.statusText}`);
        }
        const data = await response.json();
        setItem(data);
        
        // If there's a thumbnail, set the preview
        if (data.thumbnail_key) {
          setThumbnailPreview(`/api/oss-proxy?key=${encodeURIComponent(data.thumbnail_key)}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load item');
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [itemId]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (!item) return;
    
    // Handle checkbox for is_year_unknown
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setItem({
        ...item,
        [name]: checked
      });
      return;
    }
    
    setItem({
      ...item,
      [name]: value
    });
  };
  
  // Handle thumbnail upload
  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !item) return;
    
    const file = e.target.files[0];
    
    // Create a preview
    const objectUrl = URL.createObjectURL(file);
    setThumbnailPreview(objectUrl);
    
    // Upload the thumbnail
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection', item.collection);
    
    try {
      const response = await fetch('/api/thumbnail', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload thumbnail');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.thumbnailKey) {
        throw new Error('Failed to process thumbnail');
      }
      
      // Update item with new thumbnail key
      setItem({
        ...item,
        thumbnail_key: data.thumbnailKey
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload thumbnail');
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!item) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });
      
      if (!response.ok) {
        throw new Error(`Error updating item: ${response.statusText}`);
      }
      
      const data = await response.json();
      setItem(data);
      setSuccess(true);
      
      // Remove success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white p-8 rounded-xl shadow-sm animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center">
          <h2 className="text-xl font-medium text-red-600 mb-4">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  if (!item) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center">
          <h2 className="text-xl font-medium text-red-600 mb-4">Item Not Found</h2>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="bg-white shadow-sm rounded-xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Item #{item.id}</h1>
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg">
            <p className="text-green-700">Item updated successfully!</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={item.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Collection */}
          <div>
            <label htmlFor="collection" className="block text-sm font-medium text-gray-700 mb-1">
              Collection *
            </label>
            <select
              id="collection"
              name="collection"
              required
              value={item.collection}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a collection</option>
              {collections.map(collection => (
                <option key={collection} value={collection}>
                  {collection.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>
          
          {/* Year */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={item.year || ''}
                onChange={handleChange}
                disabled={item.is_year_unknown}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_year_unknown"
                  checked={item.is_year_unknown}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Year unknown</span>
              </label>
            </div>
          </div>
          
          {/* Thumbnail */}
          <div>
            <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail
            </label>
            <div className="flex items-start gap-4">
              {thumbnailPreview && (
                <div className="w-32 h-32 relative border border-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  id="thumbnail"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors text-sm font-medium"
                  >
                    {thumbnailPreview ? 'Change Thumbnail' : 'Upload Thumbnail'}
                  </button>
                  {thumbnailPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailPreview(null);
                        setItem({...item, thumbnail_key: null});
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-colors text-sm font-medium"
                    >
                      Remove Thumbnail
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Author */}
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
              Author
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={item.author || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Source */}
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <input
              type="text"
              id="source"
              name="source"
              value={item.source || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Original Link */}
          <div>
            <label htmlFor="original_link" className="block text-sm font-medium text-gray-700 mb-1">
              Original Link
            </label>
            <input
              type="url"
              id="original_link"
              name="original_link"
              value={item.original_link || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={item.description || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          
          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={item.tags || ''}
              onChange={handleChange}
              placeholder="apple, macintosh, retro, vintage"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={item.notes || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          
          {/* File info - read only */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">File Information</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">File Size:</dt>
              <dd>{formatFileSize(item.file_size)}</dd>
              
              <dt className="text-gray-500">OSS Key:</dt>
              <dd className="break-all text-xs">{item.oss_key}</dd>
              
              <dt className="text-gray-500">Uploaded:</dt>
              <dd>{new Date(item.uploaded_at).toLocaleString()}</dd>
            </dl>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-4 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => router.push(`/item/${item.id}`)}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-400"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 