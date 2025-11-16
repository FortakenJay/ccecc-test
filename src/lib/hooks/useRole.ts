'use client';

import { useAuth } from './useAuth';

export function useRole() {
  const { profile, loading } = useAuth();

  const hasPermission = (requiredRole: 'owner' | 'admin' | 'officer') => {
    if (!profile) return false;

    const roleHierarchy = {
      owner: 3,
      admin: 2,
      officer: 1,
    };

    const userLevel = roleHierarchy[profile.role];
    const requiredLevel = roleHierarchy[requiredRole];

    return userLevel >= requiredLevel;
  };

  const canManageUsers = () => {
    return profile?.role === 'owner' || profile?.role === 'admin';
  };

  const canInvite = (roleToInvite: 'admin' | 'officer') => {
    if (!profile) return false;

    if (profile.role === 'owner') return true;
    if (profile.role === 'admin' && roleToInvite === 'officer') return true;

    return false;
  };

  const canEdit = (resource: 'classes' | 'events' | 'team' | 'hsk') => {
    if (!profile) return false;
    return profile.role === 'owner' || profile.role === 'admin' || profile.role === 'officer';
  };

  const canDelete = () => {
    return profile?.role === 'owner' || profile?.role === 'admin';
  };

  const canViewAuditLogs = () => {
    return profile?.role === 'owner' || profile?.role === 'admin';
  };

  return {
    role: profile?.role,
    loading,
    hasPermission,
    canManageUsers,
    canInvite,
    canEdit,
    canDelete,
    canViewAuditLogs,
    isOwner: profile?.role === 'owner',
    isAdmin: profile?.role === 'admin',
    isOfficer: profile?.role === 'officer',
  };
}