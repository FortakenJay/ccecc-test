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
  faBook, 
  faPlus, 
  faEdit, 
  faTrash,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

interface Class {
  id: string;
  title: string;
  description?: string;
  type: string;
  level?: string;
  price_colones?: number;
  is_active: boolean;
  created_at: string;
}

export default function ClasesPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.classes');
  const tc = useTranslations('dashboard.common');
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isOfficer, loading: roleLoading } = useRole();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner && !isOfficer)) {
      router.push('/');
      return;
    }
    fetchClasses();
  }, [user, isAdmin, isOwner, authLoading, roleLoading]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clases');
      if (!res.ok) throw new Error('Failed to fetch classes');
      const data = await res.json();
      setClasses(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const res = await fetch(`/api/clases/${classId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete class');
      
      fetchClasses();
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
            <FontAwesomeIcon icon={faBook} className="w-8 h-8 text-red-600" />
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>
        <Button
          onClick={() => router.push('/panel/clases/new')}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          {t('addClass')}
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
          <div className="text-sm text-gray-600">{t('totalClasses')}</div>
          <div className="text-2xl font-bold text-gray-900">{classes.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('active')}</div>
          <div className="text-2xl font-bold text-green-600">
            {classes.filter(c => c.is_active).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('inactive')}</div>
          <div className="text-2xl font-bold text-red-600">
            {classes.filter(c => !c.is_active).length}
          </div>
        </Card>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length > 0 ? (
          classes.map((cls) => (
            <Card key={cls.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{cls.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {cls.type}
                    </span>
                    {cls.level && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {cls.level}
                      </span>
                    )}
                  </div>
                </div>
                <FontAwesomeIcon 
                  icon={cls.is_active ? faCheckCircle : faTimesCircle}
                  className={`w-5 h-5 ${cls.is_active ? 'text-green-500' : 'text-gray-400'}`}
                />
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {cls.description || t('noDescription')}
              </p>

              {cls.price_colones && (
                <div className="mb-4">
                  <span className="text-lg font-bold text-red-600">
                    ₡{cls.price_colones.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">{t('perMonth')}</span>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => router.push(`/panel/clases/${cls.id}`)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <FontAwesomeIcon icon={faEdit} className="mr-2 w-4 h-4" />
                  {tc('edit')}
                </Button>
                <Button
                  onClick={() => handleDelete(cls.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <FontAwesomeIcon icon={faBook} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noClassesFound')}</h3>
            <p className="text-gray-500 mb-4">{t('getStarted')}</p>
            <Button
              onClick={() => router.push('/panel/clases/new')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              {t('addClass')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
