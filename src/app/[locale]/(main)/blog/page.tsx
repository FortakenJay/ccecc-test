"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useBlog } from '@/lib/hooks/useBlog';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendar, 
  faUser, 
  faEye, 
  faStar,
  faNewspaper,
  faFilter,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { formatPublishedDate } from '@/lib/utils/blog';

export default function BlogPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { posts, loading, error, fetchPosts } = useBlog(locale);

  // Get category from URL on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPosts({ published: true, category: selectedCategory || undefined });
  }, [selectedCategory]);

  const featuredPosts = posts.filter((p: any) => p.is_featured);
  const regularPosts = posts.filter((p: any) => !p.is_featured);

  // Get unique categories from posts
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    posts.forEach((post: any) => {
      if (post.category) {
        categories.add(post.category);
      }
    });
    return Array.from(categories).sort();
  }, [posts]);

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    // Update URL without reload
    const url = new URL(window.location.href);
    if (category) {
      url.searchParams.set('category', category);
    } else {
      url.searchParams.delete('category');
    }
    window.history.pushState({}, '', url.toString());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <FontAwesomeIcon icon={faNewspaper} className="text-5xl mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
            <p className="text-xl text-red-100">
              Discover stories, news, and insights about Chinese culture, language learning, and our community events.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-8">
            {error}
          </div>
        )}

        {/* Category Filter */}
        {availableCategories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={faFilter} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter by Category</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategory === null ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 ${
                  selectedCategory === null 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleCategoryFilter(null)}
              >
                All Posts
                {selectedCategory === null && posts.length > 0 && (
                  <span className="ml-2 text-xs">({posts.length})</span>
                )}
              </Badge>
              {availableCategories.map((category) => {
                const count = posts.filter((p: any) => p.category === category).length;
                return (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className={`cursor-pointer px-4 py-2 ${
                      selectedCategory === category 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleCategoryFilter(category)}
                  >
                    {category}
                    <span className="ml-2 text-xs">({count})</span>
                  </Badge>
                );
              })}
            </div>
            {selectedCategory && (
              <button
                onClick={() => handleCategoryFilter(null)}
                className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTimes} />
                Clear filter
              </button>
            )}
          </div>
        )}

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
              Featured Posts
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post: any) => (
                <Card 
                  key={post.id} 
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => router.push(`/blog/${post.slug || post.id}`)}
                >
                  {post.featured_image_url && (
                    <div className="h-64 overflow-hidden">
                      <img
                        src={post.featured_image_url}
                        alt={post.title || 'Featured post'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="default" className="bg-yellow-500">
                        <FontAwesomeIcon icon={faStar} className="mr-1" size="xs" />
                        Featured
                      </Badge>
                      {post.category && (
                        <Badge variant="secondary">{post.category}</Badge>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 hover:text-red-600 transition-colors">
                      {post.title || 'Untitled'}
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {post.author && (
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faUser} />
                          {post.author.full_name}
                        </span>
                      )}
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faCalendar} />
                          {formatPublishedDate(post.published_at, locale)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faEye} />
                        {post.views || 0}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts */}
        {regularPosts.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Posts</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {regularPosts.map((post: any) => (
                <Card 
                  key={post.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/blog/${post.slug || post.id}`)}
                >
                  {post.featured_image_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.featured_image_url}
                        alt={post.title || 'Blog post'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    {post.category && (
                      <Badge variant="secondary" className="mb-3">{post.category}</Badge>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-red-600 transition-colors line-clamp-2">
                      {post.title || 'Untitled'}
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3 text-sm">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faCalendar} />
                          {formatPublishedDate(post.published_at, locale)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faEye} />
                        {post.views || 0}
                      </span>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {post.tags.slice(0, 3).map((tag: string, idx: number) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : !loading && featuredPosts.length === 0 && (
          <div className="text-center py-16">
            <FontAwesomeIcon icon={faNewspaper} className="text-6xl text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">Check back soon for new content!</p>
          </div>
        )}
      </div>
    </div>
  );
}
