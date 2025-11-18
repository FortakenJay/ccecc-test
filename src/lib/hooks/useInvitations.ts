'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import {
  isValidUUID,
  isValidEmail,
  isValidRole,
  isValidPassword,
  isValidPayloadSize,
  sanitizeError,
  VALID_ROLES,
  MAX_EMAIL_LENGTH
} from '@/lib/api-utils';

type Invitation = Database['public']['Tables']['invitations']['Row'];

// Security constants
const MAX_PASSWORD_LENGTH = 72;
const MIN_PASSWORD_LENGTH = 8;
const MAX_TOKEN_LENGTH = 500;
const TOKEN_VALIDATION_REGEX = /^[a-zA-Z0-9_\-]+$/;

// Validator functions
const isValidToken = (token: string): boolean => {
  if (!token || token.length > MAX_TOKEN_LENGTH) return false;
  return TOKEN_VALIDATION_REGEX.test(token);
};

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
      setError(sanitizeError(err));
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send invitation
  const sendInvitation = async (email: string, role: 'admin' | 'officer') => {
    try {
      // Validate inputs
      if (!isValidEmail(email)) {
        return { data: null, error: 'Invalid email address' };
      }
      if (!isValidRole(role)) {
        return { data: null, error: 'Invalid role' };
      }

      const payload = { email, role };
      if (!isValidPayloadSize(payload)) {
        return { data: null, error: 'Request too large' };
      }

      const response = await fetch('/api/invitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      await fetchInvitations();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Revoke invitation
  const revokeInvitation = async (invitationId: string) => {
    try {
      // Validate invitation ID format
      if (!isValidUUID(invitationId)) {
        return { error: 'Invalid invitation ID format' };
      }

      const response = await fetch(`/api/invitaciones/${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to revoke invitation');
      }

      await fetchInvitations();
      return { error: null };
    } catch (err: any) {
      return { error: sanitizeError(err) };
    }
  };

  // Accept invitation (for public use)
  const acceptInvitation = async (token: string, password: string) => {
    try {
      // Validate token format before API call
      if (!isValidToken(token)) {
        return { data: null, error: 'Invalid invitation token format' };
      }

      // Validate password strength before API call
      if (!isValidPassword(password)) {
        return {
          data: null,
          error: 'Password must be 8-72 characters with uppercase, lowercase, digit, and special character',
        };
      }

      const payload = { token, password };
      if (!isValidPayloadSize(payload)) {
        return { data: null, error: 'Request too large' };
      }

      const response = await fetch('/api/invitaciones/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Validate invitation token
  const validateToken = async (token: string) => {
    try {
      // Validate token format
      if (!isValidToken(token)) {
        return { data: null, error: 'Invalid token format' };
      }

      const response = await fetch(`/api/invitaciones/${token}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid token');
      }

      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Resend invitation email
  const resendInvitation = async (invitationId: string) => {
    try {
      // Validate invitation ID format
      if (!isValidUUID(invitationId)) {
        return { data: null, error: 'Invalid invitation ID format' };
      }

      const payload = { invitationId };
      if (!isValidPayloadSize(payload)) {
        return { data: null, error: 'Request too large' };
      }

      const response = await fetch('/api/invitaciones/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend invitation');
      }

      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
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