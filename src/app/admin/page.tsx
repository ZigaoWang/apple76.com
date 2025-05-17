import { cookies } from 'next/headers';
import { openDb } from '@/lib/db';
import React from 'react';
import UploadForm from './UploadForm';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'apple76admin';

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === ADMIN_PASSWORD;
}

function getMessage(searchParams: Record<string, string> | undefined) {
  if (!searchParams) return null;
  if (searchParams.success === 'upload') return { type: 'success', text: 'Upload complete!' };
  if (searchParams.success === 'delete') return { type: 'success', text: 'Delete complete!' };
  if (searchParams.error === 'upload') return { type: 'error', text: 'Upload failed.' };
  if (searchParams.error === 'delete') return { type: 'error', text: 'Delete failed.' };
  if (searchParams.error === 'auth') return { type: 'error', text: 'Not authorized.' };
  if (searchParams.error === 'nofile') return { type: 'error', text: 'No file selected.' };
  return null;
}

export default async function AdminPage({ searchParams }: { searchParams?: Record<string, string> }) {
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

  // Get message from search params
  const message = getMessage(searchParams);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      {message && (
        <div className={`mb-6 p-4 rounded text-center font-bold ${message.type === 'success' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>{message.text}</div>
      )}
      <UploadForm />
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