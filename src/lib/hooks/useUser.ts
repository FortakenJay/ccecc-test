'use client';

import { useState, useEffect } from 'react';
import type { Database } from '@/types/database.types';
import {
  isValidUUID,
  isValidEmail,
  isValidRole,
  sanitizeError,
  MAX_EMAIL_LENGTH,
  VALID_ROLES
} from '@/lib/api-utils';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface PaginationOptions {
  limit?: number;
  offset?: number;
}

interface ValidatedPagination {
  limit: number;
  offset: number;
}

const validatePagination = (pagination?: PaginationOptions): ValidatedPagination => {
  if (!pagination) return { limit: 50, offset: 0 };
  const limit = Math.min(Math.max(pagination.limit || 50, 1), 500);
  const offset = Math.max(pagination.offset || 0, 0);
  return { limit, offset };
};

export function useUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users
  const fetchUsers = async (pagination?: PaginationOptions) => {
    try {
      setLoading(true);
      const { limit, offset } = validatePagination(pagination);

      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`/api/usuarios?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.data || []);
      setError(null);
    } catch (err: any) {
      const safeError = sanitizeError(err);
      setError(safeError);
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching users:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUser = async (id: string, updates: ProfileUpdate) => {
    try {
      if (!isValidUUID(id)) {
        return { data: null, error: 'Invalid user ID format' };
      }

      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }

      await fetchUsers();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (id: string, isActive: boolean) => {
    if (!isValidUUID(id)) {
      return { data: null, error: 'Invalid user ID format' };
    }
    return updateUser(id, { is_active: isActive });
  };

  // Delete user
  const deleteUser = async (id: string) => {
    try {
      if (!isValidUUID(id)) {
        return { error: 'Invalid user ID format' };
      }

      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      await fetchUsers();
      return { error: null };
    } catch (err: any) {
      return { error: sanitizeError(err) };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUser,
    toggleUserStatus,
    deleteUser,
  };
}
