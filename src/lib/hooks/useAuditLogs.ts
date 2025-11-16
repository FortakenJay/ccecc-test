'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/types/database.types';

type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdminOrOwner } = useAuth();
  const supabase = createClient();

  // Fetch audit logs (RLS will filter based on role)
  const fetchLogs = async (filters?: {
    table?: string;
    action?: string;
    userId?: string;
    limit?: number;
  }) => {
    try {
      setLoading(true);

      if (!isAdminOrOwner) {
        throw new Error('Insufficient permissions');
      }

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.table) {
        query = query.eq('table_name', filters.table);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLogs(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminOrOwner) {
      fetchLogs();
    }
  }, [isAdminOrOwner]);

  return {
    logs,
    loading,
    error,
    fetchLogs,
  };
}