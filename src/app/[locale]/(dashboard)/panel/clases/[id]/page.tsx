"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textArea';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Class data
  const [type, setType] = useState('');
  const [level, setLevel] = useState('');
  const [slug, setSlug] = useState('');
  const [priceColones, setPriceColones] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Translations
  const [titleEn, setTitleEn] = useState('');
  const [titleEs, setTitleEs] = useState('');
  const [titleZh, setTitleZh] = useState('');
  const [typeEn, setTypeEn] = useState('');
  const [typeEs, setTypeEs] = useState('');
  const [typeZh, setTypeZh] = useState('');
  const [levelEn, setLevelEn] = useState('');
  const [levelEs, setLevelEs] = useState('');
  const [levelZh, setLevelZh] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descEs, setDescEs] = useState('');
  const [descZh, setDescZh] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchClass();
  }, [classId]);

  const fetchClass = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clases/${classId}`);
      if (!res.ok) throw new Error('Failed to fetch class');
      
      const { data } = await res.json();
      
      setType(data.type || '');
      setLevel(data.level || '');
      setSlug(data.slug || '');
      setPriceColones(data.price_colones?.toString() || '');
      setIsActive(data.is_active ?? true);
      
      // Load translations from the class data
      if (data.translations && Array.isArray(data.translations)) {
        const en = data.translations.find((t: any) => t.locale === 'en');
        const es = data.translations.find((t: any) => t.locale === 'es');
        const zh = data.translations.find((t: any) => t.locale === 'zh');
        
        if (en) {
          setTitleEn(en.title || '');
          setTypeEn(en.type || '');
          setLevelEn(en.level || '');
          setDescEn(en.description || '');
        }
        if (es) {
          setTitleEs(es.title || '');
          setTypeEs(es.type || '');
          setLevelEs(es.level || '');
          setDescEs(es.description || '');
        }
        if (zh) {
          setTitleZh(zh.title || '');
          setTypeZh(zh.type || '');
          setLevelZh(zh.level || '');
          setDescZh(zh.description || '');
        }
      }
    } catch (error) {
      showToast('Failed to load class', 'error');
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

      const res = await fetch(`/api/clases/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          level: level || null,
          slug: slug || null,
          price_colones: priceColones ? parseFloat(priceColones) : null,
          is_active: isActive,
          translations: {
            en: { title: titleEn, description: descEn || null, type: typeEn || null, level: levelEn || null },
            es: { title: titleEs, description: descEs || null, type: typeEs || null, level: levelEs || null },
            zh: { title: titleZh, description: descZh || null, type: typeZh || null, level: levelZh || null }
          }
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to update class', 'error');
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
          onClick={() => router.push('/panel/clases')}
          className="mb-4 cursor-pointer"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to Classes
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FontAwesomeIcon icon={faBook} className="w-8 h-8 text-red-600" />
          Edit Class
        </h1>
        <p className="text-gray-600 mt-2">Update class information and translations</p>
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
                  <Label htmlFor="type">Class Type *</Label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="cultural">Cultural</option>
                    <option value="taller">Taller</option>
                    <option value="hsk">HSK</option>
                    <option value="language">Language</option>
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
                    <optgroup label="General Levels">
                      <option value="beginner">Beginner</option>
                      <option value="elementary">Elementary</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="All">All Levels</option>
                    </optgroup>
                    <optgroup label="HSK Levels">
                      <option value="HSK 1">HSK 1</option>
                      <option value="HSK 2">HSK 2</option>
                      <option value="HSK 3">HSK 3</option>
                      <option value="HSK 4">HSK 4</option>
                      <option value="HSK 5">HSK 5</option>
                      <option value="HSK 6">HSK 6</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="e.g., beginner-chinese-class"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from title</p>
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
                <Label htmlFor="typeEn">Class Type (English)</Label>
                <Input
                  id="typeEn"
                  value={typeEn}
                  onChange={(e) => setTypeEn(e.target.value)}
                  placeholder="e.g., Cultural, Workshop, HSK, Language"
                />
                <p className="text-xs text-gray-500 mt-1">Translated class type for English</p>
              </div>
              <div>
                <Label htmlFor="levelEn">Level (English)</Label>
                <Input
                  id="levelEn"
                  value={levelEn}
                  onChange={(e) => setLevelEn(e.target.value)}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                />
                <p className="text-xs text-gray-500 mt-1">Translated level for English</p>
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
                <Label htmlFor="typeEs">Tipo de Clase (Español)</Label>
                <Input
                  id="typeEs"
                  value={typeEs}
                  onChange={(e) => setTypeEs(e.target.value)}
                  placeholder="ej., Cultural, Taller, HSK, Idioma"
                />
                <p className="text-xs text-gray-500 mt-1">Tipo de clase traducido al español</p>
              </div>
              <div>
                <Label htmlFor="levelEs">Nivel (Español)</Label>
                <Input
                  id="levelEs"
                  value={levelEs}
                  onChange={(e) => setLevelEs(e.target.value)}
                  placeholder="ej., Principiante, Intermedio, Avanzado"
                />
                <p className="text-xs text-gray-500 mt-1">Nivel traducido al español</p>
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
                <Label htmlFor="typeZh">课程类型 (中文)</Label>
                <Input
                  id="typeZh"
                  value={typeZh}
                  onChange={(e) => setTypeZh(e.target.value)}
                  placeholder="例如：文化、工作坊、HSK、语言"
                />
                <p className="text-xs text-gray-500 mt-1">中文翻译的课程类型</p>
              </div>
              <div>
                <Label htmlFor="levelZh">级别 (中文)</Label>
                <Input
                  id="levelZh"
                  value={levelZh}
                  onChange={(e) => setLevelZh(e.target.value)}
                  placeholder="例如：初级、中级、高级"
                />
                <p className="text-xs text-gray-500 mt-1">中文翻译的级别</p>
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
