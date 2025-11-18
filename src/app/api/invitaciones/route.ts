// src/app/api/invitations/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidEmail,
  isValidRole,
  isValidPayloadSize,
  sanitizeError,
  parsePaginationParams,
  checkAuth,
  checkAuthorization,
  errorResponse,
  checkCSRFProtection,
  generateSecureToken
} from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // CSRF Protection
    if (!checkCSRFProtection(request)) {
      return errorResponse('Invalid request origin', 403);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner only
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const body = await request.json();

    // Validate payload size
    if (!isValidPayloadSize(body)) {
      return errorResponse('Request body too large', 413);
    }

    const { email, role } = body;

    // Validate required fields
    if (!email || !role) {
      return errorResponse('Missing required fields: email, role', 400);
    }

    // Validate email
    if (!isValidEmail(email)) {
      return errorResponse('Invalid email address', 400);
    }

    // Validate role
    if (!isValidRole(role)) {
      return errorResponse('Invalid role. Must be admin or officer', 400);
    }

    // Generate cryptographically secure token
    const secureToken = generateSecureToken(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry for OTP

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return errorResponse('A user with this email already exists', 409);
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      return errorResponse('An active invitation for this email already exists', 409);
    }

    // Create invitation
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        email: email.toLowerCase().trim(),
        role,
        token: secureToken,
        invited_by: user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Invitation creation error:', error);
      if (error.message?.includes('duplicate')) {
        return errorResponse('An invitation for this email already exists', 409);
      }
      return errorResponse(`Failed to create invitation: ${error.message}`, 400);
    }

    // Send OTP email via Supabase Auth
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/login/accept-invitation?token=${secureToken}`,
        data: {
          invitation_token: secureToken,
          role: role
        }
      }
    });

    if (otpError) {
      console.error('OTP email error:', otpError);
      // Don't fail the invitation creation if email fails
      // The invitation is still valid and can be used manually
    }

    // Log invitation creation
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'invitations',
        action: 'INSERT',
        record_id: data.id,
        user_id: user.id,
        changes: { email, role }
      });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }
    if (error.message === 'FORBIDDEN') {
      return errorResponse('Insufficient permissions', 403);
    }
    return errorResponse(sanitizeError(error));
  }
}

// DELETE invitation
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // CSRF Protection
    if (!checkCSRFProtection(request)) {
      return errorResponse('Invalid request origin', 403);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner only
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return errorResponse('Missing required field: id', 400);
    }

    // Delete invitation
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Invitation deletion error:', error);
      return errorResponse(`Failed to delete invitation: ${error.message}`, 400);
    }

    // Log deletion
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'invitations',
        action: 'DELETE',
        record_id: id,
        user_id: user.id,
        changes: { deleted: true }
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }
    if (error.message === 'FORBIDDEN') {
      return errorResponse('Insufficient permissions', 403);
    }
    return errorResponse(sanitizeError(error));
  }
}

// GET invitations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner only
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    // Get pagination params
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    const { limit: parsedLimit, offset: parsedOffset } = parsePaginationParams(limit, offset);

    // Fetch all invitations
    const { data, error, count } = await supabase
      .from('invitations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (error) {
      return errorResponse('Failed to fetch invitations', 400);
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count,
        limit: parsedLimit,
        offset: parsedOffset
      }
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }
    if (error.message === 'FORBIDDEN') {
      return errorResponse('Insufficient permissions', 403);
    }
    return errorResponse(sanitizeError(error));
  }
}