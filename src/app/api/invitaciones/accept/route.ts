import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { token, password } = body;

  // Verify invitation token
  const { data: invitation, error: invError } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .is('accepted_at', null)
    .single();

  if (invError || !invitation) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  // Create user account
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: invitation.email,
    password,
  });

  if (signUpError) {
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  // Create profile with role
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user!.id,
      email: invitation.email,
      full_name: '', // User can update later
      role: invitation.role,
      invited_by: invitation.invited_by,
    });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  // Mark invitation as accepted
  await supabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id);

  return NextResponse.json({ success: true });
}