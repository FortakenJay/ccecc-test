import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidUUID,
  isValidHSKStatus,
  isValidPayloadSize,
  sanitizeError,
  checkAuth,
  checkAuthorization,
  errorResponse,
  checkCSRFProtection,
  VALID_HSK_STATUSES
} from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const user = await checkAuth(supabase);

    // Validate UUID
    if (!isValidUUID(id)) {
      return errorResponse('Invalid registration ID format', 400);
    }

    const { data, error } = await supabase
      .from('hsk_registrations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse('Registration not found', 404);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return errorResponse('Unauthorized', 401);
    }
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
      return errorResponse('Invalid registration ID format', 400);
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

    const { status } = body;

    if (!status) {
      return errorResponse('Missing required field: status', 400);
    }

    // Validate status
    if (!isValidHSKStatus(status)) {
      return errorResponse(`Invalid status. Must be one of: ${VALID_HSK_STATUSES.join(', ')}`, 400);
    }

    const { data, error } = await supabase
      .from('hsk_registrations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return errorResponse('Failed to update registration status', 400);
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
      return errorResponse('Invalid registration ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin/owner
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    const { error } = await supabase
      .from('hsk_registrations')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse('Failed to delete registration', 400);
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
