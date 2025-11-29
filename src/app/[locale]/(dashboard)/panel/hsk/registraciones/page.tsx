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
  exam_session_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  level: string;
  previous_level?: string;
  status?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

interface ExamSession {
  id: string;
  exam_date: string;
  registration_deadline: string;
  is_active: boolean;
  level?: string;
  location?: string;
}

export default function HSKRegistrationsPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.hsk.registrations');
  const tc = useTranslations('dashboard.common');
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isOfficer, loading: roleLoading } = useRole();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'>('all');

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner && !isOfficer)) {
      router.push('/');
      return;
    }
    fetchRegistrations();
    fetchExamSessions();
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

  const fetchExamSessions = async () => {
    try {
      const res = await fetch('/api/hsk/sessions');
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setExamSessions(data.data || []);
    } catch (err: any) {
      console.error('Error fetching exam sessions:', err);
    }
  };

  const updateRegistrationStatus = async (id: string, status: string) => {
    try {
      setUpdateLoading(id);
      const res = await fetch(`/api/hsk/registration/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to update registration status');
      }
      
      // Update the local state immediately for better UX
      setRegistrations(prev => prev.map(reg => 
        reg.id === id ? { ...reg, status } : reg
      ));
      
    } catch (err: any) {
      console.error('Update error:', err);
      setError(`Failed to update status: ${err.message}`);
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdateLoading(null);
    }
  };

  const getExamSessionInfo = (sessionId?: string) => {
    if (!sessionId) return null;
    return examSessions.find(s => s.id === sessionId);
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Registrations</div>
          <div className="text-2xl font-bold text-gray-900">{registrations.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {registrations.filter(r => r.status === 'pending' || !r.status).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">
            {registrations.filter(r => r.status === 'approved').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Cancelled</div>
          <div className="text-2xl font-bold text-red-600">
            {registrations.filter(r => r.status === 'cancelled').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-blue-600">
            {registrations.filter(r => r.status === 'completed').length}
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
          className="cursor-pointer"
        >
          All
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          size="sm"
          className="cursor-pointer"
        >
          Pending
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilter('approved')}
          size="sm"
          className="cursor-pointer"
        >
          <FontAwesomeIcon icon={faCheckSquare} className="mr-2" />
          Approved
        </Button>
        <Button
          variant={filter === 'rejected' ? 'default' : 'outline'}
          onClick={() => setFilter('rejected')}
          size="sm"
          className="cursor-pointer"
        >
          Rejected
        </Button>
        <Button
          variant={filter === 'cancelled' ? 'default' : 'outline'}
          onClick={() => setFilter('cancelled')}
          size="sm"
          className="cursor-pointer"
        >
          Cancelled
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          size="sm"
          className="cursor-pointer"
        >
          Completed
        </Button>
      </div>

      {/* Registrations Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exam Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.length > 0 ? (
                filteredRegistrations.map((reg) => {
                  const examSession = getExamSessionInfo(reg.exam_session_id);
                  return (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <FontAwesomeIcon icon={faUser} className="w-3 h-3 text-gray-400" />
                            {reg.first_name} {reg.last_name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3" />
                            {reg.email}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <FontAwesomeIcon icon={faPhone} className="w-3 h-3" />
                            {reg.phone}
                          </div>
                          {reg.previous_level && reg.previous_level !== 'no' && (
                            <div className="text-xs text-blue-600">
                              Previous: {reg.previous_level}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {reg.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {examSession ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {new Date(examSession.exam_date).toLocaleDateString()}
                            </div>
                            {examSession.level && (
                              <div className="text-xs text-blue-600">
                                {examSession.level}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No session assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={reg.status || 'pending'}
                          onChange={(e) => updateRegistrationStatus(reg.id, e.target.value)}
                          disabled={updateLoading === reg.id}
                          className={`text-xs px-2 py-1 rounded-full border-0 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                            reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                            reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            reg.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            reg.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                        {updateLoading === reg.id && (
                          <div className="text-xs text-gray-500 mt-1">Updating...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reg.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {(isOwner || isAdmin) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(reg.id)}
                            className="text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No registrations found
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