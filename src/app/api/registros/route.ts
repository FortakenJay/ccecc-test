import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidUUID,
  isValidAuditTable,
  isValidAuditAction,
  parsePaginationParams,
  sanitizeError,
  checkAuth,
  checkAuthorization,
  errorResponse,
  VALID_AUDIT_TABLES,
  VALID_AUDIT_ACTIONS
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const user = await checkAuth(supabase);

    // Check authorization - admin only
    await checkAuthorization(supabase, user.id, ['admin', 'owner']);

    // Get pagination params
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    const { limit: parsedLimit, offset: parsedOffset } = parsePaginationParams(limit, offset);

    // Optional filters
    const tableFilter = url.searchParams.get('table_name');
    const actionFilter = url.searchParams.get('action');
    const userIdFilter = url.searchParams.get('user_id');

    // Validate filters if provided
    if (tableFilter && !isValidAuditTable(tableFilter)) {
      return errorResponse(`Invalid table. Must be one of: ${VALID_AUDIT_TABLES.join(', ')}`, 400);
    }

    if (actionFilter && !isValidAuditAction(actionFilter)) {
      return errorResponse(`Invalid action. Must be one of: ${VALID_AUDIT_ACTIONS.join(', ')}`, 400);
    }

    if (userIdFilter && !isValidUUID(userIdFilter)) {
      return errorResponse('Invalid user ID format', 400);
    }

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:profiles(full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (tableFilter) {
      query = query.eq('table_name', tableFilter);
    }

    if (actionFilter) {
      query = query.eq('action', actionFilter);
    }

    if (userIdFilter) {
      query = query.eq('user_id', userIdFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Audit logs query error:', error);
      return errorResponse('Failed to fetch audit logs', 400);
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
