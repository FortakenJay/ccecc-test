// src/app/api/eventos/[id]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidUUID,
  isValidTextLength,
  isValidLocale,
  sanitizeError,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
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
      return errorResponse('Invalid event ID format', 400);
    }

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        translations:event_translations(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return errorResponse('Event not found', 404);
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
      return errorResponse('Invalid event ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const body = await request.json();
    const { title, description, event_date, location } = body;

    // Validate field lengths if provided
    if (title && !isValidTextLength(title, MAX_TITLE_LENGTH)) {
      return errorResponse(`Title must not exceed ${MAX_TITLE_LENGTH} characters`, 400);
    }

    if (description && !isValidTextLength(description, MAX_DESCRIPTION_LENGTH)) {
      return errorResponse(`Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`, 400);
    }

    // Build update object
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = sanitizeTextInput(title);
    if (description !== undefined) updateData.description = sanitizeTextInput(description);
    if (event_date !== undefined) updateData.event_date = event_date;
    if (location !== undefined) updateData.location = sanitizeTextInput(location);

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return errorResponse('Failed to update event', 400);
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
      return errorResponse('Invalid event ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse('Failed to delete event', 400);
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

export async function PUT(
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
      return errorResponse('Invalid event ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin or owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const body = await request.json();
    const { title, description, event_date, location, translations } = body;

    // Validate fields if provided
    if (title !== undefined && !isValidTextLength(title, MAX_TITLE_LENGTH)) {
      return errorResponse(`Title must not exceed ${MAX_TITLE_LENGTH} characters`, 400);
    }

    if (description !== undefined && !isValidTextLength(description, MAX_DESCRIPTION_LENGTH)) {
      return errorResponse(`Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`, 400);
    }

    if (location !== undefined && !isValidTextLength(location, 200)) {
      return errorResponse('Location must not exceed 200 characters', 400);
    }

    // Build update object with XSS sanitization
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = sanitizeTextInput(title);
    if (description !== undefined) updateData.description = sanitizeTextInput(description);
    if (event_date !== undefined) updateData.event_date = event_date;
    if (location !== undefined) updateData.location = sanitizeTextInput(location);

    const { data: updatedEvent, error: eventError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (eventError || !updatedEvent) {
      return errorResponse('Failed to update event', 400);
    }

    // Update translations if provided
    if (translations && typeof translations === 'object') {
      for (const [locale, trans] of Object.entries(translations)) {
        if (!isValidLocale(locale)) {
          return errorResponse(`Invalid locale: ${locale}`, 400);
        }

        const transObj = trans as Record<string, any>;

        // Validate translation fields
        if (transObj.title && !isValidTextLength(transObj.title, MAX_TITLE_LENGTH)) {
          return errorResponse(`Translation title must not exceed ${MAX_TITLE_LENGTH} characters`, 400);
        }

        if (transObj.description && !isValidTextLength(transObj.description, MAX_DESCRIPTION_LENGTH)) {
          return errorResponse(`Translation description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`, 400);
        }

        const sanitizedTrans: Record<string, any> = {};
        if (transObj.title) sanitizedTrans.title = sanitizeTextInput(transObj.title);
        if (transObj.description) sanitizedTrans.description = sanitizeTextInput(transObj.description);

        const { error: transError } = await supabase
          .from('event_translations')
          .upsert(
            {
              event_id: id,
              locale,
              ...sanitizedTrans
            },
            { onConflict: 'event_id,locale' }
          );

        if (transError) {
          return errorResponse('Failed to update translation', 400);
        }
      }
    }

    return NextResponse.json({ data: updatedEvent });
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