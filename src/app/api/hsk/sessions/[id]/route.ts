import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidUUID,
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Validate UUID
    if (!isValidUUID(id)) {
      return errorResponse('Invalid session ID format', 400);
    }

    const { data, error } = await supabase
      .from('hsk_exam_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse('Session not found', 404);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return errorResponse(sanitizeError(error));
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // CSRF Protection
    if (!checkCSRFProtection(request)) {
      return errorResponse('Invalid request origin', 403);
    }

    // Validate UUID
    if (!isValidUUID(id)) {
      return errorResponse('Invalid session ID format', 400);
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

    const { exam_date, available_slots, level, location, is_active } = body;

    // Validate exam_date if provided
    if (exam_date && !isValidFutureDate(exam_date)) {
      return errorResponse('Exam date must be in the future', 400);
    }

    // Validate available_slots if provided
    if (available_slots !== undefined && !isValidSlots(available_slots)) {
      return errorResponse('Available slots must be between 1 and 1000', 400);
    }

    const updateData: Record<string, any> = {};
    if (exam_date !== undefined) updateData.exam_date = exam_date;
    if (available_slots !== undefined) updateData.available_slots = available_slots;
    if (level !== undefined) updateData.level = level ? sanitizeTextInput(level) : null;
    if (location !== undefined) updateData.location = location ? sanitizeTextInput(location) : null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('hsk_exam_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return errorResponse('Failed to update session', 400);
    }

    return NextResponse.json({ data });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // CSRF Protection
    if (!checkCSRFProtection(request)) {
      return errorResponse('Invalid request origin', 403);
    }

    // Validate UUID
    if (!isValidUUID(id)) {
      return errorResponse('Invalid session ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const { error } = await supabase
      .from('hsk_exam_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse('Failed to delete session', 400);
    }

    return NextResponse.json({ success: true });
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
