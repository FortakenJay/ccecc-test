// src/app/api/invitations/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const body = await request.json();
  const { email, role } = body;

  // Check permissions
  if (profile?.role === 'officer') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  if (profile?.role === 'admin' && role !== 'officer') {
    return NextResponse.json({ error: 'Admins can only invite officers' }, { status: 403 });
  }

  // Create invitation
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      email,
      role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // TODO: Send invitation email with token
  // await sendInvitationEmail(email, data.token);

  return NextResponse.json({ data });
}

// GET invitations
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}