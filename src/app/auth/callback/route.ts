import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/format';

// The email-confirmation link lands here.
//
// Supabase confirms the email first and then sends the visitor here with
// ?code=... . We swap the code for a login session and send them on.
//
// The swap only works in the browser that filled in the signup form (it holds
// a one-time secret). People often sign up on a computer and open the email on
// their phone, or the email app opens its own mini browser. Then the swap
// fails — but the email IS already confirmed, so we send them to the login
// page with a friendly "confirmed, please log in" message instead of an error.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  // Supabase itself rejected the link (used twice, or too old).
  if (searchParams.get('error') || searchParams.get('error_code')) {
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error(`[auth] callback: ${error.message}`);
    return NextResponse.redirect(`${origin}/login?confirmed=1`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
