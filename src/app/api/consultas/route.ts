import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidUUID,
  isValidEmail,
  isValidTextLength,
  isValidConsultaStatus,
  isValidPayloadSize,
  sanitizeError,
  parsePaginationParams,
  MAX_NAME_LENGTH,
  MAX_PHONE_LENGTH,
  MAX_MESSAGE_LENGTH,
  checkAuth,
  checkAuthorization,
  errorResponse,
  checkCSRFProtection,
  sanitizeTextInput,
  VALID_CONSULTA_STATUSES
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication - admin, owner, and officer can view
    const user = await checkAuth(supabase);
    await checkAuthorization(supabase, user.id, ['admin', 'owner', 'officer']);

    // Get pagination params
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    const { limit: parsedLimit, offset: parsedOffset } = parsePaginationParams(limit, offset);

    // Optional status filter
    const statusFilter = url.searchParams.get('status');
    if (statusFilter && !isValidConsultaStatus(statusFilter)) {
      return errorResponse(`Invalid status. Must be one of: ${VALID_CONSULTA_STATUSES.join(', ')}`, 400);
    }

    let query = supabase
      .from('space_rental_inquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Consultas query error:', error);
      return errorResponse('Failed to fetch consultas', 400);
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        total: count || 0,
        limit: parsedLimit,
        offset: parsedOffset
      }
    });
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate payload size
    if (!isValidPayloadSize(body)) {
      return errorResponse('Request body too large', 413);
    }

    const { name, email, phone, message, subject } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return errorResponse('Missing required fields: name, email, message', 400);
    }

    // Validate field lengths
    if (!isValidTextLength(name, MAX_NAME_LENGTH)) {
      return errorResponse(`Name must not exceed ${MAX_NAME_LENGTH} characters`, 400);
    }

    if (!isValidEmail(email)) {
      return errorResponse('Invalid email address', 400);
    }

    if (phone && !isValidTextLength(phone, MAX_PHONE_LENGTH)) {
      return errorResponse(`Phone must not exceed ${MAX_PHONE_LENGTH} characters`, 400);
    }

    if (!isValidTextLength(message, MAX_MESSAGE_LENGTH)) {
      return errorResponse(`Message must not exceed ${MAX_MESSAGE_LENGTH} characters`, 400);
    }

    if (subject && !isValidTextLength(subject, 200)) {
      return errorResponse('Subject must not exceed 200 characters', 400);
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeTextInput(name),
      email: email.toLowerCase().trim(),
      phone: phone ? sanitizeTextInput(phone) : null,
      message: sanitizeTextInput(message),
      subject: subject ? sanitizeTextInput(subject) : null,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('space_rental_inquiries')
      .insert(sanitizedData)
      .select()
      .single();

    if (error) {
      if (error.message?.includes('duplicate')) {
        return errorResponse('This inquiry already exists', 409);
      }
      return errorResponse('Failed to create inquiry', 400);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return errorResponse(sanitizeError(error));
  }
}

export async function PATCH(request: NextRequest) {
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

    const { id, status } = body;

    if (!id || !status) {
      return errorResponse('Missing required fields: id, status', 400);
    }

    // Validate UUID
    if (!isValidUUID(id)) {
      return errorResponse('Invalid consulta ID format', 400);
    }

    // Validate status
    if (!isValidConsultaStatus(status)) {
      return errorResponse(`Invalid status. Must be one of: ${VALID_CONSULTA_STATUSES.join(', ')}`, 400);
    }

    const { data, error } = await supabase
      .from('space_rental_inquiries')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return errorResponse('Failed to update consulta status', 400);
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

export async function DELETE(request: NextRequest) {
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

    const { id } = body;

    if (!id) {
      return errorResponse('Missing required field: id', 400);
    }

    // Validate UUID
    if (!isValidUUID(id)) {
      return errorResponse('Invalid consulta ID format', 400);
    }

    const { error } = await supabase
      .from('space_rental_inquiries')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse('Failed to delete consulta', 400);
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