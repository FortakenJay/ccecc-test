"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textArea';
import { Toast, useToast } from '@/components/ui/toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import en from '@/locales/en/dashboard';
import es from '@/locales/es/dashboard';
import zh from '@/locales/zh/dashboard';

const translations = { en, es, zh };

export default function NewClassPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const t = translations[locale as keyof typeof translations];
  const { toast, showToast } = useToast();
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleEn || !titleEs || !titleZh) {
      showToast(t.classes.new.provideTitles, 'error');
      return;
    }

    if (!type) {
      showToast(t.classes.new.selectClassType, 'error');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch('/api/clases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          level: level || null,
          price_colones: priceColones ? parseFloat(priceColones) : null,
          is_active: isActive,
          translations: {
            en: { title: titleEn, description: descEn || null },
            es: { title: titleEs, description: descEs || null },
            zh: { title: titleZh, description: descZh || null }
          }
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || t.classes.new.createError, 'error');
        return;
      }

      showToast(t.classes.new.createSuccess, 'success');
      setTimeout(() => router.push(`/${locale}/panel/clases`), 1500);
    } catch (error) {
      showToast(t.classes.new.genericError, 'error');
    } finally {
      setLoading(false);
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
          onClick={() => router.push(`/${locale}/panel/clases`)}
          className="mb-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          {t.classes.new.backToClasses}
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FontAwesomeIcon icon={faBook} className="w-8 h-8 text-red-600" />
          {t.classes.new.title}
        </h1>
        <p className="text-gray-600 mt-2">{t.classes.new.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t.classes.new.basicInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">{t.classes.new.classType} *</Label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">{t.classes.new.selectType}</option>
                    <option value="group">{t.classes.new.types.group}</option>
                    <option value="private">{t.classes.new.types.private}</option>
                    <option value="online">{t.classes.new.types.online}</option>
                    <option value="intensive">{t.classes.new.types.intensive}</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="level">{t.classes.level}</Label>
                  <select
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">{t.classes.new.selectLevel}</option>
                    <option value="beginner">{t.classes.levels.beginner}</option>
                    <option value="elementary">{t.classes.levels.elementary}</option>
                    <option value="intermediate">{t.classes.levels.intermediate}</option>
                    <option value="advanced">{t.classes.levels.advanced}</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="price">{t.classes.new.priceColones}</Label>
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
                <Label htmlFor="isActive" className="mb-0">{t.classes.new.isActive}</Label>
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
                <Label htmlFor="titleEn">{t.classes.new.titleLabel} *</Label>
                <Input
                  id="titleEn"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder={t.classes.new.titlePlaceholder}
                  required
                />
              </div>
              <div>
                <Label htmlFor="descEn">{t.classes.new.descriptionLabel}</Label>
                <Textarea
                  id="descEn"
                  value={descEn}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescEn(e.target.value)}
                  placeholder={t.classes.new.descriptionPlaceholder}
                  rows={4}
                />
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
                <Label htmlFor="descEs">{t.classes.new.descriptionLabelEs}</Label>
                <Textarea
                  id="descEs"
                  value={descEs}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescEs(e.target.value)}
                  placeholder={t.classes.new.descriptionPlaceholderEs}
                  rows={4}
                />
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
                <Label htmlFor="descZh">{t.classes.new.descriptionLabelZh}</Label>
                <Textarea
                  id="descZh"
                  value={descZh}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescZh(e.target.value)}
                  placeholder={t.classes.new.descriptionPlaceholderZh}
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
              onClick={() => router.push(`/${locale}/panel/clases`)}
              disabled={loading}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>{t.classes.new.creating}</>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  {t.classes.new.createButton}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
