'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Consulta = Database['public']['Tables']['space_rental_inquiries']['Row'];
type ConsultaInsert = Database['public']['Tables']['space_rental_inquiries']['Insert'];

export function useConsultas() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all consultas/inquiries
  const fetchConsultas = async (status?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('space_rental_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setConsultas(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching consultas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new consulta (public - no auth required)
  const createConsulta = async (consultaData: Omit<ConsultaInsert, 'id' | 'created_at'>) => {
    try {
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
      return { data: null, error: err.message };
    }
  };

  // Update consulta status
  const updateStatus = async (id: string, status: string) => {
    try {
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
      return { data: null, error: err.message };
    }
  };

  // Delete consulta
  const deleteConsulta = async (id: string) => {
    try {
      const response = await fetch(`/api/consultas?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete consulta');
      }

      await fetchConsultas();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // Get consultas by status
  const getByStatus = (status: string) => {
    return consultas.filter(c => c.status === status);
  };

  // Get consulta statistics
  const getStats = () => {
    const total = consultas.length;
    const pending = consultas.filter(c => c.status === 'pending').length;
    const contacted = consultas.filter(c => c.status === 'contacted').length;
    const confirmed = consultas.filter(c => c.status === 'confirmed').length;
    const cancelled = consultas.filter(c => c.status === 'cancelled').length;

    return {
      total,
      pending,
      contacted,
      confirmed,
      cancelled,
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