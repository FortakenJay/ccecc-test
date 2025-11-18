"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textArea';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';

export default function EditTeamMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Team member data
  const [photoUrl, setPhotoUrl] = useState('');
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

  useEffect(() => {
    fetchTeamMember();
  }, [memberId]);

  const fetchTeamMember = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/equipo/${memberId}`);
      if (!res.ok) throw new Error('Failed to fetch team member');
      
      const { data } = await res.json();
      
      setPhotoUrl(data.photo_url || '');
      setDisplayOrder(data.display_order?.toString() || '');
      setIsActive(data.is_active ?? true);
      
      // Load translations
      const transRes = await fetch(`/api/equipo/${memberId}/translations`);
      if (transRes.ok) {
        const { data: translations } = await transRes.json();
        const en = translations.find((t: any) => t.language === 'en');
        const es = translations.find((t: any) => t.language === 'es');
        const zh = translations.find((t: any) => t.language === 'zh');
        
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
      showToast('Failed to load team member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameEn || !nameEs || !nameZh) {
      showToast('Please provide names in all languages', 'error');
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`/api/equipo/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: photoUrl || null,
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
        showToast(data.error || 'Failed to update team member', 'error');
        return;
      }

      showToast('Team member updated successfully!', 'success');
      setTimeout(() => router.push('/panel/equipo'), 1500);
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
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
          className="mb-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to Team
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-red-600" />
          Edit Team Member
        </h1>
        <p className="text-gray-600 mt-2">Update team member information and translations</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="photoUrl">Photo URL</Label>
                  <Input
                    id="photoUrl"
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
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
                <Label htmlFor="isActive" className="mb-0">Active (visible on website)</Label>
              </div>
            </CardContent>
          </Card>

          {/* English Translation */}
          <Card>
            <CardHeader>
              <CardTitle>English 🇺🇸</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nameEn">Name *</Label>
                <Input
                  id="nameEn"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Full name in English"
                  required
                />
              </div>
              <div>
                <Label htmlFor="roleEn">Role/Title</Label>
                <Input
                  id="roleEn"
                  value={roleEn}
                  onChange={(e) => setRoleEn(e.target.value)}
                  placeholder="e.g., Director, Teacher"
                />
              </div>
              <div>
                <Label htmlFor="bioEn">Bio</Label>
                <Textarea
                  id="bioEn"
                  value={bioEn}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBioEn(e.target.value)}
                  placeholder="Short biography in English"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Spanish Translation */}
          <Card>
            <CardHeader>
              <CardTitle>Español 🇪🇸</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nameEs">Nombre *</Label>
                <Input
                  id="nameEs"
                  value={nameEs}
                  onChange={(e) => setNameEs(e.target.value)}
                  placeholder="Nombre completo en español"
                  required
                />
              </div>
              <div>
                <Label htmlFor="roleEs">Cargo/Título</Label>
                <Input
                  id="roleEs"
                  value={roleEs}
                  onChange={(e) => setRoleEs(e.target.value)}
                  placeholder="ej., Director, Profesor"
                />
              </div>
              <div>
                <Label htmlFor="bioEs">Biografía</Label>
                <Textarea
                  id="bioEs"
                  value={bioEs}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBioEs(e.target.value)}
                  placeholder="Biografía breve en español"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Chinese Translation */}
          <Card>
            <CardHeader>
              <CardTitle>中文 🇨🇳</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nameZh">姓名 *</Label>
                <Input
                  id="nameZh"
                  value={nameZh}
                  onChange={(e) => setNameZh(e.target.value)}
                  placeholder="中文全名"
                  required
                />
              </div>
              <div>
                <Label htmlFor="roleZh">职位</Label>
                <Input
                  id="roleZh"
                  value={roleZh}
                  onChange={(e) => setRoleZh(e.target.value)}
                  placeholder="例如：主任、教师"
                />
              </div>
              <div>
                <Label htmlFor="bioZh">简介</Label>
                <Textarea
                  id="bioZh"
                  value={bioZh}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBioZh(e.target.value)}
                  placeholder="中文简短介绍"
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={saving}
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
