'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function login(prevState: any, formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = formData.get('password') as string || '';

  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  // 1. Direct Admin Credentials Check from Environment Variables
  if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    revalidatePath('/', 'layout');
    redirect('/dashboard');
  }

  // 2. Fallback to Supabase Auth
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data?.user) {
      const cookieStore = await cookies();
      cookieStore.set('admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      revalidatePath('/', 'layout');
      redirect('/dashboard');
    }
  } catch (e: any) {
    // If Next.js redirect was thrown, propagate it
    if (e?.digest?.startsWith('NEXT_REDIRECT')) {
      throw e;
    }
  }

  return { error: 'Invalid admin credentials! Please enter the correct email and password.' };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore error
  }

  revalidatePath('/', 'layout');
  redirect('/login');
}
