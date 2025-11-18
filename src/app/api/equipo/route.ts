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
    const locale = url.searchParams.get('locale') || 'es';

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
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Team members query error:', error);
      return errorResponse('Failed to fetch team members', 400);
    }

    const membersWithTranslation = (data || []).map(member => {
      const translation = member.translations?.find((t: any) => t.locale === locale);
      return {
        ...member,
        name: translation?.name || member.name,
        bio: translation?.bio || member.bio,
        role: translation?.role || member.role,
        translations: undefined
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

    // Check authorization - admin/owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const body = await request.json();

    // Validate payload size
    if (!isValidPayloadSize(body)) {
      return errorResponse('Request body too large', 413);
    }

    const { name, role, photo_url, translations } = body;

    // Validate required fields
    if (!name || !role) {
      return errorResponse('Missing required fields: name, role', 400);
    }

    // Validate field lengths
    if (!isValidTextLength(name, MAX_NAME_LENGTH)) {
      return errorResponse(`Name must not exceed ${MAX_NAME_LENGTH} characters`, 400);
    }

    if (!isValidTextLength(role, 50)) {
      return errorResponse('Role must not exceed 50 characters', 400);
    }

    // Validate translations
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

        if (transObj.role && !isValidTextLength(transObj.role, 50)) {
          return errorResponse('Translation role must not exceed 50 characters', 400);
        }
      }
    }

    // Create team member with XSS sanitization
    const { data: newMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        name: sanitizeTextInput(name),
        role: sanitizeTextInput(role),
        photo_url: photo_url ? photo_url.trim() : null,
        created_by: user.id,
        is_active: true
      })
      .select()
      .single();

    if (memberError || !newMember) {
      return errorResponse('Failed to create team member', 400);
    }

    // Insert translations if provided
    if (translations && typeof translations === 'object') {
      const translationsData = Object.entries(translations).map(([locale, trans]: any) => {
        const transObj = trans as Record<string, any>;
        return {
          team_member_id: newMember.id,
          locale,
          name: sanitizeTextInput(transObj.name || name),
          role: sanitizeTextInput(transObj.role || role),
          bio: transObj.bio ? sanitizeTextInput(transObj.bio) : null
        };
      });

      const { error: transError } = await supabase
        .from('team_member_translations')
        .insert(translationsData);

      if (transError) {
        return errorResponse('Failed to create translations', 400);
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