import { cookies } from 'next/headers';
import { openDb } from '@/lib/db';
import React from 'react';
import AdminDashboard from './AdminDashboard';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'apple76admin';

interface Item {
  id: number;
  title: string;
  year: number;
  collection: string;
  original_link: string;
  description: string;
  tags: string;
  oss_key: string;
  uploaded_at: string;
}

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
  const items = await db.all<Item[]>('SELECT * FROM items ORDER BY uploaded_at DESC LIMIT 100');

  return <AdminDashboard items={items} />;
} 