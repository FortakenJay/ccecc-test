"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRole } from '@/lib/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGraduationCap, 
  faPlus, 
  faEdit,
  faTrash,
  faCalendar,
  faMapMarkerAlt,
  faSave,
  faUsers
} from '@fortawesome/free-solid-svg-icons';

interface Session {
  id: string;
  exam_date: string;
  location?: string;
  max_capacity?: number;
  registration_deadline: string;
  is_active: boolean;
  created_at: string;
}

export default function HSKSessionsPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.hsk.sessions');
  const tc = useTranslations('dashboard.common');
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isOfficer, loading: roleLoading } = useRole();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [examDate, setExamDate] = useState('');
  const [location, setLocation] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner && !isOfficer)) {
      router.push('/');
      return;
    }
    fetchSessions();
  }, [user, isAdmin, isOwner, isOfficer, authLoading, roleLoading]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hsk/sessions');
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (session: Session) => {
    setEditingId(session.id);
    setExamDate(session.exam_date.split('T')[0]);
    setLocation(session.location || '');
    setMaxCapacity(session.max_capacity?.toString() || '');
    setRegistrationDeadline(session.registration_deadline.split('T')[0]);
    setIsActive(session.is_active);
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setExamDate('');
    setLocation('');
    setMaxCapacity('');
    setRegistrationDeadline('');
    setIsActive(true);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!examDate || !registrationDeadline) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const url = editingId ? `/api/hsk/sessions/${editingId}` : '/api/hsk/sessions';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_date: examDate,
          location: location || null,
          max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
          registration_deadline: registrationDeadline,
          is_active: isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || `Failed to ${editingId ? 'update' : 'create'} session`, 'error');
        return;
      }

      showToast(`Session ${editingId ? 'updated' : 'created'} successfully!`, 'success');
      resetForm();
      fetchSessions();
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session? This will also delete all registrations for this session.')) return;

    try {
      const res = await fetch(`/api/hsk/sessions/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete session');
      
      showToast('Session deleted successfully', 'success');
      fetchSessions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/hsk/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!res.ok) throw new Error('Failed to update session');
      
      fetchSessions();
    } catch (err: any) {
      showToast(err.message, 'error');
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
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' :
          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white z-50`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FontAwesomeIcon icon={faGraduationCap} className="w-8 h-8 text-red-600" />
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-2">{t('description')}</p>
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <FontAwesomeIcon icon={showForm ? faCalendar : faPlus} className="mr-2" />
          {showForm ? tc('cancel') : t('newSession')}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? t('editSession') : t('createSession')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="examDate">{t('examDate')} *</Label>
                  <Input
                    id="examDate"
                    type="datetime-local"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="registrationDeadline">{t('registrationDeadline')} *</Label>
                  <Input
                    id="registrationDeadline"
                    type="datetime-local"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">{t('location')}</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('locationPlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="maxCapacity">{t('maxCapacity')}</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    placeholder={t('capacityPlaceholder')}
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <Label htmlFor="isActive" className="mb-0">{t('activeLabel')}</Label>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  {tc('cancel')}
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>{editingId ? tc('updating') : tc('creating')}</>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} className="mr-2" />
                      {editingId ? t('updateSession') : t('createSession')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('totalSessions')}</div>
          <div className="text-2xl font-bold text-gray-900">{sessions.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('activeSessions')}</div>
          <div className="text-2xl font-bold text-green-600">
            {sessions.filter(s => s.is_active).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('upcomingExams')}</div>
          <div className="text-2xl font-bold text-blue-600">
            {sessions.filter(s => new Date(s.exam_date) > new Date()).length}
          </div>
        </Card>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.length > 0 ? (
          sessions.map((session) => {
            const examDate = new Date(session.exam_date);
            const deadline = new Date(session.registration_deadline);
            const isPast = examDate < new Date();
            
            return (
              <Card key={session.id} className={`${isPast ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        {isPast ? t('pastExam') : t('upcomingExam')}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {examDate.toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {examDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActive(session.id, session.is_active)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {session.is_active ? tc('active') : tc('inactive')}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {session.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4" />
                      {session.location}
                    </div>
                  )}
                  
                  {session.max_capacity && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />
                      {t('max')}: {session.max_capacity} {t('students')}
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">{t('registrationDeadline')}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {deadline.toLocaleDateString()} at {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {(isAdmin || isOwner || isOfficer) && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(session)}
                        className="flex-1 text-blue-600 hover:text-blue-700"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-2" />
                        {tc('edit')}
                      </Button>
                      {isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(session.id)}
                          className="flex-1 text-red-600 hover:text-red-700"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-2" />
                          {tc('delete')}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            {t('noSessions')}
          </div>
        )}
      </div>
    </div>
  );
}
