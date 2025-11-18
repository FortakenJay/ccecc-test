'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import {
  isValidUUID,
  isValidEmail,
  isValidPhone,
  isValidInquiryStatus,
  isValidTextLength,
  sanitizeError,
  parsePaginationParams,
  VALID_INQUIRY_STATUSES,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PHONE_LENGTH,
  MAX_MESSAGE_LENGTH
} from '@/lib/api-utils';

type Inquiry = Database['public']['Tables']['space_rental_inquiries']['Row'];
type InquiryInsert = Database['public']['Tables']['space_rental_inquiries']['Insert'];
type InquiryUpdate = Database['public']['Tables']['space_rental_inquiries']['Update'];

// Security constants
const VALID_STATUSES = VALID_INQUIRY_STATUSES;

// Validator functions
const isValidStatus = isValidInquiryStatus;

const isValidName = (name: string): boolean => {
  if (!name || name.length === 0 || name.length > MAX_NAME_LENGTH) return false;
  return /^[a-zA-Z\s\-'áéíóúñü]+$/.test(name);
};

const isValidMessage = (message: string): boolean => {
  if (!message || message.length === 0 || message.length > MAX_MESSAGE_LENGTH) return false;
  return true;
};

const validatePagination = (limit?: number, offset?: number) => {
  return parsePaginationParams(limit, offset);
};

export function useInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all inquiries
  const fetchInquiries = async (status?: string, limit?: number, offset?: number) => {
    try {
      setLoading(true);

      // Validate status if provided
      if (status && !isValidStatus(status)) {
        setError('Invalid status');
        setLoading(false);
        return;
      }

      const { limit: validLimit, offset: validOffset } = validatePagination(limit, offset);

      let query = supabase
        .from('space_rental_inquiries')
        .select('*', { count: 'estimated' })
        .order('created_at', { ascending: false })
        .range(validOffset, validOffset + validLimit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setInquiries(data || []);
      setError(null);
    } catch (err: any) {
      setError(sanitizeError(err));
      console.error('Error fetching inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create inquiry
  const createInquiry = async (
    inquiryData: Omit<InquiryInsert, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      // Validate all required fields
      if (!isValidEmail(inquiryData.email)) {
        return { data: null, error: 'Invalid email address' };
      }

      if (!isValidName(inquiryData.name)) {
        return { data: null, error: 'Invalid name format (max 100 characters, letters only)' };
      }

      if (!isValidPhone(inquiryData.phone)) {
        return { data: null, error: 'Invalid phone format (max 20 characters)' };
      }

      if (!inquiryData.message || !isValidMessage(inquiryData.message)) {
        return { data: null, error: `Message must be 1-${MAX_MESSAGE_LENGTH} characters` };
      }

      // API will handle sanitization server-side
      const response = await fetch('/api/consultas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create inquiry');
      }

      await fetchInquiries();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Update inquiry status
  const updateStatus = async (id: string, status: string) => {
    try {
      // Validate inquiry ID
      if (!isValidUUID(id)) {
        return { data: null, error: 'Invalid inquiry ID format' };
      }

      // Validate status
      if (!isValidStatus(status)) {
        return { data: null, error: 'Invalid status' };
      }

      const response = await fetch('/api/consultas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

      await fetchInquiries();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: sanitizeError(err) };
    }
  };

  // Delete inquiry
  const deleteInquiry = async (id: string) => {
    try {
      // Validate inquiry ID
      if (!isValidUUID(id)) {
        return { error: 'Invalid inquiry ID format' };
      }

      const response = await fetch('/api/consultas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete inquiry');
      }

      await fetchInquiries();
      return { error: null };
    } catch (err: any) {
      return { error: sanitizeError(err) };
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  return {
    inquiries,
    loading,
    error,
    fetchInquiries,
    createInquiry,
    updateStatus,
    deleteInquiry,
  };
}
