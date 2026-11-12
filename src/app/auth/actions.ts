'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getI18n } from '@/i18n/server';
import { isValidBdPhone, safeNextPath } from '@/lib/format';

export type FormState = { error?: string; message?: string } | null;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

async function siteUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const h = await headers();
  return h.get('origin') ?? `https://${h.get('host')}`;
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const { t } = await getI18n();
  const email = text(formData, 'email');
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: t.auth.missingFields };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === 'invalid_credentials') return { error: t.auth.invalidCredentials };
    if (error.code === 'email_not_confirmed') return { error: t.auth.emailNotConfirmed };
    console.error(`[auth] login: ${error.message}`);
    return { error: t.auth.genericError };
  }

  revalidatePath('/', 'layout');
  redirect(safeNextPath(formData.get('next')));
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const { t } = await getI18n();
  const fullName = text(formData, 'full_name');
  const phone = text(formData, 'phone');
  const email = text(formData, 'email');
  const password = String(formData.get('password') ?? '');

  if (!fullName || !phone || !email || !password) return { error: t.auth.missingFields };
  if (!isValidBdPhone(phone)) return { error: t.auth.invalidPhone };
  if (password.length < 6) return { error: t.auth.weakPassword };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Copied into public.profiles by the handle_new_user trigger.
      data: { full_name: fullName, phone },
      emailRedirectTo: `${await siteUrl()}/auth/callback`,
    },
  });

  if (error) {
    if (error.code === 'user_already_exists') return { error: t.auth.alreadyRegistered };
    if (error.code === 'weak_password') return { error: t.auth.weakPassword };
    console.error(`[auth] signup: ${error.message}`);
    return { error: t.auth.genericError };
  }

  // Supabase hides "email already used" behind a user with no identities.
  if (data.user && data.user.identities?.length === 0) {
    return { error: t.auth.alreadyRegistered };
  }

  // "Confirm email" is ON in Supabase → no session until the link is opened.
  if (!data.session) return { message: t.auth.checkEmail };

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const { t } = await getI18n();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account');

  const fullName = text(formData, 'full_name');
  const phone = text(formData, 'phone');
  if (!fullName || !phone) return { error: t.auth.missingFields };
  if (!isValidBdPhone(phone)) return { error: t.auth.invalidPhone };

  // RLS only lets this touch the visitor's own row, and a database trigger
  // ignores any attempt to change role or email.
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      phone,
      address: text(formData, 'address') || null,
      district: text(formData, 'district') || null,
    })
    .eq('id', user.id);

  if (error) {
    console.error(`[auth] updateProfile: ${error.message}`);
    return { error: t.auth.genericError };
  }

  revalidatePath('/account');
  return { message: t.account.saved };
}
