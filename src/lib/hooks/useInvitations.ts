'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Invitation = Database['public']['Tables']['invitations']['Row'];

export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all pending invitations
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setInvitations(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send invitation
  const sendInvitation = async (email: string, role: 'admin' | 'officer') => {
    try {
      const response = await fetch('/api/invitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      await fetchInvitations();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Revoke invitation
  const revokeInvitation = async (token: string) => {
    try {
      const response = await fetch(`/api/invitaciones/${token}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to revoke invitation');
      }

      await fetchInvitations();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // Accept invitation (for public use)
  const acceptInvitation = async (token: string, password: string) => {
    try {
      const response = await fetch('/api/invitaciones/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Validate invitation token
  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`/api/invitaciones/${token}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid token');
      }

      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Resend invitation email
  const resendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch('/api/invitaciones/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend invitation');
      }

      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    sendInvitation,
    revokeInvitation,
    acceptInvitation,
    validateToken,
    resendInvitation,
  };
}