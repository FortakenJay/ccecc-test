'use client';

import { useState, useEffect } from 'react';
import type { Database } from '@/types/database.types';
import {
  isValidUUID,
  isValidLocale,
  isValidTextLength,
  sanitizeError,
  SUPPORTED_LOCALES,
  MAX_TEXT_LENGTH,
  MAX_LIMIT as MAX_PAGINATION_LIMIT
} from '@/lib/api-utils';

// Constants for input validation
const MAX_FEATURES_SIZE = 100000;

// Validate features object (depth and size)
const isValidFeatures = (features: any): boolean => {
  if (!features) return true;
  if (typeof features !== 'object') return false;
  
  const json = JSON.stringify(features);
  if (json.length > MAX_FEATURES_SIZE) return false;
  
  const checkDepth = (obj: any, depth = 0): boolean => {
    if (depth > 5) return false;
    if (typeof obj !== 'object' || obj === null) return true;
    return Object.values(obj).every(v => checkDepth(v, depth + 1));
  };
  
  return checkDepth(features);
};

// Validate pagination parameters
const validatePagination = (pagination?: PaginationOptions): ValidatedPagination => {
  if (!pagination) return { limit: 50, offset: 0 };
  
  const limit = Math.min(Math.max(pagination.limit || 50, 1), MAX_PAGINATION_LIMIT);
  const offset = Math.max(pagination.offset || 0, 0);
  
  return { limit, offset };
};

type ClassRow = Database['public']['Tables']['classes']['Row'];
type ClassInsert = Database['public']['Tables']['classes']['Insert'];
type ClassUpdate = Database['public']['Tables']['classes']['Update'];
type ClassTranslation = Database['public']['Tables']['class_translations']['Row'];

interface ClassWithTranslations extends ClassRow {
  translations?: ClassTranslation[];
}

// Strict type for translations and features to prevent XSS via unsanitized input
interface ClassTranslationInput {
  title: string;
  description?: string;
  schedule?: string;
  features?: Record<string, string | number | boolean>;
}

interface PaginationOptions {
  limit?: number;
  offset?: number;
}

interface ValidatedPagination {
  limit: number;
  offset: number;
}

export function useClasses(locale?: string) {
  const [classes, setClasses] = useState<ClassWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all classes with translations (with pagination support)
  const fetchClasses = async (activeOnly = false, pagination?: PaginationOptions) => {
    try {
      setLoading(true);
      const { limit, offset } = validatePagination(pagination);

      const params = new URLSearchParams();
      if (activeOnly) params.append('active_only', 'true');
      if (locale && isValidLocale(locale)) params.append('locale', locale);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`/api/clases?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch classes');
      }

      setClasses(result.data || []);
      setError(null);
    } catch (err: any) {
      const safeError = sanitizeError(err);
      setError(safeError);
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching classes:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get single class by ID
  const getClass = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        return { data: null, error: 'Invalid class ID format' };
      }

      const params = new URLSearchParams();
      if (locale && isValidLocale(locale)) params.append('locale', locale);

      const response = await fetch(`/api/clases/${id}?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch class');
      }

      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Create new class with translations
  const createClass = async (
    classData: Omit<ClassInsert, 'id' | 'created_at' | 'updated_at'>,
    translations: Record<string, ClassTranslationInput>
  ) => {
    try {
      if (Object.keys(translations).length === 0) {
        return { data: null, error: 'At least one translation is required' };
      }

      for (const loc of Object.keys(translations)) {
        if (!isValidLocale(loc)) {
          return { data: null, error: `Invalid locale: ${loc}` };
        }
      }

      for (const trans of Object.values(translations)) {
        if (!isValidTextLength(trans.title, MAX_TEXT_LENGTH)) {
          return { data: null, error: `Title exceeds maximum length of ${MAX_TEXT_LENGTH}` };
        }
        if (!isValidTextLength(trans.description, MAX_TEXT_LENGTH)) {
          return { data: null, error: `Description exceeds maximum length of ${MAX_TEXT_LENGTH}` };
        }
        if (!isValidTextLength(trans.schedule, MAX_TEXT_LENGTH)) {
          return { data: null, error: `Schedule exceeds maximum length of ${MAX_TEXT_LENGTH}` };
        }
        if (!isValidFeatures(trans.features)) {
          return { data: null, error: `Features object is invalid or too large` };
        }
      }

      const payload = { classData, translations };

      const response = await fetch('/api/clases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create class');
      }

      await fetchClasses();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Update class
  const updateClass = async (
    id: string,
    classData: ClassUpdate,
    translations?: Record<string, Partial<ClassTranslationInput>>
  ) => {
    try {
      if (!isValidUUID(id)) {
        return { data: null, error: 'Invalid class ID format' };
      }

      if (translations) {
        for (const loc of Object.keys(translations)) {
          if (!isValidLocale(loc)) {
            return { data: null, error: `Invalid locale: ${loc}` };
          }
        }

        for (const trans of Object.values(translations)) {
          if (trans.title !== undefined && !isValidTextLength(trans.title, MAX_TEXT_LENGTH)) {
            return { data: null, error: `Title exceeds maximum length of ${MAX_TEXT_LENGTH}` };
          }
          if (trans.description !== undefined && !isValidTextLength(trans.description, MAX_TEXT_LENGTH)) {
            return { data: null, error: `Description exceeds maximum length of ${MAX_TEXT_LENGTH}` };
          }
          if (trans.schedule !== undefined && !isValidTextLength(trans.schedule, MAX_TEXT_LENGTH)) {
            return { data: null, error: `Schedule exceeds maximum length of ${MAX_TEXT_LENGTH}` };
          }
          if (trans.features !== undefined && !isValidFeatures(trans.features)) {
            return { data: null, error: `Features object is invalid or too large` };
          }
        }
      }

      const payload = { classData, translations };

      const response = await fetch(`/api/clases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update class');
      }

      await fetchClasses();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Delete class
  const deleteClass = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        return { error: 'Invalid class ID format' };
      }

      const response = await fetch(`/api/clases/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete class');
      }

      await fetchClasses();
      return { error: null };
    } catch (err: any) {
      return { error: sanitizeError(err) };
    }
  };

  // Toggle active status
  const toggleActive = async (id: string, isActive: boolean) => {
    // Validate UUID format
    if (!isValidUUID(id)) {
      return { error: 'Invalid class ID format' };
    }
    return updateClass(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return {
    classes,
    loading,
    error,
    fetchClasses,
    getClass,
    createClass,
    updateClass,
    deleteClass,
    toggleActive,
  };
}