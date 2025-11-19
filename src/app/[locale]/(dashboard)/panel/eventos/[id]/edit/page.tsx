"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRole } from '@/lib/hooks/useRole';
import { useEvents } from '@/lib/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textArea';
import { Toast, useToast } from '@/components/ui/toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import en from '@/locales/en/dashboard';
import es from '@/locales/es/dashboard';
import zh from '@/locales/zh/dashboard';

const translations = { en, es, zh };

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const t = translations[locale as keyof typeof translations];
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isOfficer, loading: roleLoading } = useRole();
  const { getEvent, updateEvent } = useEvents();
  const { toast, showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Event data
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
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
      router.push(`/${locale}`);
      return;
    }
    
    loadEvent();
  }, [user, isAdmin, isOwner, isOfficer, authLoading, roleLoading, id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const { data, error } = await getEvent(id);
      
      if (error || !data) {
        showToast(error || t.events.edit.failedToLoad, 'error');
        setTimeout(() => router.push(`/${locale}/panel/eventos`), 2000);
        return;
      }

      // Set basic data
      if (data.event_date) {
        // Convert ISO string to datetime-local format
        const date = new Date(data.event_date);
        const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setEventDate(localDateTime);
      }
      setLocation(data.location || '');
      setImageUrl(data.image_url || '');
      setMaxAttendees(data.max_attendees?.toString() || '');
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
      showToast(t.events.edit.failedToLoad, 'error');
      setTimeout(() => router.push(`/${locale}/panel/eventos`), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleEn || !titleEs || !titleZh) {
      showToast(t.events.new.provideTitles, 'error');
      return;
    }

    if (!eventDate) {
      showToast(t.events.new.selectEventDate, 'error');
      return;
    }

    try {
      setSaving(true);

      const eventData = {
        event_date: eventDate,
        location: location || undefined,
        image_url: imageUrl || undefined,
        max_attendees: maxAttendees ? parseInt(maxAttendees) : undefined,
        is_active: isActive,
      };

      const translations = {
        en: { title: titleEn, description: descEn || undefined },
        es: { title: titleEs, description: descEs || undefined },
        zh: { title: titleZh, description: descZh || undefined }
      };

      const { data, error } = await updateEvent(id, eventData, translations);

      if (error) {
        showToast(error, 'error');
        return;
      }

      showToast(t.events.edit.updateSuccess, 'success');
      setTimeout(() => router.push(`/${locale}/panel/eventos`), 1500);
    } catch (error) {
      showToast(t.events.new.genericError, 'error');
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
          onClick={() => router.push(`/${locale}/panel/eventos`)}
          className="mb-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          {t.events.new.backToEvents}
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FontAwesomeIcon icon={faCalendar} className="w-8 h-8 text-red-600" />
          {t.events.edit.title}
        </h1>
        <p className="text-gray-600 mt-2">{t.events.edit.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t.events.new.eventDetails}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventDate">{t.events.new.eventDateTime} *</Label>
                  <Input
                    id="eventDate"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="location">{t.events.new.locationLabel}</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t.events.new.locationPlaceholder}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="imageUrl">{t.events.new.imageUrlLabel}</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder={t.events.new.imageUrlPlaceholder}
                  />
                </div>

                <div>
                  <Label htmlFor="maxAttendees">{t.events.new.maxAttendees}</Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(e.target.value)}
                    placeholder={t.events.new.maxAttendeesPlaceholder}
                    min="1"
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
                <Label htmlFor="isActive" className="mb-0">{t.events.new.isActive}</Label>
              </div>
            </CardContent>
          </Card>

          {/* English Translation */}
          <Card>
            <CardHeader>
              <CardTitle>{t.events.new.english} 🇺🇸</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titleEn">{t.events.new.titleLabel} *</Label>
                <Input
                  id="titleEn"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder={t.events.new.titlePlaceholder}
                  required
                />
              </div>
              <div>
                <Label htmlFor="descEn">{t.events.new.descriptionLabel}</Label>
                <Textarea
                  id="descEn"
                  value={descEn}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescEn(e.target.value)}
                  placeholder={t.events.new.descriptionPlaceholder}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Spanish Translation */}
          <Card>
            <CardHeader>
              <CardTitle>{t.events.new.spanish} 🇪🇸</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titleEs">{t.events.new.titleLabelEs} *</Label>
                <Input
                  id="titleEs"
                  value={titleEs}
                  onChange={(e) => setTitleEs(e.target.value)}
                  placeholder={t.events.new.titlePlaceholderEs}
                  required
                />
              </div>
              <div>
                <Label htmlFor="descEs">{t.events.new.descriptionLabelEs}</Label>
                <Textarea
                  id="descEs"
                  value={descEs}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescEs(e.target.value)}
                  placeholder={t.events.new.descriptionPlaceholderEs}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Chinese Translation */}
          <Card>
            <CardHeader>
              <CardTitle>{t.events.new.chinese} 🇨🇳</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titleZh">{t.events.new.titleLabelZh} *</Label>
                <Input
                  id="titleZh"
                  value={titleZh}
                  onChange={(e) => setTitleZh(e.target.value)}
                  placeholder={t.events.new.titlePlaceholderZh}
                  required
                />
              </div>
              <div>
                <Label htmlFor="descZh">{t.events.new.descriptionLabelZh}</Label>
                <Textarea
                  id="descZh"
                  value={descZh}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescZh(e.target.value)}
                  placeholder={t.events.new.descriptionPlaceholderZh}
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
              onClick={() => router.push(`/${locale}/panel/eventos`)}
              disabled={saving}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={saving}
            >
              {saving ? (
                <>{t.events.edit.saving}</>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  {t.events.edit.saveChanges}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
