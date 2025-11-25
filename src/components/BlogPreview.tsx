'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Link } from '@/i18n/navigation';

interface BlogPreviewProps {
    locale: string;
}

export function BlogPreview({ locale }: BlogPreviewProps) {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBlogs() {
            try {
                const res = await fetch(`/api/eventos?locale=${locale}&published=true&limit=3`);
                if (res.ok) {
                    const data = await res.json();
                    setBlogs(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch blogs:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchBlogs();
    }, [locale]);

    if (loading) {
        return (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8">
                    <div className="text-[#C8102E] text-sm tracking-wider mb-2">BLOG</div>
                    <h2 className="text-gray-900 text-2xl mb-2">Últimas Publicaciones</h2>
                    <div className="h-1 w-20 bg-linear-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="overflow-hidden h-full animate-pulse">
                            <div className="relative h-40 bg-gray-200" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 rounded w-full" />
                                <div className="h-3 bg-gray-200 rounded w-5/6" />
                                <div className="h-3 bg-gray-200 rounded w-1/3" />
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="text-center mt-6">
                    <div className="h-10 w-48 bg-gray-200 rounded mx-auto animate-pulse" />
                </div>
            </section>
        );
    }

    if (blogs.length === 0) {
        return null;
    }

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
                <div className="text-[#C8102E] text-sm tracking-wider mb-2">BLOG</div>
                <h2 className="text-gray-900 text-2xl mb-2">Últimas Publicaciones</h2>
                <div className="h-1 w-20 bg-linear-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {blogs.map((post: any) => (
                    <Link key={post.id} href={`/eventos/${post.slug}`}>
                        <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer h-full">
                            <div className="relative h-40 overflow-hidden">
                                <ImageWithFallback
                                    src={post.featured_image_url || '/event.jpg'}
                                    alt={post.title}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                />
                                {post.category && (
                                    <div className="absolute top-3 left-3 bg-[#C8102E] text-white px-2 py-1 rounded text-xs">
                                        {post.category}
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <h3 className="text-gray-900 font-semibold mb-2 line-clamp-2">{post.title}</h3>
                                {post.excerpt && (
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                                )}
                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                    <FontAwesomeIcon icon={faCalendarDays} className="w-3 h-3 text-[#FFD700]" />
                                    {new Date(post.published_at || post.created_at).toLocaleDateString(locale, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="text-center mt-6">
                <Link href="/eventos">
                    <Button
                        variant="outline"
                        className="border-[#C8102E] text-[#C8102E] hover:bg-[#C8102E] hover:text-white hover:cursor-pointer">
                        Ver Todos los Artículos
                        <FontAwesomeIcon icon={faArrowRight} className="ml-2 w-4 h-4" />
                    </Button>
                </Link>
            </div>
        </section>
    );
}
