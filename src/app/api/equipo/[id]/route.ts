import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidUUID,
  isValidLocale,
  isValidTextLength,
  sanitizeError,
  MAX_NAME_LENGTH,
  MAX_BIO_LENGTH,
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
      return errorResponse('Invalid team member ID format', 400);
    }

    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        translations:team_member_translations(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return errorResponse('Team member not found', 404);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
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
      return errorResponse('Invalid team member ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner', 'officer']);

    const body = await request.json();
    const { image_url, display_order, is_active, translations } = body;

    // Build update object with XSS sanitization for team_members table fields only
    const updateData: Record<string, any> = {};
    if (image_url !== undefined) updateData.image_url = image_url?.trim() || null;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedMember, error: memberError } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (memberError || !updatedMember) {
      return errorResponse('Failed to update team member', 400);
    }

    // Update translations if provided
    if (translations && typeof translations === 'object') {
      for (const [locale, trans] of Object.entries(translations)) {
        if (!isValidLocale(locale)) {
          return errorResponse(`Invalid locale: ${locale}`, 400);
        }

        const transObj = trans as Record<string, any>;
        if (transObj.name && !isValidTextLength(transObj.name, MAX_NAME_LENGTH)) {
          return errorResponse(`Translation name must not exceed ${MAX_NAME_LENGTH} characters`, 400);
        }

        if (transObj.bio && !isValidTextLength(transObj.bio, MAX_BIO_LENGTH)) {
          return errorResponse(`Translation bio must not exceed ${MAX_BIO_LENGTH} characters`, 400);
        }

        const sanitizedTrans: Record<string, any> = {};
        if (transObj.name) sanitizedTrans.name = sanitizeTextInput(transObj.name);
        if (transObj.role) sanitizedTrans.role = sanitizeTextInput(transObj.role);
        if (transObj.bio) sanitizedTrans.bio = sanitizeTextInput(transObj.bio);

        const { error: transError } = await supabase
          .from('team_member_translations')
          .upsert(
            {
              team_member_id: id,
              locale,
              ...sanitizedTrans
            },
            { onConflict: 'team_member_id,locale' }
          );

        if (transError) {
          return errorResponse('Failed to update translation', 400);
        }
      }
    }

    return NextResponse.json({ data: updatedMember });
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
      return errorResponse('Invalid team member ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner', 'officer']);

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse('Failed to delete team member', 400);
    }

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
