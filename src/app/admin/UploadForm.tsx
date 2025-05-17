'use client';
import { useState } from 'react';

export default function UploadForm() {
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="bg-gray-800 p-6 rounded-lg flex flex-col gap-4 w-full max-w-xl mb-12"
      method="POST"
      action="/admin/upload"
      encType="multipart/form-data"
      onSubmit={() => setLoading(true)}
    >
      <h2 className="text-xl font-bold mb-2">Upload New Item</h2>
      <input type="file" name="file" className="bg-gray-900 p-2 rounded text-white" required disabled={loading} />
      <input type="text" name="title" placeholder="Title" className="bg-gray-900 p-2 rounded text-white" required disabled={loading} />
      <input type="number" name="year" placeholder="Year" className="bg-gray-900 p-2 rounded text-white" required disabled={loading} />
      <select name="collection" className="bg-gray-900 p-2 rounded text-white" required disabled={loading}>
        <option value="manuals">Manuals</option>
        <option value="ads">Ads</option>
        <option value="wwdc">WWDC</option>
        <option value="wallpapers">Wallpapers</option>
      </select>
      <input type="url" name="original_link" placeholder="Original Link (optional)" className="bg-gray-900 p-2 rounded text-white" disabled={loading} />
      <input type="text" name="tags" placeholder="Tags (comma separated)" className="bg-gray-900 p-2 rounded text-white" disabled={loading} />
      <textarea name="description" placeholder="Description" className="bg-gray-900 p-2 rounded text-white" disabled={loading} />
      <button type="submit" className="bg-blue-600 rounded p-2 font-bold" disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
    </form>
  );
} 