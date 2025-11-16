'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];
type EventTranslation = Database['public']['Tables']['event_translations']['Row'];

interface EventWithTranslations extends EventRow {
  translations?: EventTranslation[];
}

export function useEvents(locale?: string) {
  const [events, setEvents] = useState<EventWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all events with translations
  const fetchEvents = async (activeOnly = false) => {
    try {
      setLoading(true);
      let query = supabase
        .from('events')
        .select(`
          *,
          translations:event_translations(*)
        `)
        .order('event_date', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setEvents(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get single event by ID
  const getEvent = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          translations:event_translations(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Create new event with translations
  const createEvent = async (
    eventData: Omit<EventInsert, 'id' | 'created_at' | 'updated_at'>,
    translations: Record<string, { title: string; description?: string }>
  ) => {
    try {
      // Insert event
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (eventError) throw eventError;

      // Insert translations
      const translationsData = Object.entries(translations).map(([locale, trans]) => ({
        event_id: newEvent.id,
        locale,
        ...trans,
      }));

      const { error: transError } = await supabase
        .from('event_translations')
        .insert(translationsData);

      if (transError) throw transError;

      await fetchEvents();
      return { data: newEvent, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Update event
  const updateEvent = async (
    id: string,
    eventData: EventUpdate,
    translations?: Record<string, { title?: string; description?: string }>
  ) => {
    try {
      // Update event
      const { data: updatedEvent, error: eventError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (eventError) throw eventError;

      // Update translations if provided
      if (translations) {
        for (const [locale, trans] of Object.entries(translations)) {
          const { error: transError } = await supabase
            .from('event_translations')
            .upsert({
              event_id: id,
              locale,
              ...trans,
            }, {
              onConflict: 'event_id,locale'
            });

          if (transError) throw transError;
        }
      }

      await fetchEvents();
      return { data: updatedEvent, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Delete event
  const deleteEvent = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchEvents();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // Update attendee count
  const updateAttendees = async (id: string, count: number) => {
    return updateEvent(id, { current_attendees: count });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    updateAttendees,
  };
}