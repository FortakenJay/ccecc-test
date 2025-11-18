import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidLocale,
  isValidTextLength,
  isValidPayloadSize,
  sanitizeError,
  parsePaginationParams,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  checkAuth,
  checkAuthorization,
  errorResponse,
  checkCSRFProtection,
  sanitizeTextInput,
  SUPPORTED_LOCALES
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') || 'es';

    // Validate locale
    if (!isValidLocale(locale)) {
      return errorResponse(`Invalid locale. Must be one of: ${SUPPORTED_LOCALES.join(', ')}`, 400);
    }

    // Get pagination params
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    const { limit: parsedLimit, offset: parsedOffset } = parsePaginationParams(limit, offset);

    const { data, error, count } = await supabase
      .from('events')
      .select(`
        *,
        translations:event_translations(*)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('event_date', { ascending: true })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (error) {
      console.error('Events query error:', error);
      return errorResponse('Failed to fetch events', 400);
    }

    // Filter translations by locale
    const eventsWithTranslation = (data || []).map(event => {
      const translation = event.translations.find((t: any) => t.locale === locale);
      return {
        ...event,
        title: translation?.title || event.title,
        description: translation?.description || event.description,
        translations: undefined
      };
    });

    return NextResponse.json({
      data: eventsWithTranslation || [],
      pagination: {
        total: count || 0,
        limit: parsedLimit,
        offset: parsedOffset
      }
    });
  } catch (error: any) {
    return errorResponse(sanitizeError(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // CSRF Protection
    if (!checkCSRFProtection(request)) {
      return errorResponse('Invalid request origin', 403);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const body = await request.json();

    // Validate payload size
    if (!isValidPayloadSize(body)) {
      return errorResponse('Request body too large', 413);
    }

    const { title, description, event_date, location, translations } = body;

    // Validate required fields
    if (!title || !event_date) {
      return errorResponse('Missing required fields: title, event_date', 400);
    }

    // Validate field lengths
    if (!isValidTextLength(title, MAX_TITLE_LENGTH)) {
      return errorResponse(`Title must not exceed ${MAX_TITLE_LENGTH} characters`, 400);
    }

    if (description && !isValidTextLength(description, MAX_DESCRIPTION_LENGTH)) {
      return errorResponse(`Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`, 400);
    }

    // Validate translations
    if (translations && typeof translations === 'object') {
      for (const [locale, trans] of Object.entries(translations)) {
        if (!isValidLocale(locale)) {
          return errorResponse(`Invalid locale: ${locale}`, 400);
        }

        const transObj = trans as Record<string, any>;
        if (transObj.title && !isValidTextLength(transObj.title, MAX_TITLE_LENGTH)) {
          return errorResponse(`Translation title must not exceed ${MAX_TITLE_LENGTH} characters`, 400);
        }

        if (transObj.description && !isValidTextLength(transObj.description, MAX_DESCRIPTION_LENGTH)) {
          return errorResponse(`Translation description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`, 400);
        }
      }
    }

    // Sanitize inputs to prevent XSS
    const sanitizedData = {
      title: sanitizeTextInput(title),
      description: description ? sanitizeTextInput(description) : null,
      event_date,
      location: location ? sanitizeTextInput(location) : null,
      created_by: user.id,
      is_active: true
    };

    // Create event
    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert(sanitizedData)
      .select()
      .single();

    if (eventError || !newEvent) {
      return errorResponse('Failed to create event', 400);
    }

    // Insert translations if provided
    if (translations && typeof translations === 'object') {
      const translationsData = Object.entries(translations).map(([locale, trans]: any) => {
        const transObj = trans as Record<string, any>;
        return {
          event_id: newEvent.id,
          locale,
          title: transObj.title?.trim() || title.trim(),
          description: transObj.description?.trim() || description?.trim() || null
        };
      });

      const { error: transError } = await supabase
        .from('event_translations')
        .insert(translationsData);

      if (transError) {
        return errorResponse('Failed to create translations', 400);
      }
    }

    return NextResponse.json({ data: newEvent }, { status: 201 });
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