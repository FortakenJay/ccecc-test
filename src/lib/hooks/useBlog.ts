'use client';

import { useState, useEffect } from 'react';
import type { Database } from '@/types/database.types';
import {
  isValidUUID,
  isValidLocale,
  isValidTextLength,
  sanitizeError,
  SUPPORTED_LOCALES,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH
} from '@/lib/api-utils';

type BlogPostRow = Database['public']['Tables']['blog_posts']['Row'];
type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert'];
type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update'];
type BlogPostTranslation = Database['public']['Tables']['blog_post_translations']['Row'];

interface BlogPostWithTranslations extends BlogPostRow {
  translations?: BlogPostTranslation[];
  author?: {
    full_name: string;
    email: string;
  };
}

interface BlogPostTranslationInput {
  title: string;
  excerpt?: string;
  content?: Record<string, any>; // Tiptap JSON content with images, videos, embeds, etc.
  seo_description?: string;
  reading_time_minutes?: number;
}

export function useBlog(locale?: string) {
  const [posts, setPosts] = useState<BlogPostWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all blog posts with translations
  const fetchPosts = async (params?: {
    category?: string;
    featured?: boolean;
    published?: boolean;
  }) => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams();
      
      if (locale && isValidLocale(locale)) searchParams.append('locale', locale);
      if (params?.category) searchParams.append('category', params.category);
      if (params?.featured !== undefined) searchParams.append('featured', String(params.featured));
      if (params?.published !== undefined) searchParams.append('published', String(params.published));

      const response = await fetch(`/api/eventos?${searchParams.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch blog posts');
      }

      setPosts(result.data || []);
      setError(null);
    } catch (err: any) {
      const safeError = sanitizeError(err);
      setError(safeError);
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching blog posts:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get single blog post by ID
  const getPost = async (id: string, incrementViews: boolean = false) => {
    try {
      if (!isValidUUID(id)) {
        return { data: null, error: 'Invalid blog post ID format' };
      }

      const params = new URLSearchParams();
      if (locale && isValidLocale(locale)) params.append('locale', locale);
      if (!incrementViews) params.append('incrementViews', 'false');

      const response = await fetch(`/api/eventos/${id}?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch blog post');
      }

      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Create new blog post with translations
  const createPost = async (
    postData: {
      slug: string;
      category?: string;
      tags?: string[];
      featured_image_url?: string;
      is_featured?: boolean;
      is_published?: boolean;
    },
    translations: Record<string, BlogPostTranslationInput>
  ) => {
    try {
      if (Object.keys(translations).length === 0) {
        return { data: null, error: 'At least one translation is required' };
      }

      for (const [loc, trans] of Object.entries(translations)) {
        if (!isValidLocale(loc)) {
          return { data: null, error: `Invalid locale: ${loc}` };
        }
        if (!trans.title || !isValidTextLength(trans.title, MAX_TITLE_LENGTH)) {
          return { data: null, error: `Title is required and must not exceed ${MAX_TITLE_LENGTH} characters` };
        }
        if (trans.excerpt && !isValidTextLength(trans.excerpt, 500)) {
          return { data: null, error: `Excerpt must not exceed 500 characters` };
        }
      }

      const payload = { ...postData, translations };

      const response = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create blog post');
      }

      await fetchPosts();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Update blog post
  const updatePost = async (
    id: string,
    postData: Partial<BlogPostUpdate>,
    translations?: Record<string, Partial<BlogPostTranslationInput>>
  ) => {
    try {
      if (!isValidUUID(id)) {
        return { data: null, error: 'Invalid blog post ID format' };
      }

      if (translations) {
        for (const [loc, trans] of Object.entries(translations)) {
          if (!isValidLocale(loc)) {
            return { data: null, error: `Invalid locale: ${loc}` };
          }
          if (trans.title && !isValidTextLength(trans.title, MAX_TITLE_LENGTH)) {
            return { data: null, error: `Title exceeds max length of ${MAX_TITLE_LENGTH}` };
          }
          if (trans.excerpt && !isValidTextLength(trans.excerpt, 500)) {
            return { data: null, error: `Excerpt exceeds max length of 500 characters` };
          }
        }
      }

      const payload = { ...postData, translations };

      const response = await fetch(`/api/eventos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update blog post');
      }

      await fetchPosts();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Delete blog post
  const deletePost = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        return { error: 'Invalid blog post ID format' };
      }

      const response = await fetch(`/api/eventos/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete blog post');
      }

      await fetchPosts();
      return { error: null };
    } catch (err: any) {
      return { error: sanitizeError(err) };
    }
  };

  // Toggle publish status
  const togglePublish = async (id: string, isPublished: boolean) => {
    return updatePost(id, { is_published: isPublished });
  };

  // Toggle featured status
  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    return updatePost(id, { is_featured: isFeatured });
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    loading,
    error,
    fetchPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    togglePublish,
    toggleFeatured,
  };
}
