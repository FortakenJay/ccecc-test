import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
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
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    let query = supabase
      .from('hsk_pricing')
      .select('*')
      .order('display_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('HSK pricing query error:', error);
      return errorResponse('Failed to fetch HSK pricing', 400);
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

    const { level, level_number, written_fee_usd, oral_fee_usd, is_active, display_order } = body;

    // Validate required fields
    if (!level) {
      return errorResponse('Missing required field: level', 400);
    }

    // Validate fees if provided
    if (written_fee_usd !== undefined && written_fee_usd < 0) {
      return errorResponse('Written fee must be a positive number', 400);
    }
    if (oral_fee_usd !== undefined && oral_fee_usd < 0) {
      return errorResponse('Oral fee must be a positive number', 400);
    }

    const { data, error } = await supabase
      .from('hsk_pricing')
      .insert({
        level: sanitizeTextInput(level),
        level_number: level_number || null,
        written_fee_usd: written_fee_usd || null,
        oral_fee_usd: oral_fee_usd || null,
        is_active: is_active !== undefined ? is_active : true,
        display_order: display_order || 0,
        created_by: user.id
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Pricing insert error:', error);
      return errorResponse('Failed to create HSK pricing', 400);
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
