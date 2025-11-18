"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRole } from '@/lib/hooks/useRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast, useToast } from '@/components/ui/toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faUserPlus,
  faShield,
  faCopy,
  faCheckCircle,
  faExclamationCircle,
  faTrash,
  faClock
} from '@fortawesome/free-solid-svg-icons';

interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'officer';
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  status: 'pending' | 'accepted' | 'expired';
}

export default function InvitationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, loading: roleLoading } = useRole();
  const { toast, showToast, hideToast } = useToast();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'officer'>('officer');

  useEffect(() => {
    if (authLoading || roleLoading) return;
    
    if (!user || (!isAdmin && !isOwner)) {
      router.push('/');
      return;
    }
    fetchInvitations();
  }, [user, isAdmin, isOwner, authLoading, roleLoading]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invitaciones');
      if (!res.ok) throw new Error('Failed to fetch invitations');
      const data = await res.json();
      setInvitations(data.data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast('Please enter an email address', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Check permission to invite this role
    if (role === 'admin' && !isOwner) {
      showToast('Only owners can invite admins', 'error');
      return;
    }

    try {
      setSending(true);
      const res = await fetch('/api/invitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), role }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to send invitation', 'error');
        return;
      }

      showToast('Invitation sent successfully! User will receive an OTP email.', 'success');
      setEmail('');
      setRole('officer');
      fetchInvitations();
    } catch (err: any) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/login?invitation=${token}`;
    navigator.clipboard.writeText(link);
    showToast('Invitation link copied to clipboard!', 'success');
  };

  const handleDeleteInvitation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;

    try {
      const res = await fetch('/api/invitaciones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Failed to delete invitation');

      showToast('Invitation deleted', 'success');
      fetchInvitations();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(i => !i.accepted_at && new Date(i.expires_at) > new Date());
  const acceptedInvitations = invitations.filter(i => i.accepted_at);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FontAwesomeIcon icon={faUserPlus} className="w-8 h-8 text-red-600" />
          User Invitations
        </h1>
        <p className="text-gray-600 mt-2">Invite new users to join the platform</p>
      </div>

      {/* Invite Form */}
      <Card className="mb-8 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Send New Invitation</h2>
        <form onSubmit={handleSendInvitation} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                <FontAwesomeIcon icon={faEnvelope} className="mr-2 w-4 h-4" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                <FontAwesomeIcon icon={faShield} className="mr-2 w-4 h-4" />
                Role *
              </Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'officer')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="officer">Officer</option>
                {isOwner && <option value="admin">Admin</option>}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faExclamationCircle} className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">How OTP invitations work:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>User receives an email with a One-Time Password (OTP)</li>
                  <li>They use the OTP to sign in at the login page</li>
                  <li>After signing in, they'll be prompted to set their password and complete their profile</li>
                  <li>OTP expires in 1 hour for security</li>
                </ol>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={sending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {sending ? (
              <>
                <FontAwesomeIcon icon={faClock} className="mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Invitations</div>
          <div className="text-2xl font-bold text-gray-900">{invitations.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{pendingInvitations.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Accepted</div>
          <div className="text-2xl font-bold text-green-600">{acceptedInvitations.length}</div>
        </Card>
      </div>

      {/* Pending Invitations */}
      <Card className="mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Pending Invitations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingInvitations.length > 0 ? (
                pendingInvitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{inv.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inv.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        <FontAwesomeIcon icon={faShield} className="mr-1 w-3 h-3" />
                        {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => copyInviteLink(inv.token)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <FontAwesomeIcon icon={faCopy} className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteInvitation(inv.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No pending invitations
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Accepted Invitations */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Accepted Invitations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accepted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {acceptedInvitations.length > 0 ? (
                acceptedInvitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{inv.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inv.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        <FontAwesomeIcon icon={faShield} className="mr-1 w-3 h-3" />
                        {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
                        {inv.accepted_at ? new Date(inv.accepted_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    No accepted invitations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
