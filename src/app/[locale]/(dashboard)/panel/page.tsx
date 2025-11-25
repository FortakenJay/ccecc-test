'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRole } from '@/lib/hooks/useRole';
import { Card } from '@/components/ui/Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCalendar,
  faBook,
  faFileText,
  faShield,
  faChartLine,
  faExclamationCircle,
  faCheckCircle,
  faClock,
  faPlus,
  faEdit,
  faTrash,
  faUserShield,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    admins: number;
    officers: number;
  };
  content: {
    classes: number;
    events: number;
    teamMembers: number;
    hskSessions: number;
  };
  auditLogs: {
    id: string;
    action: string;
    table_name: string;
    user_id: string;
    user?: {
      full_name: string;
      email: string;
    };
    created_at: string;
    changes?: any;
  }[];
}

export default function DashboardPage() {
  const t = useTranslations('dashboard.panel');
  const tc = useTranslations('dashboard.common');
  const tu = useTranslations('dashboard.users');
  const { user, profile, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isOfficer, loading: roleLoading } = useRole();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!roleLoading && !isAdmin && !isOwner && !isOfficer) {
      router.push('/');
    }
  }, [isAdmin, isOwner, isOfficer, roleLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data with individual error handling
        const fetchWithFallback = async (url: string, name: string) => {
          try {
            const res = await fetch(url);
            if (!res.ok) {
              console.error(`${name} failed with status:`, res.status);
              return { data: [] };
            }
            return await res.json();
          } catch (err) {
            console.error(`${name} fetch error:`, err);
            return { data: [] };
          }
        };

        const [users, classes, events, team, hskSessions, logs] = await Promise.all([
          fetchWithFallback('/api/usuarios', 'Users'),
          fetchWithFallback('/api/clases', 'Classes'),
          fetchWithFallback('/api/eventos', 'Events'),
          fetchWithFallback('/api/equipo', 'Team'),
          fetchWithFallback('/api/hsk/registration', 'HSK'),
          // Only fetch audit logs for admins and owners
          (profile?.role === 'owner' || profile?.role === 'admin') 
            ? fetchWithFallback('/api/registros?limit=15', 'Audit Logs')
            : Promise.resolve({ data: [] })
        ]);

        // Process users stats
        const usersData = users.data || [];
        const userStats = {
          total: usersData.length,
          active: usersData.filter((u: any) => u.is_active).length,
          admins: usersData.filter((u: any) => u.role === 'admin').length,
          officers: usersData.filter((u: any) => u.role === 'officer').length,
        };

        // Process content stats
        const contentStats = {
          classes: (classes.data || []).length,
          events: (events.data || []).length,
          teamMembers: (team.data || []).length,
          hskSessions: (hskSessions.data || []).length,
        };



        // Process audit logs - filter based on role
        let auditLogs = logs.data || [];
        
        // If admin (not owner), only show officer actions
        if (profile?.role === 'admin') {
          // Fetch all users to get officers
          const officers = usersData.filter((u: any) => u.role === 'officer');
          const officerIds = officers.map((o: any) => o.id);
          auditLogs = auditLogs.filter((log: any) => officerIds.includes(log.user_id));
        }
        // Owner sees all logs (no filter needed)

        setStats({
          users: userStats,
          content: contentStats,
          auditLogs: auditLogs,
        });
        
        setError(null);
      } catch (err: any) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user && (isAdmin || isOwner)) {
      fetchDashboardData();
    }
  }, [user, isAdmin, isOwner, profile?.role]);

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user || (!isAdmin && !isOwner)) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">
          {t('welcomeBack')}, {profile?.full_name || user.email}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FontAwesomeIcon icon={faUserShield} className="mr-2" />
            {profile?.role === 'owner' ? tu('owner') : tu('admin')}
          </span>
          <span className="text-sm text-gray-500">
            {t('lastLogin')}: {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <FontAwesomeIcon icon={faExclamationCircle} className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">{t('error')}</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loadingStats')}</p>
        </div>
      ) : stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Users */}
            <Card className="p-6 bg-linear-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">{t('stats.totalUsers')}</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.users.total}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {stats.users.active} {t('stats.active')}
                  </p>
                </div>
                <FontAwesomeIcon icon={faUsers} className="w-12 h-12 text-blue-600 opacity-80" />
              </div>
            </Card>

            {/* Total Classes */}
            <Card className="p-6 bg-linear-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">{t('stats.classes')}</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{stats.content.classes}</p>
                  <p className="text-xs text-green-600 mt-1">{t('stats.activePrograms')}</p>
                </div>
                <FontAwesomeIcon icon={faBook} className="w-12 h-12 text-green-600 opacity-80" />
              </div>
            </Card>

            {/* Total Events */}
            <Card className="p-6 bg-linear-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">{t('stats.events')}</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{stats.content.events}</p>
                  <p className="text-xs text-purple-600 mt-1">{t('stats.upcomingPast')}</p>
                </div>
                <FontAwesomeIcon icon={faCalendar} className="w-12 h-12 text-purple-600 opacity-80" />
              </div>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            {/* User Roles */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faShield} className="w-5 h-5 text-red-600" />
                {t('userRoles')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{tu('admins')}</span>
                  <span className="font-semibold text-gray-900">{stats.users.admins}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{tu('officers')}</span>
                  <span className="font-semibold text-gray-900">{stats.users.officers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{tc('inactive')}</span>
                  <span className="font-semibold text-gray-900">
                    {stats.users.total - stats.users.active}
                  </span>
                </div>
              </div>
            </Card>

            {/* Content Overview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faClipboardList} className="w-5 h-5 text-red-600" />
                {t('contentOverview')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('teamMembers')}</span>
                  <span className="font-semibold text-gray-900">{stats.content.teamMembers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('hskSessions')}</span>
                  <span className="font-semibold text-gray-900">{stats.content.hskSessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('totalItems')}</span>
                  <span className="font-semibold text-gray-900">
                    {stats.content.classes + stats.content.events + stats.content.teamMembers}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Audit Logs - Only show for admins and owners */}
          {(profile?.role === 'owner' || profile?.role === 'admin') && (
            <Card className="p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FontAwesomeIcon icon={faClipboardList} className="w-5 h-5 text-red-600" />
                  {t('auditLog')}
                  {profile?.role === 'admin' && (
                    <span className="text-xs font-normal text-gray-500 ml-2">{t('officerActionsOnly')}</span>
                  )}
                </h3>
                <button
                  onClick={() => router.push('/panel/registros')}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  {t('viewAll')} →
                </button>
              </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.auditLogs.length > 0 ? (
                stats.auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`p-2 rounded-full ${
                      log.action === 'INSERT' ? 'bg-green-100' :
                      log.action === 'UPDATE' ? 'bg-blue-100' :
                      'bg-red-100'
                    }`}>
                      <FontAwesomeIcon 
                        icon={log.action === 'INSERT' ? faPlus : log.action === 'UPDATE' ? faEdit : faTrash}
                        className={`w-4 h-4 ${
                          log.action === 'INSERT' ? 'text-green-600' :
                          log.action === 'UPDATE' ? 'text-blue-600' :
                          'text-red-600'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-semibold">{log.action}</span> {t('on')}{' '}
                        <span className="font-semibold">{log.table_name}</span>
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {t('by')} {log.user?.full_name || log.user?.email || t('unknownUser')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  {profile?.role === 'admin' 
                    ? t('noOfficerActivity')
                    : t('noRecentActivity')
                  }
                </p>
              )}
            </div>
          </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Manage Users - Only for admins and owners */}
            {(profile?.role === 'owner' || profile?.role === 'admin') && (
              <button
                onClick={() => router.push('/panel/usuarios')}
                className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-red-500 hover:shadow-md transition-all text-left group"
              >
                <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-gray-400 group-hover:text-red-600 mb-2" />
                <h4 className="font-semibold text-gray-900">{t('manageUsers')}</h4>
                <p className="text-sm text-gray-600 mt-1">{t('manageUsersDesc')}</p>
              </button>
            )}

            <button
              onClick={() => router.push('/panel/clases')}
              className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-red-500 hover:shadow-md transition-all text-left group"
            >
              <FontAwesomeIcon icon={faBook} className="w-8 h-8 text-gray-400 group-hover:text-red-600 mb-2" />
              <h4 className="font-semibold text-gray-900">{t('manageClasses')}</h4>
              <p className="text-sm text-gray-600 mt-1">{t('manageClassesDesc')}</p>
            </button>

            <button
              onClick={() => router.push('/panel/blog')}
              className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-red-500 hover:shadow-md transition-all text-left group"
            >
              <FontAwesomeIcon icon={faCalendar} className="w-8 h-8 text-gray-400 group-hover:text-red-600 mb-2" />
              <h4 className="font-semibold text-gray-900">{t('manageEvents')}</h4>
              <p className="text-sm text-gray-600 mt-1">{t('manageEventsDesc')}</p>
            </button>


          </div>
        </>
      ) : null}
    </div>
  );
}
