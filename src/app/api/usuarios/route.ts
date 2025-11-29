import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidEmail,
  isValidRole,
  parsePaginationParams,
  sanitizeError,
  checkAuth,
  checkAuthorization,
  errorResponse
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin, owner, and officer
    await checkAuthorization(supabase, user.id, ['admin', 'owner', 'officer']);

    // Get pagination params
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    const { limit: parsedLimit, offset: parsedOffset } = parsePaginationParams(limit, offset);

    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (error) {
      console.error('Users query error:', error);
      return errorResponse('Failed to fetch users', 400);
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