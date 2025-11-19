import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, full_name, role, invited_by, invitation_id, is_active = true } = body;

    // Validate required fields
    if (!id || !email || !full_name || !role || !invitation_id) {
      return NextResponse.json(
        { error: 'Missing required fields: id, email, full_name, role, invitation_id' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['owner', 'admin', 'officer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be owner, admin, or officer' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify there's a valid invitation for this email
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitation_id)
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();

    let profile;
    let profileError;

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          email,
          full_name,
          role,
          invited_by,
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      profile = data;
      profileError = error;
    } else {
      // Create new profile using a public client (RLS policy allows this for valid invitations)
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id,
          email,
          full_name,
          role,
          invited_by,
          is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      profile = data;
      profileError = error;
    }

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      let errorMessage = 'Failed to create profile';
      if (profileError.message) {
        if (profileError.message.includes('duplicate key')) {
          errorMessage = 'Profile already exists for this user';
        } else if (profileError.message.includes('foreign key')) {
          errorMessage = 'Invalid invitation reference';
        } else if (profileError.message.includes('check constraint')) {
          errorMessage = 'Invalid role or data format';
        } else if (profileError.message.includes('policy')) {
          errorMessage = 'Profile creation not allowed - ensure invitation is valid';
        } else {
          errorMessage = profileError.message;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage, details: profileError },
        { status: 500 }
      );
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('Failed to mark invitation as accepted:', updateError);
      // Don't fail the request since profile was created successfully
    }

    return NextResponse.json({ 
      success: true, 
      profile,
      message: 'Profile created successfully' 
    });

  } catch (error) {
    console.error('Invitation acceptance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}