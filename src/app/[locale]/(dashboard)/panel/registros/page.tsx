"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRole } from '@/lib/hooks/useRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList,
  faPlus,
  faEdit,
  faTrash,
  faClock,
  faShield
} from '@fortawesome/free-solid-svg-icons';

interface AuditLog {
  id: string;
  user_id: string;
  user_role: string;
  action: string;
  table_name: string;
  record_id?: string;
  user?: {
    full_name: string;
    email: string;
  };
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  old_data?: any;
  new_data?: any;
}

export default function RegistrosPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.auditLogs');
  const tc = useTranslations('dashboard.common');
  const tu = useTranslations('dashboard.users');
  const { user, profile, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, loading: roleLoading } = useRole();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Helper function to translate role
  const getRoleTranslation = (role: string) => {
    switch (role) {
      case 'owner': return tu('owner');
      case 'admin': return tu('admin');
      case 'officer': return tu('officer');
      default: return role;
    }
  };

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner)) {
      router.push('/');
      return;
    }
    fetchLogs();
  }, [user, isAdmin, isOwner, authLoading, roleLoading]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/registros?limit=100');
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      
      console.log('API Response:', data);
      console.log('First log entry:', data.data?.[0]);
      
      let allLogs = data.data || [];
      
      // Filter based on role (admin sees only officer actions)
      if (profile?.role === 'admin') {
        allLogs = allLogs.filter((log: AuditLog) => log.user_role === 'officer');
      }
      
      setLogs(allLogs);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(l => l.action === filter);

  const actionColors = {
    INSERT: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  const actionIcons = {
    INSERT: faPlus,
    UPDATE: faEdit,
    DELETE: faTrash,
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FontAwesomeIcon icon={faClipboardList} className="w-8 h-8 text-red-600" />
          {t('title')}
          {profile?.role === 'admin' && (
            <span className="text-sm font-normal text-gray-500">({t('officerActionsOnly')})</span>
          )}
        </h1>
        <p className="text-gray-600 mt-2">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('totalActions')}</div>
          <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('inserts')}</div>
          <div className="text-2xl font-bold text-green-600">
            {logs.filter(l => l.action === 'INSERT').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('updates')}</div>
          <div className="text-2xl font-bold text-blue-600">
            {logs.filter(l => l.action === 'UPDATE').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('deletes')}</div>
          <div className="text-2xl font-bold text-red-600">
            {logs.filter(l => l.action === 'DELETE').length}
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {['all', 'INSERT', 'UPDATE', 'DELETE'].map((action) => (
          <Button
            key={action}
            onClick={() => setFilter(action)}
            variant={filter === action ? 'default' : 'outline'}
            size="sm"
            className={filter === action ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {action === 'all' ? t('all') : t(action.toLowerCase())}
          </Button>
        ))}
      </div>

      {/* Logs List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('action')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('timestamp')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        actionColors[log.action as keyof typeof actionColors] || 'bg-gray-100 text-gray-800'
                      }`}>
                        <FontAwesomeIcon 
                          icon={actionIcons[log.action as keyof typeof actionIcons] || faEdit} 
                          className="mr-1 w-3 h-3" 
                        />
                        {t(log.action.toLowerCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.table_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {log.user?.full_name || log.user?.email || (log.user_id ? t('deletedUser') : t('system'))}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <FontAwesomeIcon icon={faShield} className="w-3 h-3" />
                          {getRoleTranslation(log.user_role)}
                        </div>
                        {log.user_id && !log.user && (
                          <div className="text-xs text-gray-400 mt-1">ID: {log.user_id.substring(0, 8)}...</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    {profile?.role === 'admin' 
                      ? t('noOfficerActivity')
                      : filter === 'all' 
                        ? t('noLogs')
                        : `${t('no')} ${t(filter.toLowerCase())} ${t('actionsFound')}`
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
