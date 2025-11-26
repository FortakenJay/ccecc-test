"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRole } from '@/lib/hooks/useRole';
import { useClasses } from '@/lib/hooks/useClasses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textArea';
import { Toast, useToast } from '@/components/ui/toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isOfficer, loading: roleLoading } = useRole();
  const { getClass, updateClass } = useClasses();
  const { toast, showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Class data
  const [type, setType] = useState('');
  const [level, setLevel] = useState('');
  const [priceColones, setPriceColones] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Translations
  const [titleEn, setTitleEn] = useState('');
  const [titleEs, setTitleEs] = useState('');
  const [titleZh, setTitleZh] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descEs, setDescEs] = useState('');
  const [descZh, setDescZh] = useState('');

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner && !isOfficer)) {
      router.push('/');
      return;
    }
    
    loadClass();
  }, [user, isAdmin, isOwner, isOfficer, authLoading, roleLoading, id]);

  const loadClass = async () => {
    try {
      setLoading(true);
      const { data, error } = await getClass(id);
      
      if (error || !data) {
        showToast(error || 'Failed to load class', 'error');
        setTimeout(() => router.push('/panel/clases'), 2000);
        return;
      }

      // Set basic data
      setType(data.type || '');
      setLevel(data.level || '');
      setPriceColones(data.price_colones?.toString() || '');
      setIsActive(data.is_active ?? true);

      // Set translations
      if (data.translations && Array.isArray(data.translations)) {
        const enTrans = data.translations.find((t: any) => t.locale === 'en');
        const esTrans = data.translations.find((t: any) => t.locale === 'es');
        const zhTrans = data.translations.find((t: any) => t.locale === 'zh');

        if (enTrans) {
          setTitleEn(enTrans.title || '');
          setDescEn(enTrans.description || '');
        }
        if (esTrans) {
          setTitleEs(esTrans.title || '');
          setDescEs(esTrans.description || '');
        }
        if (zhTrans) {
          setTitleZh(zhTrans.title || '');
          setDescZh(zhTrans.description || '');
        }
      }
    } catch (error) {
      showToast('Failed to load class', 'error');
      setTimeout(() => router.push('/panel/clases'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleEn || !titleEs || !titleZh) {
      showToast('Please provide titles in all languages', 'error');
      return;
    }

    if (!type) {
      showToast('Please select a class type', 'error');
      return;
    }

    try {
      setSaving(true);

      const classData = {
        type,
        level: level || null,
        price_colones: priceColones ? parseFloat(priceColones) : null,
        is_active: isActive,
      };

      const translations = {
        en: { title: titleEn, description: descEn || undefined },
        es: { title: titleEs, description: descEs || undefined },
        zh: { title: titleZh, description: descZh || undefined }
      };

      const { data, error } = await updateClass(id, classData, translations);

      if (error) {
        showToast(error, 'error');
        return;
      }

      showToast('Class updated successfully!', 'success');
      setTimeout(() => router.push('/panel/clases'), 1500);
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user || (!isAdmin && !isOwner && !isOfficer)) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {toast && (
        <Toast message={toast.message} type={toast.type} />
      )}
      
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => router.push('/panel/clases')}
          className="mb-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to Classes
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FontAwesomeIcon icon={faBook} className="w-8 h-8 text-red-600" />
          Edit Class
        </h1>
        <p className="text-gray-600 mt-2">Update class information with multilingual support</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">Class Type *</Label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="group">Group Class</option>
                    <option value="private">Private Class</option>
                    <option value="online">Online Class</option>
                    <option value="intensive">Intensive Course</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="level">Level</Label>
                  <select
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select level</option>
                    <option value="beginner">Beginner</option>
                    <option value="elementary">Elementary</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="price">Price (Colones)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={priceColones}
                    onChange={(e) => setPriceColones(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
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
                <Label htmlFor="titleEn">Title *</Label>
                <Input
                  id="titleEn"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Class title in English"
                  required
                />
              </div>
              <div>
                <Label htmlFor="descEn">Description</Label>
                <Textarea
                  id="descEn"
                  value={descEn}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescEn(e.target.value)}
                  placeholder="Class description in English"
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
                <Label htmlFor="titleEs">Título *</Label>
                <Input
                  id="titleEs"
                  value={titleEs}
                  onChange={(e) => setTitleEs(e.target.value)}
                  placeholder="Título de la clase en español"
                  required
                />
              </div>
              <div>
                <Label htmlFor="descEs">Descripción</Label>
                <Textarea
                  id="descEs"
                  value={descEs}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescEs(e.target.value)}
                  placeholder="Descripción de la clase en español"
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
                <Label htmlFor="titleZh">标题 *</Label>
                <Input
                  id="titleZh"
                  value={titleZh}
                  onChange={(e) => setTitleZh(e.target.value)}
                  placeholder="中文课程标题"
                  required
                />
              </div>
              <div>
                <Label htmlFor="descZh">描述</Label>
                <Textarea
                  id="descZh"
                  value={descZh}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescZh(e.target.value)}
                  placeholder="中文课程描述"
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
              onClick={() => router.push('/panel/clases')}
              disabled={saving}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
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
