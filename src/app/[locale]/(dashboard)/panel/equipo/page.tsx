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
  faTimesCircle,
  faArrowUp,
  faArrowDown,
  faFilter
} from '@fortawesome/free-solid-svg-icons';

interface TeamMember {
  id: string;
  slug: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  category?: string;
  created_at: string;
  updated_at: string;
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
      
      // Map role to category
      const teamWithCategories = (data.data || []).map((member: TeamMember) => {
        let category = 'uncategorized';
        const role = member.role?.toLowerCase() || '';
        
        if (role.includes('board') || role.includes('董事会') || role.includes('junta')) {
          category = 'board';
        } else if (role.includes('leadership') || role.includes('领导') || role.includes('liderazgo')) {
          category = 'leadership';
        } else if (role.includes('local') || role.includes('本地') || role.includes('locales')) {
          category = 'local_teachers';
        } else if (role.includes('volunteer') || role.includes('志愿') || role.includes('voluntarios')) {
          category = 'volunteer_teachers';
        } else if (role.includes('partner') || role.includes('合作') || role.includes('socios')) {
          category = 'partner_institutions';
        }
        
        return { ...member, category };
      });
      
      setTeam(teamWithCategories);
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

  const handleReorder = async (memberId: string, direction: 'up' | 'down', currentOrder: number, category: string) => {
    const categoryMembers = filteredTeam.filter(m => m.category === category);
    const currentIndex = categoryMembers.findIndex(m => m.id === memberId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= categoryMembers.length) return;

    const targetMember = categoryMembers[targetIndex];

    try {
      await Promise.all([
        fetch(`/api/equipo/${memberId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: targetMember.display_order }),
        }),
        fetch(`/api/equipo/${targetMember.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: currentOrder }),
        }),
      ]);

      fetchTeam();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const categories = [
    { value: 'all', label: t('categoryLabels.all'), color: 'gray' },
    { value: 'board', label: t('categoryLabels.board'), color: 'purple' },
    { value: 'leadership', label: t('categoryLabels.leadership'), color: 'blue' },
    { value: 'local_teachers', label: t('categoryLabels.local_teachers'), color: 'green' },
    { value: 'volunteer_teachers', label: t('categoryLabels.volunteer_teachers'), color: 'yellow' },
    { value: 'partner_institutions', label: t('categoryLabels.partner_institutions'), color: 'pink' },
  ];

  const filteredTeam = selectedCategory === 'all' 
    ? team 
    : team.filter(m => m.category === selectedCategory);

  const groupedTeam = filteredTeam.reduce((acc: any, member: any) => {
    const category = member.category || 'uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(member);
    return acc;
  }, {});

  Object.keys(groupedTeam).forEach(category => {
    groupedTeam[category].sort((a: any, b: any) => 
      (a.display_order || 0) - (b.display_order || 0)
    );
  });

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
          className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
        <Card className="p-4">
          <div className="text-sm text-gray-600">{t('categories')}</div>
          <div className="text-2xl font-bold text-blue-600">
            {Object.keys(groupedTeam).length}
          </div>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{t('filterByCategory')}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-[#C8102E] text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team Grid by Category */}
      {Object.keys(groupedTeam).length === 0 ? (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faUserTie} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noMembersFound')}</h3>
          <p className="text-gray-500 mb-4">{t('getStarted')}</p>
          <Button
            onClick={() => router.push('/panel/equipo/new')}
            className="bg-red-600 hover:bg-red-700 text-white">
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            {t('addMember')}
          </Button>
        </div>
      ) : (
        Object.entries(groupedTeam).map(([category, members]: [string, any]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="capitalize">{t(`categoryLabels.${category}` as any) || category.replace(/_/g, ' ')}</span>
              <span className="text-sm font-normal text-gray-500">
                ({members.length} {members.length !== 1 ? t('members') : t('member')})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {members.map((member: any, index: number) => (
                <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {member.image_url ? (
                      <div className="h-48 bg-gray-200 overflow-hidden">
                        <img 
                          src={member.image_url} 
                          alt={member.slug}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <FontAwesomeIcon icon={faUserTie} className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    {!member.is_active && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md">
                        {t('inactive')}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {member.name || member.slug}
                      </h3>
                      {member.role && (
                        <p className="text-sm text-red-600 font-medium">{member.role}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">{t('orderLabel')} {member.display_order}</span>
                        {member.category && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {t(`categoryLabels.${member.category}` as any) || member.category.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {member.bio && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {member.bio}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 mb-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleReorder(member.id, 'up', member.display_order, category)}
                          disabled={index === 0}
                          title={t('moveUp')}
                          className="cursor-pointer p-1.5 text-gray-600 hover:text-[#C8102E] hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed">
                          <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleReorder(member.id, 'down', member.display_order, category)}
                          disabled={index === members.length - 1}
                          title={t('moveDown')}
                          className="cursor-pointer p-1.5 text-gray-600 hover:text-[#C8102E] hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed">
                          <FontAwesomeIcon icon={faArrowDown} className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => toggleActive(member.id, member.is_active)}
                        className={`cursor-pointer px-2 py-1 rounded text-xs font-medium transition-colors ${
                          member.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}>
                        <FontAwesomeIcon 
                          icon={member.is_active ? faCheckCircle : faTimesCircle}
                          className="mr-1 w-3 h-3"
                        />
                        {member.is_active ? tc('active') : t('inactive')}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/panel/equipo/${member.id}`)}
                        variant="outline"
                        size="sm"
                        className="cursor-pointer flex-1 text-xs">
                        <FontAwesomeIcon icon={faEdit} className="mr-1 w-3 h-3" />
                        {tc('edit')}
                      </Button>
                      <Button
                        onClick={() => handleDelete(member.id)}
                        variant="outline"
                        size="sm"
                        className="cursor-pointer text-red-600 hover:text-red-700 hover:border-red-300 text-xs">
                        <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
