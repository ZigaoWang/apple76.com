'use client';

import React, { useState, useEffect } from 'react';

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
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    // Add smooth scroll effect
    const handleScroll = () => {
      const elements = document.querySelectorAll('.fade-in');
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          element.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              throw new Error(data.message || data.error || 'Upload failed');
            }
          } catch (error) {
            setUploadStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
            reject(error);
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            const error = new Error(data.message || data.error || 'Upload failed');
            setUploadStatus('error');
            setErrorMessage(error.message);
            reject(error);
          } catch (parseError) {
            setUploadStatus('error');
            setErrorMessage('Server error occurred');
            reject(new Error('Server error occurred'));
          }
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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            {isFormVisible ? 'Hide Upload Form' : 'Show Upload Form'}
          </button>
        </div>
      
        {/* Upload Form */}
        <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-500 ${isFormVisible ? 'max-h-[2000px] opacity-100 mb-12' : 'max-h-0 opacity-0'}`}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Upload New Item</h2>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File <span className="text-red-500">*</span>
                  </label>
                  <input type="file" name="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="title" placeholder="Enter title" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                </div>
                
                {/* Year field with unknown checkbox */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 items-center">
                    <input 
                      type="number" 
                      name="year" 
                      placeholder="Enter year" 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                      disabled={isYearUnknown}
                      required={!isYearUnknown}
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={isYearUnknown}
                        onChange={(e) => setIsYearUnknown(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Year Unknown</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection <span className="text-red-500">*</span>
                  </label>
                  <select name="collection" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                    <option value="hardware-manuals">Hardware Manuals</option>
                    <option value="software-manuals">Software Manuals</option>
                    <option value="print-ads">Print Advertisements</option>
                    <option value="tv-ads">TV Commercials</option>
                    <option value="wwdc-keynotes">WWDC Keynotes</option>
                    <option value="wwdc-sessions">WWDC Sessions</option>
                    <option value="wallpapers">Wallpapers</option>
                    <option value="event-photos">Event Photos</option>
                    <option value="product-photos">Product Photos</option>
                    <option value="product-announcements">Product Announcements</option>
                    <option value="press-releases">Press Releases</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original Link (Optional)
                  </label>
                  <input type="url" name="original_link" placeholder="Enter original source URL" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source (Optional)
                  </label>
                  <input type="text" name="source" placeholder="e.g., Apple.com, Magazine name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author/Creator (Optional)
                  </label>
                  <input type="text" name="author" placeholder="Enter author or creator name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (Optional)
                  </label>
                  <input type="text" name="tags" placeholder="Enter tags separated by commas" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea name="description" placeholder="Enter description" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" rows={3} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea name="notes" placeholder="Enter any additional notes" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" rows={3} />
                </div>
              </div>
              
              {/* Progress Bar */}
              {uploadStatus === 'uploading' && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {uploadProgress === 100 ? 'Upload complete!' : `Uploading... ${uploadProgress}%`}
                  </p>
                </div>
              )}
              
              {/* Success Message */}
              {uploadStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Success! </strong>
                  <span className="block sm:inline">Upload completed successfully.</span>
                </div>
              )}
              
              {/* Error Message */}
              {uploadStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Error! </strong>
                  <span className="block sm:inline">
                    {errorMessage.includes('NoSuchKey') ? 
                      'File upload failed: The file could not be saved. Please try again.' :
                      errorMessage}
                  </span>
                </div>
              )}
              
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  disabled={uploadStatus === 'uploading'}
                >
                  {uploadStatus === 'uploading' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Existing Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={item.id} className={`fade-in hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.is_year_unknown ? 'Unknown' : item.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.collection}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          Delete
                        </button>
                        <a 
                          href={`/admin/items/${item.id}/edit`} 
                          className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                        >
                          Edit
                        </a>
                        <a 
                          href={`/item/${item.id}`} 
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200" 
                          target="_blank"
                        >
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
} 