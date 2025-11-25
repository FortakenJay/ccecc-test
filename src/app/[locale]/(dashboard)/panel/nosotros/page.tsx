"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTeam } from '@/lib/hooks/useTeam';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import {ImageWithFallback} from '@/components/ImageWithFallback';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faArrowUp, faArrowDown, faUser } from '@fortawesome/free-solid-svg-icons';

export default function AboutPageManagement() {
    const { user, profile, loading: authLoading } = useAuth();
    const { teamMembers, loading, error, fetchTeamMembers } = useTeam();
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        if (!authLoading && (!user || !['owner', 'admin'].includes(profile?.role || ''))) {
            router.push('/panel');
        }
    }, [user, profile, authLoading, router]);

    useEffect(() => {
        fetchTeamMembers(false, 'en'); // Fetch all members including inactive
    }, []);

    const categories = [
        { value: 'all', label: 'All Members' },
        { value: 'board', label: 'Board of Directors' },
        { value: 'leadership', label: 'Leadership Team' },
        { value: 'local_teachers', label: 'Local Teachers' },
        { value: 'volunteer_teachers', label: 'Volunteer Teachers' },
        { value: 'partner_institutions', label: 'Partner Institutions' },
    ];

    const filteredMembers = selectedCategory === 'all' 
        ? teamMembers 
        : teamMembers.filter((m: any) => m.category === selectedCategory);

    const groupedMembers = filteredMembers.reduce((acc: any, member: any) => {
        const category = member.category || 'uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(member);
        return acc;
    }, {});

    // Sort members by display_order within each category
    Object.keys(groupedMembers).forEach(category => {
        groupedMembers[category].sort((a: any, b: any) => 
            (a.display_order || 0) - (b.display_order || 0)
        );
    });

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this team member?')) return;

        try {
            const response = await fetch(`/api/equipo/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete');
            
            fetchTeamMembers(false, 'en');
        } catch (error) {
            console.error('Error deleting team member:', error);
            alert('Failed to delete team member');
        }
    };

    const handleReorder = async (id: string, direction: 'up' | 'down', currentOrder: number, category: string) => {
        const categoryMembers = groupedMembers[category];
        const currentIndex = categoryMembers.findIndex((m: any) => m.id === id);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= categoryMembers.length) return;

        const targetMember = categoryMembers[targetIndex];

        try {
            // Swap display_order values
            await Promise.all([
                fetch(`/api/equipo/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ display_order: targetMember.display_order }),
                }),
                fetch(`/api/equipo/${targetMember.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ display_order: currentOrder }),
                }),
            ]);

            fetchTeamMembers(false, 'en');
        } catch (error) {
            console.error('Error reordering:', error);
            alert('Failed to reorder team members');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">About Page Management</h1>
                    <p className="text-gray-600 mt-1">Manage team members and organizational hierarchy</p>
                </div>
                <Button
                    onClick={() => router.push('/panel/equipo/new')}
                    className="bg-[#C8102E] hover:bg-[#A00D24] text-white">
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add Team Member
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {/* Category Filter */}
            <div className="mb-6 flex gap-2 flex-wrap">
                {categories.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            selectedCategory === cat.value
                                ? 'bg-[#C8102E] text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Team Members by Category */}
            {Object.keys(groupedMembers).length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="text-gray-400 mb-4">
                        <FontAwesomeIcon icon={faUser} className="w-16 h-16" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members</h3>
                    <p className="text-gray-600 mb-4">Get started by adding your first team member</p>
                    <Button
                        onClick={() => router.push('/panel/equipo/new')}
                        className="bg-[#C8102E] hover:bg-[#A00D24] text-white">
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Add Team Member
                    </Button>
                </Card>
            ) : (
                Object.entries(groupedMembers).map(([category, members]: [string, any]) => (
                    <div key={category} className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize">
                            {category.replace(/_/g, ' ')}
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({members.length} member{members.length !== 1 ? 's' : ''})
                            </span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {members.map((member: any, index: number) => (
                                <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="relative h-48">
                                        <ImageWithFallback
                                            src={member.image_url || '/jane.jpg'}
                                            alt={member.name}
                                            className="w-full h-full object-cover"
                                        />
                                        {!member.is_active && (
                                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                                Inactive
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-1">{member.name || member.slug}</h3>
                                        <p className="text-sm text-[#C8102E] mb-2">{member.role || 'No role'}</p>
                                        {member.bio && (
                                            <p className="text-xs text-gray-600 line-clamp-2 mb-3">{member.bio}</p>
                                        )}
                                        
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleReorder(member.id, 'up', member.display_order, category)}
                                                    disabled={index === 0}
                                                    className="p-2 text-gray-600 hover:text-[#C8102E] disabled:opacity-30 disabled:cursor-not-allowed">
                                                    <FontAwesomeIcon icon={faArrowUp} className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleReorder(member.id, 'down', member.display_order, category)}
                                                    disabled={index === members.length - 1}
                                                    className="p-2 text-gray-600 hover:text-[#C8102E] disabled:opacity-30 disabled:cursor-not-allowed">
                                                    <FontAwesomeIcon icon={faArrowDown} className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => router.push(`/panel/equipo/${member.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                                    <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(member.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded">
                                                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
