'use client';

import { useState, useEffect } from 'react';
import type { Database } from '@/types/database.types';
import {
  isValidUUID,
  isValidLocale,
  isValidTextLength,
  sanitizeError,
  SUPPORTED_LOCALES,
  MAX_NAME_LENGTH,
  MAX_BIO_LENGTH
} from '@/lib/api-utils';

type TeamMember = Database['public']['Tables']['team_members']['Row'];
type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];
type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update'];
type TeamMemberTranslation = Database['public']['Tables']['team_member_translations']['Row'];

interface TeamMemberWithTranslations extends TeamMember {
  translations?: TeamMemberTranslation[];
}

const MAX_ROLE_LENGTH = 50;

interface TeamTranslationInput {
  name: string;
  role: string;
  bio?: string;
}

export function useTeam() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all team members
  const fetchTeamMembers = async (activeOnly = false, locale?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeOnly) params.append('active_only', 'true');
      if (locale && isValidLocale(locale)) params.append('locale', locale);

      const response = await fetch(`/api/equipo?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch team members');
      }

      setTeamMembers(result.data || []);
      setError(null);
    } catch (err: any) {
      setError(sanitizeError(err));
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create team member with translations
  const createTeamMember = async (
    memberData: Omit<TeamMemberInsert, 'id' | 'created_at' | 'updated_at'>,
    translations: Record<string, TeamTranslationInput>
  ) => {
    try {
      if (Object.keys(translations).length === 0) {
        return { data: null, error: 'At least one translation is required' };
      }

      for (const [loc, trans] of Object.entries(translations)) {
        if (!isValidLocale(loc)) {
          return { data: null, error: `Invalid locale: ${loc}` };
        }
        if (!isValidTextLength(trans.name, MAX_NAME_LENGTH)) {
          return { data: null, error: `Name exceeds max length of ${MAX_NAME_LENGTH}` };
        }
        if (!isValidTextLength(trans.role, MAX_ROLE_LENGTH)) {
          return { data: null, error: `Role exceeds max length of ${MAX_ROLE_LENGTH}` };
        }
        if (!isValidTextLength(trans.bio, MAX_BIO_LENGTH)) {
          return { data: null, error: `Bio exceeds max length of ${MAX_BIO_LENGTH}` };
        }
      }

      const payload = { memberData, translations };

      const response = await fetch('/api/equipo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create team member');
      }

      await fetchTeamMembers();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Update team member
  const updateTeamMember = async (
    id: string,
    memberData: TeamMemberUpdate,
    translations?: Record<string, Partial<TeamTranslationInput>>
  ) => {
    try {
      if (!isValidUUID(id)) {
        return { data: null, error: 'Invalid team member ID format' };
      }

      if (translations) {
        for (const [loc, trans] of Object.entries(translations)) {
          if (!isValidLocale(loc)) {
            return { data: null, error: `Invalid locale: ${loc}` };
          }
          if (trans.name && !isValidTextLength(trans.name, MAX_NAME_LENGTH)) {
            return { data: null, error: `Name exceeds max length of ${MAX_NAME_LENGTH}` };
          }
          if (trans.role && !isValidTextLength(trans.role, MAX_ROLE_LENGTH)) {
            return { data: null, error: `Role exceeds max length of ${MAX_ROLE_LENGTH}` };
          }
          if (trans.bio && !isValidTextLength(trans.bio, MAX_BIO_LENGTH)) {
            return { data: null, error: `Bio exceeds max length of ${MAX_BIO_LENGTH}` };
          }
        }
      }

      const payload = { memberData, translations };

      const response = await fetch(`/api/equipo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update team member');
      }

      await fetchTeamMembers();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Delete team member
  const deleteTeamMember = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        return { error: 'Invalid team member ID format' };
      }

      const response = await fetch(`/api/equipo/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete team member');
      }

      await fetchTeamMembers();
      return { error: null };
    } catch (err: any) {
      return { error: sanitizeError(err) };
    }
  };

  // Update display order
  const updateDisplayOrder = async (id: string, order: number) => {
    if (!isValidUUID(id)) {
      return { data: null, error: 'Invalid team member ID format' };
    }
    return updateTeamMember(id, { display_order: order });
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  return {
    teamMembers,
    loading,
    error,
    fetchTeamMembers,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    updateDisplayOrder,
  };
}
