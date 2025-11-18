'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/types/database.types';
import {
  isValidUUID,
  isValidAuditTable,
  isValidAuditAction,
  sanitizeError,
  DEFAULT_LIMIT,
  MAX_LIMIT
} from '@/lib/api-utils';

type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

// Validator functions
const isValidTableName = isValidAuditTable;
const isValidAction = isValidAuditAction;

interface FetchFilters {
  table?: string;
  action?: string;
  userId?: string;
  limit?: number;
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdminOrOwner } = useAuth();

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch audit logs (RLS will filter based on role)
  // Note: Client-side permission check is for UX only - RLS provides real security
  const fetchLogs = useCallback(
    async (filters?: FetchFilters) => {
      // Early return if not admin/owner (UX check, not security)
      if (!isAdminOrOwner) {
        if (isMountedRef.current) {
          setError('Insufficient permissions');
          setLoading(false);
        }
        return;
      }

      try {
        if (isMountedRef.current) {
          setLoading(true);
          setError(null);
        }

        // Validate filters
        if (filters?.table && !isValidTableName(filters.table)) {
          if (isMountedRef.current) {
            setError('Invalid table name');
            setLoading(false);
          }
          return;
        }

        if (filters?.action && !isValidAction(filters.action)) {
          if (isMountedRef.current) {
            setError('Invalid action');
            setLoading(false);
          }
          return;
        }

        if (filters?.userId && !isValidUUID(filters.userId)) {
          if (isMountedRef.current) {
            setError('Invalid user ID format');
            setLoading(false);
          }
          return;
        }

        // Create fresh Supabase client for this request
        const supabase = createClient();

        // Validate and sanitize limit
        const safeLimit = Math.min(
          Math.max(filters?.limit || DEFAULT_LIMIT, 1),
          MAX_LIMIT
        );

        let query = supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(safeLimit);

        // Apply filters if provided (whitelist-validated)
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

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setLogs(data || []);
          setError(null);
        }
      } catch (err) {
        // Type-safe error handling
        const errorMessage = sanitizeError(err);

        if (isMountedRef.current) {
          setError(errorMessage);
          console.error('Error fetching audit logs:', err);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [isAdminOrOwner]
  );

  // Initial fetch on mount
  useEffect(() => {
    if (isAdminOrOwner) {
      fetchLogs();
    } else {
      // Set loading to false if user is not authorized
      setLoading(false);
    }
  }, [isAdminOrOwner, fetchLogs]);

  return { logs, loading, error, fetchLogs };
}