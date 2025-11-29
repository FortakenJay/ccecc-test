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
      type?: string;
      level?: string;
      price_colones?: number;
      is_active?: boolean;
      translations?: Record<string, Record<string, any>>;
    };

    const { type, level, price_colones, is_active, translations } = body;

    // Validate fields if provided
    if (type !== undefined && !isValidTextLength(type, MAX_TEXT_LENGTH)) {
      return errorResponse(`Type must not exceed ${MAX_TEXT_LENGTH} characters`, 400);
    }

    if (level !== undefined && !isValidTextLength(level, MAX_TEXT_LENGTH)) {
      return errorResponse(`Level must not exceed ${MAX_TEXT_LENGTH} characters`, 400);
    }

    // Update class
    const classData: Record<string, any> = {};
    if (type !== undefined) classData.type = sanitizeTextInput(type);
    if (level !== undefined) classData.level = sanitizeTextInput(level);
    if (price_colones !== undefined) classData.price_colones = price_colones;
    if (is_active !== undefined) classData.is_active = is_active;

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

        const sanitizedTrans: Record<string, any> = {};
        if (transObj.title) sanitizedTrans.title = sanitizeTextInput(transObj.title);
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
