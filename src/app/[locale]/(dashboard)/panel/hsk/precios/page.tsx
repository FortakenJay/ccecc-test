"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRole } from '@/lib/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDollarSign, 
  faPlus, 
  faEdit,
  faTrash,
  faSave,
  faAward
} from '@fortawesome/free-solid-svg-icons';

interface Translation {
  locale: string;
  description: string;
}

interface Pricing {
  id: string;
  level: string;
  level_number?: number;
  written_fee_usd?: number;
  oral_fee_usd?: number;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  translations?: Translation[];
}

export default function HSKPricingPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.hsk.pricing');
  const tc = useTranslations('dashboard.common');
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isOfficer, loading: roleLoading } = useRole();
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [level, setLevel] = useState('');
  const [levelNumber, setLevelNumber] = useState('');
  const [writtenFeeUsd, setWrittenFeeUsd] = useState('');
  const [oralFeeUsd, setOralFeeUsd] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Translation states
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionEs, setDescriptionEs] = useState('');
  const [descriptionZh, setDescriptionZh] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner && !isOfficer)) {
      router.push('/');
      return;
    }
    fetchPricing();
  }, [user, isAdmin, isOwner, isOfficer, authLoading, roleLoading]);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hsk/pricing?active=false');
      if (!res.ok) throw new Error('Failed to fetch pricing');
      const data = await res.json();
      setPricing(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (price: Pricing) => {
    setEditingId(price.id);
    setLevel(price.level || '');
    setLevelNumber(price.level_number?.toString() || '');
    setWrittenFeeUsd(price.written_fee_usd?.toString() || '');
    setOralFeeUsd(price.oral_fee_usd?.toString() || '');
    setIsActive(price.is_active);
    setDisplayOrder(price.display_order?.toString() || '');
    
    // Set translations
    const enTrans = price.translations?.find(t => t.locale === 'en');
    const esTrans = price.translations?.find(t => t.locale === 'es');
    const zhTrans = price.translations?.find(t => t.locale === 'zh');
    setDescriptionEn(enTrans?.description || '');
    setDescriptionEs(esTrans?.description || '');
    setDescriptionZh(zhTrans?.description || '');
    
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setLevel('');
    setLevelNumber('');
    setWrittenFeeUsd('');
    setOralFeeUsd('');
    setIsActive(true);
    setDisplayOrder('');
    setDescriptionEn('');
    setDescriptionEs('');
    setDescriptionZh('');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!level) {
      showToast(tc('requiredFields'), 'error');
      return;
    }

    try {
      setSubmitting(true);

      const url = editingId ? `/api/hsk/pricing/${editingId}` : '/api/hsk/pricing';
      const method = editingId ? 'PATCH' : 'POST';

      const translations = [
        { locale: 'en', description: descriptionEn || null },
        { locale: 'es', description: descriptionEs || null },
        { locale: 'zh', description: descriptionZh || null }
      ].filter(t => t.description);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          level_number: levelNumber ? parseInt(levelNumber) : null,
          written_fee_usd: writtenFeeUsd ? parseFloat(writtenFeeUsd) : null,
          oral_fee_usd: oralFeeUsd ? parseFloat(oralFeeUsd) : null,
          is_active: isActive,
          display_order: displayOrder ? parseInt(displayOrder) : 0,
          translations
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || tc('error'), 'error');
        return;
      }

      showToast(tc('success'), 'success');
      resetForm();
      fetchPricing();
    } catch (error) {
      showToast(tc('error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tc('deleteConfirm'))) return;

    try {
      const res = await fetch(`/api/hsk/pricing/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error(tc('error'));
      
      showToast(tc('success'), 'success');
      fetchPricing();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/hsk/pricing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!res.ok) throw new Error(tc('error'));
      
      fetchPricing();
    } catch (err: any) {
      showToast(err.message, 'error');
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
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' :
          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white z-50`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FontAwesomeIcon icon={faDollarSign} className="w-8 h-8 text-red-600" />
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-2">{t('description')}</p>
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <FontAwesomeIcon icon={showForm ? faAward : faPlus} className="mr-2" />
          {showForm ? tc('cancel') : t('newPricing')}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? t('editPricing') : t('createPricing')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="level">{t('level')} *</Label>
                  <Input
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder={t('levelPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="levelNumber">{t('levelNumber')}</Label>
                  <Input
                    id="levelNumber"
                    type="number"
                    value={levelNumber}
                    onChange={(e) => setLevelNumber(e.target.value)}
                    placeholder="1-6"
                    min="1"
                    max="6"
                  />
                </div>

                <div>
                  <Label htmlFor="displayOrder">{t('displayOrder')}</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="writtenFeeUsd">{t('writtenFee')}</Label>
                  <Input
                    id="writtenFeeUsd"
                    type="number"
                    step="0.01"
                    value={writtenFeeUsd}
                    onChange={(e) => setWrittenFeeUsd(e.target.value)}
                    placeholder={t('feePlaceholder')}
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="oralFeeUsd">{t('oralFee')}</Label>
                  <Input
                    id="oralFeeUsd"
                    type="number"
                    step="0.01"
                    value={oralFeeUsd}
                    onChange={(e) => setOralFeeUsd(e.target.value)}
                    placeholder={t('feePlaceholder')}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descriptionEn">{t('descriptionEn')}</Label>
                <Input
                  id="descriptionEn"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="descriptionEs">{t('descriptionEs')}</Label>
                <Input
                  id="descriptionEs"
                  value={descriptionEs}
                  onChange={(e) => setDescriptionEs(e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="descriptionZh">{t('descriptionZh')}</Label>
                <Input
                  id="descriptionZh"
                  value={descriptionZh}
                  onChange={(e) => setDescriptionZh(e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
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
                <Label htmlFor="isActive" className="mb-0">{t('activeLabel')}</Label>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  {tc('cancel')}
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>{editingId ? tc('updating') : tc('creating')}</>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} className="mr-2" />
                      {editingId ? t('updatePricing') : t('createPricing')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pricingList')}</CardTitle>
        </CardHeader>
        <CardContent>
          {pricing.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('level')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('writtenFee')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('oralFee')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('total')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{tc('status')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pricing.map((price) => {
                    const writtenFee = price.written_fee_usd || 0;
                    const oralFee = price.oral_fee_usd || 0;
                    const total = writtenFee + oralFee;

                    return (
                      <tr key={price.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{price.level}</div>
                          {price.description && (
                            <div className="text-xs text-gray-500">{price.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {writtenFee > 0 ? `$${writtenFee.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {oralFee > 0 ? `$${oralFee.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-red-600">
                          ${total.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(price.id, price.is_active)}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              price.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {price.is_active ? tc('active') : tc('inactive')}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(price)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            {isOwner && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(price.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {t('noPricing')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
