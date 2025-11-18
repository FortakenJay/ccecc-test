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

type EventRow = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];
type EventTranslation = Database['public']['Tables']['event_translations']['Row'];

interface EventWithTranslations extends EventRow {
  translations?: EventTranslation[];
}

interface EventTranslationInput {
  title: string;
  description?: string;
}

export function useEvents(locale?: string) {
  const [events, setEvents] = useState<EventWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all events with translations
  const fetchEvents = async (activeOnly = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeOnly) params.append('active_only', 'true');
      if (locale && isValidLocale(locale)) params.append('locale', locale);

      const response = await fetch(`/api/eventos?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch events');
      }

      setEvents(result.data || []);
      setError(null);
    } catch (err: any) {
      const safeError = sanitizeError(err);
      setError(safeError);
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching events:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get single event by ID
  const getEvent = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        return { data: null, error: 'Invalid event ID format' };
      }

      const params = new URLSearchParams();
      if (locale && isValidLocale(locale)) params.append('locale', locale);

      const response = await fetch(`/api/eventos/${id}?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch event');
      }

      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Create new event with translations
  const createEvent = async (
    eventData: Omit<EventInsert, 'id' | 'created_at' | 'updated_at'>,
    translations: Record<string, EventTranslationInput>
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
        if (!isValidTextLength(trans.description, MAX_DESCRIPTION_LENGTH)) {
          return { data: null, error: `Description exceeds max length of ${MAX_DESCRIPTION_LENGTH}` };
        }
      }

      const payload = { eventData, translations };

      const response = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create event');
      }

      await fetchEvents();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Update event
  const updateEvent = async (
    id: string,
    eventData: EventUpdate,
    translations?: Record<string, Partial<EventTranslationInput>>
  ) => {
    try {
      if (!isValidUUID(id)) {
        return { data: null, error: 'Invalid event ID format' };
      }

      if (translations) {
        for (const [loc, trans] of Object.entries(translations)) {
          if (!isValidLocale(loc)) {
            return { data: null, error: `Invalid locale: ${loc}` };
          }
          if (trans.title && !isValidTextLength(trans.title, MAX_TITLE_LENGTH)) {
            return { data: null, error: `Title exceeds max length of ${MAX_TITLE_LENGTH}` };
          }
          if (trans.description && !isValidTextLength(trans.description, MAX_DESCRIPTION_LENGTH)) {
            return { data: null, error: `Description exceeds max length of ${MAX_DESCRIPTION_LENGTH}` };
          }
        }
      }

      const payload = { eventData, translations };

      const response = await fetch(`/api/eventos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update event');
      }

      await fetchEvents();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Delete event
  const deleteEvent = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        return { error: 'Invalid event ID format' };
      }

      const response = await fetch(`/api/eventos/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete event');
      }

      await fetchEvents();
      return { error: null };
    } catch (err: any) {
      return { error: sanitizeError(err) };
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
