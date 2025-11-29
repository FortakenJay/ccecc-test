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
import en from '@/locales/en/dashboard';
import es from '@/locales/es/dashboard';
import zh from '@/locales/zh/dashboard';

const translations = { en, es, zh };

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;
  const locale = (params.locale as string) || 'en';
  const t = translations[locale as keyof typeof translations];
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Class data
  const [type, setType] = useState('');
  const [level, setLevel] = useState('');
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


  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Function to translate level values
  const translateLevel = (levelValue: string) => {
    const levelTranslations = {
      'beginner': { en: 'Beginner', es: 'Principiante', zh: '初级' },
      'elementary': { en: 'Elementary', es: 'Elemental', zh: '基础' },
      'intermediate': { en: 'Intermediate', es: 'Intermedio', zh: '中级' },
      'advanced': { en: 'Advanced', es: 'Avanzado', zh: '高级' },
      'All': { en: 'All Levels', es: 'Todos los Niveles', zh: '所有级别' },
      'HSK 1': { en: 'HSK 1', es: 'HSK 1', zh: 'HSK 1' },
      'HSK 2': { en: 'HSK 2', es: 'HSK 2', zh: 'HSK 2' },
      'HSK 3': { en: 'HSK 3', es: 'HSK 3', zh: 'HSK 3' },
      'HSK 4': { en: 'HSK 4', es: 'HSK 4', zh: 'HSK 4' },
      'HSK 5': { en: 'HSK 5', es: 'HSK 5', zh: 'HSK 5' },
      'HSK 6': { en: 'HSK 6', es: 'HSK 6', zh: 'HSK 6' }
    };
    return levelTranslations[levelValue as keyof typeof levelTranslations] || { en: '', es: '', zh: '' };
  };

  // Function to translate type/category values
  const translateType = (typeValue: string) => {
    const typeTranslations = {
      'hsk': { en: 'HSK Courses', es: 'Cursos HSK', zh: 'HSK课程' },
      'language': { en: 'Chinese Language Classes', es: 'Clases de Idioma Chino', zh: '中文语言课程' },
      'cultural': { en: 'Cultural Classes', es: 'Clases Culturales', zh: '文化课程' },
      'talleres': { en: 'Workshops', es: 'Talleres', zh: '工作坊' }
    };
    return typeTranslations[typeValue as keyof typeof typeTranslations] || { en: '', es: '', zh: '' };
  };

  // Handle level change and update translations
  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
    const translations = translateLevel(newLevel);
    setLevelEn(translations.en);
    setLevelEs(translations.es);
    setLevelZh(translations.zh);
  };

  // Handle type change and update translations
  const handleTypeChange = (newType: string) => {
    setType(newType);
    const translations = translateType(newType);
    setTypeEn(translations.en);
    setTypeEs(translations.es);
    setTypeZh(translations.zh);
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
        }
        if (es) {
          setTitleEs(es.title || '');
          setTypeEs(es.type || '');
          setLevelEs(es.level || '');
        }
        if (zh) {
          setTitleZh(zh.title || '');
          setTypeZh(zh.type || '');
          setLevelZh(zh.level || '');
        }
      }
    } catch (error) {
      showToast(t.classes.edit.failedToLoad, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleEn || !titleEs || !titleZh) {
      showToast(t.classes.edit.titleRequired, 'error');
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`/api/clases/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type || null,
          level: level || null,
          price_colones: priceColones ? parseFloat(priceColones) : null,
          is_active: isActive,
          translations: {
            en: { title: titleEn, type: typeEn || null, level: levelEn || null },
            es: { title: titleEs, type: typeEs || null, level: levelEs || null },
            zh: { title: titleZh, type: typeZh || null, level: levelZh || null }
          }
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || t.classes.edit.updateError, 'error');
        return;
      }

      showToast(t.classes.edit.updateSuccess, 'success');
      setTimeout(() => router.push('/panel/clases'), 1500);
    } catch (error) {
      showToast(t.classes.new.genericError, 'error');
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
          {t.classes.edit.backToClasses}
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FontAwesomeIcon icon={faBook} className="w-8 h-8 text-red-600" />
          {t.classes.edit.title}
        </h1>
        <p className="text-gray-600 mt-2">{t.classes.edit.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t.classes.new.basicInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="type">{t.classes.new.classType}</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">{t.classes.new.selectType}</option>
                  <option value="hsk">{t.classes.new.types.hsk}</option>
                  <option value="language">{t.classes.new.types.language}</option>
                  <option value="cultural">{t.classes.new.types.cultural}</option>
                  <option value="talleres">{t.classes.new.types.talleres}</option>
                </select>
              </div>

              <div>
                <Label htmlFor="level">{t.classes.level}</Label>
                <select
                  id="level"
                  value={level}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">{t.classes.new.selectLevel}</option>
                  <optgroup label={locale === 'en' ? 'General Levels' : locale === 'es' ? 'Niveles Generales' : '常规级别'}>
                    <option value="beginner">{t.classes.levels.beginner}</option>
                    <option value="elementary">{t.classes.levels.elementary}</option>
                    <option value="intermediate">{t.classes.levels.intermediate}</option>
                    <option value="advanced">{t.classes.levels.advanced}</option>
                    <option value="All">{t.classes.levels.All}</option>
                  </optgroup>
                  <optgroup label={locale === 'en' ? 'HSK Levels' : locale === 'es' ? 'Niveles HSK' : 'HSK级别'}>
                    <option value="HSK 1">HSK 1</option>
                    <option value="HSK 2">HSK 2</option>
                    <option value="HSK 3">HSK 3</option>
                    <option value="HSK 4">HSK 4</option>
                    <option value="HSK 5">HSK 5</option>
                    <option value="HSK 6">HSK 6</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <Label htmlFor="price">{t.classes.edit.priceLabel}</Label>
                <Input
                  id="price"
                  type="number"
                  value={priceColones}
                  onChange={(e) => setPriceColones(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="max-w-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <Label htmlFor="isActive" className="mb-0">{t.classes.edit.activeLabel}</Label>
              </div>
            </CardContent>
          </Card>

          {/* English Translation */}
          <Card>
            <CardHeader>
              <CardTitle>{t.classes.new.english} 🇺🇸</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titleEn">{t.classes.edit.titleLabel} *</Label>
                <Input
                  id="titleEn"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder={t.classes.new.titlePlaceholder}
                  required
                />
              </div>
              <div>
                <Label htmlFor="typeEn">{t.classes.edit.categoryEnglish}</Label>
                <Input
                  id="typeEn"
                  value={typeEn}
                  onChange={(e) => setTypeEn(e.target.value)}
                  placeholder="e.g., HSK Courses, Chinese Language Classes"
                  className="bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">{t.classes.edit.autoGenerated}</p>
              </div>
              <div>
                <Label htmlFor="levelEn">{t.classes.edit.levelEnglish}</Label>
                <Input
                  id="levelEn"
                  value={levelEn}
                  onChange={(e) => setLevelEn(e.target.value)}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                  className="bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">{t.classes.edit.autoGeneratedLevel}</p>
              </div>
            </CardContent>
          </Card>

          {/* Spanish Translation */}
          <Card>
            <CardHeader>
              <CardTitle>{t.classes.new.spanish} 🇪🇸</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titleEs">{t.classes.new.titleLabelEs} *</Label>
                <Input
                  id="titleEs"
                  value={titleEs}
                  onChange={(e) => setTitleEs(e.target.value)}
                  placeholder={t.classes.new.titlePlaceholderEs}
                  required
                />
              </div>
              <div>
                <Label htmlFor="typeEs">{t.classes.edit.categorySpanish}</Label>
                <Input
                  id="typeEs"
                  value={typeEs}
                  onChange={(e) => setTypeEs(e.target.value)}
                  placeholder="ej., Cursos HSK, Clases de Idioma Chino"
                  className="bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">{t.classes.edit.autoGenerated}</p>
              </div>
              <div>
                <Label htmlFor="levelEs">{t.classes.edit.levelSpanish}</Label>
                <Input
                  id="levelEs"
                  value={levelEs}
                  onChange={(e) => setLevelEs(e.target.value)}
                  placeholder="ej., Principiante, Intermedio, Avanzado"
                  className="bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">{t.classes.edit.autoGeneratedLevel}</p>
              </div>
            </CardContent>
          </Card>

          {/* Chinese Translation */}
          <Card>
            <CardHeader>
              <CardTitle>{t.classes.new.chinese} 🇨🇳</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titleZh">{t.classes.new.titleLabelZh} *</Label>
                <Input
                  id="titleZh"
                  value={titleZh}
                  onChange={(e) => setTitleZh(e.target.value)}
                  placeholder={t.classes.new.titlePlaceholderZh}
                  required
                />
              </div>
              <div>
                <Label htmlFor="typeZh">{t.classes.edit.categoryChinese}</Label>
                <Input
                  id="typeZh"
                  value={typeZh}
                  onChange={(e) => setTypeZh(e.target.value)}
                  placeholder="例如：HSK课程、中文语言课程"
                  className="bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">{t.classes.edit.autoGenerated}</p>
              </div>
              <div>
                <Label htmlFor="levelZh">{t.classes.edit.levelChinese}</Label>
                <Input
                  id="levelZh"
                  value={levelZh}
                  onChange={(e) => setLevelZh(e.target.value)}
                  placeholder="例如：初级、中级、高级"
                  className="bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">{t.classes.edit.autoGeneratedLevel}</p>
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
              {t.classes.edit.cancel}
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={saving}
            >
              {saving ? (
                <>{t.classes.edit.saving}</>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  {t.classes.edit.saveChanges}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
