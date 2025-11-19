"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRole } from '@/lib/hooks/useRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileText, 
  faClock,
  faCheckCircle,
  faEnvelope,
  faPhone,
  faCalendar,
  faUsers
} from '@fortawesome/free-solid-svg-icons';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_type: string;
  event_date: string;
  estimated_guests: number;
  message?: string;
  status: 'pending' | 'contacted' | 'confirmed' | 'cancelled';
  created_at: string;
}

export default function ConsultasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isOfficer, loading: roleLoading } = useRole();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner && !isOfficer)) {
      router.push('/');
      return;
    }
    fetchInquiries();
  }, [user, isAdmin, isOwner, authLoading, roleLoading]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/consultas');
      if (!res.ok) throw new Error('Failed to fetch inquiries');
      const data = await res.json();
      setInquiries(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/consultas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      
      fetchInquiries();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredInquiries = filter === 'all' 
    ? inquiries 
    : inquiries.filter(i => i.status === filter);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    contacted: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FontAwesomeIcon icon={faFileText} className="w-8 h-8 text-red-600" />
          Space Rental Inquiries
        </h1>
        <p className="text-gray-600 mt-2">Manage customer inquiries and bookings</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Inquiries</div>
          <div className="text-2xl font-bold text-gray-900">{inquiries.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {inquiries.filter(i => i.status === 'pending').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Contacted</div>
          <div className="text-2xl font-bold text-blue-600">
            {inquiries.filter(i => i.status === 'contacted').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Confirmed</div>
          <div className="text-2xl font-bold text-green-600">
            {inquiries.filter(i => i.status === 'confirmed').length}
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {['all', 'pending', 'contacted', 'confirmed', 'cancelled'].map((status) => (
          <Button
            key={status}
            onClick={() => setFilter(status)}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            className={filter === status ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Inquiries List */}
      <div className="space-y-4">
        {filteredInquiries.length > 0 ? (
          filteredInquiries.map((inquiry) => (
            <Card key={inquiry.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{inquiry.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-400" />
                      {inquiry.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-gray-400" />
                      {inquiry.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-gray-400" />
                      Event: {new Date(inquiry.event_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-gray-400" />
                      {inquiry.estimated_guests} guests
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[inquiry.status]}`}>
                  {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-1">Event Type:</div>
                <div className="text-sm text-gray-600">{inquiry.event_type}</div>
              </div>

              {inquiry.message && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">Message:</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {inquiry.message}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                  Received: {new Date(inquiry.created_at).toLocaleString()}
                </div>
                <div className="flex gap-2">
                  {inquiry.status === 'pending' && (
                    <Button
                      onClick={() => updateStatus(inquiry.id, 'contacted')}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                    >
                      Mark Contacted
                    </Button>
                  )}
                  {inquiry.status === 'contacted' && (
                    <Button
                      onClick={() => updateStatus(inquiry.id, 'confirmed')}
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:border-green-300"
                    >
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      Confirm
                    </Button>
                  )}
                  {inquiry.status !== 'cancelled' && (
                    <Button
                      onClick={() => updateStatus(inquiry.id, 'cancelled')}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faFileText} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
            <p className="text-gray-500">
              {filter === 'all' ? 'No inquiries yet' : `No ${filter} inquiries`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
