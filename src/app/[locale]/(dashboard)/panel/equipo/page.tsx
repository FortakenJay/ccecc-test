"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRole } from '@/lib/hooks/useRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserTie, 
  faPlus, 
  faEdit, 
  faTrash,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

interface TeamMember {
  id: string;
  slug: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Translated fields (from team_member_translations)
  name?: string;
  role?: string;
  bio?: string;
}

export default function EquipoPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('dashboard.team');
  const tc = useTranslations('dashboard.common');
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isOfficer, loading: roleLoading } = useRole();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner && !isOfficer)) {
      router.push('/');
      return;
    }
    fetchTeam();
  }, [user, isAdmin, isOwner, authLoading, roleLoading, locale]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/equipo?locale=${locale}`);
      if (!res.ok) throw new Error('Failed to fetch team members');
      const data = await res.json();
      setTeam(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const res = await fetch(`/api/equipo/${memberId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete team member');
      
      fetchTeam();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleActive = async (memberId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/equipo/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      
      fetchTeam();
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
            <FontAwesomeIcon icon={faUserTie} className="w-8 h-8 text-red-600" />
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>
        <Button
          onClick={() => router.push('/panel/equipo/new')}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          {t('addMember')}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('totalMembers')}</div>
          <div className="text-2xl font-bold text-gray-900">{team.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">{tc('active')}</div>
          <div className="text-2xl font-bold text-green-600">
            {team.filter(m => m.is_active).length}
          </div>
        </Card>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.length > 0 ? (
          team.map((member) => (
            <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {member.image_url && (
                <div className="h-64 bg-gray-200 overflow-hidden">
                  <img 
                    src={member.image_url} 
                    alt={member.slug}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {member.name || member.slug}
                    </h3>
                    {member.role && (
                      <p className="text-sm text-red-600 font-medium mb-2">{member.role}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {t('order')}: {member.display_order}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleActive(member.id, member.is_active)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      member.is_active 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <FontAwesomeIcon 
                      icon={member.is_active ? faCheckCircle : faTimesCircle}
                      className="mr-1 w-3 h-3"
                    />
                    {member.is_active ? tc('active') : tc('inactive')}
                  </button>
                </div>

                {member.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {member.bio}
                  </p>
                )}

                <div className="text-xs text-gray-500 mb-4">
                  {t('created')}: {new Date(member.created_at).toLocaleDateString()}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => router.push(`/panel/equipo/${member.id}`)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-2 w-4 h-4" />
                    {tc('edit')}
                  </Button>
                  <Button
                    onClick={() => handleDelete(member.id)}
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
            <FontAwesomeIcon icon={faUserTie} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noMembersFound')}</h3>
            <p className="text-gray-500 mb-4">{t('getStarted')}</p>
            <Button
              onClick={() => router.push('/panel/equipo/new')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              {t('addMember')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
