import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidUUID,
  isValidHSKStatus,
  isValidPayloadSize,
  sanitizeError,
  parsePaginationParams,
  checkAuth,
  errorResponse,
  checkCSRFProtection,
  VALID_HSK_STATUSES
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const user = await checkAuth(supabase);

    // Get pagination params
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    const { limit: parsedLimit, offset: parsedOffset } = parsePaginationParams(limit, offset);

    // Optional filters
    const sessionIdFilter = url.searchParams.get('exam_session_id');
    const statusFilter = url.searchParams.get('status');

    // Validate filters if provided
    if (sessionIdFilter && !isValidUUID(sessionIdFilter)) {
      return errorResponse('Invalid exam session ID format', 400);
    }

    if (statusFilter && !isValidHSKStatus(statusFilter)) {
      return errorResponse(`Invalid status. Must be one of: ${VALID_HSK_STATUSES.join(', ')}`, 400);
    }

    let query = supabase
      .from('hsk_registrations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (sessionIdFilter) {
      query = query.eq('exam_session_id', sessionIdFilter);
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      return errorResponse('Failed to fetch registrations', 400);
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count,
        limit: parsedLimit,
        offset: parsedOffset
      }
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }
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

    const body = await request.json();

    // Validate payload size
    if (!isValidPayloadSize(body)) {
      return errorResponse('Request body too large', 413);
    }

    const { exam_session_id, user_id } = body;

    // Validate required fields
    if (!exam_session_id || !user_id) {
      return errorResponse('Missing required fields: exam_session_id, user_id', 400);
    }

    // Validate UUIDs
    if (!isValidUUID(exam_session_id)) {
      return errorResponse('Invalid exam session ID format', 400);
    }

    if (!isValidUUID(user_id)) {
      return errorResponse('Invalid user ID format', 400);
    }

    // Check if session has available slots
    const { data: session, error: sessionError } = await supabase
      .from('hsk_exam_sessions')
      .select('available_slots')
      .eq('id', exam_session_id)
      .single();

    if (sessionError || !session) {
      return errorResponse('Exam session not found', 404);
    }

    if (session.available_slots <= 0) {
      return errorResponse('No available slots for this exam session', 400);
    }

    // Create registration
    const { data, error } = await supabase
      .from('hsk_registrations')
      .insert({
        exam_session_id,
        user_id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('duplicate')) {
        return errorResponse('User already registered for this exam', 409);
      }
      return errorResponse('Failed to create registration', 400);
    }

    // Update available slots (WARNING: Race condition - use RPC for atomicity)
    await supabase
      .from('hsk_exam_sessions')
      .update({ available_slots: session.available_slots - 1 })
      .eq('id', exam_session_id);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }
    return errorResponse(sanitizeError(error));
  }
}