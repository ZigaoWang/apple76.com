import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'apple76admin';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = form.get('password');
  const baseUrl = req.nextUrl.origin;
  if (password === ADMIN_PASSWORD) {
    const res = NextResponse.redirect(`${baseUrl}/admin`);
    res.cookies.set('admin_auth', ADMIN_PASSWORD, { httpOnly: true, path: '/admin' });
    return res;
  }
  return NextResponse.redirect(`${baseUrl}/admin?error=1`);
} 