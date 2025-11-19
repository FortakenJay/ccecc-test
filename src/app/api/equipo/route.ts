import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidLocale,
  isValidTextLength,
  isValidPayloadSize,
  sanitizeError,
  checkAuth,
  checkAuthorization,
  errorResponse,
  checkCSRFProtection,
  sanitizeTextInput,
  SUPPORTED_LOCALES,
  MAX_NAME_LENGTH,
  MAX_BIO_LENGTH
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') || 'en';

    // Validate locale
    if (!isValidLocale(locale)) {
      return errorResponse(`Invalid locale. Must be one of: ${SUPPORTED_LOCALES.join(', ')}`, 400);
    }

    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        translations:team_member_translations(*)
      `)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Team members query error:', error);
      return errorResponse('Failed to fetch team members', 400);
    }

    // Map members with their translations for the requested locale
    const membersWithTranslation = (data || []).map(member => {
      const translation = member.translations?.find((t: any) => t.locale === locale);
      return {
        ...member,
        name: translation?.name || null,
        role: translation?.role || null,
        bio: translation?.bio || null,
        translations: undefined // Remove translations array from response
      };
    });

    return NextResponse.json({ data: membersWithTranslation || [] });
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

    // Check authorization - admin/owner/officer
    await checkAuthorization(supabase, user.id, ['admin', 'owner', 'officer']);

    const body = await request.json();

    // Validate payload size
    if (!isValidPayloadSize(body)) {
      return errorResponse('Request body too large', 413);
    }

    const { slug, image_url, display_order, translations } = body;

    // Validate required fields
    if (!slug) {
      return errorResponse('Missing required field: slug', 400);
    }

    // Validate field lengths
    if (!isValidTextLength(slug, 100)) {
      return errorResponse('Slug must not exceed 100 characters', 400);
    }

    // Validate translations if provided
    if (translations && typeof translations === 'object') {
      for (const [locale, trans] of Object.entries(translations)) {
        if (!isValidLocale(locale)) {
          return errorResponse(`Invalid locale: ${locale}`, 400);
        }

        const transObj = trans as Record<string, any>;
        if (transObj.name && !isValidTextLength(transObj.name, MAX_NAME_LENGTH)) {
          return errorResponse(`Translation name must not exceed ${MAX_NAME_LENGTH} characters`, 400);
        }

        if (transObj.role && !isValidTextLength(transObj.role, 100)) {
          return errorResponse('Translation role must not exceed 100 characters', 400);
        }

        if (transObj.bio && !isValidTextLength(transObj.bio, MAX_BIO_LENGTH)) {
          return errorResponse(`Translation bio must not exceed ${MAX_BIO_LENGTH} characters`, 400);
        }
      }
    }

    // Get max display_order
    const { data: maxOrderData } = await supabase
      .from('team_members')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = display_order || (maxOrderData?.display_order || 0) + 1;

    // Create team member
    const { data: newMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        slug: sanitizeTextInput(slug),
        image_url: image_url ? image_url.trim() : null,
        display_order: nextOrder,
        created_by: user.id,
        is_active: true
      })
      .select()
      .single();

    if (memberError || !newMember) {
      console.error('Failed to create team member:', memberError);
      return errorResponse('Failed to create team member', 400);
    }

    // Insert translations if provided
    if (translations && typeof translations === 'object') {
      const translationsData = Object.entries(translations).map(([locale, trans]) => {
        const transObj = trans as Record<string, any>;
        return {
          team_member_id: newMember.id,
          locale,
          name: transObj.name ? sanitizeTextInput(transObj.name) : null,
          role: transObj.role ? sanitizeTextInput(transObj.role) : null,
          bio: transObj.bio ? sanitizeTextInput(transObj.bio) : null
        };
      });

      const { error: transError } = await supabase
        .from('team_member_translations')
        .insert(translationsData);

      if (transError) {
        console.error('Failed to create translations:', transError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ data: newMember }, { status: 201 });
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