'use client';

import {useEffect, useState, useCallback, useRef} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
import type {User}
from '@supabase/supabase-js';
import type {Database}
from '@/types/database.types';
import {isValidUUID} from '@/lib/api-utils';

type UserRole = Database['public']['Enums']['user_role'];

interface UserProfile {
    id : string;
    email : string;
    full_name : string;
    role : UserRole;
    is_active : boolean;
}

// Constants for input validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // Bcrypt limit
const MIN_FULL_NAME_LENGTH = 2;
const MAX_FULL_NAME_LENGTH = 100;

// Validation helpers
const sanitizeError = (error : any) : string => {
    if (!error) 
        return 'An error occurred';
    if (typeof error === 'string') 
        return error.length > 100
            ? 'An error occurred'
            : error;
    if (error.message) {
        if (error.message.includes('permission') || error.message.includes('denied')) {
            return 'You do not have permission to perform this action';
        }
        if (error.message.includes('network') || error.message.includes('timeout')) {
            return 'Network error; please try again';
        }
        return 'An error occurred';
    }
    return 'An error occurred';
};

const isValidEmail = (email : string) : boolean => {
    if (!email || email.length > MAX_EMAIL_LENGTH) 
        return false;
    return EMAIL_REGEX.test(email);
};

const isValidPassword = (password : string) : boolean => {
    if (!password) 
        return false;
    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        return false;
    }
    // Require at least one uppercase, one lowercase, one digit, one special
    // character
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    return hasLower && hasUpper && hasDigit && hasSpecial;
};

const isValidFullName = (name : string) : boolean => {
    if (!name) 
        return false;
    const trimmed = name.trim();
    return trimmed.length >= MIN_FULL_NAME_LENGTH && trimmed.length <= MAX_FULL_NAME_LENGTH;
};

// SECURITY: Client-side rate limiting with memory management WARNING: This can
// be bypassed - MUST implement server-side rate limiting
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const rateLimiter = {
    attempts: new Map < string,
    number[] > (),
    maxAttempts: 5,
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxStoredEmails: 100, // Prevent memory leak

    cleanup(): void {
        const now = Date.now();
        // Remove old entries to prevent memory leak
        for (const [email,
            attempts]of this.attempts.entries()) {
            const recentAttempts = attempts.filter(time => now - time < this.windowMs);
            if (recentAttempts.length === 0) {
                this
                    .attempts
                    .delete(email);
            } else {
                this
                    .attempts
                    .set(email, recentAttempts);
            }
        }

        // If still too many entries, remove oldest
        if (this.attempts.size > this.maxStoredEmails) {
            const entries = Array.from(this.attempts.entries());
            entries.sort((a, b) => {
                const aNewest = Math.max(...a[1]);
                const bNewest = Math.max(...b[1]);
                return aNewest - bNewest;
            });

            const toKeep = entries.slice(-this.maxStoredEmails);
            this.attempts = new Map(toKeep);
        }
    },

    isRateLimited(email : string): boolean {
        this.cleanup();
        const now = Date.now();
        const attempts = this
            .attempts
            .get(email) || [];

        const recentAttempts = attempts.filter(time => now - time < this.windowMs);
        this
            .attempts
            .set(email, recentAttempts);

        return recentAttempts.length >= this.maxAttempts;
    },

    recordAttempt(email : string): void {
        const attempts = this
            .attempts
            .get(email) || [];
        attempts.push(Date.now());
        this
            .attempts
            .set(email, attempts);
    },

    clear(email : string): void {
        this
            .attempts
            .delete(email);
    }
};

// Periodic cleanup - only create one interval globally
let cleanupIntervalId : number | undefined;
if (typeof window !== 'undefined' && !cleanupIntervalId) {
    cleanupIntervalId = window.setInterval(() => rateLimiter.cleanup(), RATE_LIMIT_CLEANUP_INTERVAL_MS);
}

export function useAuth() {
    const [user,
        setUser] = useState < User | null > (null);
    const [profile,
        setProfile] = useState < UserProfile | null > (null);
    const [loading,
        setLoading] = useState(true);
    const [authLoading,
        setAuthLoading] = useState(false);
    const router = useRouter();
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef < AbortController | null > (null);
    const fetchingProfileRef = useRef(false);
    const lastFetchedUserIdRef = useRef < string | null > (null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef
                    .current
                    .abort();
            }
        };
    }, []);

    const fetchProfile = useCallback(async(userId : string) => {
        // SECURITY: Validate UUID format
        if (!isValidUUID(userId)) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Invalid user ID format');
            }
            return;
        }

        // Prevent duplicate concurrent fetches for same user
        if (fetchingProfileRef.current && lastFetchedUserIdRef.current === userId) {
            return;
        }

        fetchingProfileRef.current = true;
        lastFetchedUserIdRef.current = userId;

        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef
                .current
                .abort();
        }

        abortControllerRef.current = new AbortController();
        const supabase = createClient();

        try {
            // NOTE: Supabase JS client doesn't support AbortSignal yet This structure is
            // ready for when they add support
            const {data, error} = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (process.env.NODE_ENV === 'development') {
                console.log('Supabase query result:', { 
                    hasData: !!data, 
                    hasError: !!error,
                    errorType: error ? typeof error : 'none',
                    errorCode: error?.code,
                    errorMessage: error?.message,
                    errorDetails: error?.details,
                    fullError: error ? JSON.stringify(error, null, 2) : 'none'
                });
            }

            // Check if aborted
            if (abortControllerRef.current
                ?.signal.aborted) {
                return;
            }

            if (error) 
                throw error;
            
            // SECURITY: Validate profile data structure
            if (!data || !data.role || !data.id || !data.email) {
                throw new Error('Invalid profile data structure');
            }

            // SECURITY: Verify profile ID matches requested user (prevent ID mismatch
            // attacks)
            if (data.id !== userId) {
                throw new Error('Profile ID mismatch');
            }

            // SECURITY: Validate email format in retrieved profile
            if (!isValidEmail(data.email)) {
                throw new Error('Invalid email in profile');
            }

            // SECURITY: Validate full_name if present
            if (data.full_name && !isValidFullName(data.full_name)) {
                throw new Error('Invalid full name in profile');
            }

            // SECURITY: Check if user account is active
            if (!data.is_active) {
                throw new Error('ACCOUNT_INACTIVE');
            }

            if (isMountedRef.current) {
                setProfile(data);
            }
        } catch (error) {
            // SECURITY: Don't log sensitive error details in production
            if (process.env.NODE_ENV === 'development') {
                console.log('=== CAUGHT ERROR ===');
                console.log('Error type:', typeof error);
                console.log('Error value:', error);
                console.log('Is Error instance:', error instanceof Error);
                
                if (error instanceof Error) {
                    console.log('Error.name:', error.name);
                    console.log('Error.message:', error.message);
                    console.log('Error.stack:', error.stack);
                }
                
                console.log('Error properties:', Object.getOwnPropertyNames(error));
                console.log('Error code:', (error as any)?.code);
                console.log('Error details:', (error as any)?.details);
                console.log('Error message:', (error as any)?.message);
                console.log('==================');
            }

            // Only sign out for specific security errors, not network issues
            const isCriticalError = error instanceof Error && (error.message === 'Invalid profile data structure' || error.message === 'Profile ID mismatch' || error.message === 'Invalid email in profile' || error.message === 'Invalid full name in profile' || error.message === 'ACCOUNT_INACTIVE');

            if (isCriticalError) {
                await supabase
                    .auth
                    .signOut();
                if (isMountedRef.current) {
                    setUser(null);
                    setProfile(null);
                }
            } else if (isMountedRef.current) {
                // Network error - clear profile but keep user
                setProfile(null);
            }
        } finally {
            fetchingProfileRef.current = false;
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const supabase = createClient();
        let initializingRef = {
            current: true
        };

        // Get initial session
        const initAuth = async() => {
            try {
                const {data: {
                        session
                    }} = await supabase
                    .auth
                    .getSession();

                if (isMountedRef.current) {
                    if (session
                        ?.user) {
                        setUser(session.user);
                        await fetchProfile(session.user.id);
                    } else {
                        setUser(null);
                        setProfile(null);
                        setLoading(false);
                    }
                }
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Auth initialization error:', error);
                }
                if (isMountedRef.current) {
                    setLoading(false);
                }
            } finally {
                initializingRef.current = false;
            }
        };

        initAuth();

        // Listen for auth changes
        const {data: {
                subscription
            }} = supabase
            .auth
            .onAuthStateChange(async(_event, session) => {
                // Prevent race conditions during initialization
                if (initializingRef.current) 
                    return;
                
                if (isMountedRef.current) {
                    const newUserId = session
                        ?.user
                            ?.id;
                    const currentUserId = user
                        ?.id;

                    // Only update if user actually changed
                    if (newUserId !== currentUserId) {
                        setUser(session
                            ?.user ?? null);

                        if (session
                            ?.user) {
                            await fetchProfile(session.user.id);
                        } else {
                            setProfile(null);
                            setLoading(false);
                        }
                    }
                }
            });

        return () => {
            subscription.unsubscribe();
        };
    }, [
        fetchProfile, user
            ?.id
    ]);

    const signIn = async(email : string, password : string) => {
        const supabase = createClient();

        try {
            setAuthLoading(true);

            // Normalize email
            const normalizedEmail = email
                .trim()
                .toLowerCase();

            // SECURITY: Validate inputs
            if (!normalizedEmail || !password) {
                return {data: null, error: new Error('Email and password are required')};
            }

            // SECURITY: Validate email format
            if (!isValidEmail(normalizedEmail)) {
                return {data: null, error: new Error('Invalid email format')};
            }

            // SECURITY: Validate password requirements
            if (!isValidPassword(password)) {
                return {
                    data: null,
                    error: new Error(`Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters with at least one uppercase letter, one lowercase letter, one digit, and one special character`)
                };
            }

            // SECURITY: Client-side rate limiting (can be bypassed) IMPORTANT: Implement
            // server-side rate limiting via Supabase auth settings
            if (rateLimiter.isRateLimited(normalizedEmail)) {
                return {data: null, error: new Error('Too many login attempts. Please try again later.')};
            }

            // Record attempt before trying
            rateLimiter.recordAttempt(normalizedEmail);

            const {data, error} = await supabase
                .auth
                .signInWithPassword({email: normalizedEmail, password});

            if (error) {
                // SECURITY: Generic error message to prevent user enumeration
                if (process.env.NODE_ENV === 'development') {
                    console.error('Sign in error:', error.message);
                }

                return {data: null, error: new Error('Invalid email or password')};
            }

            // Clear rate limit on successful login
            if (data.user) {
                rateLimiter.clear(normalizedEmail);
            }

            return {data, error: null};
        } catch (error) {
            // SECURITY: Generic error message
            if (process.env.NODE_ENV === 'development') {
                console.error('Unexpected sign in error:', error);
            }

            return {data: null, error: new Error('Authentication failed. Please try again.')};
        } finally {
            if (isMountedRef.current) {
                setAuthLoading(false);
            }
        }
    };

    const signOut = async() => {
        const supabase = createClient();

        try {
            setAuthLoading(true);

            // Cancel any pending profile fetches
            if (abortControllerRef.current) {
                abortControllerRef
                    .current
                    .abort();
            }

            const {error} = await supabase
                .auth
                .signOut();

            if (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Sign out error:', error);
                }
                // Don't throw - still clear local state
            }

            // Clear local state
            if (isMountedRef.current) {
                setUser(null);
                setProfile(null);
                lastFetchedUserIdRef.current = null;
                setAuthLoading(false);
            }

            // Redirect after successful sign out
            router.push('/login');
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error during sign out:', error);
            }

            if (isMountedRef.current) {
                setAuthLoading(false);
            }

            // Still redirect on error to prevent stuck states
            router.push('/login');
        }
    };

    // CRITICAL SECURITY NOTE: These are CLIENT-SIDE checks ONLY for UI purposes
    // NEVER trust these for authorization - ALWAYS verify on the server/API
    // Implement proper RLS policies in Supabase and verify permissions in API routes
    const isActive = profile
        ?.is_active === true;
    const isOwner = !loading && isActive && profile
        ?.role === 'owner';
    const isAdmin = !loading && isActive && profile
        ?.role === 'admin';
    const isOfficer = !loading && isActive && profile
        ?.role === 'officer';
    const isAdminOrOwner = isOwner || isAdmin;

    return {
        user,
        profile,
        loading,
        authLoading,
        signIn,
        signOut,
        isOwner,
        isAdmin,
        isOfficer,
        isAdminOrOwner,
        isActive
    };
}