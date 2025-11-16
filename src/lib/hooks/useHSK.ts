'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type HSKSession = Database['public']['Tables']['hsk_exam_sessions']['Row'];
type HSKSessionInsert = Database['public']['Tables']['hsk_exam_sessions']['Insert'];
type HSKSessionUpdate = Database['public']['Tables']['hsk_exam_sessions']['Update'];
type HSKRegistration = Database['public']['Tables']['hsk_registrations']['Row'];
type HSKRegistrationInsert = Database['public']['Tables']['hsk_registrations']['Insert'];

export function useHSK() {
  const [sessions, setSessions] = useState<HSKSession[]>([]);
  const [registrations, setRegistrations] = useState<HSKRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all exam sessions
  const fetchSessions = async (activeOnly = false) => {
    try {
      setLoading(true);
      let query = supabase
        .from('hsk_exam_sessions')
        .select('*')
        .order('exam_date', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setSessions(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching HSK sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch registrations for a specific session
  const fetchRegistrations = async (sessionId?: string) => {
    try {
      let query = supabase
        .from('hsk_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (sessionId) {
        query = query.eq('exam_session_id', sessionId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setRegistrations(data || []);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Create exam session
  const createSession = async (sessionData: Omit<HSKSessionInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('hsk_exam_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (createError) throw createError;

      await fetchSessions();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Update exam session
  const updateSession = async (id: string, sessionData: HSKSessionUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('hsk_exam_sessions')
        .update(sessionData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchSessions();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Delete exam session
  const deleteSession = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('hsk_exam_sessions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchSessions();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // Create registration
  const createRegistration = async (registrationData: Omit<HSKRegistrationInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('hsk_registrations')
        .insert(registrationData)
        .select()
        .single();

      if (createError) throw createError;

      // Update available slots
      const session = sessions.find(s => s.id === registrationData.exam_session_id);
      if (session) {
        await updateSession(session.id, {
          available_slots: session.available_slots - 1
        });
      }

      await fetchRegistrations(registrationData.exam_session_id || undefined);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Update registration status
  const updateRegistrationStatus = async (id: string, status: string) => {
    try {
      const { data, error: updateError } = await supabase
        .from('hsk_registrations')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchRegistrations();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
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
