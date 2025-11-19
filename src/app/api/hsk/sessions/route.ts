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
      .order('exam_date', { ascending: true });

    if (error) {
      console.error('HSK exam sessions query error:', error);
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

    // Check authorization - admin/owner/officer
    await checkAuthorization(supabase, user.id, ['admin', 'owner', 'officer']);

    const body = await request.json();

    // Validate payload size
    if (!isValidPayloadSize(body)) {
      return errorResponse('Request body too large', 413);
    }

    const { exam_date, location, max_capacity, registration_deadline, is_active } = body;

    // Validate required fields
    if (!exam_date || !registration_deadline) {
      return errorResponse('Missing required fields: exam_date, registration_deadline', 400);
    }

    // Validate exam_date is in future
    if (!isValidFutureDate(exam_date)) {
      return errorResponse('Exam date must be in the future', 400);
    }

    // Validate registration_deadline is in future
    if (!isValidFutureDate(registration_deadline)) {
      return errorResponse('Registration deadline must be in the future', 400);
    }

    const { data, error } = await supabase
      .from('hsk_exam_sessions')
      .insert({
        exam_date,
        location: location ? sanitizeTextInput(location) : null,
        max_capacity: max_capacity || null,
        registration_deadline,
        is_active: is_active !== undefined ? is_active : true,
        created_by: user.id
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Session insert error:', error);
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