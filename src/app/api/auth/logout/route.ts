import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkCSRFProtection, errorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  // CSRF Protection
  if (!checkCSRFProtection(request)) {
    return errorResponse('Invalid request origin', 403);
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/login', request.url));
}