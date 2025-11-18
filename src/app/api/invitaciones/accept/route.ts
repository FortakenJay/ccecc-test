import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidPassword,
  isValidAlphanumeric,
  sanitizeError,
  errorResponse,
  checkCSRFProtection,
  sanitizeTextInput,
  isValidTextLength,
  MAX_NAME_LENGTH
} from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // CSRF Protection
    if (!checkCSRFProtection(request)) {
      return errorResponse('Invalid request origin', 403);
    }
    
    const body = await request.json();
    const { token, password, full_name } = body;

    // Validate required fields
    if (!token || !password || !full_name) {
      return errorResponse('Missing required fields: token, password, full_name', 400);
    }

    // Validate token format (alphanumeric + dash/underscore, max 500)
    if (!isValidAlphanumeric(token) || token.length > 500) {
      return errorResponse('Invalid invitation token format', 400);
    }

    // Validate full name
    const trimmedName = full_name.trim();
    if (trimmedName.length < 2 || !isValidTextLength(trimmedName, MAX_NAME_LENGTH)) {
      return errorResponse(`Full name must be between 2 and ${MAX_NAME_LENGTH} characters`, 400);
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return errorResponse('Password must be 8-72 characters with uppercase, lowercase, digit, and special character', 400);
    }

    // Verify invitation token
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .is('accepted_at', null)
      .single();

    if (invError || !invitation) {
      return errorResponse('Invalid or expired invitation token', 400);
    }

    // Create user account
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password
    });

    if (signUpError) {
      if (signUpError.message?.includes('already')) {
        return errorResponse('This email is already registered', 409);
      }
      return errorResponse('Failed to create account', 400);
    }

    if (!authData.user) {
      return errorResponse('Failed to create user', 400);
    }

    // Create profile with role
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: invitation.email.toLowerCase().trim(),
        full_name: sanitizeTextInput(trimmedName),
        role: invitation.role,
        invited_by: invitation.invited_by
      });

    if (profileError) {
      return errorResponse('Failed to create profile', 400);
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      return errorResponse('Failed to update invitation status', 400);
    }

    // Log successful invitation acceptance
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'invitations',
        action: 'UPDATE',
        record_id: invitation.id,
        user_id: authData.user.id,
        changes: { status: 'accepted' }
      });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return errorResponse(sanitizeError(error));
  }
}