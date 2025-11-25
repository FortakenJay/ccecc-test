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
  const { isAdmin, isOwner, loading: roleLoading } = useRole();
  const { posts, loading, error, fetchPosts, deletePost, togglePublish, toggleFeatured } = useBlog();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner)) {
      router.push('/');
      return;
    }

    fetchPosts(); // Fetch all posts (published and drafts)
  }, [user, isAdmin, isOwner, authLoading, roleLoading]);

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

  if (!user || (!isAdmin && !isOwner)) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
            <FontAwesomeIcon icon={faNewspaper} className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
            Blog Posts
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Manage your blog content</p>
        </div>
        <Button
          onClick={() => router.push('/panel/blog/new')}
          className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          New Post
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card className="p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-600">Total Posts</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900">{posts.length}</div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-600">Published</div>
          <div className="text-xl md:text-2xl font-bold text-green-600">
            {posts.filter((p) => p.is_published).length}
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-600">Featured</div>
          <div className="text-xl md:text-2xl font-bold text-yellow-600">
            {posts.filter((p) => p.is_featured).length}
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-600">Total Views</div>
          <div className="text-xl md:text-2xl font-bold text-blue-600">
            {posts.reduce((sum, p) => sum + (p.views || 0), 0)}
          </div>
        </Card>
      </div>

      <div className="grid gap-6">
        {posts.length === 0 ? (
          <Card className="p-8 text-center">
            <FontAwesomeIcon icon={faNewspaper} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
            <p className="text-gray-500 mb-4">Create your first post!</p>
            <Button
              onClick={() => router.push('/panel/blog/new')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              New Post
            </Button>
          </Card>
        ) : (
          posts.map((post: any) => (
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
                            Featured
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
                          {post.views || 0} views
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
                        className="flex-1 md:flex-none"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Edit
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(post.id, post.is_published || false)}
                        className="flex-1 md:flex-none"
                      >
                        <FontAwesomeIcon 
                          icon={post.is_published ? faTimesCircle : faCheckCircle} 
                          className="mr-1" 
                        />
                        <span className="hidden sm:inline">{post.is_published ? 'Unpublish' : 'Publish'}</span>
                        <span className="sm:hidden">{post.is_published ? 'Hide' : 'Show'}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleFeatured(post.id, post.is_featured || false)}
                        className="flex-1 md:flex-none"
                      >
                        <FontAwesomeIcon icon={faStar} className="mr-1" />
                        {post.is_featured ? 'Unfeature' : 'Feature'}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="flex-1 md:flex-none"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-1" />
                        {deletingId === post.id ? 'Deleting...' : 'Delete'}
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
