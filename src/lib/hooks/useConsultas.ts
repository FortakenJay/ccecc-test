'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import {
  isValidUUID,
  isValidEmail,
  isValidConsultaStatus,
  isValidPayloadSize,
  sanitizeError,
  VALID_CONSULTA_STATUSES
} from '@/lib/api-utils';

type Consulta = Database['public']['Tables']['space_rental_inquiries']['Row'];
type ConsultaInsert = Database['public']['Tables']['space_rental_inquiries']['Insert'];

// Valid status values for inquiries
const VALID_STATUSES = VALID_CONSULTA_STATUSES;

// Validate status against whitelist
const isValidStatus = isValidConsultaStatus;

// Input field validation
const isValidName = (name: string): boolean => {
  return name.length > 0 && name.length <= 100;
};

const isValidPhoneNumber = (phone: string | undefined | null): boolean => {
  if (!phone) return true;
  return phone.length > 0 && phone.length <= 20;
};

const isValidMessage = (message: string | undefined | null): boolean => {
  if (!message) return true;
  return message.length <= 5000;
};

export function useConsultas() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all consultas/inquiries
  const fetchConsultas = async (status?: string) => {
    try {
      setLoading(true);
      
      // Validate status parameter if provided
      if (status && !isValidStatus(status)) {
        return { error: `Invalid status: ${status}` };
      }

      let query = supabase
        .from('space_rental_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && isValidStatus(status)) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setConsultas(data || []);
      setError(null);
      return { error: null };
    } catch (err: any) {
      const safeError = sanitizeError(err);
      setError(safeError);
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching consultas:', err);
      }
      return { error: safeError };
    } finally {
      setLoading(false);
    }
  };

  // Create new consulta (public - no auth required)
  const createConsulta = async (consultaData: Omit<ConsultaInsert, 'id' | 'created_at'>) => {
    try {
      // Validate payload size to prevent DoS
      if (!isValidPayloadSize(consultaData)) {
        return { data: null, error: 'Request payload is too large' };
      }

      // Validate required fields
      if (!consultaData.email || !isValidEmail(consultaData.email)) {
        return { data: null, error: 'Valid email address is required' };
      }

      if (!consultaData.name || !isValidName(consultaData.name)) {
        return { data: null, error: 'Valid name is required (max 100 characters)' };
      }

      if (!isValidPhoneNumber(consultaData.phone)) {
        return { data: null, error: 'Phone number is invalid (max 20 characters)' };
      }

      if (!isValidMessage(consultaData.message)) {
        return { data: null, error: 'Message is invalid (max 5000 characters)' };
      }

      const response = await fetch('/api/consultas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultaData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create consulta');
      }

      await fetchConsultas();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Update consulta status
  const updateStatus = async (id: string, status: string) => {
    try {
      // Validate UUID format
      if (!isValidUUID(id)) {
        return { data: null, error: 'Invalid consulta ID format' };
      }

      // Validate status against whitelist
      if (!isValidStatus(status)) {
        return { data: null, error: `Invalid status: ${status}` };
      }

      const response = await fetch('/api/consultas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

      await fetchConsultas();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Delete consulta
  const deleteConsulta = async (id: string) => {
    try {
      // Validate UUID format
      if (!isValidUUID(id)) {
        return { error: 'Invalid consulta ID format' };
      }

      const response = await fetch('/api/consultas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete consulta');
      }

      await fetchConsultas();
      return { error: null };
    } catch (err: any) {
      return { error: sanitizeError(err) };
    }
  };

  // Get consultas by status
  const getByStatus = (status: string) => {
    // Validate status before filtering
    if (!isValidStatus(status)) {
      console.warn(`Invalid status: ${status}`);
      return [];
    }
    return consultas.filter(c => c.status === status);
  };

  // Get consulta statistics
  const getStats = () => {
    const total = consultas.length;
    const stats: Record<string, number> = {};

    // Initialize all valid statuses with 0
    VALID_STATUSES.forEach(s => {
      stats[s] = 0;
    });

    // Count occurrences of each status
    consultas.forEach(c => {
      if (c.status && VALID_STATUSES.includes(c.status)) {
        stats[c.status]++;
      }
    });

    return {
      total,
      ...stats,
    };
  };

  useEffect(() => {
    fetchConsultas();
  }, []);

  return {
    consultas,
    loading,
    error,
    fetchConsultas,
    createConsulta,
    updateStatus,
    deleteConsulta,
    getByStatus,
    getStats,
  };
}