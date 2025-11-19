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
  faCalendar, 
  faPlus, 
  faEdit, 
  faTrash,
  faCheckCircle,
  faTimesCircle,
  faMapMarkerAlt,
  faUsers
} from '@fortawesome/free-solid-svg-icons';

interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  event_date: string;
  location: string;
  max_attendees?: number;
  current_attendees?: number;
  is_active: boolean;
  image_url?: string;
}

export default function EventosPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.events');
  const tc = useTranslations('dashboard.common');
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isOfficer, loading: roleLoading } = useRole();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner && !isOfficer)) {
      router.push('/');
      return;
    }
    fetchEvents();
  }, [user, isAdmin, isOwner, authLoading, roleLoading]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/eventos');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const res = await fetch(`/api/eventos/${eventId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete event');
      
      fetchEvents();
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
            <FontAwesomeIcon icon={faCalendar} className="w-8 h-8 text-red-600" />
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>
        <Button
          onClick={() => router.push('/panel/eventos/new')}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          {t('createEvent')}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('totalEvents')}</div>
          <div className="text-2xl font-bold text-gray-900">{events.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{tc('active')}</div>
          <div className="text-2xl font-bold text-green-600">
            {events.filter(e => e.is_active).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('totalAttendees')}</div>
          <div className="text-2xl font-bold text-blue-600">
            {events.reduce((sum, e) => sum + (e.current_attendees || 0), 0)}
          </div>
        </Card>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length > 0 ? (
          events.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {event.image_url && (
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {event.event_type}
                      </span>
                    </div>
                  </div>
                  <FontAwesomeIcon 
                    icon={event.is_active ? faCheckCircle : faTimesCircle}
                    className={`w-5 h-5 ${event.is_active ? 'text-green-500' : 'text-gray-400'}`}
                  />
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {event.description || t('noDescription')}
                </p>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-gray-400" />
                    {new Date(event.event_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-gray-400" />
                    {event.location}
                  </div>
                  {event.max_attendees && (
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-gray-400" />
                      {event.current_attendees || 0} / {event.max_attendees} {t('attendees')}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => router.push(`/panel/eventos/${event.id}`)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-2 w-4 h-4" />
                    {tc('edit')}
                  </Button>
                  <Button
                    onClick={() => handleDelete(event.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <FontAwesomeIcon icon={faCalendar} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noEventsFound')}</h3>
            <p className="text-gray-500 mb-4">{t('getStarted')}</p>
            <Button
              onClick={() => router.push('/panel/eventos/new')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              {t('createEvent')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
