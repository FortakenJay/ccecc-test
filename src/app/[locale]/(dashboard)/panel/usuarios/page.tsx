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
  faUsers, 
  faUserPlus, 
  faEdit, 
  faTrash, 
  faShield,
  faCheckCircle,
  faTimesCircle,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'officer';
  is_active: boolean;
  created_at: string;
}

export default function UsuariosPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.users');
  const tc = useTranslations('dashboard.common');
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, loading: roleLoading } = useRole();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'officer'>('officer');

  // Helper function to translate role
  const getRoleTranslation = (role: string) => {
    switch (role) {
      case 'owner': return t('owner');
      case 'admin': return t('admin');
      case 'officer': return t('officer');
      default: return role;
    }
  };

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner)) {
      router.push('/');
      return;
    }
    fetchUsers();
  }, [user, isAdmin, isOwner, authLoading, roleLoading]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/usuarios');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const res = await fetch(`/api/usuarios/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/usuarios/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update user status');
      }
      
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (usr: User) => {
    setEditingId(usr.id);
    setEditName(usr.full_name);
    setEditRole(usr.role === 'owner' ? 'admin' : usr.role);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditRole('officer');
  };

  const handleSaveEdit = async (userId: string) => {
    if (!editName.trim()) {
      alert(t('nameRequired'));
      return;
    }

    try {
      const res = await fetch(`/api/usuarios/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          full_name: editName.trim(),
          role: editRole
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update user');
      }
      
      handleCancelEdit();
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-red-600" />
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>
        <Button
          onClick={() => router.push('/panel/usuarios/invitations')}
          className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
        >
          <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
          {t('inviteUser')}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('totalUsers')}</div>
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{tc('active')}</div>
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.is_active).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('admins')}</div>
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === 'admin').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('officers')}</div>
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role === 'officer').length}
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tc('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('joined')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tc('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === usr.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Full Name"
                        />
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{usr.full_name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3" />
                            {usr.email}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === usr.id ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as 'admin' | 'officer')}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="officer">{t('officer')}</option>
                          <option value="admin">{t('admin')}</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          usr.role === 'owner' ? 'bg-red-100 text-red-800' :
                          usr.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <FontAwesomeIcon icon={faShield} className="mr-1 w-3 h-3" />
                          {getRoleTranslation(usr.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(usr.id, usr.is_active)}
                        disabled={usr.role === 'owner'}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          usr.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } ${usr.role === 'owner' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <FontAwesomeIcon 
                          icon={usr.is_active ? faCheckCircle : faTimesCircle} 
                          className="mr-1 w-3 h-3" 
                        />
                        {usr.is_active ? tc('active') : tc('inactive')}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(usr.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === usr.id ? (
                          <>
                            <Button
                              onClick={() => handleSaveEdit(usr.id)}
                              size="sm"
                              className="cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                            >
                              {tc('save')}
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer"
                            >
                              {tc('cancel')}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleEdit(usr)}
                              variant="ghost"
                              size="sm"
                              disabled={usr.role === 'owner'}
                              className={usr.role === 'owner' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            >
                              <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                            </Button>
                            {usr.role !== 'owner' && (
                              <Button
                                onClick={() => handleDelete(usr.id)}
                                variant="ghost"
                                size="sm"
                                className="cursor-pointer text-red-600 hover:text-red-700"
                              >
                                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {t('noUsersFound')}
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
