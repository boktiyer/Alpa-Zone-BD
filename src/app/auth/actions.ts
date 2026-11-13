'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient as createPlainClient } from '@supabase/supabase-js';
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

/**
 * "Forgot password": emails a link that opens /reset-password.
 *
 * Sent with a plain (non-cookie) client on purpose. The normal client makes
 * links that only work in the browser that asked for them; people usually ask
 * on one device and open the email on another (or inside the Gmail app). This
 * way the link carries its own one-time login and works anywhere.
 */
export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { t } = await getI18n();
  const email = text(formData, 'email');
  if (!email) return { error: t.auth.missingFields };

  const supabase = createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        flowType: 'implicit',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteUrl()}/reset-password`,
  });

  if (error) {
    if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
      return { error: t.auth.emailRateLimit };
    }
    console.error(`[auth] requestPasswordReset: ${error.message}`);
    return { error: t.auth.genericError };
  }

  // Same answer whether or not the email has an account, so nobody can use
  // this form to find out who is registered.
  return { message: t.auth.forgotSent };
}

/**
 * Saves the new password. The reset link's one-time login arrives as two
 * hidden fields (read from the link by the form); a visitor who is already
 * logged in can use the page without them.
 */
export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const { t } = await getI18n();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  const accessToken = text(formData, 'access_token');
  const refreshToken = text(formData, 'refresh_token');

  if (password.length < 6) return { error: t.auth.weakPassword };
  if (password !== confirm) return { error: t.auth.passwordMismatch };

  const supabase = await createClient();

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      console.error(`[auth] updatePassword session: ${error.message}`);
      return { error: t.auth.resetLinkError };
    }
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: t.auth.resetLinkError };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === 'same_password') return { error: t.auth.samePassword };
    if (error.code === 'weak_password') return { error: t.auth.weakPassword };
    console.error(`[auth] updatePassword: ${error.message}`);
    return { error: t.auth.genericError };
  }

  revalidatePath('/', 'layout');
  return { message: t.auth.passwordChanged };
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
