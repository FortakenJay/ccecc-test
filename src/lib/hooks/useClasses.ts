'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type ClassRow = Database['public']['Tables']['classes']['Row'];
type ClassInsert = Database['public']['Tables']['classes']['Insert'];
type ClassUpdate = Database['public']['Tables']['classes']['Update'];
type ClassTranslation = Database['public']['Tables']['class_translations']['Row'];

interface ClassWithTranslations extends ClassRow {
  translations?: ClassTranslation[];
}

export function useClasses(locale?: string) {
  const [classes, setClasses] = useState<ClassWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all classes with translations
  const fetchClasses = async (activeOnly = false) => {
    try {
      setLoading(true);
      let query = supabase
        .from('classes')
        .select(`
          *,
          translations:class_translations(*)
        `)
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setClasses(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get single class by ID
  const getClass = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('classes')
        .select(`
          *,
          translations:class_translations(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Create new class with translations
  const createClass = async (
    classData: Omit<ClassInsert, 'id' | 'created_at' | 'updated_at'>,
    translations: Record<string, { title: string; description?: string; schedule?: string; features?: any }>
  ) => {
    try {
      // Insert class
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert(classData)
        .select()
        .single();

      if (classError) throw classError;

      // Insert translations
      const translationsData = Object.entries(translations).map(([locale, trans]) => ({
        class_id: newClass.id,
        locale,
        ...trans,
      }));

      const { error: transError } = await supabase
        .from('class_translations')
        .insert(translationsData);

      if (transError) throw transError;

      await fetchClasses();
      return { data: newClass, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Update class
  const updateClass = async (
    id: string,
    classData: ClassUpdate,
    translations?: Record<string, { title?: string; description?: string; schedule?: string; features?: any }>
  ) => {
    try {
      // Update class
      const { data: updatedClass, error: classError } = await supabase
        .from('classes')
        .update(classData)
        .eq('id', id)
        .select()
        .single();

      if (classError) throw classError;

      // Update translations if provided
      if (translations) {
        for (const [locale, trans] of Object.entries(translations)) {
          const { error: transError } = await supabase
            .from('class_translations')
            .upsert({
              class_id: id,
              locale,
              ...trans,
            }, {
              onConflict: 'class_id,locale'
            });

          if (transError) throw transError;
        }
      }

      await fetchClasses();
      return { data: updatedClass, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Delete class
  const deleteClass = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchClasses();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // Toggle active status
  const toggleActive = async (id: string, isActive: boolean) => {
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