import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { openDb } from '@/lib/db';
import React from 'react';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'apple76admin';

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === ADMIN_PASSWORD;
}

export default async function AdminPage() {
  const isAuthed = await checkAuth();
  if (!isAuthed) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <form method="POST" action="/admin/login" className="bg-gray-800 p-8 rounded-lg flex flex-col gap-4 max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
          <input type="password" name="password" placeholder="Password" className="p-2 rounded bg-gray-900 text-white" />
          <button type="submit" className="bg-blue-600 rounded p-2 font-bold">Login</button>
        </form>
      </main>
    );
  }

  // Fetch items from DB
  const db = await openDb();
  const items = await db.all('SELECT * FROM items ORDER BY uploaded_at DESC LIMIT 100');

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <form className="bg-gray-800 p-6 rounded-lg flex flex-col gap-4 w-full max-w-xl mb-12" method="POST" action="/admin/upload" encType="multipart/form-data">
        <h2 className="text-xl font-bold mb-2">Upload New Item</h2>
        <input type="file" name="file" className="bg-gray-900 p-2 rounded text-white" required />
        <input type="text" name="title" placeholder="Title" className="bg-gray-900 p-2 rounded text-white" required />
        <input type="number" name="year" placeholder="Year" className="bg-gray-900 p-2 rounded text-white" required />
        <select name="collection" className="bg-gray-900 p-2 rounded text-white" required>
          <option value="manuals">Manuals</option>
          <option value="ads">Ads</option>
          <option value="wwdc">WWDC</option>
          <option value="wallpapers">Wallpapers</option>
        </select>
        <input type="url" name="original_link" placeholder="Original Link (optional)" className="bg-gray-900 p-2 rounded text-white" />
        <input type="text" name="tags" placeholder="Tags (comma separated)" className="bg-gray-900 p-2 rounded text-white" />
        <textarea name="description" placeholder="Description" className="bg-gray-900 p-2 rounded text-white" />
        <button type="submit" className="bg-blue-600 rounded p-2 font-bold">Upload</button>
      </form>
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Existing Items</h2>
        <table className="w-full text-left bg-gray-900 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-800">
              <th className="p-2">Title</th>
              <th className="p-2">Year</th>
              <th className="p-2">Collection</th>
              <th className="p-2">Tags</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-700">
                <td className="p-2">{item.title}</td>
                <td className="p-2">{item.year}</td>
                <td className="p-2">{item.collection}</td>
                <td className="p-2">{item.tags}</td>
                <td className="p-2 flex gap-2">
                  <form method="POST" action={`/admin/delete?id=${item.id}`}><button className="text-red-400">Delete</button></form>
                  <a href={`/collections/${item.collection}/${encodeURIComponent(item.oss_key)}`} className="text-blue-400" target="_blank">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
} 