'use client';

import React, { useState } from 'react';

interface Item {
  id: number;
  title: string;
  year: number | null;
  collection: string;
  original_link: string;
  description: string;
  tags: string;
  oss_key: string;
  uploaded_at: string;
  source: string;
  author: string;
  file_size: number;
  notes: string;
  is_year_unknown: boolean;
}

interface AdminDashboardProps {
  items: Item[];
}

export default function AdminDashboard({ items }: AdminDashboardProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isYearUnknown, setIsYearUnknown] = useState(false);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('is_year_unknown', isYearUnknown.toString());

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              setUploadProgress(100);
              setUploadStatus('success');
              form.reset();
              setIsYearUnknown(false);
              // Reload the page after 2 seconds
              setTimeout(() => {
                window.location.reload();
              }, 2000);
              resolve(data);
            } else {
              throw new Error(data.error || 'Upload failed');
            }
          } catch (error) {
            setUploadStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
            reject(error);
          }
        } else {
          const error = new Error('Upload failed');
          setUploadStatus('error');
          setErrorMessage('Server error occurred');
          reject(error);
        }
      });

      xhr.addEventListener('error', () => {
        const error = new Error('Network error occurred');
        setUploadStatus('error');
        setErrorMessage('Network error occurred');
        reject(error);
      });

      xhr.open('POST', '/admin/upload');
      xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');
      xhr.send(formData);
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`/admin/delete?id=${id}`, {
          method: 'POST',
          headers: {
            'x-requested-with': 'XMLHttpRequest'
          }
        });

        const data = await response.json();

        if (data.success) {
          window.location.reload();
        } else {
          throw new Error(data.error || 'Delete failed');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert(error instanceof Error ? error.message : 'Delete failed');
      }
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Upload Form */}
      <div className="bg-gray-800 p-6 rounded-lg flex flex-col gap-4 w-full max-w-xl mb-12">
        <h2 className="text-xl font-bold mb-2">Upload New Item</h2>
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1">
              File <span className="text-red-500">*</span>
            </label>
            <input type="file" name="file" className="bg-gray-900 p-2 rounded text-white w-full" required />
          </div>

          <div>
            <label className="block mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input type="text" name="title" placeholder="Enter title" className="bg-gray-900 p-2 rounded text-white w-full" required />
          </div>
          
          {/* Year field with unknown checkbox */}
          <div>
            <label className="block mb-1">
              Year <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 items-center">
              <input 
                type="number" 
                name="year" 
                placeholder="Enter year" 
                className="bg-gray-900 p-2 rounded text-white flex-1" 
                disabled={isYearUnknown}
                required={!isYearUnknown}
              />
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={isYearUnknown}
                  onChange={(e) => setIsYearUnknown(e.target.checked)}
                  className="rounded"
                />
                <span>Year Unknown</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block mb-1">
              Collection <span className="text-red-500">*</span>
            </label>
            <select name="collection" className="bg-gray-900 p-2 rounded text-white w-full" required>
              <optgroup label="Manuals">
                <option value="manuals/hardware">Hardware Manuals</option>
                <option value="manuals/software">Software Manuals</option>
                <option value="manuals/service">Service Manuals</option>
                <option value="manuals/developer">Developer Documentation</option>
              </optgroup>
              <optgroup label="Marketing">
                <option value="ads/print">Print Advertisements</option>
                <option value="ads/tv">TV Commercials</option>
                <option value="ads/billboard">Billboards</option>
                <option value="ads/poster">Posters</option>
                <option value="ads/catalog">Product Catalogs</option>
                <option value="ads/packaging">Product Packaging</option>
              </optgroup>
              <optgroup label="WWDC">
                <option value="wwdc/keynotes">Keynotes</option>
                <option value="wwdc/sessions">Technical Sessions</option>
                <option value="wwdc/labs">Labs</option>
                <option value="wwdc/scholarship">Scholarship Program</option>
                <option value="wwdc/design">Design Awards</option>
              </optgroup>
              <optgroup label="Media">
                <option value="wallpapers/official">Official Wallpapers</option>
                <option value="wallpapers/event">Event Wallpapers</option>
                <option value="wallpapers/product">Product Wallpapers</option>
                <option value="photos/events">Event Photos</option>
                <option value="photos/products">Product Photos</option>
                <option value="photos/retail">Retail Store Photos</option>
              </optgroup>
              <optgroup label="Historical">
                <option value="historical/announcements">Product Announcements</option>
                <option value="historical/press">Press Releases</option>
                <option value="historical/events">Historical Events</option>
                <option value="historical/retail">Retail History</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block mb-1">
              Original Link (Optional)
            </label>
            <input type="url" name="original_link" placeholder="Enter original source URL" className="bg-gray-900 p-2 rounded text-white w-full" />
          </div>

          <div>
            <label className="block mb-1">
              Source (Optional)
            </label>
            <input type="text" name="source" placeholder="e.g., Apple.com, Magazine name" className="bg-gray-900 p-2 rounded text-white w-full" />
          </div>

          <div>
            <label className="block mb-1">
              Author/Creator (Optional)
            </label>
            <input type="text" name="author" placeholder="Enter author or creator name" className="bg-gray-900 p-2 rounded text-white w-full" />
          </div>

          <div>
            <label className="block mb-1">
              Tags (Optional)
            </label>
            <input type="text" name="tags" placeholder="Enter tags separated by commas" className="bg-gray-900 p-2 rounded text-white w-full" />
          </div>

          <div>
            <label className="block mb-1">
              Description (Optional)
            </label>
            <textarea name="description" placeholder="Enter description" className="bg-gray-900 p-2 rounded text-white w-full" />
          </div>

          <div>
            <label className="block mb-1">
              Additional Notes (Optional)
            </label>
            <textarea name="notes" placeholder="Enter any additional notes" className="bg-gray-900 p-2 rounded text-white w-full" />
          </div>
          
          {/* Progress Bar */}
          {uploadStatus === 'uploading' && (
            <div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {uploadProgress === 100 ? 'Upload complete!' : `Uploading... ${uploadProgress}%`}
              </p>
            </div>
          )}
          
          {/* Success Message */}
          {uploadStatus === 'success' && (
            <div className="bg-green-500 text-white p-3 rounded">
              Upload successful!
            </div>
          )}
          
          {/* Error Message */}
          {uploadStatus === 'error' && (
            <div className="bg-red-500 text-white p-3 rounded">
              Upload failed: {errorMessage}
            </div>
          )}
          
          <button 
            type="submit" 
            className="bg-blue-600 rounded p-2 font-bold"
            disabled={uploadStatus === 'uploading'}
          >
            {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {/* Items Table */}
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Existing Items</h2>
        <table className="w-full text-left bg-gray-900 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-800">
              <th className="p-2">Title</th>
              <th className="p-2">Year</th>
              <th className="p-2">Collection</th>
              <th className="p-2">Source</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-700">
                <td className="p-2">{item.title}</td>
                <td className="p-2">{item.is_year_unknown ? 'Unknown' : item.year}</td>
                <td className="p-2">{item.collection}</td>
                <td className="p-2">{item.source}</td>
                <td className="p-2 flex gap-2">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                  <a 
                    href={`/collections/${item.collection}/${encodeURIComponent(item.oss_key)}`} 
                    className="text-blue-400 hover:text-blue-300" 
                    target="_blank"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
} 