"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast, useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLock, 
  faUser,
  faCheckCircle,
  faExclamationCircle,
  faSpinner,
  faEnvelope,
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import { createClient } from '@/lib/supabase/client';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const t = useTranslations('acceptInvitation');
  
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    checkAuthAndInvitation();
  }, []);

  const checkAuthAndInvitation = async () => {
    try {
      setVerifying(true);
      const supabase = createClient();
      
      // Check if user is authenticated via OTP
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user || !user.email) {
        showToast(t('errors.signInFirst'), 'error');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      // Check if there's a valid invitation for this email
      const { data: invitations, error: invError } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', user.email)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (invError || !invitations || invitations.length === 0) {
        showToast(t('errors.noValidInvitation'), 'error');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      const invite = invitations[0];
      setEmail(user.email);
      setRole(invite.role);
      setInvitation(invite);
      setValid(true);
    } catch (error) {
      showToast(t('errors.verifyFailed'), 'error');
      setTimeout(() => router.push('/login'), 3000);
    } finally {
      setVerifying(false);
    }
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fullName.trim()) {
      showToast(t('errors.enterFullName'), 'error');
      return;
    }

    if (fullName.trim().length < 2) {
      showToast(t('errors.nameMinLength'), 'error');
      return;
    }

    if (password.length < 8) {
      showToast(t('errors.passwordMinLength'), 'error');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      showToast(t('errors.passwordUppercase'), 'error');
      return;
    }

    if (!/[a-z]/.test(password)) {
      showToast(t('errors.passwordLowercase'), 'error');
      return;
    }

    if (!/\d/.test(password)) {
      showToast(t('errors.passwordNumber'), 'error');
      return;
    }

    if (!/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      showToast(t('errors.passwordSpecial'), 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast(t('errors.passwordsNotMatch'), 'error');
      return;
    }

    if (!invitation) {
      showToast(t('errors.noInvitation'), 'error');
      return;
    }

    if (!invitation.role || !['owner', 'admin', 'officer'].includes(invitation.role)) {
      showToast(t('errors.invalidRole'), 'error');
      return;
    }

    console.log('Starting invitation acceptance with:', {
      invitationId: invitation.id,
      role: invitation.role,
      invitedBy: invitation.invited_by,
      email: email
    });

    try {
      setLoading(true);
      const supabase = createClient();

      // Get current user session info
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        showToast(t('errors.sessionInvalid'), 'error');
        return;
      }

      console.log('Current user session:', {
        id: currentUser.id,
        email: currentUser.email,
        emailConfirmed: currentUser.email_confirmed_at,
        lastSignIn: currentUser.last_sign_in_at,
        factors: currentUser.factors?.length || 0
      });

      // Update password with detailed error handling
      let passwordSetSuccessfully = true;
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password
      });

      if (passwordError) {
        passwordSetSuccessfully = false;
        console.error('Password update error:', passwordError);
        
        // Provide more specific error messages based on error type
        let errorMessage = 'Failed to set password';
        let shouldContinue = true;
        
        if (passwordError.message) {
          if (passwordError.message.includes('email_change_confirm_status_not_found')) {
            errorMessage = 'Please complete email verification first';
          } else if (passwordError.message.includes('session_not_found')) {
            errorMessage = 'Session expired. Please sign in again';
            shouldContinue = false;
          } else if (passwordError.message.includes('New password should be different')) {
            // This happens when OTP creates a temporary password - skip and continue
            errorMessage = 'Password will be set on first manual login';
            passwordSetSuccessfully = false;
          } else if (passwordError.message.includes('password')) {
            errorMessage = `Password error: ${passwordError.message}`;
          } else {
            errorMessage = `Authentication error: ${passwordError.message}`;
          }
        }
        
        if (!shouldContinue) {
          showToast(errorMessage, 'error');
          return;
        }
        
        // Show warning but continue with profile creation for non-critical errors
        if (!passwordError.message.includes('New password should be different')) {
          showToast(`Note: ${errorMessage}. You can set a password later in your profile.`, 'warning');
        }
      }

      // Update profile with role and full name via special invitation API
      console.log('Creating profile with data:', {
        id: currentUser.id,
        email: currentUser.email,
        full_name: fullName.trim(),
        role: invitation.role,
        invited_by: invitation.invited_by,
        invitation_id: invitation.id
      });

      try {
        const profileResponse = await fetch('/api/accept-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: currentUser.id,
            email: currentUser.email,
            full_name: fullName.trim(),
            role: invitation.role,
            invited_by: invitation.invited_by,
            invitation_id: invitation.id,
            is_active: true
          })
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${profileResponse.status}: ${profileResponse.statusText}`);
        }

        const result = await profileResponse.json();
        console.log('Profile created successfully via invitation API:', result);
      } catch (apiError) {
        console.error('Invitation API failed:', apiError);
        showToast(`${t('errors.profileFailed')}: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`, 'error');
        return;
      }

      const successMessage = passwordSetSuccessfully 
        ? t('success.complete')
        : t('success.completePasswordLater');
        
      showToast(successMessage, 'success');
      setTimeout(() => router.push('/panel'), 2000);
    } catch (error) {
      showToast(t('errors.genericError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-[#8B0000] to-[#C8102E]">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <FontAwesomeIcon 
              icon={faSpinner} 
              className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" 
            />
            <h2 className="text-xl font-semibold text-gray-900">{t('verifyingTitle')}</h2>
            <p className="text-sm text-gray-600 mt-2">{t('verifyingSubtitle')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-[#8B0000] to-[#C8102E]">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <FontAwesomeIcon 
              icon={faExclamationCircle} 
              className="w-16 h-16 text-red-600 mx-auto mb-4" 
            />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('invalidTitle')}</h2>
            <p className="text-sm text-gray-600">
              {t('invalidMessage')}
            </p>
          </CardContent>
        </Card>
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-[#8B0000] to-[#C8102E] py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            {t('invitedAs')} <span className="font-semibold text-red-600">{role}</span>
          </p>
          <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-2 mt-3">
            <FontAwesomeIcon icon={faCircleInfo} className="mr-1" />
            {t('authNotice')}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAccept} className="space-y-4">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">
                <FontAwesomeIcon icon={faEnvelope} className="mr-2 w-4 h-4" />
                {t('emailLabel')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                <FontAwesomeIcon icon={faUser} className="mr-2 w-4 h-4" />
                {t('fullNameLabel')}
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder={t('fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                <FontAwesomeIcon icon={faLock} className="mr-2 w-4 h-4" />
                {t('passwordLabel')}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={72}
              />
              <div className="text-xs text-gray-600 space-y-1 mt-2">
                <p>{t('passwordRequirements')}</p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                  <li className={password.length >= 8 ? 'text-green-600' : ''}>
                    {t('req8Chars')}
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                    {t('reqUppercase')}
                  </li>
                  <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                    {t('reqLowercase')}
                  </li>
                  <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                    {t('reqNumber')}
                  </li>
                  <li className={/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : ''}>
                    {t('reqSpecial')}
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                <FontAwesomeIcon icon={faLock} className="mr-2 w-4 h-4" />
                {t('confirmPasswordLabel')}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                maxLength={72}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600">{t('passwordsDontMatch')}</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                  {t('passwordsMatch')}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                  {t('submittingButton')}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  {t('submitButton')}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('alreadyAccount')}{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                {t('signIn')}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
