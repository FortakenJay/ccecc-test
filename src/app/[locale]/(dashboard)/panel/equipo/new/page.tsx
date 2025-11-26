"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textArea';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import ImageUpload from '@/components/ImageUpload';

export default function NewTeamMemberPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.team');
  const tc = useTranslations('dashboard.common');
  
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Team member data
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!slug.trim()) {
      showToast(t('slugRequired'), 'error');
      return;
    }

    if (!nameEn || !nameEs || !nameZh) {
      showToast(t('nameRequired'), 'error');
      return;
    }

    try {
      setSaving(true);

      const res = await fetch('/api/equipo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug.trim(),
          image_url: imageUrl || null,
          display_order: displayOrder ? parseInt(displayOrder) : null,
          translations: {
            en: { name: nameEn, role: roleEn || null, bio: bioEn || null },
            es: { name: nameEs, role: roleEs || null, bio: bioEs || null },
            zh: { name: nameZh, role: roleZh || null, bio: bioZh || null }
          }
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || t('createError'), 'error');
        return;
      }

      showToast(t('createSuccess'), 'success');
      setTimeout(() => router.push('/panel/equipo'), 1500);
    } catch (error) {
      showToast(t('createError'), 'error');
    } finally {
      setSaving(false);
    }
  };

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
          {t('addMember')}
        </h1>
        <p className="text-gray-600 mt-2">{t('newSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slug">{t('slug')} *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="john-doe"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{t('slugHint')}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Team Member Photo</Label>
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
                <Label htmlFor="roleEn">{t('position')}</Label>
                <select
                  id="roleEn"
                  value={roleEn}
                  onChange={(e) => setRoleEn(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Select position</option>
                  <option value="Board of Directors">Board of Directors</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Local Teachers">Local Teachers</option>
                  <option value="Volunteer Teachers">Volunteer Teachers</option>
                  <option value="Partners">Partners</option>
                </select>
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
                <Label htmlFor="roleEs">{t('position')}</Label>
                <select
                  id="roleEs"
                  value={roleEs}
                  onChange={(e) => setRoleEs(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Seleccionar posición</option>
                  <option value="Junta Directiva">Junta Directiva</option>
                  <option value="Liderazgo">Liderazgo</option>
                  <option value="Profesores Locales">Profesores Locales</option>
                  <option value="Profesores Voluntarios">Profesores Voluntarios</option>
                  <option value="Socios">Socios</option>
                </select>
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
                <Label htmlFor="roleZh">{t('position')}</Label>
                <select
                  id="roleZh"
                  value={roleZh}
                  onChange={(e) => setRoleZh(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">选择职位</option>
                  <option value="董事会">董事会</option>
                  <option value="领导层">领导层</option>
                  <option value="本地教师">本地教师</option>
                  <option value="志愿教师">志愿教师</option>
                  <option value="合作伙伴">合作伙伴</option>
                </select>
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
                <>{tc('creating')}</>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  {tc('create')}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
