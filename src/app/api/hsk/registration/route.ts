import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidFutureDate,
  isValidSlots,
  isValidPayloadSize,
  sanitizeError,
  checkAuth,
  checkAuthorization,
  errorResponse,
  checkCSRFProtection,
  sanitizeTextInput
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('hsk_exam_sessions')
      .select('*')
      .eq('is_active', true)
      .order('exam_date', { ascending: true });

    if (error) {
      console.error('HSK sessions query error:', error);
      return errorResponse('Failed to fetch HSK exam sessions', 400);
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return errorResponse(sanitizeError(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // CSRF Protection
    if (!checkCSRFProtection(request)) {
      return errorResponse('Invalid request origin', 403);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const body = await request.json();

    // Validate payload size
    if (!isValidPayloadSize(body)) {
      return errorResponse('Request body too large', 413);
    }

    const { exam_date, available_slots, level, location } = body;

    // Validate required fields
    if (!exam_date || available_slots === undefined) {
      return errorResponse('Missing required fields: exam_date, available_slots', 400);
    }

    // Validate exam_date is in future
    if (!isValidFutureDate(exam_date)) {
      return errorResponse('Exam date must be in the future', 400);
    }

    // Validate available_slots (1-1000)
    if (!isValidSlots(available_slots)) {
      return errorResponse('Available slots must be between 1 and 1000', 400);
    }

    const { data, error } = await supabase
      .from('hsk_exam_sessions')
      .insert({
        exam_date,
        available_slots,
        level: level ? sanitizeTextInput(level) : null,
        location: location ? sanitizeTextInput(location) : null,
        created_by: user.id,
        is_active: true
      })
      .select()
      .single();

    if (error || !data) {
      return errorResponse('Failed to create HSK exam session', 400);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }
    if (error.message === 'FORBIDDEN') {
      return errorResponse('Insufficient permissions', 403);
    }
    return errorResponse(sanitizeError(error));
  }
}