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
  faGraduationCap, 
  faPlus, 
  faEdit, 
  faTrash,
  faCheckCircle,
  faTimesCircle,
  faUser,
  faEnvelope,
  faPhone,
  faCheckSquare
} from '@fortawesome/free-solid-svg-icons';

interface Registration {
  id: string;
  session_id: string;
  full_name: string;
  email: string;
  phone?: string;
  level: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  registration_date: string;
  created_at: string;
}

export default function HSKRegistrationsPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.hsk.registrations');
  const tc = useTranslations('dashboard.common');
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isOfficer, loading: roleLoading } = useRole();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner && !isOfficer)) {
      router.push('/');
      return;
    }
    fetchRegistrations();
  }, [user, isAdmin, isOwner, authLoading, roleLoading]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hsk/registration');
      if (!res.ok) throw new Error('Failed to fetch registrations');
      const data = await res.json();
      setRegistrations(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const res = await fetch(`/api/hsk/registration/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update payment status');
      
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const res = await fetch(`/api/hsk/registration/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete registration');
      
      fetchRegistrations();
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

  const filteredRegistrations = filter === 'all' 
    ? registrations 
    : registrations.filter(r => r.status === filter);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FontAwesomeIcon icon={faGraduationCap} className="w-8 h-8 text-red-600" />
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-2">{t('totalRegistrations')}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('totalRegistrations')}</div>
          <div className="text-2xl font-bold text-gray-900">{registrations.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('pendingPayment')}</div>
          <div className="text-2xl font-bold text-yellow-600">
            {registrations.filter(r => r.status === 'pending').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('confirmed')}</div>
          <div className="text-2xl font-bold text-green-600">
            {registrations.filter(r => r.status === 'confirmed').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('cancelled')}</div>
          <div className="text-2xl font-bold text-red-600">
            {registrations.filter(r => r.status === 'cancelled').length}
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          {t('all')}
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          size="sm"
        >
          {t('pending')}
        </Button>
        <Button
          variant={filter === 'confirmed' ? 'default' : 'outline'}
          onClick={() => setFilter('confirmed')}
          size="sm"
        >
          <FontAwesomeIcon icon={faCheckSquare} className="mr-2" />
          {t('confirmed')}
        </Button>
        <Button
          variant={filter === 'cancelled' ? 'default' : 'outline'}
          onClick={() => setFilter('cancelled')}
          size="sm"
        >
          {t('cancelled')}
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          size="sm"
        >
          {t('completed')}
        </Button>
      </div>

      {/* Registrations Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('student')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('level')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('paymentStatus')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('registered')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.length > 0 ? (
                filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <FontAwesomeIcon icon={faUser} className="w-3 h-3 text-gray-400" />
                          {reg.full_name}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3" />
                          {reg.email}
                        </div>
                        {reg.phone && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <FontAwesomeIcon icon={faPhone} className="w-3 h-3" />
                            {reg.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        HSK {reg.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={reg.status}
                        onChange={(e) => updatePaymentStatus(reg.id, e.target.value as any)}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${
                          reg.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          reg.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          reg.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="pending">{t('pending')}</option>
                        <option value="confirmed">{t('confirmed')}</option>
                        <option value="cancelled">{t('cancelled')}</option>
                        <option value="completed">{t('completed')}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reg.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(reg.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {t('noRegistrations')}
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
