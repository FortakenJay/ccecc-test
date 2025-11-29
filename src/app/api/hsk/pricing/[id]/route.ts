import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidUUID,
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
      return errorResponse('Invalid pricing ID format', 400);
    }

    const { data, error } = await supabase
      .from('hsk_pricing')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse('Pricing not found', 404);
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
      return errorResponse('Invalid pricing ID format', 400);
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

    const { level, level_number, written_fee_usd, oral_fee_usd, is_active, display_order } = body;

    // Validate fees if provided
    if (written_fee_usd !== undefined && written_fee_usd < 0) {
      return errorResponse('Written fee must be a positive number', 400);
    }
    if (oral_fee_usd !== undefined && oral_fee_usd < 0) {
      return errorResponse('Oral fee must be a positive number', 400);
    }

    const updateData: Record<string, any> = {};
    if (level !== undefined) updateData.level = level ? sanitizeTextInput(level) : null;
    if (level_number !== undefined) updateData.level_number = level_number;
    if (written_fee_usd !== undefined) updateData.written_fee_usd = written_fee_usd;
    if (oral_fee_usd !== undefined) updateData.oral_fee_usd = oral_fee_usd;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data, error } = await supabase
      .from('hsk_pricing')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return errorResponse('Failed to update pricing', 400);
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
      return errorResponse('Invalid pricing ID format', 400);
    }

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - owner only
    await checkAuthorization(supabase, user.id, ['owner']);

    const { error } = await supabase
      .from('hsk_pricing')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse('Failed to delete pricing', 400);
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
