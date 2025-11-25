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
    const url = new URL(request.url);
    const incrementViews = url.searchParams.get('incrementViews') !== 'false';

    // Check if it's a UUID or slug
    const isUUID = isValidUUID(id);
    
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        translations:blog_post_translations(*),
        author:author_id(full_name, email)
      `);
    
    // Query by UUID or slug
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }
    
    const { data, error } = await query.single();

    if (error || !data) {
      return errorResponse('Blog post not found', 404);
    }

    // Increment views only if requested (skip for dashboard/admin views)
    if (incrementViews) {
      await supabase
        .from('blog_posts')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', data.id);
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
      return errorResponse('Invalid blog post ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner', 'officer']);

    const body = await request.json();
    const { slug, category, tags, featured_image_url, is_featured, is_published } = body;

    // Build update object
    const updateData: Record<string, any> = {};
    if (slug !== undefined) updateData.slug = sanitizeTextInput(slug);
    if (category !== undefined) updateData.category = sanitizeTextInput(category);
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags.map((t: string) => sanitizeTextInput(t)) : null;
    if (featured_image_url !== undefined) updateData.featured_image_url = sanitizeTextInput(featured_image_url);
    if (is_featured !== undefined) updateData.is_featured = Boolean(is_featured);
    if (is_published !== undefined) {
      updateData.is_published = Boolean(is_published);
      if (is_published && !updateData.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return errorResponse('Failed to update blog post', 400);
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
      return errorResponse('Invalid blog post ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner', 'officer']);

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse('Failed to delete blog post', 400);
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
      return errorResponse('Invalid blog post ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin or owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner', 'officer']);

    const body = await request.json();
    const { slug, category, tags, featured_image_url, is_featured, is_published, translations } = body;

    // Build update object with XSS sanitization
    const updateData: Record<string, any> = {};
    if (slug !== undefined) updateData.slug = sanitizeTextInput(slug);
    if (category !== undefined) updateData.category = sanitizeTextInput(category);
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags.map((t: string) => sanitizeTextInput(t)) : null;
    if (featured_image_url !== undefined) updateData.featured_image_url = sanitizeTextInput(featured_image_url);
    if (is_featured !== undefined) updateData.is_featured = Boolean(is_featured);
    if (is_published !== undefined) {
      updateData.is_published = Boolean(is_published);
      if (is_published) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data: updatedPost, error: postError } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (postError || !updatedPost) {
      return errorResponse('Failed to update blog post', 400);
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

        if (transObj.excerpt && !isValidTextLength(transObj.excerpt, 500)) {
          return errorResponse(`Excerpt must not exceed 500 characters`, 400);
        }

        const sanitizedTrans: Record<string, any> = {};
        if (transObj.title) sanitizedTrans.title = sanitizeTextInput(transObj.title);
        if (transObj.excerpt) sanitizedTrans.excerpt = sanitizeTextInput(transObj.excerpt);
        if (transObj.content) sanitizedTrans.content = transObj.content; // Tiptap JSON - no sanitization

        const { error: transError } = await supabase
          .from('blog_post_translations')
          .upsert(
            {
              blog_post_id: id,
              locale,
              ...sanitizedTrans
            },
            { onConflict: 'blog_post_id,locale' }
          );

        if (transError) {
          return errorResponse('Failed to update translation', 400);
        }
      }
    }

    return NextResponse.json({ data: updatedPost });
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