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
    const category = url.searchParams.get('category');
    const featured = url.searchParams.get('featured');
    const published = url.searchParams.get('published');

    // Validate locale
    if (!isValidLocale(locale)) {
      return errorResponse(`Invalid locale. Must be one of: ${SUPPORTED_LOCALES.join(', ')}`, 400);
    }

    // Get pagination params
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    const { limit: parsedLimit, offset: parsedOffset } = parsePaginationParams(limit, offset);

    // Build query
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        translations:blog_post_translations(*),
        author:author_id(full_name, email)
      `, { count: 'exact' });

    // Apply filters
    if (published === 'true') {
      query = query.eq('is_published', true);
    } else if (published === 'false') {
      query = query.eq('is_published', false);
    }
    // If published is not provided, show all posts
    
    if (category) {
      query = query.eq('category', category);
    }
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data, error, count } = await query
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (error) {
      console.error('Blog posts query error:', error);
      return errorResponse('Failed to fetch blog posts', 400);
    }

    // Filter translations by locale
    const postsWithTranslation = (data || []).map(post => {
      const translation = post.translations.find((t: any) => t.locale === locale);
      return {
        ...post,
        title: translation?.title || '',
        excerpt: translation?.excerpt || '',
        content: translation?.content || null, // Tiptap JSON content
        translations: undefined
      };
    });

    return NextResponse.json({
      data: postsWithTranslation || [],
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
    await checkAuthorization(supabase, user.id, ['admin', 'owner', 'officer']);

    const body = await request.json();

    // Validate payload size
    if (!isValidPayloadSize(body)) {
      return errorResponse('Request body too large', 413);
    }

    const { 
      slug, 
      category, 
      tags, 
      featured_image_url, 
      is_featured, 
      is_published,
      translations 
    } = body;

    // Validate required fields
    if (!slug || !translations || Object.keys(translations).length === 0) {
      return errorResponse('Missing required fields: slug, translations', 400);
    }

    // Validate translations
    if (translations && typeof translations === 'object') {
      for (const [locale, trans] of Object.entries(translations)) {
        if (!isValidLocale(locale)) {
          return errorResponse(`Invalid locale: ${locale}`, 400);
        }

        const transObj = trans as Record<string, any>;
        if (!transObj.title || !isValidTextLength(transObj.title, MAX_TITLE_LENGTH)) {
          return errorResponse(`Translation title is required and must not exceed ${MAX_TITLE_LENGTH} characters`, 400);
        }

        if (transObj.excerpt && !isValidTextLength(transObj.excerpt, 500)) {
          return errorResponse(`Excerpt must not exceed 500 characters`, 400);
        }
      }
    }

    // Sanitize inputs to prevent XSS
    const sanitizedData = {
      slug: sanitizeTextInput(slug),
      category: category ? sanitizeTextInput(category) : null,
      tags: Array.isArray(tags) ? tags.map((t: string) => sanitizeTextInput(t)) : null,
      featured_image_url: featured_image_url ? sanitizeTextInput(featured_image_url) : null,
      is_featured: Boolean(is_featured),
      is_published: Boolean(is_published),
      published_at: is_published ? new Date().toISOString() : null,
      author_id: user.id,
      created_by: user.id
    };

    // Create blog post
    const { data: newPost, error: postError } = await supabase
      .from('blog_posts')
      .insert(sanitizedData)
      .select()
      .single();

    if (postError || !newPost) {
      console.error('Blog post creation error:', postError);
      return errorResponse('Failed to create blog post', 400);
    }

    // Insert translations
    const translationsData = Object.entries(translations).map(([locale, trans]: any) => {
      const transObj = trans as Record<string, any>;
      return {
        blog_post_id: newPost.id,
        locale,
        title: sanitizeTextInput(transObj.title.trim()),
        excerpt: transObj.excerpt ? sanitizeTextInput(transObj.excerpt.trim()) : null,
        content: transObj.content || null // Tiptap JSON content - no sanitization needed for JSONB
      };
    });

    const { error: transError } = await supabase
      .from('blog_post_translations')
      .insert(translationsData);

    if (transError) {
      console.error('Translation creation error:', transError);
      return errorResponse('Failed to create translations', 400);
    }

    return NextResponse.json({ data: newPost }, { status: 201 });
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