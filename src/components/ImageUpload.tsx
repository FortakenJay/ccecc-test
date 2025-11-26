"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket: 'team-photos' | 'blog-images' | 'class-images' | 'event-images';
  onError?: (error: string) => void;
  maxSize?: number; // in MB
  previewHeight?: string;
  label?: string;
}

export default function ImageUpload({
  value,
  onChange,
  bucket,
  onError,
  maxSize = 5,
  previewHeight = 'h-48',
  label = 'Image'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const t = useTranslations('buttons');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError?.(t('errorInvalidImage'));
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      onError?.(t('errorImageTooLarge', { size: maxSize }));
      return;
    }

    try {
      setUploading(true);
      const supabase = createClient();

      // Delete old image
      if (value && value.includes(bucket)) {
        const oldFileName = value.split('/').pop();
        if (oldFileName) {
          await supabase.storage.from(bucket).remove([oldFileName]);
        }
      }

      // Upload new file
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(publicUrl);
      onError?.('');
    } catch (err: any) {
      onError?.(err.message || t('errorUpload'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!value) return;

    try {
      const supabase = createClient();
      const fileName = value.split('/').pop();

      if (fileName) {
        await supabase.storage.from(bucket).remove([fileName]);
      }

      onChange('');
    } catch {
      onError?.(t('errorRemove'));
    }
  };

  // Unique ID for label/input
  const inputId = `image-upload-${Math.random().toString(36).slice(2)}`;

  return (
    <div>
      {value ? (
        <div className="space-y-2">
          <div
            className={`relative ${previewHeight} w-full rounded-lg overflow-hidden border-2 border-gray-200 `}
          >
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.jpg';
              }}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            className="text-red-600 cursor-pointer"
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            {t('removeImage')}
          </Button>
        </div>
      ) : (
        <div>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <label htmlFor={inputId} className="w-full">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="w-full"
            >
              <FontAwesomeIcon icon={faUpload} className="mr-2" />

              {uploading
                ? t('uploading')
                : `${t('upload')} ${label}`}
            </Button>
          </label>

          <p className="text-xs text-gray-500 mt-1">
            {t('maxSize', { size: maxSize })}
          </p>
        </div>
      )}
    </div>
  );
}
