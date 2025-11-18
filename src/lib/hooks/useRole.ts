'use client';

import { useAuth } from './useAuth';

// CRITICAL SECURITY WARNING
// ===========================
// ALL PERMISSION CHECKS IN THIS FILE ARE CLIENT-SIDE ONLY FOR UI PURPOSES
// NEVER RELY ON THESE CHECKS FOR AUTHORIZATION OR SECURITY
// ALWAYS verify permissions server-side using:
// 1. Supabase Row-Level Security (RLS) policies
// 2. Server-side API route permission checks
// 3. JWT token validation
//
// A malicious user can bypass these checks via browser dev tools or direct API calls
// Your API and database MUST enforce authorization independently

// Export role hierarchy for centralized management
export const ROLE_HIERARCHY = {
  owner: 3,
  admin: 2,
  officer: 1,
} as const;

export function useRole() {
  const { profile, loading } = useAuth();

  const hasPermission = (requiredRole: 'owner' | 'admin' | 'officer') => {
    if (!profile) return false;

    const userLevel = ROLE_HIERARCHY[profile.role];
    const requiredLevel = ROLE_HIERARCHY[requiredRole];

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