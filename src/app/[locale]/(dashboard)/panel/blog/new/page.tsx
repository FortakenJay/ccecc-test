"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useBlog } from '@/lib/hooks/useBlog';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textArea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSave, 
  faEye,
  faImage,
  faTag,
  faFolder
} from '@fortawesome/free-solid-svg-icons';
import { generateSlug, EXAMPLE_TIPTAP_CONTENT } from '@/lib/utils/blog';
import TiptapEditor from '@/components/TiptapEditor';
import ImageUpload from '@/components/ImageUpload';

export default function NewBlogPostPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('dashboard.blog');
  const { createPost, loading } = useBlog(locale);
  
  const [formData, setFormData] = useState({
    slug: '',
    category: '',
    featured_image_url: '',
    is_published: false,
    is_featured: false,
    tags: [] as string[],
    translations: {
      [locale]: {
        title: '',
        excerpt: '',
        content: EXAMPLE_TIPTAP_CONTENT,
        seo_description: ''
      }
    }
  });
  
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  const categories = [
    'Culture',
    'Language Learning',
    'Events',
    'News',
    'Community',
    'Food & Cuisine',
    'Travel',
    'History',
    'Art & Music',
    'Other'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTranslationChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        translations: {
          ...prev.translations,
          [locale]: {
            ...prev.translations[locale],
            [field]: value
          }
        }
      };
      
      // Auto-generate slug from title if slug is empty
      if (field === 'title' && !prev.slug) {
        updated.slug = generateSlug(value);
      }
      
      return updated;
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleInputChange('tags', formData.tags.filter(t => t !== tag));
  };

  const handleContentChange = (json: any) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: {
          ...prev.translations[locale],
          content: json
        }
      }
    }));
  };

  const handleSubmit = async (publish: boolean = false) => {
    if (!formData.translations[locale].title) {
      setError(t('titleRequired'));
      return;
    }

    try {
      const { slug, category, tags, featured_image_url, is_featured } = formData;
      const postData = {
        slug,
        category,
        tags,
        featured_image_url,
        is_featured,
        is_published: publish,
      };

      const result = await createPost(postData, formData.translations);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      router.push('/panel/blog');
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/panel/blog')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            {t('backToBlog')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('createNew')}</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Excerpt */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">{t('titleLabel')} *</Label>
                  <Input
                    id="title"
                    value={formData.translations[locale].title}
                    onChange={(e) => handleTranslationChange('title', e.target.value)}
                    placeholder={t('titlePlaceholder')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">{t('slugLabel')}</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder={t('slugPlaceholder')}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('slugHelp')}</p>
                </div>

                <div>
                  <Label htmlFor="excerpt">{t('excerptLabel')}</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.translations[locale].excerpt}
                    onChange={(e) => handleTranslationChange('excerpt', e.target.value)}
                    placeholder={t('excerptPlaceholder')}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="seo">{t('seoLabel')}</Label>
                  <Textarea
                    id="seo"
                    value={formData.translations[locale].seo_description}
                    onChange={(e) => handleTranslationChange('seo_description', e.target.value)}
                    placeholder={t('seoPlaceholder')}
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Content Editor */}
            <Card className="p-6">
              <Label>{t('contentLabel')} *</Label>
              <p className="text-sm text-gray-600 mb-3">
                {t('contentHelp')}
              </p>
              <TiptapEditor
                content={formData.translations[locale].content}
                onChange={handleContentChange}
                placeholder={t('contentPlaceholder')}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Actions */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('publish')}</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  variant="secondary"
                  className="cursor-pointer w-full"
                >
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  {t('saveDraft')}
                </Button>
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                  className="cursor-pointer w-full bg-green-600 hover:bg-green-700"
                >
                  <FontAwesomeIcon icon={faEye} className="mr-2" />
                  {t('publishNow')}
                </Button>
              </div>
            </Card>

            {/* Featured Image */}
            <Card className="p-6">
              <Label className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faImage} />
                {t('featuredImage')}
              </Label>
              <ImageUpload
                value={formData.featured_image_url}
                onChange={(url) => handleInputChange('featured_image_url', url)}
                bucket="blog-images"
                onError={(err) => setError(err)}
                label={t('featuredImage')}
              />
            </Card>

            {/* Category */}
            <Card className="p-6">
              <Label htmlFor="category" className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faFolder} />
                {t('categoryLabel')}
              </Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">{t('categoryPlaceholder')}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </Card>

            {/* Tags */}
            <Card className="p-6">
              <Label className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faTag} />
                {t('tagsLabel')}
              </Label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder={t('tagPlaceholder')}
                />
                <Button onClick={handleAddTag} type="button" size="sm" className="cursor-pointer">
                  {t('addTag')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Settings */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t('settings')}</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{t('featuredPost')}</span>
                </label>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
