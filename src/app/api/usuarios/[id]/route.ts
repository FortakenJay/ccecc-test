import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidUUID,
  isValidEmail,
  isValidRole,
  isValidTextLength,
  sanitizeError,
  MAX_NAME_LENGTH,
  checkAuth,
  checkAuthorization,
  errorResponse,
  checkCSRFProtection,
  sanitizeTextInput
} from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Validate UUID
    if (!isValidUUID(id)) {
      return errorResponse('Invalid user ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Authorization: can view own profile or admin can view any
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse('User not found', 404);
    }

    return NextResponse.json({ data });
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // CSRF Protection
    if (!checkCSRFProtection(request)) {
      return errorResponse('Invalid request origin', 403);
    }

    // Validate UUID
    if (!isValidUUID(id)) {
      return errorResponse('Invalid user ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Authorization: admin/owner only
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const body = await request.json();
    const { full_name, email, role, is_active } = body;

    // Validate fields if provided
    if (full_name && !isValidTextLength(full_name, MAX_NAME_LENGTH)) {
      return errorResponse(`Full name must not exceed ${MAX_NAME_LENGTH} characters`, 400);
    }

    if (email && !isValidEmail(email)) {
      return errorResponse('Invalid email address', 400);
    }

    if (role && !isValidRole(role)) {
      return errorResponse('Invalid role. Must be admin or officer', 400);
    }

    // Build update object with only allowed fields
    const updateData: Record<string, any> = {};
    if (full_name !== undefined) updateData.full_name = sanitizeTextInput(full_name);
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return errorResponse('Failed to update user', 400);
    }

    return NextResponse.json({ data });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // CSRF Protection
    if (!checkCSRFProtection(request)) {
      return errorResponse('Invalid request origin', 403);
    }

    // Validate UUID
    if (!isValidUUID(id)) {
      return errorResponse('Invalid user ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Authorization: owner only can delete
    await checkAuthorization(supabase, user.id, ['owner']);

    // Prevent self-deletion
    if (id === user.id) {
      return errorResponse('Cannot delete your own account', 400);
    }

    // Permanently delete user from profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) {
      console.error('Profile deletion error:', profileError);
      return errorResponse('Failed to delete user profile', 400);
    }

    // Delete user from Supabase Auth using admin client
    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Auth deletion error:', authError);
      return errorResponse('Failed to delete user from authentication system', 400);
    }

    // Log deletion
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'profiles',
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
