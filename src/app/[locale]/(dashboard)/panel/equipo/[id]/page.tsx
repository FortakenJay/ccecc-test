"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textArea';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import ImageUpload from '@/components/ImageUpload';

export default function EditTeamMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;
  const t = useTranslations('dashboard.team');
  const tc = useTranslations('dashboard.common');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Team member data
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Translations
  const [nameEn, setNameEn] = useState('');
  const [nameEs, setNameEs] = useState('');
  const [nameZh, setNameZh] = useState('');
  const [roleEn, setRoleEn] = useState('');
  const [roleEs, setRoleEs] = useState('');
  const [roleZh, setRoleZh] = useState('');
  const [bioEn, setBioEn] = useState('');
  const [bioEs, setBioEs] = useState('');
  const [bioZh, setBioZh] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Function to translate position values
  const translatePosition = (positionValue: string) => {
    const positionTranslations = {
      'board': { en: 'Board of Directors', es: 'Junta Directiva', zh: '董事会' },
      'leadership': { en: 'Leadership', es: 'Liderazgo', zh: '领导层' },
      'local_teachers': { en: 'Local Teachers', es: 'Profesores Locales', zh: '本地教师' },
      'volunteer_teachers': { en: 'Volunteer Teachers', es: 'Profesores Voluntarios', zh: '志愿教师' },
      'partner_institutions': { en: 'Partners', es: 'Socios', zh: '合作伙伴' },
      'uncategorized': { en: 'Uncategorized', es: 'Sin categoría', zh: '未分类' }
    };
    return positionTranslations[positionValue as keyof typeof positionTranslations] || { en: '', es: '', zh: '' };
  };

  // Handle position change and update translations
  const handlePositionChange = (newPosition: string) => {
    const translations = translatePosition(newPosition);
    setRoleEn(translations.en);
    setRoleEs(translations.es);
    setRoleZh(translations.zh);
  };

  useEffect(() => {
    fetchTeamMember();
  }, [memberId]);

  const fetchTeamMember = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/equipo/${memberId}`);
      if (!res.ok) throw new Error('Failed to fetch team member');
      
      const { data } = await res.json();
      
      setImageUrl(data.image_url || '');
      setDisplayOrder(data.display_order?.toString() || '');
      setIsActive(data.is_active ?? true);
      
      // Load translations from main response
      if (data.translations && Array.isArray(data.translations)) {
        const en = data.translations.find((t: any) => t.locale === 'en');
        const es = data.translations.find((t: any) => t.locale === 'es');
        const zh = data.translations.find((t: any) => t.locale === 'zh');
        
        if (en) {
          setNameEn(en.name || '');
          setRoleEn(en.role || '');
          setBioEn(en.bio || '');
        }
        if (es) {
          setNameEs(es.name || '');
          setRoleEs(es.role || '');
          setBioEs(es.bio || '');
        }
        if (zh) {
          setNameZh(zh.name || '');
          setRoleZh(zh.role || '');
          setBioZh(zh.bio || '');
        }
      }
    } catch (error) {
      showToast(t('loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameEn || !nameEs || !nameZh) {
      showToast(t('nameRequired'), 'error');
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`/api/equipo/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl || null,
          display_order: displayOrder ? parseInt(displayOrder) : null,
          is_active: isActive,
          translations: {
            en: { name: nameEn, role: roleEn || null, bio: bioEn || null },
            es: { name: nameEs, role: roleEs || null, bio: bioEs || null },
            zh: { name: nameZh, role: roleZh || null, bio: bioZh || null }
          }
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || t('updateError'), 'error');
        return;
      }

      showToast(t('updateSuccess'), 'success');
      setTimeout(() => router.push('/panel/equipo'), 1500);
    } catch (error) {
      showToast(t('updateError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' :
          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white z-50`}>
          {toast.message}
        </div>
      )}
      
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => router.push('/panel/equipo')}
          className="mb-4 cursor-pointer"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          {t('backToTeam')}
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-red-600" />
          {t('editMember')}
        </h1>
        <p className="text-gray-600 mt-2">{t('editSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>{t('teamMemberPhoto')}</Label>
                  <ImageUpload
                    value={imageUrl}
                    onChange={setImageUrl}
                    bucket="team-photos"
                    onError={(error) => error && showToast(error, 'error')}
                    previewHeight="h-32"
                    label="Photo"
                  />
                </div>

                <div>
                  <Label htmlFor="category">{t('position')}</Label>
                  <select
                    id="category"
                    onChange={(e) => handlePositionChange(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">{t('selectCategory')}</option>
                    <option value="board">{t('categoryLabels.board')}</option>
                    <option value="leadership">{t('categoryLabels.leadership')}</option>
                    <option value="local_teachers">{t('categoryLabels.local_teachers')}</option>
                    <option value="volunteer_teachers">{t('categoryLabels.volunteer_teachers')}</option>
                    <option value="partner_institutions">{t('categoryLabels.partner_institutions')}</option>
                    <option value="uncategorized">{t('categoryLabels.uncategorized')}</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="displayOrder">{t('order')}</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('orderHint')}</p>
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
            </CardContent>
          </Card>

          {/* English Translation */}
          <Card>
            <CardHeader>
              <CardTitle>{t('english')} 🇺🇸</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nameEn">{t('name')} *</Label>
                <Input
                  id="nameEn"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder={t('namePlaceholderEn')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="roleEn">{t('position')} (English)</Label>
                <Input
                  id="roleEn"
                  value={roleEn}
                  onChange={(e) => setRoleEn(e.target.value)}
                  placeholder="e.g., Board of Directors, Leadership"
                  className="bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated from category selection above</p>
              </div>
              <div>
                <Label htmlFor="bioEn">{t('bio')}</Label>
                <Textarea
                  id="bioEn"
                  value={bioEn}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBioEn(e.target.value)}
                  placeholder={t('bioPlaceholderEn')}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Spanish Translation */}
          <Card>
            <CardHeader>
              <CardTitle>{t('spanish')} 🇪🇸</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nameEs">{t('name')} *</Label>
                <Input
                  id="nameEs"
                  value={nameEs}
                  onChange={(e) => setNameEs(e.target.value)}
                  placeholder={t('namePlaceholderEs')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="roleEs">{t('position')} (Español)</Label>
                <Input
                  id="roleEs"
                  value={roleEs}
                  onChange={(e) => setRoleEs(e.target.value)}
                  placeholder="ej., Junta Directiva, Liderazgo"
                  className="bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generado desde la selección de categoría arriba</p>
              </div>
              <div>
                <Label htmlFor="bioEs">{t('bio')}</Label>
                <Textarea
                  id="bioEs"
                  value={bioEs}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBioEs(e.target.value)}
                  placeholder={t('bioPlaceholderEs')}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Chinese Translation */}
          <Card>
            <CardHeader>
              <CardTitle>{t('chinese')} 🇨🇳</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nameZh">{t('name')} *</Label>
                <Input
                  id="nameZh"
                  value={nameZh}
                  onChange={(e) => setNameZh(e.target.value)}
                  placeholder={t('namePlaceholderZh')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="roleZh">{t('position')} (中文)</Label>
                <Input
                  id="roleZh"
                  value={roleZh}
                  onChange={(e) => setRoleZh(e.target.value)}
                  placeholder="例如：董事会、领导层"
                  className="bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">从上面的职位选择自动生成</p>
              </div>
              <div>
                <Label htmlFor="bioZh">{t('bio')}</Label>
                <Textarea
                  id="bioZh"
                  value={bioZh}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBioZh(e.target.value)}
                  placeholder={t('bioPlaceholderZh')}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/panel/equipo')}
              disabled={saving}
              className="cursor-pointer"
            >
              {tc('cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={saving}
            >
              {saving ? (
                <>{tc('saving')}</>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  {tc('save')}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
