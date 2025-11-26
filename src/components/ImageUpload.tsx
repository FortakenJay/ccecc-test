"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { createClient } from '@/lib/supabase/client';

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file');
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      onError?.(`Image size must be less than ${maxSize}MB`);
      return;
    }

    try {
      setUploading(true);
      const supabase = createClient();
      
      // Delete old image if it exists
      if (value && value.includes(bucket)) {
        const oldFileName = value.split('/').pop();
        if (oldFileName) {
          await supabase.storage.from(bucket).remove([oldFileName]);
        }
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      onError?.('');
    } catch (error: any) {
      onError?.(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!value) return;

    try {
      if (value.includes(bucket)) {
        const supabase = createClient();
        const fileName = value.split('/').pop();
        if (fileName) {
          await supabase.storage.from(bucket).remove([fileName]);
        }
      }
      onChange('');
    } catch (error: any) {
      onError?.('Failed to remove image');
    }
  };

  const inputId = `image-upload-${Math.random().toString(36).substring(7)}`;

  return (
    <div>
      {value ? (
        <div className="space-y-2">
          <div className={`relative ${previewHeight} w-full rounded-lg overflow-hidden border-2 border-gray-200`}>
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
            className="text-red-600"
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Remove Image
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
          <label htmlFor={inputId}>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => document.getElementById(inputId)?.click()}
              className="w-full"
            >
              <FontAwesomeIcon icon={faUpload} className="mr-2" />
              {uploading ? 'Uploading...' : `Upload ${label}`}
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-1">Max {maxSize}MB, JPG/PNG/WEBP</p>
        </div>
      )}
    </div>
  );
}
