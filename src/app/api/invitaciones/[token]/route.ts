// src/app/api/invitaciones/[token]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const supabase = await createClient();
  const { token } = await params;

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .is('accepted_at', null)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  return NextResponse.json({ data });
}
