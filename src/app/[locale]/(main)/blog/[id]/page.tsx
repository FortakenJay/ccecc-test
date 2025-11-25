"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendar, 
  faUser, 
  faEye, 
  faClock,
  faArrowLeft,
  faTag,
  faFolder
} from '@fortawesome/free-solid-svg-icons';
import { formatPublishedDate } from '@/lib/utils/blog';

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPost();
  }, [params.id]);

  const loadPost = async () => {
    try {
      const response = await fetch(`/api/eventos/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load post');
      }

      // Merge translation data with post
      const postData = result.data;
      const translation = postData.translations?.find((t: any) => t.locale === locale) || postData.translations?.[0];
      
      if (translation) {
        setPost({
          ...postData,
          title: translation.title,
          excerpt: translation.excerpt,
          content: translation.content,
          seo_description: translation.seo_description
        });
      } else {
        setPost(postData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content: any) => {
    if (!content || !content.content) return null;

    const renderNode = (node: any, index: number): any => {
      switch (node.type) {
        case 'paragraph':
          return (
            <p key={index} className="mb-4">
              {node.content?.map((child: any, i: number) => renderNode(child, i))}
            </p>
          );
        
        case 'heading':
          const level = node.attrs.level;
          const headingClass = `font-bold mb-4 mt-6 ${
            level === 1 ? 'text-4xl' :
            level === 2 ? 'text-3xl' :
            'text-2xl'
          }`;
          const headingContent = node.content?.map((child: any, i: number) => renderNode(child, i));
          
          if (level === 1) {
            return <h1 key={index} className={headingClass}>{headingContent}</h1>;
          } else if (level === 2) {
            return <h2 key={index} className={headingClass}>{headingContent}</h2>;
          } else if (level === 3) {
            return <h3 key={index} className={headingClass}>{headingContent}</h3>;
          } else if (level === 4) {
            return <h4 key={index} className={headingClass}>{headingContent}</h4>;
          } else if (level === 5) {
            return <h5 key={index} className={headingClass}>{headingContent}</h5>;
          } else {
            return <h6 key={index} className={headingClass}>{headingContent}</h6>;
          }
        
        case 'bulletList':
          return (
            <ul key={index} className="list-disc pl-6 mb-4 space-y-2">
              {node.content?.map((child: any, i: number) => renderNode(child, i))}
            </ul>
          );
        
        case 'orderedList':
          return (
            <ol key={index} className="list-decimal pl-6 mb-4 space-y-2">
              {node.content?.map((child: any, i: number) => renderNode(child, i))}
            </ol>
          );
        
        case 'listItem':
          return (
            <li key={index}>
              {node.content?.map((child: any, i: number) => renderNode(child, i))}
            </li>
          );
        
        case 'blockquote':
          return (
            <blockquote key={index} className="border-l-4 border-red-600 pl-4 italic text-gray-700 my-4">
              {node.content?.map((child: any, i: number) => renderNode(child, i))}
            </blockquote>
          );
        
        case 'image':
          return (
            <img
              key={index}
              src={node.attrs.src}
              alt={node.attrs.alt || ''}
              className="max-w-full h-auto rounded-lg my-6"
            />
          );
        
        case 'codeBlock':
          return (
            <pre key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
              <code>{node.content?.[0]?.text}</code>
            </pre>
          );
        
        case 'text':
          let text = node.text;
          if (node.marks) {
            node.marks.forEach((mark: any) => {
              if (mark.type === 'bold') {
                text = <strong key={index}>{text}</strong>;
              } else if (mark.type === 'italic') {
                text = <em key={index}>{text}</em>;
              } else if (mark.type === 'code') {
                text = <code key={index} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{text}</code>;
              } else if (mark.type === 'link') {
                text = (
                  <a
                    key={index}
                    href={mark.attrs.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 underline"
                  >
                    {text}
                  </a>
                );
              } else if (mark.type === 'strike') {
                text = <s key={index}>{text}</s>;
              }
            });
          }
          return text;
        
        default:
          return null;
      }
    };

    return (
      <div className="prose max-w-none">
        {content.content.map((node: any, index: number) => renderNode(node, index))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error || 'Post not found'}
          </div>
          <button
            onClick={() => router.push('/blog')}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      {post.featured_image_url && (
        <div className="relative h-96 w-full overflow-hidden">
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/blog')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Blog
        </button>

        {/* Article Header */}
        <article>
          <header className="mb-8">
            {/* Category & Featured Badge */}
            <div className="flex items-center gap-2 mb-4">
              {post.is_featured && (
                <Badge variant="default" className="bg-yellow-500">
                  Featured
                </Badge>
              )}
              {post.category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faFolder} size="xs" />
                  {post.category}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 border-b border-gray-200 pb-4">
              {post.author && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} />
                  <span>{post.author.full_name}</span>
                </div>
              )}
              {post.published_at && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendar} />
                  <span>{formatPublishedDate(post.published_at, locale)}</span>
                </div>
              )}
              {post.reading_time_minutes && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} />
                  <span>{post.reading_time_minutes} min read</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faEye} />
                <span>{post.views || 0} views</span>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-12">
            {renderContent(post.content)}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faTag} className="text-gray-500" />
                <span className="font-semibold text-gray-700">Tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
