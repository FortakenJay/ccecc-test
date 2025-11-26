"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRole } from '@/lib/hooks/useRole';
import { useBlog } from '@/lib/hooks/useBlog';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash,
  faCheckCircle,
  faTimesCircle,
  faEye,
  faStar,
  faCalendar,
  faUser,
  faNewspaper
} from '@fortawesome/free-solid-svg-icons';
import { formatPublishedDate } from '@/lib/utils/blog';

export default function BlogDashboardPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.blog');
  const tc = useTranslations('dashboard.common');
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, loading: roleLoading, isOfficer } = useRole();
  const { posts, loading, error, fetchPosts, deletePost, togglePublish, toggleFeatured } = useBlog();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filterFeatured, setFilterFeatured] = useState<'all' | 'featured' | 'notFeatured'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views'>('newest');

 useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner && !isOfficer)) {
      router.push('/');
      return;
    }
    fetchPosts();
  }, [user, isAdmin, isOwner, authLoading,isOfficer, roleLoading]);


  // Filter and sort posts
  const filteredPosts = posts.filter(post => {
    // Status filter
    if (filterStatus === 'published' && !post.is_published) return false;
    if (filterStatus === 'draft' && post.is_published) return false;

    // Featured filter
    if (filterFeatured === 'featured' && !post.is_featured) return false;
    if (filterFeatured === 'notFeatured' && post.is_featured) return false;

    // Category filter
    if (filterCategory !== 'all' && post.category !== filterCategory) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const translation = post.translations?.[0];
      const matchesTitle = translation?.title?.toLowerCase().includes(query);
      const matchesExcerpt = translation?.excerpt?.toLowerCase().includes(query);
      const matchesCategory = post.category?.toLowerCase().includes(query);
      const matchesTags = post.tags?.some((tag: string) => tag.toLowerCase().includes(query));
      if (!matchesTitle && !matchesExcerpt && !matchesCategory && !matchesTags) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    } else if (sortBy === 'views') {
      return (b.views || 0) - (a.views || 0);
    }
    return 0;
  });

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));

  const handleDelete = async (id: string) => {
    if (!confirm(tc('confirmDelete'))) return;
    
    setDeletingId(id);
    const { error } = await deletePost(id);
    
    if (error) {
      alert(error);
    }
    setDeletingId(null);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    const { error } = await togglePublish(id, !currentStatus);
    if (error) {
      alert(error);
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    const { error } = await toggleFeatured(id, !currentStatus);
    if (error) {
      alert(error);
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user || (!isAdmin && !isOwner && !isOfficer)) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
            <FontAwesomeIcon icon={faNewspaper} className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
            {t('title')}
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">{t('subtitle')}</p>
        </div>
        <Button
          onClick={() => router.push('/panel/blog/new')}
          className="cursor-pointer bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          {t('newPost')}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6 md:mb-8 p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <Label htmlFor="search">{tc('search')}</Label>
            <Input
              id="search"
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Label htmlFor="filterStatus">{tc('status')}</Label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className=" cursor-pointer w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">{tc('all')}</option>
              <option value="published">{t('published')}</option>
              <option value="draft">{t('draft')}</option>
            </select>
          </div>

          {/* Featured Filter */}
          <div>
            <Label htmlFor="filterFeatured">{t('featured')}</Label>
            <select
              id="filterFeatured"
              value={filterFeatured}
              onChange={(e) => setFilterFeatured(e.target.value as any)}
              className="cursor-pointer w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">{tc('all')}</option>
              <option value="featured">{t('featured')}</option>
              <option value="notFeatured">{t('notFeatured')}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <Label htmlFor="filterCategory">{t('category')}</Label>
            <select
              id="filterCategory"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="cursor-pointer w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">{tc('all')}</option>
              {uniqueCategories.map(category => (
                <option key={category || 'uncategorized'} value={category || ''}>{category}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <Label htmlFor="sortBy">{t('sortBy')}</Label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="cursor-pointer w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="newest">{t('newestFirst')}</option>
              <option value="oldest">{t('oldestFirst')}</option>
              <option value="views">{t('MostViewed')}</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(filterStatus !== 'all' || filterFeatured !== 'all' || filterCategory !== 'all' || searchQuery || sortBy !== 'newest') && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">{t('activeFilters')}</span>
            {filterStatus !== 'all' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {t('statusLabel')} {filterStatus}
              </span>
            )}
            {filterFeatured !== 'all' && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                {t('featured')}: {filterFeatured === 'featured' ? 'Yes' : 'No'}
              </span>
            )}
            {filterCategory !== 'all' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                {t('category')}: {filterCategory}
              </span>
            )}
            {searchQuery && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                Search: {searchQuery}
              </span>
            )}
            {sortBy !== 'newest' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Sort: {sortBy === 'oldest' ? 'Oldest First' : 'Most Views'}
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterFeatured('all');
                setFilterCategory('all');
                setSortBy('newest');
              }}
              className="cursor-pointer px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs hover:bg-gray-300"
            >
              Clear all
            </button>
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card className="p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-600">{t('totalPosts')}</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900">
            {filteredPosts.length}
            {filteredPosts.length !== posts.length && (
              <span className="text-sm text-gray-500 ml-2">of {posts.length}</span>
            )}
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-600">{t('published')}</div>
          <div className="text-xl md:text-2xl font-bold text-green-600">
            {filteredPosts.filter((p) => p.is_published).length}
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-600">{t('featured')}</div>
          <div className="text-xl md:text-2xl font-bold text-yellow-600">
            {filteredPosts.filter((p) => p.is_featured).length}
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-600">{t('totalViews')}</div>
          <div className="text-xl md:text-2xl font-bold text-blue-600">
            {filteredPosts.reduce((sum, p) => sum + (p.views || 0), 0)}
          </div>
        </Card>
      </div>

      <div className="grid gap-6">
        {filteredPosts.length === 0 ? (
          <Card className="p-8 text-center">
            <FontAwesomeIcon icon={faNewspaper} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {posts.length === 0 ? 'No blog posts found' : 'No posts match your filters'}
            </h3>
            <p className="text-gray-500 mb-4">
              {posts.length === 0 ? 'Create your first post!' : 'Try adjusting your filters'}
            </p>
            {posts.length === 0 ? (
              <Button
                onClick={() => router.push('/panel/blog/new')}
                className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                {t('newPost')}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterFeatured('all');
                  setFilterCategory('all');
                  setSortBy('newest');
                }}
                variant="outline"
                className="cursor-pointer"
              >
                {t('clearFilters')}
              </Button>
            )}
          </Card>
        ) : (
          filteredPosts.map((post: any) => (
            <Card key={post.id} className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Featured Image */}
                {post.featured_image_url && (
                  <div className="w-full md:w-48 h-48 md:h-32 shrink-0">
                    <img
                      src={post.featured_image_url}
                      alt={post.title || 'Blog post'}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900">{post.title || 'Untitled'}</h3>
                        {post.is_featured && (
                          <Badge variant="default" className="bg-yellow-500">
                            <FontAwesomeIcon icon={faStar} className="mr-1" size="xs" />
                            {t('featured')}
                          </Badge>
                        )}
                        <Badge variant={post.is_published ? "default" : "secondary"} className={post.is_published ? "bg-green-500" : ""}>
                          {post.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>

                      {post.excerpt && (
                        <p className="text-gray-600 mb-3 line-clamp-2">{post.excerpt}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500">
                        {post.category && (
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {post.category}
                          </span>
                        )}
                        {post.author && (
                          <span>
                            <FontAwesomeIcon icon={faUser} className="mr-1" />
                            {post.author.full_name}
                          </span>
                        )}
                        {post.published_at && (
                          <span>
                            <FontAwesomeIcon icon={faCalendar} className="mr-1" />
                            {formatPublishedDate(post.published_at)}
                          </span>
                        )}
                        <span>
                          <FontAwesomeIcon icon={faEye} className="mr-1" />
                          {post.views || 0} {t('views')}
                        </span>
                      </div>

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {post.tags.map((tag: string, idx: number) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row md:flex-col flex-wrap md:flex-nowrap gap-2 w-full md:w-auto md:ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/panel/blog/${post.id}`)}
                        className="cursor-pointer flex-1 md:flex-none"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        {tc('edit')}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(post.id, post.is_published || false)}
                        className="cursor-pointer flex-1 md:flex-none"
                      >
                        <FontAwesomeIcon 
                          icon={post.is_published ? faTimesCircle : faCheckCircle} 
                          className="mr-1" 
                        />
                        <span className="hidden sm:inline">{post.is_published ? t('unpublish') : t('publish')}</span>
                        <span className="sm:hidden">{post.is_published ? 'Hide' : 'Show'}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleFeatured(post.id, post.is_featured || false)}
                        className="cursor-pointer flex-1 md:flex-none"
                      >
                        <FontAwesomeIcon icon={faStar} className="mr-1" />
                        {post.is_featured ? t('unfeature') : t('feature')}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="cursor-pointer flex-1 md:flex-none"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-1" />
                        {deletingId === post.id ? t('deleting') : tc('delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
