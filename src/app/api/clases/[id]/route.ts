import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidUUID,
  isValidLocale,
  isValidTextLength,
  sanitizeError,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_TEXT_LENGTH,
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
      return errorResponse('Invalid class ID format', 400);
    }

    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        translations:class_translations(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return errorResponse('Class not found', 404);
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
      return errorResponse('Invalid class ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin or owner only
    await checkAuthorization(supabase, user.id, ['admin', 'owner', 'officer']);

    const body = (await request.json()) as {
      title?: string;
      description?: string;
      schedule?: string;
      features?: string;
      translations?: Record<string, Record<string, any>>;
    };

    const { title, description, schedule, features, translations } = body;

    // Validate fields if provided
    if (title !== undefined && !isValidTextLength(title, MAX_TITLE_LENGTH)) {
      return errorResponse(`Title must not exceed ${MAX_TITLE_LENGTH} characters`, 400);
    }

    if (description !== undefined && !isValidTextLength(description, MAX_DESCRIPTION_LENGTH)) {
      return errorResponse(`Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`, 400);
    }

    if (schedule !== undefined && !isValidTextLength(schedule, MAX_TEXT_LENGTH)) {
      return errorResponse(`Schedule must not exceed ${MAX_TEXT_LENGTH} characters`, 400);
    }

    if (features !== undefined && !isValidTextLength(features, 1000)) {
      return errorResponse('Features must not exceed 1000 characters', 400);
    }

    // Update class
    const classData: Record<string, any> = {};
    if (title !== undefined) classData.title = sanitizeTextInput(title);
    if (description !== undefined) classData.description = sanitizeTextInput(description);
    if (schedule !== undefined) classData.schedule = sanitizeTextInput(schedule);
    if (features !== undefined) classData.features = sanitizeTextInput(features);

    const { data: updatedClass, error: classError } = await supabase
      .from('classes')
      .update(classData)
      .eq('id', id)
      .select()
      .single();

    if (classError || !updatedClass) {
      return errorResponse('Failed to update class', 400);
    }

    // Update translations if provided
    if (translations && typeof translations === 'object') {
      for (const [locale, trans] of Object.entries(translations)) {
        // Validate locale
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
        if (transObj.schedule) sanitizedTrans.schedule = sanitizeTextInput(transObj.schedule);
        if (transObj.features) sanitizedTrans.features = transObj.features;
        if (transObj.type) sanitizedTrans.type = sanitizeTextInput(transObj.type);
        if (transObj.level) sanitizedTrans.level = sanitizeTextInput(transObj.level);

        const { error: transError } = await supabase
          .from('class_translations')
          .upsert(
            {
              class_id: id,
              locale,
              ...sanitizedTrans
            },
            {
              onConflict: 'class_id,locale'
            }
          );

        if (transError) {
          return errorResponse('Failed to update translation', 400);
        }
      }
    }

    return NextResponse.json({ data: updatedClass });
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
      return errorResponse('Invalid class ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - owner or admin
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse('Failed to delete class', 400);
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
