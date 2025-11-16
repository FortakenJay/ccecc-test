'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Inquiry = Database['public']['Tables']['space_rental_inquiries']['Row'];
type InquiryInsert = Database['public']['Tables']['space_rental_inquiries']['Insert'];
type InquiryUpdate = Database['public']['Tables']['space_rental_inquiries']['Update'];

export function useInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all inquiries
  const fetchInquiries = async (status?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('space_rental_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setInquiries(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create inquiry
  const createInquiry = async (inquiryData: Omit<InquiryInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('space_rental_inquiries')
        .insert(inquiryData)
        .select()
        .single();

      if (createError) throw createError;

      await fetchInquiries();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Update inquiry status
  const updateStatus = async (id: string, status: string) => {
    try {
      const { data, error: updateError } = await supabase
        .from('space_rental_inquiries')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchInquiries();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  // Delete inquiry
  const deleteInquiry = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('space_rental_inquiries')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchInquiries();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
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
