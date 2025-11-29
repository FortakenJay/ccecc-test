'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import {
  isValidUUID,
  isValidFutureDate,
  isValidSlots,
  isValidHSKStatus,
  sanitizeError,
  parsePaginationParams
} from '@/lib/api-utils';

type HSKSession = Database['public']['Tables']['hsk_exam_sessions']['Row'];
type HSKSessionInsert = Database['public']['Tables']['hsk_exam_sessions']['Insert'];
type HSKSessionUpdate = Database['public']['Tables']['hsk_exam_sessions']['Update'];
type HSKRegistration = Database['public']['Tables']['hsk_registrations']['Row'];
type HSKRegistrationInsert = Database['public']['Tables']['hsk_registrations']['Insert'];

// Security constants

const MIN_SLOTS = 1;
const MAX_SLOTS = 1000;

// Validator functions
const isValidStatus = isValidHSKStatus;

const validatePagination = (limit?: number, offset?: number) => {
  return parsePaginationParams(limit, offset);
};

export function useHSK() {
  const [sessions, setSessions] = useState<HSKSession[]>([]);
  const [registrations, setRegistrations] = useState<HSKRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all exam sessions
  const fetchSessions = async (activeOnly = false, limit?: number, offset?: number) => {
    try {
      setLoading(true);
      const { limit: validLimit, offset: validOffset } = validatePagination(limit, offset);

      let query = supabase
        .from('hsk_exam_sessions')
        .select('*', { count: 'estimated' })
        .order('exam_date', { ascending: true })
        .range(validOffset, validOffset + validLimit - 1);

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setSessions(data || []);
      setError(null);
    } catch (err: any) {
      setError(sanitizeError(err));
      console.error('Error fetching HSK sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch registrations for a specific session
  const fetchRegistrations = async (sessionId?: string, limit?: number, offset?: number) => {
    try {
      // Validate sessionId if provided
      if (sessionId && !isValidUUID(sessionId)) {
        return { data: null, error: 'Invalid session ID format' };
      }

      const { limit: validLimit, offset: validOffset } = validatePagination(limit, offset);

      let query = supabase
        .from('hsk_registrations')
        .select('*', { count: 'estimated' })
        .order('created_at', { ascending: false })
        .range(validOffset, validOffset + validLimit - 1);

      if (sessionId) {
        query = query.eq('exam_session_id', sessionId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setRegistrations(data || []);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Create exam session
  const createSession = async (sessionData: Omit<HSKSessionInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Validate exam_date is in the future
      if (sessionData.exam_date && !isValidFutureDate(sessionData.exam_date)) {
        return { data: null, error: 'Exam date must be in the future' };
      }


      const response = await fetch('/api/hsk/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create session');
      }

      await fetchSessions();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Update exam session
  const updateSession = async (id: string, sessionData: HSKSessionUpdate) => {
    try {
      // Validate session ID
      if (!isValidUUID(id)) {
        return { data: null, error: 'Invalid session ID format' };
      }

      // Validate exam_date if provided
      if (sessionData.exam_date && !isValidFutureDate(sessionData.exam_date)) {
        return { data: null, error: 'Exam date must be in the future' };
      }


      const response = await fetch(`/api/hsk/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update session');
      }

      await fetchSessions();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Delete exam session
  const deleteSession = async (id: string) => {
    try {
      // Validate session ID
      if (!isValidUUID(id)) {
        return { error: 'Invalid session ID format' };
      }

      const response = await fetch(`/api/hsk/sessions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete session');
      }

      await fetchSessions();
      return { error: null };
    } catch (err: any) {
      return { error: sanitizeError(err) };
    }
  };

  // Create registration
  const createRegistration = async (registrationData: Omit<HSKRegistrationInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Validate session ID
      if (!isValidUUID(registrationData.exam_session_id)) {
        return { data: null, error: 'Invalid session ID format' };
      }

      // Validate status if provided
      if (registrationData.status && !isValidStatus(registrationData.status)) {
        return { data: null, error: 'Invalid registration status' };
      }

      const response = await fetch('/api/hsk/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create registration');
      }

      await fetchRegistrations(registrationData.exam_session_id || undefined);
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Update registration status
  const updateRegistrationStatus = async (id: string, status: string) => {
    try {
      // Validate registration ID
      if (!isValidUUID(id)) {
        return { data: null, error: 'Invalid registration ID format' };
      }

      // Validate status
      if (!isValidStatus(status)) {
        return { data: null, error: 'Invalid status' };
      }

      const response = await fetch(`/api/hsk/registration/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update registration status');
      }

      await fetchRegistrations();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchRegistrations();
  }, []);

  return {
    sessions,
    registrations,
    loading,
    error,
    fetchSessions,
    fetchRegistrations,
    createSession,
    updateSession,
    deleteSession,
    createRegistration,
    updateRegistrationStatus,
  };
}
