// src/app/api/invitaciones/[token]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidAlphanumeric,
  sanitizeError,
  errorResponse
} from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient();
    const { token } = await params;

    // Validate token format (alphanumeric + dash/underscore, max 500)
    if (!isValidAlphanumeric(token) || token.length > 500) {
      return errorResponse('Invalid token format', 400);
    }

    const { data, error } = await supabase
      .from('invitations')
      .select('id, email, role, expires_at, status')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .eq('status', 'pending')
      .is('accepted_at', null)
      .single();

    if (error || !data) {
      return errorResponse('Invalid or expired invitation token', 404);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return errorResponse(sanitizeError(error));
  }
}
