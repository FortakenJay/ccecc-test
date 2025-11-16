'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type TeamMember = Database['public']['Tables']['team_members']['Row'];
type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];
type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update'];
type TeamMemberTranslation = Database['public']['Tables']['team_member_translations']['Row'];

interface TeamMemberWithTranslations extends TeamMember {
  translations?: TeamMemberTranslation[];
}

export function useTeam() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all team members
  const fetchTeamMembers = async (activeOnly = false) => {
    try {
      setLoading(true);
      let query = supabase
        .from('team_members')
        .select(`
          *,
          translations:team_member_translations(*)
        `)
        .order('display_order', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTeamMembers(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create team member with translations
  const createTeamMember = async (
    memberData: Omit<TeamMemberInsert, 'id' | 'created_at' | 'updated_at'>,
    translations: Record<string, { name: string; role: string; bio?: string }>
  ) => {
    try {
      // Insert team member
      const { data: newMember, error: memberError } = await supabase
        .from('team_members')
        .insert(memberData)
        .select()
        .single();

      if (memberError) throw memberError;

      // Insert translations
      const translationsData = Object.entries(translations).map(([locale, trans]) => ({
        team_member_id: newMember.id,
        locale,
        ...trans,
      }));

      const { error: transError } = await supabase
        .from('team_member_translations')
        .insert(translationsData);

      if (transError) throw transError;

      await fetchTeamMembers();
      return { data: newMember, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Update team member
  const updateTeamMember = async (
    id: string,
    memberData: TeamMemberUpdate,
    translations?: Record<string, { name?: string; role?: string; bio?: string }>
  ) => {
    try {
      // Update team member
      const { data: updatedMember, error: memberError } = await supabase
        .from('team_members')
        .update(memberData)
        .eq('id', id)
        .select()
        .single();

      if (memberError) throw memberError;

      // Update translations if provided
      if (translations) {
        for (const [locale, trans] of Object.entries(translations)) {
          const { error: transError } = await supabase
            .from('team_member_translations')
            .upsert({
              team_member_id: id,
              locale,
              ...trans,
            }, {
              onConflict: 'team_member_id,locale'
            });

          if (transError) throw transError;
        }
      }

      await fetchTeamMembers();
      return { data: updatedMember, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Delete team member
  const deleteTeamMember = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchTeamMembers();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // Update display order
  const updateDisplayOrder = async (id: string, order: number) => {
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