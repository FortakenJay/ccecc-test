import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidUUID,
  isValidLocale,
  isValidTextLength,
  sanitizeError,
  parsePaginationParams,
  MAX_TEXT_LENGTH,
  checkAuth,
  checkAuthorization,
  errorResponse,
  checkCSRFProtection,
  sanitizeTextInput
} from '@/lib/api-utils';

// GET - Fetch all active classes with locale filter
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'es';
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const { limit, offset } = parsePaginationParams(limitParam, offsetParam);

    // Validate locale
    if (!isValidLocale(locale)) {
      return errorResponse('Invalid locale', 400);
    }

    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        translations:class_translations(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Classes query error:', error);
      throw error;
    }

    // Filter translations by locale
    const classesWithTranslation = (data || []).map((cls: any) => {
      const translation = cls.translations?.find((t: any) => t.locale === locale);
      return {
        id: cls.id,
        is_active: cls.is_active,
        created_at: cls.created_at,
        updated_at: cls.updated_at,
        ...translation,
      };
    });

    return NextResponse.json({ data: classesWithTranslation || [] });
  } catch (error: any) {
    return errorResponse(sanitizeError(error), 500);
  }
}

// POST - Create new class
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // CSRF Protection
    if (!checkCSRFProtection(request)) {
      return errorResponse('Invalid request origin', 403);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization
    await checkAuthorization(supabase, user.id, ['admin', 'owner', 'officer']);

    const body = await request.json();
    const { classData, translations } = body;

    // Validate translations
    if (!translations || Object.keys(translations).length === 0) {
      return NextResponse.json(
        { error: 'At least one translation is required' },
        { status: 400 }
      );
    }

    // Validate all translation locales and text fields
    for (const [loc, trans] of Object.entries(translations)) {
      if (!isValidLocale(loc)) {
        return NextResponse.json(
          { error: `Invalid locale: ${loc}` },
          { status: 400 }
        );
      }
      const t = trans as any;
      if (!isValidTextLength(t.title, MAX_TEXT_LENGTH)) {
        return NextResponse.json(
          { error: `Title exceeds max length of ${MAX_TEXT_LENGTH}` },
          { status: 400 }
        );
      }
      if (!isValidTextLength(t.description, MAX_TEXT_LENGTH)) {
        return NextResponse.json(
          { error: `Description exceeds max length of ${MAX_TEXT_LENGTH}` },
          { status: 400 }
        );
      }
    }

    // Insert class
    const { data: newClass, error: classError } = await supabase
      .from('classes')
      .insert({
        ...classData,
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (classError) throw classError;

    // Insert translations with XSS sanitization
    const translationsData = Object.entries(translations).map(([loc, trans]: any) => ({
      class_id: newClass.id,
      locale: loc,
      title: sanitizeTextInput(trans.title),
      description: trans.description ? sanitizeTextInput(trans.description) : null,
      schedule: trans.schedule ? sanitizeTextInput(trans.schedule) : null,
      features: trans.features,
    }));

    const { error: transError } = await supabase
      .from('class_translations')
      .insert(translationsData);

    if (transError) throw transError;

    return NextResponse.json({ data: newClass }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 500 }
    );
  }
}